'use strict';
// Analyst-side triage, not a customer classifier or a demand forecast.
// Inputs must come from reviewed records. Free text alone never establishes a cause.
function classifyNeed(x={}){
 if(x.safetyRelated===true)return{code:'safety_review',owner:'운영 담당',next:'알레르기 등 안전 조건은 추천으로 해결하지 말고 공식 정보 확인 안내'};
 if(x.consent!==true)return{code:'no_collection',owner:'운영 담당',next:'집계하지 않음. 기기 안 기록은 별도 유지'};
 if(x.interpretationChanged===true&&x.changeReason!=='preference_change'&&x.changeReason!=='misread')return{code:'change_reason_unknown',owner:'기획 담당',next:'AI 오해석인지 생각이 바뀐 것인지 확인'};
 if(x.changeReason==='misread')return{code:'interpretation_review',owner:'AI 담당',next:'원문과 수정 조건을 확인하고 평가 문장에 추가'};
 if(x.outsideSupportedFeatures===true)return{code:'unrepresented_need',owner:'기획 담당',next:'맛 이외의 요구 또는 표현하지 못하는 조건을 별도 조사'};
 if(x.verifiedMissingMenu===true)return{code:'catalog_gap',owner:'데이터 담당',next:'공식 출처와 판매 범위 확인 후 목록 보완'};
 if(x.conditionsConfirmed!==true||x.catalogReviewed!==true||!Number.isInteger(x.candidateCount)||x.candidateCount<0)return{code:'pending_review',owner:'데이터 담당',next:'조건 확인과 목록 누락 점검부터 수행'};
 if(x.candidateCount===0)return{code:'unmet_in_catalog',owner:'기획 담당',next:'현재 목록에서 미충족. 전체 시장 부재나 신메뉴 수요로 해석하지 않음'};
 return{code:'alternative_available',owner:'기획 담당',next:'대안 선택 이유 확인. 구매나 만족을 자동으로 가정하지 않음'};
}
module.exports={classifyNeed};
