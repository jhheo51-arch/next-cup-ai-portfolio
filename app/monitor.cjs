'use strict';
const slots=['2026-10-08','2026-10-12','2026-10-15','2026-10-19'];
const sources=require('./evidence.json').sources.filter(x=>x.kind==='official').map(x=>x.id);
function monitor(db){
 db.exec('CREATE TABLE IF NOT EXISTS monitor_runs(slot TEXT PRIMARY KEY,recorded TEXT NOT NULL,payload TEXT NOT NULL)');
 return {
  status(){return {timezone:'Asia/Seoul',slots,runs:db.prepare('SELECT slot,recorded,payload FROM monitor_runs ORDER BY slot').all().map(r=>({...r,payload:JSON.parse(r.payload)}))};},
  record(b,at=new Date()){
   const localDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(at);
   if(!slots.includes(b.slot)||b.slot!==localDate)throw Error('예정일 당일 실제 실행만 기록합니다. 누락 회차를 소급 완료하지 마세요.');
   if(!Array.isArray(b.checks)||b.checks.length!==sources.length||new Set(b.checks.map(x=>x.sourceId)).size!==sources.length)throw Error('등록 공식 출처별 확인 결과가 필요합니다.');
   for(const c of b.checks)if(!sources.includes(c.sourceId)||!['unchanged','changed','failed','missing'].includes(c.result)||typeof c.note!=='string'||!c.note.trim()||c.note.length>500)throw Error('출처별 상태와 짧은 근거가 필요합니다.');
   db.prepare('INSERT INTO monitor_runs VALUES(?,?,?)').run(b.slot,at.toISOString(),JSON.stringify({checks:b.checks.map(({sourceId,result,note})=>({sourceId,result,note}))}));
   return {recorded:b.slot,final:b.slot===slots.at(-1)};
  }
 };
}
module.exports={monitor,slots};
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path'),{openStore}=require('./db.cjs');
 fs.mkdirSync(path.join(__dirname,'../runtime'),{recursive:true});const store=openStore(path.join(__dirname,'../runtime/next-cup.sqlite'));
 try{const m=monitor(store.db);if(process.argv[2]==='status')console.log(JSON.stringify(m.status(),null,2));
 else if(process.argv[2]==='record')console.log(JSON.stringify(m.record(JSON.parse(fs.readFileSync(process.argv[3],'utf8')))));
 else throw Error('사용법: node monitor.cjs status 또는 record 실행결과JSON경로');
 }catch(e){console.error(e.message);process.exitCode=1;}finally{store.close();}
}
