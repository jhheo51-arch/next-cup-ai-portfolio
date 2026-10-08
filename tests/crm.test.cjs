const test=require('node:test'),assert=require('node:assert/strict');
const {aggregate}=require('../app/crm.cjs');const {createApp}=require('../app/server.cjs');
test('가상 CRM 단계는 서로 다른 의미로 집계',()=>{const d=aggregate();assert.deepEqual([d.scenarioCount,d.followUpCount,d.alertEligibleCount,d.consentedCount,d.matchedCount,d.deliveredCount],[9,6,4,3,2,1]);assert.equal(d.byTopic.find(x=>x.id==='rice').count,3);});
test('동의 기반 관심 알림과 중복 방지',async()=>{const app=createApp({dbPath:':memory:'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port,clientId='11111111-1111-4111-8111-111111111111';const post=async(url,body)=>{const r=await fetch(base+url,{method:'POST',headers:{Origin:base,'X-Next-Cup':'1','Content-Type':'application/json'},body:JSON.stringify(body)});return{status:r.status,body:await r.json()}};try{
 assert.equal((await post('/api/crm/subscribe',{clientId,topics:['rice'],consent:false})).status,400);
 assert.deepEqual((await post('/api/crm/subscribe',{clientId,topics:['rice','crunch'],consent:true})).body.topics,['crunch','rice']);
 const first=await post('/api/crm/test-notification',{clientId,eventId:'synthetic-rice-menu-20261008'});assert.equal(first.status,200);assert.equal(first.body.delivery.duplicate,false);assert.equal(first.body.remotePush,false);
 assert.equal((await post('/api/crm/test-notification',{clientId,eventId:'synthetic-rice-menu-20261008'})).body.delivery.duplicate,true);
 assert.deepEqual((await post('/api/crm/unsubscribe',{clientId})).body.topics,[]);
 assert.equal((await post('/api/crm/test-notification',{clientId,eventId:'synthetic-rice-menu-20261008'})).status,400);
}finally{app.server.closeAllConnections();await app.close();}});
