// Optional paid Gemini calls. All prompts below are synthetic, not customer evidence.
const {createAI}=require('../ai.cjs'),fs=require('node:fs'),path=require('node:path');
const cases=[
 ['rice','이천 햅쌀 크림 프라푸치노의 구수한 쌀 풍미가 꼭 있어야 합니다. 커피는 싫어요.',['rice'],['coffee'],'yes'],
 ['vanilla','바닐라 크림 콜드 브루의 바닐라 향과 크림감이 좋아요.',['vanilla','cream'],[],'unknown'],
 ['custard','슈크림 라떼의 부드러운 크림감이 좋아요. 커피 풍미는 피하고 싶어요.',['cream'],['coffee'],'unknown'],
 ['chai','차이 티 라떼의 계피 향신료 향과 차 풍미를 좋아합니다.',['spice','tea'],[],'unknown'],
 ['glazed','블랙 글레이즈드 라떼의 폼 질감과 커피 풍미가 좋아요.',['foam','coffee'],[],'unknown'],
 ['jeju','제주 비자림 콜드 브루의 말차와 커피 풍미를 좋아합니다.',['matcha','coffee'],[],'unknown']
];
(async()=>{
 const ai=createAI(),rows=[];
 if(!ai.configured)throw Error('Gemini 설정이 없습니다.');
 for(const [id,prompt,likes,dislikes,rice]of cases){
  try{const r=await ai.taste([{role:'user',text:'합성 기능 시험용 문장입니다. '+prompt}]);
   rows.push({id,kind:'synthetic',pass:likes.length===r.result.likes.length&&likes.every(x=>r.result.likes.includes(x))&&dislikes.length===r.result.dislikes.length&&dislikes.every(x=>r.result.dislikes.includes(x))&&r.result.essentialRice===rice,expected:{likes,dislikes,essentialRice:rice},result:r.result,meta:r.meta});
  }catch(e){rows.push({id,kind:'synthetic',pass:false,errorCode:e.code||'ERROR'});}
  console.log(JSON.stringify({id,pass:rows.at(-1).pass}));
 }
 const report={at:new Date().toISOString(),model:ai.model,kind:'synthetic',humanParticipants:0,scope:'6개의 명시적 표현 검사. 모호한 기억, 실제 맛, 고객 효과 검증 아님.',rows};
 const dir=path.join(__dirname,'../runtime');fs.mkdirSync(dir,{recursive:true});const dest=path.join(dir,'live-cases-'+Date.now()+'.json');
 fs.writeFileSync(dest,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({passed:rows.filter(x=>x.pass).length,total:rows.length,report:dest}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
