const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createAI}=require('../app/ai.cjs'),P=require('../app/taste-policy.cjs');
const protocol=require('../evidence/hard-cases.json');
const phase=process.argv[2];if(!['baseline','revised','heldout'].includes(phase))throw Error('phase required');
const dir=process.env.EVAL_OUTPUT_DIR||path.join(__dirname,'../runtime/hard-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const dest=path.join(dir,'hard-'+phase+'.json');if(fs.existsSync(dest))throw Error('Existing results are preserved; choose a new evidence file deliberately.');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
(async()=>{const ai=createAI();if(!ai.configured)throw Error('NO_KEY');const report={phase,started:new Date().toISOString(),kind:protocol.kind,externalParticipants:0,model:ai.model,promptHash:hash(P.PROMPT),prompt:P.PROMPT,protocolHash:hash(JSON.stringify(protocol)),calls:0,rows:[]};
for(const c of protocol.cases.filter(x=>x.split===(phase==='heldout'?'heldout':'development'))){
 const row={id:c.id,category:c.category,input:c.text,expected:c.expected};report.calls++;report.inflight=c.id;fs.writeFileSync(dest,JSON.stringify(report,null,2));
 try{const {result,meta}=await ai.taste([{role:'user',text:c.text}]);row.result=result;row.meta=meta;const e=c.expected;
 row.checks={likes:same(result.likes,e.likes),dislikes:same(result.dislikes,e.dislikes),essentialRice:result.essentialRice===e.essentialRice,clarification:!e.questionRequired||result.question.trim().length>0,unsupported:e.retainPatterns.every(p=>new RegExp(p).test(result.understanding+' '+result.question))};
 row.errors=Object.entries(row.checks).filter(([,v])=>!v).map(([k])=>k);row.pass=row.errors.length===0;
 }catch(e){row.pass=false;row.errors=[e.code||'UPSTREAM'];}
 report.inflight=null;report.rows.push(row);fs.writeFileSync(dest,JSON.stringify(report,null,2));console.log(JSON.stringify({phase,id:row.id,pass:row.pass,errors:row.errors}));
 if(report.rows.slice(-2).length===2&&report.rows.slice(-2).every(r=>r.errors.some(e=>['UPSTREAM','TIMEOUT','AUTH','QUOTA','MODEL','NO_KEY'].includes(e)))){report.stopped='연속 연결 실패 2회. 미실행 문장은 해석 평가 분모에 넣지 않음.';break;}
}
report.completed=new Date().toISOString();report.passed=report.rows.filter(r=>r.pass).length;fs.writeFileSync(dest,JSON.stringify(report,null,2));console.log(JSON.stringify({phase,passed:report.passed,total:report.rows.length}));})().catch(e=>{console.error(e.code||e.message);process.exitCode=1;});
