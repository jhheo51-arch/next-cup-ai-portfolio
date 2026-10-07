const test=require('node:test'),assert=require('node:assert/strict');
const {classifyNeed}=require('../app/need-triage.cjs');
const {checkTaste}=require('../app/ai.cjs'),{checkGrounding}=require('../app/taste-policy.cjs');
for(const c of require('../evidence/need-triage-cases.json').cases)test('요구 분류 '+c.id+' '+c.label,()=>{assert.equal(classifyNeed(c.input).code,c.expected);if(c.expected==='pending_review')for(const candidateCount of [undefined,-1,0.5])assert.equal(classifyNeed({consent:true,conditionsConfirmed:true,catalogReviewed:true,candidateCount}).code,'pending_review');});
const text='바닐라 향이 좋아요.';
const good={likes:['vanilla'],dislikes:[],essentialRice:'unknown',understanding:'바닐라 향 선호',question:'',evidence:[{tag:'vanilla',polarity:'like',quote:'바닐라 향이 좋아요'}]};
const guards=[
['사전 밖 태그 거절',{...good,likes:['sweet']}],
['좋아함과 피함 중복 거절',{...good,dislikes:['vanilla']}],
['필수 여부 임의 값 거절',{...good,essentialRice:'maybe'}],
['중복 선호 거절',{...good,likes:['vanilla','vanilla']}],
['확인 질문 타입 오류 거절',{...good,question:42}],
['추가 태그 근거 누락 거절',{...good,likes:['vanilla','coffee']}],
['없는 인용 거절',{...good,evidence:[{tag:'vanilla',polarity:'like',quote:'커피가 좋습니다'}]}],
['필수 근거 누락 거절',{...good,essentialRice:'yes'}]];
for(const [name,v]of guards)test('가상 AI 출력 '+name,()=>assert.equal(checkTaste(v)&&checkGrounding(v,[{role:'user',text}]),false));
test('가상 AI 출력 정상 형식은 통과',()=>assert.ok(checkTaste(good)&&checkGrounding(good,[{role:'user',text}])));
test('원문 인용 검사만으로 의미 정확성은 증명되지 않음',()=>{const v={...good,likes:['coffee'],evidence:[{tag:'coffee',polarity:'like',quote:'바닐라 향이 좋아요'}]};assert.ok(checkTaste(v)&&checkGrounding(v,[{role:'user',text}]));});
