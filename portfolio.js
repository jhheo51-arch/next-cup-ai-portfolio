"use strict";
(() => {
  const $ = s => document.querySelector(s);
  $('.brand').insertAdjacentHTML('afterbegin','<span class="brand-seal" aria-hidden="true">N<span>✦</span></span>');
  $('header').insertAdjacentHTML('beforeend','<span class="header-edition">TASTE MEMORY / No. 01</span>');
  $('header').insertAdjacentHTML('afterend','<div class="concept-strip"><span>STARBUCKS FAN CONCEPT</span><span>개인 포트폴리오 / 공식 서비스가 아닙니다</span></div>');
  const start=$('#start'), hero=document.createElement('div');hero.className='editorial-hero';
  const copy=document.createElement('div');copy.className='hero-copy';
  ['.eyebrow','h1','.lead'].forEach(s=>copy.append(start.querySelector(s)));
  copy.querySelector('.eyebrow').textContent='그리운 메뉴에서 시작하는 다음 선택';
  copy.querySelector('h1').innerHTML='좋아했던 그 음료,<br> <em>다음엔 무엇을</em><br> 마실까요?';
  copy.querySelector('.lead').innerHTML='쌀의 구수함이었을까요, 시원하게 갈린 질감이었을까요.<br> 다음 잔에서도 만나고 싶은 특징을 찾아보세요.';
  copy.insertAdjacentHTML('beforeend','<a class="hero-cta" href="#memory" id="hero-begin">내 취향으로 다음 잔 찾기 <span aria-hidden="true">↗</span></a><p class="hero-footnote">가입 없이 시작 / AI 해석은 직접 확인해요</p>');
  hero.append(copy);hero.insertAdjacentHTML('beforeend',`<figure class="hero-art"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="art-overline">THE CUP I REMEMBER</span><span class="flavour-note note-one">구수한 쌀 풍미</span><span class="flavour-note note-two">시원하게 갈린 질감</span><img src="rice-cup.svg" width="480" height="540" alt="쌀 음료의 기억을 표현한 NEXT CUP 콘셉트 일러스트"><figcaption><span>OUR FIRST MEMORY</span><strong>이천 햅쌀 크림 프라푸치노</strong><small>실제 제품 사진이 아닌 콘셉트 일러스트</small></figcaption></figure>`);
  start.prepend(hero);
  const journey=document.createElement('div');journey.className='editorial-journey';journey.innerHTML='<span><b>01</b> 기억을 들려주세요</span><i aria-hidden="true">→</i><span><b>02</b> 원하는 특징을 확인해요</span><i aria-hidden="true">→</i><span><b>03</b> 대안을 비교하고, 바람을 남겨요</span>';hero.after(journey);
  const entry=document.createElement('div');entry.className='memory-layout';entry.innerHTML='<div class="memory-heading"><p class="eyebrow">YOUR TASTE, IN YOUR WORDS</p><h2>그 음료의 어떤 점이<br> 좋으셨나요?</h2><p>메뉴 이름만 기억나도 괜찮아요.<br> 좋아했던 맛과 지금 원하는 점을<br> 편하게 적어주세요.</p><div class="memory-note"><span>기억과 다음 선택은 다를 수 있어요.</span><p>같은 맛이 아니어도, 좋아하던 질감이<br> 다음 선택의 이유가 될 수 있으니까요.</p></div></div><div class="memory-card"></div>';
  journey.after(entry);entry.querySelector('.memory-card').append($('#memory-form'),$('#manual'));
  entry.querySelector('.memory-heading').append($('.about'));
  $('#memory-form label[for=memory]').textContent='내가 기억하는 한 잔';
  $('#memory').placeholder='이천 햅쌀 크림 프라푸치노를 좋아했어요. 쌀의 구수한 맛과 과자 같은 토핑, 시원하게 갈린 질감이 기억나요.';
  $('#hero-begin').addEventListener('click',e=>{e.preventDefault();$('#memory').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});$('#memory').focus({preventScroll:true});});
  for(const id of ['confirm','result','request','saved']){
    const section=$('#'+id);section.classList.add('inner-page');
    section.insertAdjacentHTML('afterbegin',`<div class="page-kicker"><a href="#start">NEXT CUP</a><span>${{confirm:'나의 취향',result:'다음 한 잔',request:'남겨두는 바람',saved:'나의 기록'}[id]}</span></div>`);
  }
  $('#confirm').insertAdjacentHTML('beforeend','<aside class="quiet-note"><span>같은 맛을 약속하지 않습니다.</span><p>좋아하는 특징이 겹치는 후보를 비교하고, 꼭 필요한 특징이 없으면 추천하지 않습니다.</p></aside>');
  $('#request').insertAdjacentHTML('beforeend','<aside class="quiet-note"><span>추천이 끝나도, 취향은 남습니다.</span><p>찾지 못한 요구는 다음 메뉴를 생각하는 출발점입니다. 기록은 이 브라우저에만 보관됩니다.</p></aside>');
  const observer=new MutationObserver(()=>{
    document.querySelectorAll('.drink').forEach((card,i)=>{
      if(card.dataset.designed)return;card.dataset.designed='true';
      const name=card.querySelector('h2').textContent;
      const tone=name.includes('딸기')?'strawberry':name.includes('망고')?'mango':name.includes('초콜릿')?'cocoa':name.includes('콜드')?'cold':'latte';
      card.insertAdjacentHTML('afterbegin',`<div class="drink-visual ${tone}" aria-hidden="true"><span class="drink-number">0${i+1} / NEXT CUP</span><div class="mini-cup"><span>N</span></div><span class="drink-type">${['cocoa','strawberry','mango'].includes(tone)?'BLENDED':tone==='cold'?'COLD BREW':'LATTE'}</span></div>`);
    });
  });observer.observe($('#candidates'),{childList:true});
})();
