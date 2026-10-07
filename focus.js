"use strict";
(() => {
  // Existing advanced functions remain reachable, but are no longer the main journey.
  $(".header nav").innerHTML =
    '<a href="#discover">취향과 대안 찾기</a><a href="#request">남은 요구 기록</a><a href="#collection">내 보관함</a><a href="#research">검증 자료</a>';
  $("footer").insertAdjacentHTML(
    "beforeend",
    '<details><summary>후속 기능</summary><a href="#studio">메뉴 아이디어</a> / <a href="#community">시험 커뮤니티</a></details>',
  );
  $(".hero h1").innerHTML =
    "그때 좋아했던 맛,<br>다음 잔에서는<br>무엇을 남길까요?";
  $(".hero-description").textContent =
    "기억을 정리하고, 등록된 음료 중 맞는 조건과 달라지는 점을 비교해 보세요.";
  $(".hero-caption").textContent =
    "같은 맛을 재현하는 서비스가 아닌, 선택 조건을 확인하는 도구";
  $(".next-story").innerHTML =
    '<div><p class="eyebrow">선택 이후</p><h2>대안으로 채우지 못한 점을 기록하세요.</h2><p>추천 후보에 없는 맛과 식감을 남깁니다. 요청은 내 기기에 저장되며 실제 주문이나 스타벅스 접수가 아닙니다.</p></div><a class="outline" href="#request">남은 요구 기록</a>';
  $("#finder").insertAdjacentHTML(
    "afterbegin",
    '<ol class="journey" aria-label="이용 순서"><li>1 기억 입력</li><li>2 취향 확인</li><li>3 대안 또는 보류</li><li>4 남은 요구 기록</li></ol>',
  );
  $("#ai-title").textContent = "1. 좋아했던 점을 적어주세요";
  $("label[for=ai-memory]").textContent = "기억나는 메뉴와 맛, 지금 원하는 점";
  $("#ai-memory").placeholder =
    "메뉴 이름만 쓰기보다 좋아했던 향, 질감, 피하고 싶은 맛을 적어주세요.";
  $("#ai-form").insertAdjacentHTML(
    "beforeend",
    '<p id="ai-progress" role="status" aria-live="polite"></p><button type="button" id="manual-now" class="outline">기다리지 않고 직접 선택</button><p class="fine">취향이 명확하다면 AI 없이 아래 항목을 바로 선택해도 됩니다. 전환 시 이미 전송된 API 요청의 과금 취소는 보장하지 않습니다.</p>',
  );
  $("#manual-now").addEventListener("click", () => {
    window.dispatchEvent(new Event("nextcup-manual"));
    $("#taste-form").scrollIntoView({ block: "start" });
    $("#taste-form input").focus();
  });
  $("#taste-form .step").textContent = "2 / 취향 확인";
  $("#taste-form h3").textContent = "선택 조건을 확인하세요";
  $("#taste-form .muted").textContent =
    "좋아하는 감각과 피할 감각을 나눕니다. 감각 분류는 실제 시음 점수가 아닙니다.";
  $("#taste-form .chips").innerHTML = Object.entries(C.labels)
    .map(
      ([key, label]) =>
        `<label><input type="checkbox" name="taste" value="${key}"><span>${label}</span></label>`,
    )
    .join("");
  const essentialLabel = $("#essential").closest("label");
  essentialLabel.hidden = true;
  $("#essential").checked = false;
  essentialLabel.insertAdjacentHTML(
    "afterend",
    '<div class="field"><label for="rice-requirement">쌀 풍미가 반드시 필요한가요?</label><select id="rice-requirement"><option value="unknown">아직 정하지 않았어요 / 선택 필요</option><option value="yes">쌀 풍미가 없으면 추천하지 않아요</option><option value="no">쌀 풍미가 없어도 다른 감각을 비교해요</option></select></div><fieldset><legend>피하고 싶은 감각</legend><div class="chips">' +
      Object.entries(C.labels)
        .map(
          ([key, label]) =>
            `<label><input type="checkbox" name="avoid" value="${key}"><span>${label}</span></label>`,
        )
        .join("") +
      "</div></fieldset>",
  );
  $("#rice-requirement").addEventListener("change", () => {
    $("#essential").checked = $("#rice-requirement").value === "yes";
  });
  $$("[name=avoid]").forEach((el) =>
    el.addEventListener("change", () => {
      window.NextCupAIState.dislikes = $$("[name=avoid]:checked").map(
        (x) => x.value,
      );
      const note = $("#dislike-note");
      if (note) note.hidden = true;
    }),
  );
  $("#store").previousElementSibling.innerHTML =
    '비교 조건 <span class="muted">재고 연동 없음</span>';
  $("#store").options[0].textContent = "등록 후보 전체 비교 / 3종";
  $("#store").options[1].textContent = "콜드 브루 제외 / 품절 가정 시험";
  $("#taste-form button[type=submit]").textContent =
    "확인한 조건으로 후보 비교";
  $(".comparison .step").textContent = "3 / 대안 또는 추천 보류";
  $("#comparison-title").textContent = "맞는 조건과 다른 점을 함께 봅니다";
  $("#results").innerHTML =
    "<p>갈린 얼음 질감이 좋고 커피 풍미를 피한다면 초콜릿 크림 칩을 비교할 수 있습니다. 바닐라 향을 원하고 커피가 괜찮다면 바닐라 크림 콜드 브루가 후보입니다.</p><p>쌀 풍미가 필수라면 등록된 세 음료 모두 추천하지 않습니다. 실제 맛과 매장 재고는 별도 확인이 필요합니다.</p>";
  $("#request .page-heading h1").textContent = "4. 대안으로 채우지 못한 점";
  $("#request .page-heading > p:last-child").textContent =
    "필요했던 감각, 비교한 후보, 끝내 남은 요구를 확인하고 저장하세요.";
  $("#research .page-heading").insertAdjacentHTML(
    "afterend",
    '<article class="card lab-block"><p class="eyebrow">2026.10.07 검증 기록</p><h2>어떤 조건에서 후보가 달라졌나요?</h2><p>같은 12개 입력의 기대 후보 일치는 수정 전 9개에서 수정 후 12개로 바뀌었습니다. 바닐라 분류 누락과 초콜릿 비선호 누락을 수정한 코드 시험입니다.</p><p>새 합성 입력 12개를 각 2회 Gemini로 호출했습니다. 조건 완전 일치 22/24, 지정 후보 ID 일치 24/24입니다. 쌀 필수 미확인은 이 후보 시험에서만 필수 아님으로 가정했습니다. 실제 화면은 직접 확인을 요청합니다.</p><p>자동 검사 96개, 화면 검사 13개 통과. 실제 외부 이용자 검증은 0명이며 맛 유사도나 구매 효과를 입증하지 않았습니다.</p><a class="outline" target="_blank" rel="noreferrer" href="https://github.com/jhheo51-arch/next-cup-ai-portfolio/blob/main/VALIDATION.md">실패 2건과 원자료 확인</a></article>',
  );
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-unmet]") || !lastComparison) return;
    const { input, result } = lastComparison;
    $("#request-reason").value =
      "확인한 취향: " +
      input.tags.map((t) => C.labels[t]).join(", ") +
      ". 피할 감각: " +
      (input.dislikes.map((t) => C.labels[t]).join(", ") || "없음") +
      ". 비교 후보: " +
      (result.candidates.map((d) => d.name).join(", ") || "없음") +
      ".";
    $("#request-keep").value = input.essential
      ? "쌀의 구수한 풍미"
      : result.candidates.length
        ? [...new Set(result.candidates.flatMap((d) => d.missing))]
            .map((t) => C.labels[t])
            .join(", ")
        : input.tags.map((t) => C.labels[t]).join(", ");
    $("#request-change").value = "";
    $("#request-form").dispatchEvent(new Event("input"));
    toast("비교 결과를 옮겼습니다. 남은 요구를 직접 확인하고 저장해 주세요.");
  });
})();
