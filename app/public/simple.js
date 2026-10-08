"use strict";
(() => {
  const C = NextCup, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const key = "next-cup:simple:v1", clientKey="next-cup:crm-client:v1", pages = ["start","confirm","result","request","saved","crm"];
  let comparison = null, controller = null, epoch = 0;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mainTags = ['rice','ice','crunch','cream','cocoa','fruit','yogurt'];
  for (const [tag,label] of Object.entries(C.labels)) {
    $(mainTags.includes(tag) ? '#likes' : '#more-likes').insertAdjacentHTML('beforeend', `<label><input type="checkbox" name="like" value="${tag}">${label}</label>`);
    $('#dislikes').insertAdjacentHTML('beforeend', `<label><input type="checkbox" name="avoid" value="${tag}">${label}</label>`);
  }
  function priorityOptions() {
    const select = $('#priority'), previous = select.value;
    const makeOption = (value, label) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      return option;
    };
    const options = [makeOption('', '없어요')];
    for (const input of $$('[name=like]:checked').filter(x=>x.value!=='rice')) {
      options.push(makeOption(input.value, C.labels[input.value] || input.value));
    }
    select.replaceChildren(...options);
    if ([...select.options].some(x=>x.value===previous)) select.value=previous;
  }
  function cancel() { epoch++; controller?.abort(); controller=null; $('#interpret').disabled=false; $('#ai-status').textContent=''; }
  function show(id) {
    if (!pages.includes(id)) id='start';
    if (['result','request'].includes(id) && !comparison) id='start';
    if(id!=='start') cancel();
    pages.forEach(page=>$('#'+page).hidden=page!==id);
    if(id==='saved') renderSaved();
    if(id==='crm') renderCRM();
    $$('[data-view-link]').forEach(link=>link.toggleAttribute('aria-current',link.dataset.viewLink===id));
    history.replaceState(null,'','#'+id); window.scrollTo(0,0); $('#'+id+' h1').setAttribute('tabindex','-1'); $('#'+id+' h1').focus({preventScroll:true});
  }
  $$('[data-go]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.go)));
  window.addEventListener('hashchange',()=>show(location.hash.slice(1)));
  $('#manual').addEventListener('click',()=>{ cancel(); $('#interpretation').textContent='좋아하는 특징을 직접 골라주세요.'; show('confirm'); });
  $('#memory').addEventListener('input',cancel);
  async function post(url, body, signal) {
    const response = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-Next-Cup':'1'},body:JSON.stringify(body),signal});
    const data=await response.json(); if(!response.ok) throw Error(data.error || '처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'); return data;
  }
  $('#memory-form').addEventListener('submit',async e=>{
    e.preventDefault(); cancel(); const ticket=epoch; controller=new AbortController(); const timer=setTimeout(()=>controller?.abort(),13000);
    $('#interpret').disabled=true; $('#ai-status').textContent='취향을 정리하고 있습니다. 기다리지 않고 직접 선택할 수도 있어요.';
    try {
      const data=await post('/api/ai/taste',{history:[{role:'user',text:$('#memory').value.trim()}],consent:$('#consent').checked},controller.signal);
      if(ticket!==epoch)return;
      $$('[name=like]').forEach(x=>x.checked=data.result.likes.includes(x.value)); $$('[name=avoid]').forEach(x=>x.checked=data.result.dislikes.includes(x.value));
      $('#rice').value=['yes','no'].includes(data.result.essentialRice)?data.result.essentialRice:'';
      $('#priority').value=''; priorityOptions();
      $('#interpretation').textContent=[data.result.understanding, data.result.question ? '확인할 점: '+data.result.question : '', '다르게 해석한 부분은 직접 바꿔주세요.'].filter(Boolean).join(' ');
      if($$('#more-likes input:checked').length) $('#more-likes').parentElement.open=true;
      if($$('#dislikes input:checked').length) $('#dislikes').parentElement.open=true;
      comparison=null; show('confirm');
    } catch(error){if(ticket===epoch) $('#ai-status').textContent=error.name==='AbortError'?'시간이 오래 걸리고 있어요. 입력은 그대로 두었으니 직접 선택하거나 다시 시도해 주세요.':error.message;}
    finally{clearTimeout(timer);if(ticket===epoch){$('#interpret').disabled=false;controller=null;}}
  });
  $('#taste-form').addEventListener('change',()=>{priorityOptions();comparison=null;$('#confirm-error').textContent='';});
  $('#taste-form').addEventListener('submit',async e=>{
    e.preventDefault(); const button=e.submitter;
    const input={tags:$$('[name=like]:checked').map(x=>x.value),dislikes:$$('[name=avoid]:checked').map(x=>x.value),essential:$('#rice').value==='yes',priority:$('#priority').value,store:'all'};
    if(input.tags.some(tag=>input.dislikes.includes(tag))){$('#confirm-error').textContent='같은 특징을 좋아하는 항목과 피하는 항목에 동시에 선택하지 말아주세요.';return;}
    if(!input.tags.length&&!input.essential){$('#confirm-error').textContent='좋아하는 특징을 하나 이상 골라주세요.';return;}
    button.disabled=true;
    const snapshot=JSON.stringify(input);
    try{
      const result=await post('/api/recommend',input,AbortSignal.timeout(12000));
      const current={tags:$$('[name=like]:checked').map(x=>x.value),dislikes:$$('[name=avoid]:checked').map(x=>x.value),essential:$('#rice').value==='yes',priority:$('#priority').value,store:'all'};
      if(snapshot!==JSON.stringify(current)){ $('#confirm-error').textContent='조건이 바뀌었습니다. 다시 비교해 주세요.';return; }
      comparison={input,result};
      $('#result-title').textContent=result.candidates.length?'이 특징을 이어갈 수 있어요.':'지금 목록에서는 찾지 못했어요.';
      $('#result-note').textContent=result.candidates.length?'같은 맛이라는 뜻은 아닙니다. 맞는 점과 달라지는 점을 함께 살펴보세요.':'조건을 바꿔서 억지로 고를 필요는 없어요. 찾지 못한 특징을 남겨두세요.';
      $('#candidates').innerHTML=result.candidates.map(d=>`<article class="drink"><h2>${esc(d.name)}</h2><p><strong>이어갈 특징</strong><br>${d.shared.map(t=>C.labels[t]).join(', ')}</p><p><strong>달라지는 점</strong><br>${esc(d.difference)}</p>${d.missing.length?'<p>채우지 못한 특징: '+d.missing.map(t=>C.labels[t]).join(', ')+'</p>':''}</article>`).join('');
      $('#sources').innerHTML=result.sources.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(C.drinks.find(d=>d.id===s.id)?.name||'메뉴')} 자료</a></p>`).join('');show('result');
    }catch(error){$('#confirm-error').textContent=error.name==='TimeoutError'?'응답이 늦어지고 있습니다. 선택은 그대로 남아 있으니 다시 시도해 주세요.':error.message;}finally{button.disabled=false;}
  });
  $('#to-request').addEventListener('click',()=>{show('request');});
  function records(){const value=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(value)||value.some(r=>!r||typeof r.text!=='string'))throw Error('저장 기록을 읽지 못했습니다. 기존 내용은 덮어쓰지 않았습니다.');return value;}
  $('#request-form').addEventListener('submit',e=>{e.preventDefault();try{const text=$('#unmet').value.trim();if(!text)throw Error('남기고 싶은 특징을 적어주세요.');const rows=records();localStorage.setItem(key,JSON.stringify([...rows,{id:crypto.randomUUID(),text,comparison,at:new Date().toISOString()}]));$('#unmet').value='';show('saved');}catch(error){$('#save-error').textContent=error.message;}});
  function renderSaved(){try{$('#records').innerHTML=records().map(r=>`<article class="record"><p>${esc(r.text)}</p><p class="fine">${esc(new Date(r.at).toLocaleDateString('ko-KR'))} / 내 기기 기록</p></article>`).join('')||'<p>아직 남겨둔 기록이 없습니다.</p>';}catch(error){$('#records').textContent=error.message;}}
  function clientId(){let value=localStorage.getItem(clientKey);if(!/^[a-f0-9-]{36}$/.test(value||'')){value=crypto.randomUUID();localStorage.setItem(clientKey,value);}return value;}
  async function loadAlertStatus(){try{const response=await fetch('/api/crm/status?clientId='+encodeURIComponent(clientId()));const data=await response.json();if(!response.ok)throw Error(data.error);$$('[name=alert-topic]').forEach(x=>x.checked=data.topics.includes(x.value));$('#alert-consent').checked=data.topics.length>0;$('#alert-status').textContent=data.topics.length?'알림 동의가 저장되어 있습니다. 선택한 조건은 '+data.topics.length+'개입니다.':'저장된 알림 동의가 없습니다.';}catch(error){$('#alert-status').textContent=error.message;}}
  async function notificationReady(){if(!('Notification'in window)||!('serviceWorker'in navigator))throw Error('이 브라우저에서는 알림 시험을 지원하지 않습니다.');const permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;if(permission!=='granted')throw Error('브라우저 알림 권한이 필요합니다. 주소창의 사이트 권한에서 다시 허용할 수 있습니다.');await navigator.serviceWorker.register('/sw.js');return navigator.serviceWorker.ready;}
  $('#alert-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;$('#alert-status').textContent='알림 권한과 동의를 확인하고 있습니다.';try{const topics=$$('[name=alert-topic]:checked').map(x=>x.value);if(!topics.length)throw Error('관심 조건을 하나 이상 선택해 주세요.');if(!$('#alert-consent').checked)throw Error('관심 메뉴 알림에 동의해 주세요.');await notificationReady();const data=await post('/api/crm/subscribe',{clientId:clientId(),topics,consent:true},AbortSignal.timeout(12000));$('#alert-status').textContent='선택한 관심 조건 '+data.topics.length+'개를 저장했습니다. 요구 문장 원문은 전송하지 않았습니다.';}catch(error){$('#alert-status').textContent=error.message;}finally{button.disabled=false;}});
  $('#unsubscribe').addEventListener('click',async e=>{const button=e.currentTarget;button.disabled=true;try{await post('/api/crm/unsubscribe',{clientId:clientId()},AbortSignal.timeout(12000));$$('[name=alert-topic]').forEach(x=>x.checked=false);$('#alert-consent').checked=false;$('#alert-status').textContent='관심 메뉴 알림을 해제했습니다.';}catch(error){$('#alert-status').textContent=error.message;}finally{button.disabled=false;}});
  async function renderCRM(){try{const response=await fetch('/api/crm/dashboard');const data=await response.json();if(!response.ok)throw Error(data.error);$('#crm-notice').textContent=data.notice;const metrics=[['가상 사례',data.scenarioCount],['후속 검토',data.followUpCount],['알림 동의',data.consentedCount],['조건 일치',data.matchedCount],['시험 발송',data.deliveredCount]];$('#crm-metrics').innerHTML=metrics.map(([label,value])=>`<article><strong>${value}</strong><span>${label}</span></article>`).join('');const max=Math.max(...data.stages.map(x=>x.count),1);$('#crm-pipeline').innerHTML=data.stages.map(x=>`<div class="bar-row"><span>${esc(x.label)}</span><progress max="${max}" value="${x.count}" aria-label="${esc(x.label)} ${x.count}건"></progress><strong>${x.count}</strong></div>`).join('');$('#crm-needs').innerHTML=data.byTopic.filter(x=>x.count).map(x=>`<div class="need-row"><span>${esc(x.label)}</span><strong>${x.count}건</strong></div>`).join('');$('#crm-status').textContent=`이 로컬 서버의 알림 동의 기기 ${data.localPrototype.subscribedClients}개 / 시험 발송 요청 ${data.localPrototype.deliveryRequests}건`;}catch(error){$('#crm-notice').textContent=error.message;}}
  $('#test-notification').addEventListener('click',async e=>{const button=e.currentTarget;button.disabled=true;try{const registration=await notificationReady();const data=await post('/api/crm/test-notification',{clientId:clientId(),eventId:'synthetic-rice-menu-20261008'},AbortSignal.timeout(12000));if(!data.delivery.duplicate)await registration.showNotification(data.event.title,{body:data.event.body,tag:data.event.id,data:{url:'/#saved'}});await renderCRM();$('#crm-status').textContent=data.delivery.duplicate?'같은 시험 알림은 이미 요청했습니다. 중복 발송하지 않았습니다.':'브라우저에 시험 알림을 표시했습니다. 실제 스타벅스 소식이나 원격 푸시가 아닙니다.';}catch(error){$('#crm-status').textContent=error.message;}finally{button.disabled=false;}});
  window.addEventListener('hashchange',()=>{if(location.hash==='#saved')loadAlertStatus();});
  loadAlertStatus();
  show(location.hash.slice(1)||'start');
})();
