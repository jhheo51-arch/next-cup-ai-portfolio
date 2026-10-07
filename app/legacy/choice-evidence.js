"use strict";
(() => {
  const key = "next-cup:choice-evidence:v1";
  const version = "choice-v05/catalog-3/required-feature-v1";
  let trial = null;
  $("#rice-requirement").closest(".field").insertAdjacentHTML("afterend", `<div class="field"><label for="taste-priority">이번 음료에서 꼭 유지할 특징 하나</label><select id="taste-priority"><option value="">추가 필수 조건 없음</option>${Object.entries(C.labels).filter(([id]) => id !== "rice").map(([id,label]) => `<option value="${id}">${label}</option>`).join("")}</select><p class="fine">위에서 좋아하는 감각으로 선택한 항목 중 하나를 고르세요. 예를 들어 갈린 질감이 필수라면 라떼나 콜드 브루는 추천하지 않습니다. 쌀 풍미의 필수 여부는 별도로 확인합니다.</p></div>`);
  function read() {
    const rows = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(rows) || rows.some(r => !r || !["choice", "trial"].includes(r.type)))
      throw Error("기존 기록을 읽을 수 없습니다. 브라우저 저장 내용을 확인해 주세요.");
    return rows;
  }
  function save(row) {
    const rows = read();
    localStorage.setItem(key, JSON.stringify([...rows, { ...row, id: crypto.randomUUID(), savedAt: new Date().toISOString(), version }]));
    render();
  }
  $("#finder").insertAdjacentHTML("beforebegin", `<section class="section" aria-labelledby="choice-intent"><div class="card"><p class="eyebrow">이 서비스로 확인할 것</p><h2 id="choice-intent">똑같은 맛이 아니어도, 원하는 특징은 고를 수 있습니다.</h2><p>쌀 풍미가 꼭 필요하면 추천을 보류합니다. 차갑게 갈린 질감이 더 중요하다면 그 조건이 맞는 후보를 보여줍니다. 어떤 조건을 포기해도 되는지는 직접 결정합니다.</p><details><summary>왜 비교 음료가 3종인가요?</summary><p>초콜릿 크림 칩 프라푸치노는 갈린 질감과 초콜릿, 카페 라떼는 우유의 부드러움과 커피, 바닐라 크림 콜드 브루는 바닐라 향과 커피 조건을 시험하기 위한 목록입니다. 인기순이나 전체 메뉴를 대표하는 표본이 아닙니다.</p><p>과일과 요거트 음료는 이 목록에 없습니다. 원하는 후보가 없으면 ‘전체 메뉴에 대안 없음’이 아니라 ‘이 목록으로 판단할 수 없음’입니다. 구매 전 공식 메뉴와 매장 판매 여부를 확인해 주세요.</p><a href="https://www.starbucks.co.kr/menu/drink_list.do" target="_blank" rel="noreferrer">공식 음료 목록 확인</a></details></div></section>`);
  $("#collection").insertAdjacentHTML("beforeend", `<section class="card" id="choice-log"><h2>추천 밖에서 고른 음료도 기록하세요</h2><p>선택, 실제 음용, 만족은 서로 다릅니다. 기록은 이 브라우저에만 저장되며 AI 분석이나 외부 공개에 자동 사용되지 않습니다.</p><form id="choice-form"><label for="choice-menu">고른 음료</label><input id="choice-menu" required maxlength="100"><label for="choice-stage">어디까지 해봤나요?</label><select id="choice-stage"><option value="considered">후보로 생각만 했어요</option><option value="selected">골랐지만 아직 마시지 않았어요</option><option value="tasted">실제로 마셨어요</option></select><label for="choice-reason">그 음료를 고른 이유</label><textarea id="choice-reason" required maxlength="500" placeholder="원했던 특징, 추천받은 계기 등을 적어주세요."></textarea><label for="choice-rating">마신 뒤 평가</label><select id="choice-rating"><option value="unknown">아직 평가하지 않았어요 / 기억나지 않아요</option><option value="okay">맛이 괜찮았어요</option><option value="different">원했던 것과 달랐어요</option></select><label for="choice-unmet">여전히 찾지 못한 점 / 없거나 기억나지 않으면 그대로 적어주세요</label><textarea id="choice-unmet" maxlength="500"></textarea><button class="button" type="submit">내 선택 기록 저장</button><p id="choice-error" role="alert"></p></form><div id="choice-rows"></div></section>`);
  $("#research").insertAdjacentHTML("beforeend", `<section class="card" id="comparison-study"><h2>AI 입력과 직접 선택 비교 시험</h2><p>실제 이용자를 대신하는 자동 검사는 아닙니다. 같은 사람과 같은 과제 번호로 두 방식을 각각 시험하세요. 시작할 때 기존 취향과 AI 대화는 초기화됩니다.</p><details><summary>시험 방법과 판단 기준</summary><p>한 사람은 AI부터, 다음 사람은 직접 선택부터 시작합니다. 동일한 과제 문장과 후보 목록을 사용하고, 과제 설명을 읽은 뒤 시작합니다. 시간은 시작부터 결과 저장까지이며 중간에 다른 일을 하면 해당 회차를 중단으로 기록하세요.</p><p>완료 시간만 짧아져도 성공은 아닙니다. 조건 오류, 수정 횟수, 결과를 이해했는지를 함께 확인합니다. 느리거나 실패한 기록도 지우지 않습니다. 가상 시험과 본인 시험은 외부 사용자 검증에 합산하지 않습니다.</p></details><form id="trial-setup"><label for="trial-person">익명 참가자 번호 / 실명 금지</label><input id="trial-person" required maxlength="30" pattern="[A-Za-z0-9_-]+" placeholder="P01"><label for="trial-task">과제 번호 / 두 방식에서 동일하게 입력</label><input id="trial-task" required maxlength="30" pattern="[A-Za-z0-9_-]+" placeholder="T01"><label for="trial-kind">시험 구분</label><select id="trial-kind"><option value="synthetic">가상 시나리오 시험</option><option value="self">본인 직접 시험</option><option value="external">외부 이용자 직접 시험</option></select><label for="trial-mode">이번 입력 방식</label><select id="trial-mode"><option value="manual">직접 항목 선택</option><option value="ai">AI로 문장 정리</option></select><button class="button" type="submit">초기화하고 시험 시작</button></form><p id="trial-state" role="status">진행 중인 시험이 없습니다.</p><form id="trial-finish" hidden><label for="trial-outcome">이번 결과</label><select id="trial-outcome"><option value="completed">조건과 결과를 확인했어요</option><option value="failed">조건을 제대로 반영하지 못했어요</option><option value="aborted">중단했어요 / 다른 일을 했어요</option></select><label for="trial-understood">왜 후보가 나왔거나 보류됐는지 이해했나요?</label><select id="trial-understood"><option value="unknown">미확인</option><option value="yes">예</option><option value="no">아니요</option></select><label for="trial-note">틀린 조건, 불편한 점 / 없으면 없음</label><textarea id="trial-note" required maxlength="500"></textarea><button class="button" type="submit">이번 회차 저장</button></form><p id="trial-error" role="alert"></p><p class="fine">입력 방식은 선택한 계획과 실제 AI 요청 횟수를 함께 기록합니다. 브라우저를 새로고침하면 진행 중인 회차는 복구되지 않습니다. 다운로드한 원문에는 직접 적은 내용이 포함되므로 공개 전에 확인하세요.</p><button class="outline" id="evidence-export" type="button">내 시험과 선택 기록 내려받기</button><div id="trial-rows"></div></section>`);
  $("#choice-form").addEventListener("submit", e => {
    e.preventDefault();
    const stage = $("#choice-stage").value, rating = $("#choice-rating").value;
    try {
      if (stage !== "tasted" && rating !== "unknown") throw Error("실제로 마신 경우에만 맛을 평가할 수 있습니다.");
      if (!$("#choice-menu").value.trim() || !$("#choice-reason").value.trim()) throw Error("음료와 선택 이유를 공백 없이 적어주세요.");
      save({ type: "choice", menu: $("#choice-menu").value.trim(), reason: $("#choice-reason").value.trim(), stage, rating, unmet: $("#choice-unmet").value.trim(), provenance: "browser-self-report", comparison: lastComparison ? { input: lastComparison.input, candidates: lastComparison.result.candidates.map(d => d.name), status: lastComparison.result.status } : null });
      e.target.reset(); $("#choice-error").textContent = "저장했습니다. 실제 구매 증빙이 아닌 본인 기록입니다.";
    } catch (err) { $("#choice-error").textContent = err.message; }
  });
  $("#choice-intent").parentElement.insertAdjacentHTML("beforeend", `<details><summary>출발점이 된 실제 선택 사례</summary><p>기획자는 이천 햅쌀 크림 프라푸치노의 쌀 풍미, 과자 같은 토핑, 음료 취지를 좋아했습니다. 이후 딸기 딜라이트 요거트 블렌디드를 선택한 이유는 시원하게 갈린 음료를 좋아했고 당시 추천을 받아 시도했기 때문입니다. 마신 뒤 맛도 괜찮았다고 회상했습니다.</p><p>맛이 같았다는 뜻은 아닙니다. 원래 좋아했던 특징과 다음 선택에서 중요했던 특징이 다를 수 있다는 문제 정의입니다. 추천 경로, 당시 날짜, 만족도 점수는 확인하지 않았습니다. 이 서비스 사용 결과나 외부 사용자 검증도 아닙니다.</p><p>딸기 딜라이트 요거트 블렌디드는 공식 2024년 판매량 자료에서도 확인되는 실제 음료입니다. 이 과거 자료만으로 현재 판매나 특정 지점 재고를 보장할 수 없어 자동 추천 목록에는 넣지 않았습니다.</p><a href="https://www.shinsegaegroupnewsroom.com/starbucks-2024-top-10-drinks/" target="_blank" rel="noreferrer">공식 과거 메뉴 자료</a></details>`);
  $("#trial-setup").addEventListener("submit", e => {
    e.preventDefault();
    if (trial) return;
    window.dispatchEvent(new Event("nextcup-manual"));
    $("#ai-reset").click();
    $$("[name=taste], [name=avoid]").forEach(el => el.checked = false);
    window.NextCupAIState.dislikes = []; $("#rice-requirement").value = "unknown"; $("#essential").checked = false; $("#store").value = "all"; $("#taste-priority").value = "";
    $("#taste-form").dispatchEvent(new Event("change"));
    trial = { type: "trial", person: $("#trial-person").value, task: $("#trial-task").value, kind: $("#trial-kind").value, mode: $("#trial-mode").value, startedAt: new Date().toISOString(), start: performance.now(), changes: 0, changesAfterAI: 0, aiRequests: 0, aiApplied: 0, comparisons: 0 };
    $("#trial-setup").hidden = true; $("#trial-finish").hidden = false; $("#trial-error").textContent = "";
    $("#trial-state").textContent = "시험 진행 중입니다. 취향 비교 후 검증 자료 화면으로 돌아와 저장하세요.";
    location.hash = "discover"; $("#finder").scrollIntoView();
  });
  $("#taste-form").addEventListener("change", e => {
    if (trial && e.isTrusted) { trial.changes++; if (trial.aiApplied) trial.changesAfterAI++; }
  });
  $("#ai-form").addEventListener("submit", () => { if (trial) trial.aiRequests++; });
  $("#ai-interpretation").addEventListener("click", e => { if (trial && e.target.id === "apply-taste") trial.aiApplied++; });
  $("#taste-form").addEventListener("submit", () => { if (trial) trial.comparisons++; });
  $("#trial-finish").addEventListener("submit", e => {
    e.preventDefault();
    if (!trial) return;
    try {
      const outcome = $("#trial-outcome").value;
      if (!$("#trial-note").value.trim()) throw Error("틀린 조건이나 불편한 점을 적어주세요. 없으면 없음이라고 적어주세요.");
      if (outcome === "completed" && (!lastComparison || !["partial", "empty"].includes(lastComparison.result.status))) throw Error("완료로 저장하려면 취향 비교 결과를 먼저 확인하세요. 실패하거나 중단했다면 해당 결과를 선택해 주세요.");
      const { start, ...record } = trial;
      save({ ...record, elapsedSeconds: Math.round((performance.now() - start) / 100) / 10, outcome, understood: $("#trial-understood").value, note: $("#trial-note").value.trim(), comparison: lastComparison ? { input: lastComparison.input, status: lastComparison.result.status, candidates: lastComparison.result.candidates.map(d => d.id) } : null });
      trial = null; e.target.reset(); e.target.hidden = true; $("#trial-setup").hidden = false; $("#trial-state").textContent = "저장했습니다. 다음 회차는 반대 방식으로 시작하세요."; $("#trial-error").textContent = "";
    } catch (err) { $("#trial-error").textContent = err.message; }
  });
  function render() {
    const rows = read();
    $("#choice-rows").innerHTML = rows.filter(r => r.type === "choice").map(r => `<article class="result-card"><h3>${esc(r.menu)}</h3><p>${esc(r.reason)}</p><p>진행: ${esc({considered:"후보 검토", selected:"선택 / 음용 전", tasted:"실제 음용"}[r.stage])} / 평가: ${esc({unknown:"미확인", okay:"맛이 괜찮았음", different:"기대와 다름"}[r.rating])}</p><p>남은 요구: ${esc(r.unmet || "미기재")}</p></article>`).join("") || "<p>아직 직접 저장한 선택 기록이 없습니다.</p>";
    $("#trial-rows").innerHTML = rows.filter(r => r.type === "trial").map(r => `<p>${esc(r.person)} / ${esc(r.task)} / ${esc({synthetic:"가상",self:"본인",external:"외부 이용자"}[r.kind])} / ${esc(r.mode)} / ${esc(r.outcome)} / ${esc(r.elapsedSeconds)}초 / 변경 ${esc(r.changes)}회 / AI 요청 ${esc(r.aiRequests)}회</p>`).join("") || "<p>아직 저장한 비교 시험이 없습니다. 성과를 계산하지 않습니다.</p>";
  }
  $("#evidence-export").addEventListener("click", () => {
    try {
      const blob = new Blob([JSON.stringify({ schemaVersion: 1, disclaimer: "기기 내 자기보고 기록. 신원이나 구매 검증 아님. 가상/본인/외부 구분을 유지할 것.", records: read() }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = "next-cup-choice-evidence-" + Date.now() + ".json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { $("#trial-error").textContent = err.message; }
  });
  window.addEventListener("beforeunload", e => { if (trial) { e.preventDefault(); e.returnValue = ""; } });
  try { render(); } catch (err) { $("#trial-error").textContent = err.message; }
})();
