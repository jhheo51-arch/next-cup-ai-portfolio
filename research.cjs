'use strict';
const {randomUUID,createHash}=require('node:crypto');
const evidence=require('./evidence.json'), C=require('./core.js'),{fail}=require('./db.cjs'),{pii}=require('./ai.cjs');
const now=()=>new Date().toISOString();
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const parse=r=>r?{...r,payload:JSON.parse(r.payload)}:null;
const txt=(s,max=1200)=>typeof s==='string'&&s.trim().length>0&&s.length<=max&&!pii(s);
const labels={...C.labels,vanilla:'바닐라 향',spice:'계피, 향신료',tea:'차 풍미',matcha:'말차 풍미',cocoa:'초콜릿 풍미',foam:'폼 질감',caramel:'카라멜 풍미'};
const validTags=a=>Array.isArray(a)&&a.length<=Object.keys(labels).length&&new Set(a).size===a.length&&a.every(t=>Object.hasOwn(labels,t));
const seedCatalog=[
 {id:'chocolate',name:'초콜릿 크림 칩 프라푸치노',tags:['cream','ice','cocoa'],sourceIds:['S08'],checked:'2026-10-07',sale:'listed',scope:'공식 목록, 지점 재고 미확인'},
 {id:'latte',name:'카페 라떼',tags:['cream','coffee'],sourceIds:['S09'],checked:'2026-10-07',sale:'listed',scope:'공식 목록, 지점 재고 미확인'},
 {id:'coldbrew',name:'바닐라 크림 콜드 브루',tags:['cream','coffee','vanilla'],sourceIds:['S07'],checked:'2026-10-07',sale:'listed',scope:'상시 전환 이력, 지점 재고 미확인'},
 {id:'glazed',name:'블랙 글레이즈드 라떼',tags:['cream','coffee','foam','caramel'],sourceIds:['S05'],checked:'2026-10-07',sale:'seasonal',scope:'2026-10-06 공식 발표 기준 가을 시즌'},
 {id:'matcha-glazed',name:'말차 글레이즈드 티 라떼',tags:['cream','matcha','foam','caramel'],sourceIds:['S05'],checked:'2026-10-07',sale:'seasonal',scope:'2026-09-29 재출시, 지점 재고 미확인'}
];
function compare(input,catalog,at=Date.now()){
 if(!input||!validTags(input.likes)||!validTags(input.dislikes)||!validTags(input.required)||input.likes.some(t=>input.dislikes.includes(t))||input.required.some(t=>input.dislikes.includes(t)))fail(400,'선호, 비선호, 필수 조건을 확인해 주세요.');
 if(!input.likes.length&&!input.required.length)return {status:'clarify',candidates:[],reason:'선호 또는 필수 감각을 한 가지 이상 알려주세요.'};
 const eligible=catalog.filter(d=>['listed','seasonal'].includes(d.sale)&&Number.isFinite(Date.parse(d.checked))&&at-Date.parse(d.checked)<=30*86400000&&Date.parse(d.checked)<=at&&(!d.end||Date.parse(d.end+'T23:59:59+09:00')>=at));
 const candidates=eligible.filter(d=>!input.dislikes.some(t=>d.tags.includes(t))&&input.required.every(t=>d.tags.includes(t))).map(d=>({...d,shared:input.likes.filter(t=>d.tags.includes(t)),missing:input.likes.filter(t=>!d.tags.includes(t))})).filter(d=>d.shared.length||input.required.length).sort((a,b)=>b.shared.length-a.shared.length||a.id.localeCompare(b.id));
 return{status:candidates.length?'partial':'empty',candidates,reason:candidates.length?'감각 태그는 설계 해석이며 맛의 동일성, 실시간 재고를 보장하지 않습니다.':'필수 조건을 만족하는 검토 후보가 없거나 자료 재확인이 필요합니다.'};
}
function initResearch(store,ai){
 const db=store.db,s=q=>db.prepare(q);
 db.exec(`CREATE TABLE IF NOT EXISTS lab_trials(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,case_id TEXT NOT NULL,kind TEXT NOT NULL,phase INTEGER NOT NULL,sequence TEXT NOT NULL,started TEXT NOT NULL,updated TEXT NOT NULL,status TEXT NOT NULL,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS lab_observations(id TEXT PRIMARY KEY,case_id TEXT NOT NULL,created TEXT NOT NULL,status TEXT NOT NULL,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS lab_catalog(id INTEGER PRIMARY KEY,payload TEXT NOT NULL,created TEXT NOT NULL,reason TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS lab_decisions(id TEXT PRIMARY KEY,created TEXT NOT NULL,actor TEXT NOT NULL,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS lab_notes(id TEXT PRIMARY KEY,created TEXT NOT NULL,actor TEXT NOT NULL,payload TEXT NOT NULL); `);
 if(!s('SELECT id FROM lab_catalog LIMIT 1').get())s('INSERT INTO lab_catalog(payload,created,reason) VALUES(?,?,?)').run(JSON.stringify(seedCatalog),now(),'공식 출처를 검토한 초기 후보 목록');
 const catalog=()=>{const r=s('SELECT * FROM lab_catalog ORDER BY id DESC LIMIT 1').get();return {...r,items:JSON.parse(r.payload),payload:undefined};};
 const admin=u=>{if(u?.role!=='admin')fail(403,'운영자만 사용할 수 있습니다.');};
 function trial(u,id){const r=parse(s('SELECT * FROM lab_trials WHERE id=? AND user_id=?').get(id,u.id));if(!r)fail(404,'본인의 평가를 찾을 수 없습니다.');return r;}
 const update=t=>s('UPDATE lab_trials SET phase=?,updated=?,status=?,payload=? WHERE id=?').run(t.phase,now(),t.status,JSON.stringify(t.payload),t.id);
 function start(u,b){
  if(!evidence.cases.some(c=>c.id===b.caseId)||b.consent!==true||!['human','synthetic'].includes(b.kind)||!txt(b.memory)||!txt(b.behavior,500)||!['yes','no'].includes(b.experienced))fail(400,'사례, 실제 경험 여부, 기억, 당시 행동, 저장 동의를 확인해 주세요.');
  const pending=s("SELECT id FROM lab_trials WHERE user_id=? AND status='active'").get(u.id);if(pending)fail(409,'진행 중인 평가를 먼저 완료하거나 참여 철회해 주세요.');
  if(s('SELECT COUNT(*) n FROM lab_trials WHERE user_id=?').get(u.id).n>=30)fail(429,'계정당 평가 30건 한도입니다.');
  const sequence=parseInt(digest([u.id,b.caseId]).slice(0,2),16)%2?['ai','manual']:['manual','ai'];
  const id=randomUUID(),time=now(),payload={memory:b.memory.trim(),behavior:b.behavior.trim(),experienced:b.experienced,sequence,runs:[],phaseStarted:time,catalog:catalog().items,catalogVersion:catalog().id,protocol:'P01',consentVersion:'2026-10-07',inference:null};
  s('INSERT INTO lab_trials VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,u.id,b.caseId,b.kind,0,JSON.stringify(sequence),time,time,'active',JSON.stringify(payload));return trial(u,id);
 }
 async function interpret(u,id,b){const t=trial(u,id);if(t.status!=='active'||t.payload.sequence[t.phase]!=='ai')fail(409,'현재 AI 평가 단계가 아닙니다.');if(b.consent!==true)fail(400,'Google 전송 동의가 필요합니다.');if(t.payload.inference) return t.payload.inference;
  const data=await ai.taste([{role:'user',text:'대상 메뉴: '+evidence.cases.find(c=>c.id===t.case_id).name+'. 사용자 기억: '+t.payload.memory}]);
  const latest=trial(u,id);if(latest.status!=='active'||latest.phase!==t.phase)fail(409,'평가가 변경되어 AI 응답을 반영하지 않았습니다.');
  latest.payload.inference=data;update(latest);return data;
 }
 function run(u,id,b){const t=trial(u,id);if(t.status!=='active'||t.payload.runs.length!==t.phase)fail(409,'이미 완료한 단계이거나 진행 중인 평가가 아닙니다.');
  const mode=t.payload.sequence[t.phase];if(mode==='ai'&&!t.payload.inference)fail(400,'AI 해석을 먼저 받은 후 확인해 주세요.');
  const result=compare(b,t.payload.catalog);t.payload.preview={input:{likes:b.likes,dislikes:b.dislikes,required:b.required},result,mode,elapsedMs:Date.now()-Date.parse(t.payload.phaseStarted),at:now()};update(t);return result;
 }
 function rate(u,id,b){const t=trial(u,id),p=t.payload.preview;if(t.status!=='active'||!p)fail(409,'먼저 결과를 비교해 주세요.');
  if(!Number.isInteger(b.helpful)||b.helpful<1||b.helpful>5||!['none',...p.result.candidates.map(d=>d.id)].includes(b.choice)||!['not_tasted','satisfied','different','too_sweet'].includes(b.tasting))fail(400,'도움 정도, 선택, 시음 여부를 확인해 주세요.');
  if(b.choice==='none'&&b.tasting!=='not_tasted')fail(400,'선택하지 않은 음료를 시음했다고 기록할 수 없습니다.');
  const original=t.payload.inference?.result;
  const changed=p.mode==='ai'?digest([p.input.likes.slice().sort(),p.input.dislikes.slice().sort(),p.input.required.slice().sort()])!==digest([(original.likes||[]).slice().sort(),(original.dislikes||[]).slice().sort(),original.essentialRice==='yes'?['rice']:[]]):null;
  t.payload.runs.push({...p,rating:{helpful:b.helpful,choice:b.choice,tasting:b.tasting},original:p.mode==='ai'?original:null,aiCorrected:changed,meta:p.mode==='ai'?t.payload.inference.meta:null});
  delete t.payload.preview;t.payload.inference=null;t.phase++;t.status=t.phase===2?'complete':'active';t.payload.phaseStarted=now();update(t);return trial(u,id);
 }
 function withdraw(u,id){const t=trial(u,id);t.status='withdrawn';t.payload={withdrawn:now(),protocol:'P01'};update(t);}
 function observations(){return s('SELECT * FROM lab_observations ORDER BY created DESC LIMIT 100').all().map(parse);}
 function observe(u,b){
  admin(u);const c=evidence.cases.find(c=>c.id===b.caseId),src=evidence.sources.find(x=>x.id===b.sourceId&&x.kind==='official');
  if(!c||!src||!c.sourceIds.includes(src.id)||!txt(b.note,1200)||!['checked','failed','missing'].includes(b.result)||!txt(b.evidence,1500))fail(400,'해당 사례의 공식 출처, 확인 결과, 근거 발췌, 검토 메모가 필요합니다.');
  const id=randomUUID(),p={...b,actor:u.id,baseVersion:catalog().id};s('INSERT INTO lab_observations VALUES(?,?,?,?,?)').run(id,b.caseId,now(),'pending',JSON.stringify(p));return id;
 }
 function review(u,id,b){
  admin(u);const o=parse(s('SELECT * FROM lab_observations WHERE id=?').get(id));if(!o||o.status!=='pending')fail(409,'검토 대기 항목이 아닙니다.');
  if(!['acknowledge','reject','refresh','hold'].includes(b.action)||!txt(b.reason,500))fail(400,'검토 동작과 근거가 필요합니다.');
  const current=catalog();if(['refresh','hold'].includes(b.action)){
   if(o.payload.result!=='checked')fail(400,'수집 실패, 목록 부재는 판매 상태 변경의 근거가 아닙니다.');
   if(o.payload.baseVersion!==current.id)fail(409,'후보 목록이 변경됐습니다. 새 관찰로 검토해 주세요.');
   const item=current.items.find(d=>d.id===b.menuId&&d.sourceIds.includes(o.payload.sourceId));if(!item)fail(400,'이 출처와 연결된 등록 후보를 선택해 주세요.');
   const source=evidence.sources.find(x=>x.id===o.payload.sourceId);
   if(b.action==='refresh'&&source.published&&Date.now()-Date.parse(source.published)>30*86400000)fail(400,'오래된 보도자료의 재열람만으로 현재 판매를 갱신할 수 없습니다. 현재 목록 근거가 필요합니다.');
   const next=current.items.map(d=>d.id===b.menuId?{...d,checked:now().slice(0,10),sale:b.action==='hold'?'hold':d.sale}:d);
   if(b.action==='refresh'&&item.sale==='hold')fail(400,'보류한 후보는 이전 버전 복구 후 재검토하세요.');
   db.exec('BEGIN IMMEDIATE');try{s('INSERT INTO lab_catalog(payload,created,reason) VALUES(?,?,?)').run(JSON.stringify(next),now(),b.reason);s('UPDATE lab_observations SET status=?,payload=? WHERE id=?').run('reviewed',JSON.stringify({...o.payload,review:{action:b.action,reason:b.reason,actor:u.id}}),id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
  }else s('UPDATE lab_observations SET status=?,payload=? WHERE id=?').run(b.action==='reject'?'rejected':'reviewed',JSON.stringify({...o.payload,review:{action:b.action,reason:b.reason,actor:u.id}}),id);
 }
 function rollback(u,b){admin(u);if(!Number.isInteger(b.version)||!txt(b.reason,500))fail(400,'복구 버전과 이유가 필요합니다.');const old=s('SELECT payload FROM lab_catalog WHERE id=?').get(b.version);if(!old)fail(404,'복구할 버전이 없습니다.');s('INSERT INTO lab_catalog(payload,created,reason) VALUES(?,?,?)').run(old.payload,now(),'복구 v'+b.version+': '+b.reason);}
 function metrics(){
  const all=s("SELECT * FROM lab_trials WHERE status!='withdrawn' ORDER BY started").all().map(parse),human=all.filter(t=>t.kind==='human'),complete=human.filter(t=>t.status==='complete'),runs=complete.flatMap(t=>t.payload.runs),n=complete.length;
  const avg=a=>a.length?Number((a.reduce((x,y)=>x+y,0)/a.length).toFixed(2)):null;
  return{started:human.length,completed:n,participants:new Set(complete.map(t=>t.user_id)).size,synthetic:all.filter(t=>t.kind==='synthetic').length,experienced:complete.filter(t=>t.payload.experienced==='yes').length,
   modes:['manual','ai'].map(mode=>{const r=runs.filter(x=>x.mode===mode);return{mode,n:r.length,helpful:avg(r.map(x=>x.rating.helpful)),seconds:avg(r.map(x=>x.elapsedMs/1000)),selected:r.filter(x=>x.rating.choice!=='none').length,corrected:mode==='ai'?r.filter(x=>x.aiCorrected).length:null};}),
   pairedHelpfulnessDifference:avg(complete.map(t=>t.payload.runs.find(r=>r.mode==='ai').rating.helpful-t.payload.runs.find(r=>r.mode==='manual').rating.helpful)),
   byCase:evidence.cases.map(c=>{const rows=complete.filter(t=>t.case_id===c.id);return{id:c.id,name:c.name,n:rows.length,unmet:rows.filter(t=>t.payload.runs.some(r=>r.result.status==='empty')).length};}),caution:'자발적 참여, 자기보고. 같은 사람이 여러 사례를 평가할 수 있음. 완료한 쌍만 비교하며 중도 이탈 별도 표시. 인과 효과, 판매 수요 추정 불가.'};
 }
 function decision(u,b){admin(u);if(!evidence.cases.some(c=>c.id===b.caseId)||!txt(b.finding)||!txt(b.counter)||!txt(b.next)||!txt(b.owner,80))fail(400,'관찰, 반례, 다음 행동, 담당 역할을 적어주세요.');const id=randomUUID();s('INSERT INTO lab_decisions VALUES(?,?,?,?)').run(id,now(),u.id,JSON.stringify({...b,claim:'CL-01',snapshot:metrics()}));return id;}
 function note(u,b){admin(u);if(!['contribution','incident','handoff'].includes(b.type)||!txt(b.title,120)||!txt(b.detail)||!txt(b.evidence,500))fail(400,'기여/실패/인수인계 유형과 내용, 근거가 필요합니다.');const id=randomUUID();s('INSERT INTO lab_notes VALUES(?,?,?,?)').run(id,now(),u.id,JSON.stringify(b));return id;}
 return{catalog,metrics,start,interpret,run,rate,withdraw,trial,observe,review,rollback,decision,note,
  publicData:()=>({...evidence,labels,catalog:catalog()}),
  mine:u=>s('SELECT * FROM lab_trials WHERE user_id=? ORDER BY started DESC').all(u.id).map(parse),
  adminData:u=>{admin(u);return{metrics:metrics(),observations:observations(),versions:s('SELECT id,created,reason FROM lab_catalog ORDER BY id DESC').all(),decisions:s('SELECT * FROM lab_decisions ORDER BY created DESC').all().map(parse),notes:s('SELECT * FROM lab_notes ORDER BY created DESC').all().map(parse)};},
  packet:u=>{admin(u);return{claim:evidence.claim,generated:now(),protocol:'P01',metrics:metrics(),sources:evidence.sources,cases:evidence.cases.map(({ownerEvidence,...c})=>c),ownerInterview:{id:'U01',status:'직접 경험 응답 1건, 비교 평가 미완료',designDecision:evidence.ownerInterview?.designDecision},decisions:s('SELECT id,created,payload FROM lab_decisions').all().map(parse),mapping:{pdf:'CL-01의 문제, 판단, 한계 설명',excel:'P01의 정의, 분모, 실제 관측 결과',github:'P01 계산, 조건 검사, 실패 복구 재현'},excluded:'계정, 비밀번호, API 키, 원문 개인 응답, 시험용 계정 제외. 제출 파일 생성이나 외부 게시 아님.'};}
 };
}
module.exports={initResearch,compare,labels,seedCatalog};
