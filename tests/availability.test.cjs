const test=require('node:test'),assert=require('node:assert/strict');
const {createAI}=require('../app/ai.cjs');
test('503 혼잡은 일반 연결 오류와 구분하고 직접 선택 안내',async()=>{
 const events=[];const ai=createAI({config:{key:'synthetic-only',model:'fixture'},fetchImpl:async()=>({ok:false,status:503}),onEnd:(_id,status)=>events.push(status)});
 await assert.rejects(ai.taste([{role:'user',text:'바닐라 향이 좋아요.'}]),e=>e.code==='UNAVAILABLE'&&e.status===503&&e.message.includes('직접 선택'));
 assert.deepEqual(events,['UNAVAILABLE']);
});
