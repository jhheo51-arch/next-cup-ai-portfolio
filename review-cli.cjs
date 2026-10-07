'use strict';
// Local scheduled observer: queues evidence only; cannot approve or change catalog.
const fs=require('node:fs'),path=require('node:path'),{openStore}=require('./db.cjs'),{initResearch}=require('./research.cjs');
const root=path.join(__dirname,'runtime');fs.mkdirSync(root,{recursive:true});
const store=openStore(path.join(root,'next-cup.sqlite')),lab=initResearch(store,null),actor={id:'scheduled-observer',role:'admin'};
try{
 if(process.argv[2]==='status'){
  const d=lab.publicData(),a=lab.adminData(actor);
  console.log(JSON.stringify({catalog:d.catalog,officialSources:d.sources.filter(s=>s.kind==='official'),cases:d.cases.map(c=>({id:c.id,sourceIds:c.sourceIds})),recentObservations:a.observations},null,2));
 }else if(process.argv[2]==='observe'){
  const [caseId,sourceId,result,note,evidence]=process.argv.slice(3);
  const duplicate=lab.adminData(actor).observations.some(o=>o.case_id===caseId&&o.payload.sourceId===sourceId&&o.payload.result===result&&o.payload.evidence===evidence);
  if(duplicate)console.log(JSON.stringify({duplicate:true}));
  else console.log(JSON.stringify({queued:lab.observe(actor,{caseId,sourceId,result,note,evidence})}));
 }else throw Error('사용법: node review-cli.cjs status 또는 observe 사례ID 출처ID checked|missing|failed 메모 짧은근거');
}catch(e){console.error(e.message);process.exitCode=1;}finally{store.close();}
