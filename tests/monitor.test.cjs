const test=require('node:test'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite'),{monitor}=require('../monitor.cjs');
const checks=require('../evidence.json').sources.filter(x=>x.kind==='official').map(x=>({sourceId:x.id,result:'unchanged',note:'합성 시험 근거'}));
test('예약 운영 증거: 실제 기록과 중복, 소급 방지',()=>{
 const db=new DatabaseSync(':memory:'),m=monitor(db),b={slot:'2026-10-08',checks};
 try{
 assert.equal(m.status().runs.length,0);
 assert.throws(()=>m.record(b,new Date('2026-10-07T00:00:00Z')));
 assert.throws(()=>m.record({...b,checks:[]},new Date('2026-10-08T00:00:00Z')));
 assert.equal(m.record(b,new Date('2026-10-08T00:00:00Z')).final,false);
 assert.throws(()=>m.record(b,new Date('2026-10-08T00:01:00Z')));
 assert.equal(m.record({...b,slot:'2026-10-19'},new Date('2026-10-19T00:00:00Z')).final,true);
 assert.equal(m.status().runs.length,2);
 }finally{db.close();}
});
