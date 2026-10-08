"use strict";
const fs=require("node:fs"),path=require("node:path");
const topics={rice:"쌀의 구수한 풍미",crunch:"바삭한 토핑",ice:"시원하게 갈린 질감",purpose:"지역 농가와 연결된 취지"};
const scenarios=JSON.parse(fs.readFileSync(path.join(__dirname,"../evidence/crm-scenarios.json"),"utf8"));
const event={id:"synthetic-rice-menu-20261008",topic:"rice",title:"관심 메뉴 알림 시험",body:"쌀 풍미와 관련된 메뉴가 공식 목록에서 확인된 상황을 가정한 시험 알림입니다.",sourceKind:"synthetic",checked:"2026-10-08"};
function aggregate(rows=scenarios.rows){
 const count=key=>rows.filter(r=>r[key]).length;
 const byTopic=Object.entries(topics).map(([id,label])=>({id,label,count:rows.filter(r=>r.topic===id).length})).sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id));
 return{scenarioCount:rows.length,followUpCount:count("followUp"),alertEligibleCount:count("alertEligible"),consentedCount:count("consented"),matchedCount:count("matched"),deliveredCount:count("delivered"),byTopic,stages:[
  {id:"follow_up",label:"후속 검토",count:count("followUp")},{id:"eligible",label:"알림 후보",count:count("alertEligible")},{id:"consented",label:"알림 동의",count:count("consented")},{id:"matched",label:"조건 일치",count:count("matched")},{id:"delivered",label:"시험 발송",count:count("delivered")}
 ]};
}
const validClient=id=>typeof id==="string"&&/^[a-f0-9-]{36}$/.test(id);
function createCRM(store){return{
 dashboard(){return{dataKind:"synthetic-scenario",notice:"가상 시나리오 9건입니다. 실제 고객 수요, 구매 의사, 발송 실적이 아닙니다.",...aggregate(),localPrototype:store.crmMetrics(),rows:scenarios.rows.map(({id,need,decision,followUp,alertEligible,consented,matched,delivered,topic})=>({id,need,decision,followUp,alertEligible,consented,matched,delivered,topic}))};},
 status(clientId){if(!validClient(clientId))throw Object.assign(new Error("알림 식별값을 확인해 주세요."),{status:400});return{topics:store.crmStatus(clientId),event};},
 subscribe({clientId,topics:selected,consent}){if(!validClient(clientId))throw Object.assign(new Error("알림 식별값을 확인해 주세요."),{status:400});if(consent!==true)throw Object.assign(new Error("관심 메뉴 알림에 동의해 주세요."),{status:400});if(!Array.isArray(selected)||selected.length<1||selected.length>4||new Set(selected).size!==selected.length||selected.some(x=>!topics[x]))throw Object.assign(new Error("관심 조건을 하나 이상 선택해 주세요."),{status:400});store.crmSubscribe(clientId,selected);return{topics:store.crmStatus(clientId)};},
 unsubscribe({clientId}){if(!validClient(clientId))throw Object.assign(new Error("알림 식별값을 확인해 주세요."),{status:400});store.crmUnsubscribe(clientId);return{topics:[]};},
 dispatch({clientId,eventId}){if(!validClient(clientId)||eventId!==event.id)throw Object.assign(new Error("알림 시험 정보를 확인해 주세요."),{status:400});const active=store.crmStatus(clientId);if(!active.includes(event.topic))throw Object.assign(new Error("쌀 풍미 관심 알림에 먼저 동의해 주세요."),{status:400});const result=store.crmDeliver(clientId,event);return{event,delivery:result,remotePush:false,notice:"로컬 시험 서버가 조건과 동의를 확인했습니다. 브라우저 알림 표시를 시도합니다."};}
};}
module.exports={topics,scenarios,event,aggregate,createCRM};
