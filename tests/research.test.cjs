const test=require('node:test'),assert=require('node:assert/strict');
const {openStore}=require('../db.cjs'),{initResearch,compare,seedCatalog}=require('../research.cjs');
const at=Date.parse('2026-10-07T12:00:00Z');
const input={likes:['cream'],dislikes:[],required:[]};
test('검토 후보의 조건·신선도 검사',async t=>{
 await t.test('쌀 필수는 대안 없음',()=>assert.equal(compare({...input,required:['rice']},seedCatalog,at).candidates.length,0));
 await t.test('비선호 배제',()=>assert.ok(compare({...input,dislikes:['coffee']},seedCatalog,at).candidates.every(x=>!x.tags.includes('coffee'))));
 await t.test('오래된 자료는 제외',()=>assert.equal(compare(input,seedCatalog,at+31*86400000).candidates.length,0));
 await t.test('미래 확인일은 제외',()=>assert.equal(compare(input,seedCatalog,at-2*86400000).candidates.length,0));
 await t.test('보류 후보 제외',()=>assert.equal(compare(input,seedCatalog.map(x=>({...x,sale:'hold'})),at).candidates.length,0));
 await t.test('종료 기간 제외',()=>assert.equal(compare(input,seedCatalog.map(x=>({...x,end:'2026-09-01'})),at).candidates.length,0));
 await t.test('선호와 비선호 충돌 거절',()=>assert.throws(()=>compare({...input,dislikes:['cream']},seedCatalog,at)));
 await t.test('임의 태그 거절',()=>assert.throws(()=>compare({...input,likes:['invented']},seedCatalog,at)));
 await t.test('빈 취향 확인 질문',()=>assert.equal(compare({...input,likes:[]},seedCatalog,at).status,'clarify'));
});
test('평가 기록·운영 검토·복구',async t=>{
 const store=openStore(':memory:');
 const ai={taste:async()=>({result:{likes:['cream'],dislikes:[],essentialRice:'no',understanding:'크림',question:''},meta:{model:'synthetic-only',ms:1}})};
 const lab=initResearch(store,ai),u={id:'fixture-user',role:'member'},admin={id:'fixture-admin',role:'admin'};
 const body={caseId:'rice',kind:'synthetic',consent:true,memory:'시험용 크림 선호',behavior:'시험용 다른 음료 선택',experienced:'no'};
 try{
 await t.test('초기 실제 평가 0·평균 미측정',()=>{assert.equal(lab.metrics().completed,0);assert.equal(lab.metrics().modes[0].helpful,null);});
 await t.test('동의 없으면 시작 불가',()=>assert.throws(()=>lab.start(u,{...body,consent:false})));
 let tr=lab.start(u,body);
 await t.test('다른 사람 평가 접근 불가',()=>assert.throws(()=>lab.trial({id:'another'},tr.id)));
 await t.test('진행 중 중복 평가 거절',()=>assert.throws(()=>lab.start(u,body)));
 for(let phase=0;phase<2;phase++){
  if(tr.payload.sequence[phase]==='ai')await lab.interpret(u,tr.id,{consent:true});
  lab.run(u,tr.id,input);
  await t.test('미선택 시음 평가 거절 '+phase,()=>assert.throws(()=>lab.rate(u,tr.id,{helpful:3,choice:'none',tasting:'satisfied'})));
  tr=lab.rate(u,tr.id,{helpful:3,choice:'none',tasting:'not_tasted'});
 }
 await t.test('합성 시험은 실제 완료 수에서 제외',()=>{assert.equal(lab.metrics().completed,0);assert.equal(lab.metrics().synthetic,1);});
 await t.test('완료 평가 재작성 거절',()=>assert.throws(()=>lab.run(u,tr.id,input)));
 await t.test('회원 운영자 기능 차단',()=>assert.throws(()=>lab.adminData(u)));
 await t.test('다른 사례 출처 혼합 거절',()=>assert.throws(()=>lab.observe(admin,{caseId:'rice',sourceId:'S05',result:'checked',note:'시험',evidence:'시험'})));
 const obs=lab.observe(admin,{caseId:'glazed',sourceId:'S05',result:'checked',note:'합성 운영 시험',evidence:'합성 운영 시험'});
 const original=lab.catalog().id;
 await t.test('보류 반영',()=>{lab.review(admin,obs,{action:'hold',menuId:'glazed',reason:'합성 시험'});assert.equal(lab.catalog().items.find(x=>x.id==='glazed').sale,'hold');});
 await t.test('기존 버전 복구·이력 보존',()=>{lab.rollback(admin,{version:original,reason:'합성 복구 시험'});assert.equal(lab.catalog().items.find(x=>x.id==='glazed').sale,'seasonal');assert.ok(lab.catalog().id>original);});
 const missing=lab.observe(admin,{caseId:'glazed',sourceId:'S05',result:'missing',note:'합성 부재',evidence:'합성 시험'});
 await t.test('목록 부재를 단종으로 변경 못 함',()=>assert.throws(()=>lab.review(admin,missing,{action:'hold',menuId:'glazed',reason:'시험'})));
 await t.test('근거 묶음에 개인 응답 없음',()=>assert.ok(!JSON.stringify(lab.packet(admin)).includes('시험용 크림 선호')));
 await t.test('철회하면 원문 제거·집계 제외',()=>{lab.withdraw(u,tr.id);assert.equal(lab.metrics().synthetic,0);assert.equal(lab.trial(u,tr.id).payload.memory,undefined);});
 }finally{store.close();}
});
