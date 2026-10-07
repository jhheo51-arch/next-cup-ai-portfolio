(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NextCup=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const labels={rice:'구수한 쌀 풍미',cream:'부드러운 크림감',ice:'차갑게 갈린 질감',crunch:'바삭한 토핑',coffee:'커피 풍미',vanilla:'바닐라 향',spice:'계피, 향신료',tea:'차 풍미',matcha:'말차 풍미',cocoa:'초콜릿 풍미',foam:'폼 질감',caramel:'카라멜 풍미'};
 const ingredients={rice:'이천 쌀',sesame:'흑임자',oat:'오트',vanilla:'바닐라'};
 const bases={cream:'크림 블렌디드',latte:'라떼',tea:'티 음료'};
 const textures={smooth:'부드럽게',crunch:'바삭한 포인트',thick:'꾸덕하게'};
 // These tags describe prototype assumptions, not verified recipes or sensory measurements.
 const drinks=[{id:'chocolate',name:'초콜릿 크림 칩 프라푸치노',tags:['cream','ice'],difference:'쌀의 구수함은 이어지지 않습니다. 초콜릿 풍미와 칩의 씹히는 질감이 다르며, 카페인이 없는 음료는 아닙니다.'},{id:'latte',name:'카페 라떼',tags:['cream','coffee'],difference:'쌀 풍미 대신 커피 풍미가 있으며, 갈린 얼음이나 바삭한 토핑의 대안은 아닙니다.'},{id:'coldbrew',name:'바닐라 크림 콜드 브루',tags:['cream','coffee'],difference:'쌀 풍미가 아닌 커피, 바닐라 계열입니다. 얼음을 갈아 만든 질감도 다릅니다.'}];
 const has=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k);
 const text=(v,max,required=true)=>typeof v==='string'&&v.length<=max&&(!required||v.trim().length>0);
 const list=(v,o,min=0)=>Array.isArray(v)&&v.length>=min&&v.length<=Object.keys(o).length&&new Set(v).size===v.length&&v.every(k=>has(o,k));
 function compare({tags,essential,store,dislikes=[]}={}){
  if(!list(tags,labels)||!list(dislikes,labels)||tags.some(t=>dislikes.includes(t))||typeof essential!=='boolean'||!['all','limited','unknown'].includes(store))return{status:'invalid',candidates:[]};
  if(store==='unknown')return{status:'unknown',candidates:[]};
  if(!tags.length)return{status:'clarify',candidates:[]};
  const allowed=drinks.filter(d=>(store!=='limited'||d.id!=='coldbrew')&&!d.tags.some(t=>dislikes.includes(t)));
  const candidates=allowed.filter(d=>!essential||d.tags.includes('rice')).map(d=>({...d,shared:tags.filter(t=>d.tags.includes(t)),missing:tags.filter(t=>!d.tags.includes(t))})).filter(d=>d.shared.length).sort((a,b)=>b.shared.length-a.shared.length||a.id.localeCompare(b.id));
  return{status:candidates.length?'partial':'empty',candidates};
 }
 function validate(type,p){
  if(!p||typeof p!=='object')return'입력 내용을 확인해 주세요.';
  if(type==='request'){
   if(!['return','local'].includes(p.kind))return'요청 유형을 선택해 주세요.';
   if(p.kind==='local'&&!text(p.localMenu,100))return'메뉴명과 지점을 100자 이내로 적어주세요.';
   if(!text(p.reason,500))return'그리운 이유를 1~500자로 적어주세요.';
   if(!text(p.keep,160))return'꼭 지킬 맛을 1~160자로 적어주세요.';
   if(!text(p.change,160,false))return'달라져도 괜찮은 점은 160자 이내로 적어주세요.';
  }else if(type==='idea'){
   if(!text(p.title,60))return'메뉴 이름을 1~60자로 적어주세요.';
   if(!has(bases,p.base)||!has(textures,p.texture))return'음료와 식감을 다시 선택해 주세요.';
   if(!list(p.ingredients,ingredients,1))return'더하고 싶은 재료를 하나 이상 골라주세요.';
   if(!text(p.story,500))return'누가, 언제 좋아할 메뉴인지 1~500자로 적어주세요.';
  }else if(type==='candidate'){
   if(!list(p.tags,labels,1)||typeof p.essential!=='boolean'||!compare(p).candidates.some(d=>d.id===p.drinkId))return'취향과 매장 조건에 맞는 후보인지 다시 확인해 주세요.';
   if(!['pending','liked','different','tooSweet'].includes(p.feedback))return'시음 평가를 확인해 주세요.';
  }else return'지원하지 않는 기록입니다.';
  return'';
 }
 function isRecord(r){return!!r&&typeof r==='object'&&text(r.id,100)&&/^[a-zA-Z0-9-]+$/.test(r.id)&&typeof r.createdAt==='string'&&Number.isFinite(Date.parse(r.createdAt))&&!validate(r.type,r.payload);}
 function signature(type,p){if(type==='candidate')return JSON.stringify([type,p.drinkId,p.store,[...p.tags].sort(),p.essential]);if(type==='request')return JSON.stringify([type,p.kind,p.localMenu||'',p.reason,p.keep,p.change]);return JSON.stringify([type,p.title,p.base,[...p.ingredients].sort(),p.texture,p.story]);}
 return{labels,ingredients,bases,textures,drinks,compare,validate,isRecord,signature};
});
