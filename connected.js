"use strict";
(() => {
  let me = null,
    posts = [],
    history = [],
    interpretation = null,
    publishDraft = null,
    editPost = null,
    boardEpoch = 0;
  const reasons = {
    original: "원래 맛 그대로",
    lessSweet: "덜 달게",
    newIdea: "새로운 메뉴로",
  };
  const errors = (id, e) => {
    $(id).textContent = e.message || "연결에 실패했습니다. 다시 시도해 주세요.";
  };
  async function api(url, body, signal) {
    const res = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers:
        body === undefined
          ? {}
          : { "Content-Type": "application/json", "X-Next-Cup": "1" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal || AbortSignal.timeout(55000),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw Error("서버 응답을 읽지 못했습니다. 다시 시도해 주세요.");
    }
    if (!res.ok) throw Error(data.error || "요청을 처리하지 못했습니다.");
    return data;
  }
  async function busy(button, fn) {
    const label = button.textContent;
    button.disabled = true;
    button.textContent = "처리 중…";
    try {
      await fn();
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  }
  $(".header nav").insertAdjacentHTML(
    "beforeend",
    '<a href="#community">함께 만드는 메뉴</a>',
  );
  $(".mode").textContent = "Gemini 연결 상태 확인 중";
  $("#finder").insertAdjacentHTML(
    "afterbegin",
    `<section class="ai-card" aria-labelledby="ai-title"><div><p class="eyebrow">TASTE CONVERSATION</p><h2 id="ai-title">그때 그 맛, 말로 들려주세요.</h2><p>AI와 기억을 정리한 뒤, 아래 취향 항목에 직접 적용할 수 있어요.</p></div><form id="ai-form"><label for="ai-memory">이천 햅쌀 크림 프라푸치노에서 좋아했던 점</label><textarea id="ai-memory" required maxlength="1200" rows="3" placeholder="구수한 쌀 맛이 좋았고, 커피 맛이 없는 부드러운 음료였으면 좋겠어요."></textarea><label class="check"><input id="ai-consent" type="checkbox" required> 이 대화를 Google Gemini로 보내 취향을 분석하는 데 동의합니다.</label><p class="fine">입력과 확인 질문만 전송합니다. 비밀번호, 연락처는 적지 마세요. 대화 원문은 서버 기록으로 남기지 않습니다.</p><div class="result-actions"><button class="button" type="submit">AI와 취향 찾기</button><button class="outline" type="button" id="ai-reset">대화 새로 시작</button></div><p id="ai-error" class="error" role="alert"></p></form><div id="ai-conversation" class="conversation" aria-live="polite"></div><div id="ai-interpretation"></div></section>`,
  );
  $("#taste-form fieldset").insertAdjacentHTML(
    "afterend",
    '<div id="dislike-note" class="notice-box" hidden></div>',
  );
  $("#taste-form .chips").insertAdjacentHTML(
    "beforeend",
    '<label><input type="checkbox" name="taste" value="coffee"><span>커피 풍미</span></label>',
  );
  $("#ai-form .fine").textContent +=
    " 이 도구는 알레르기, 영양, 건강 조건을 판단하지 않습니다.";
  $("#main").insertAdjacentHTML(
    "beforeend",
    `<section id="community" class="view section" hidden><div class="page-heading"><p class="eyebrow">OUR NEXT CUP</p><h1>당신의 한 표가,<br>다음 이야기의 단서가 되도록.</h1><p>재출시 요청과 나만의 메뉴 제안을 함께 읽고, 원하는 방향에 의견을 남겨요.</p><span class="status-chip">초대형 시험 커뮤니티 ,  이 컴퓨터에서만 실행 중</span></div><div id="account-panel" class="card"><h2>초대받은 분들과 먼저 시작합니다.</h2><p>스타벅스 계정이 아닌, 이 시험 서비스의 별도 계정입니다. 실명, 이메일은 받지 않습니다.</p><div class="auth-grid"><form id="login-form"><h3>로그인</h3><label for="login-handle">아이디</label><input id="login-handle" required autocomplete="username" maxlength="24"><label for="login-password">비밀번호</label><input id="login-password" type="password" required autocomplete="current-password" maxlength="128"><button class="button" type="submit">로그인</button></form><form id="signup-form"><h3>초대 코드로 가입</h3><label for="signup-invite">초대 코드</label><input id="signup-invite" required autocomplete="off" maxlength="100"><label for="signup-handle">아이디 ,  영문, 숫자, 밑줄, 하이픈 3~24자</label><input id="signup-handle" required pattern="[a-zA-Z0-9_-]{3,24}" autocomplete="username" maxlength="24"><label for="signup-password">비밀번호 ,  12자 이상</label><input id="signup-password" type="password" required minlength="12" maxlength="128" autocomplete="new-password"><button class="outline" type="submit">가입하고 시작하기</button></form></div><p class="fine">가입 정보는 이 컴퓨터의 서버에 저장됩니다. 다른 서비스에서 쓰는 비밀번호는 사용하지 마세요. 초대 코드는 운영자가 발급합니다.</p><p id="auth-error" class="error" role="alert"></p></div><div id="member-panel" hidden><div class="community-toolbar"><p id="member-name"></p><button type="button" id="logout" class="outline">로그아웃</button></div><div class="notice-box">게시한 제안은 이 서버에 가입한 회원에게 공유되며 Google Gemini의 의견 요약에 사용될 수 있습니다. 개인 보관함의 글은 별도로 ‘커뮤니티에 제안’하기 전까지 공개되지 않습니다. 투표는 구매 의사나 실제 수요를 뜻하지 않습니다.</div><div class="community-toolbar"><div class="chips"><button type="button" data-board-filter="all" aria-pressed="true">전체 제안</button><button type="button" data-board-filter="mine" aria-pressed="false">내 제안</button></div><div class="result-actions"><a class="button" href="#collection">내 기록에서 제안하기 ↗</a><button type="button" id="refresh-board" class="outline">새로 불러오기</button></div></div><p id="board-error" class="error" role="alert"></p><div id="board-stats" class="notice-box"></div><div id="board" class="saved-grid"></div><section class="card summary-panel"><p class="eyebrow">LISTEN TO THE REASONS</p><h2>함께 원하는 맛은 무엇일까요?</h2><p>AI가 최근 공개 제안 최대 30건을 주제별로 묶습니다. 표 수는 저장된 실제 표에서 계산합니다.</p><label class="check"><input id="summary-consent" type="checkbox"> 공유 동의된 제안의 본문을 Google Gemini로 보내 요약합니다.</label><button type="button" id="summarize" class="button">AI로 의견 묶어보기</button><p id="summary-error" class="error" role="alert"></p><div id="summary-result" aria-live="polite"></div></section><section id="ops-panel" class="card summary-panel" hidden><h2>운영 확인</h2><p>AI 호출 횟수, 처리 시간, 토큰 사용량과 신고 상태입니다. 금액 추정은 하지 않습니다.</p><button type="button" class="outline" id="load-ops">운영 기록 확인</button><div id="ops-result" aria-live="polite"></div></section></div></section>`,
  );
  document.body.insertAdjacentHTML(
    "beforeend",
    `<dialog id="publish-dialog" aria-labelledby="publish-title"><form id="publish-form"><h2 id="publish-title">커뮤니티에 제안하기</h2><div id="publish-fields"></div><label class="check"><input id="publish-consent" type="checkbox" required> 다른 회원에게 공개하고 Google Gemini 의견 요약에 사용하는 데 동의합니다.</label><p class="fine">스타벅스에 제출되는 것은 아닙니다. 개인정보는 게시하지 마세요.</p><p id="publish-error" class="error" role="alert"></p><div class="result-actions"><button type="submit" class="button">확인하고 게시</button><button type="button" class="outline" id="publish-cancel">취소</button></div></form></dialog>`,
  );
  $("#notes").innerHTML =
    `<div class="page-heading"><p class="eyebrow">PRODUCT & AI WORKFLOW</p><h1>취향의 기억을,<br>다음 메뉴의 근거로.</h1><p>고객 취향 분석 ,  AI 처리 흐름 ,  초대형 제안 커뮤니티</p><a class="outline" href="PRD.md">제품 요구사항 기획서 읽기 ↗</a></div><div class="notes-grid"><article class="card"><h2>지금 구현한 흐름</h2><p>Gemini 취향 해석과 확인 질문 → 사용자 수정, 승인 → 서버의 등록 메뉴 조회와 조건 검사 → 부분 대안 또는 추천 보류 → 개인 기록 → 명시적 커뮤니티 게시 → 계정당 한 표 → 근거 원문을 포함한 AI 의견 묶기.</p><p>AI는 게시, 투표, 주문을 대신 실행하지 않습니다. 규칙 기반 검사로 후보를 제한하며 수동 선택도 유지합니다.</p></article><article class="card"><h2>사실과 가정</h2><p>이천 햅쌀 크림 프라푸치노는 2019년 고객 요청으로 재출시된 기록이 있습니다. 연중 판매 발표는 커피 버전이며 영구 단종 여부는 확인하지 못했습니다.</p><a href="https://www.shinsegaegroupnewsroom.com/starbucks-organic-farm-produce-popular/" target="_blank" rel="noreferrer">공식 재출시 자료 ↗</a><p>추천 후보의 감각 태그는 설계 해석입니다. 현재 전체 메뉴, 매장 재고를 연동하지 않았고, 후보 3종은 공식 목록에서 확인한 소규모 비교 목록입니다. 초콜릿 칩의 씹히는 질감을 쌀과자 토핑과 같다고 보지 않습니다.</p></article><article class="card"><h2>직무 연결</h2><p>고객의 선호, 비선호를 구조화하고 충족되지 않는 요구를 기록합니다. AI 오류 대응, 출처 검증, 사용량 기록으로 개발, 운영의 기초를 보여줍니다. 요청 주제와 투표 이유는 메뉴 검토를 위한 자료이지 수요 예측이 아닙니다.</p></article><article class="card"><h2>공개 운영 전 남은 일</h2><p>현재 주소는 이 컴퓨터에서만 접속됩니다. 공개 인터넷 배포, HTTPS, 계정 복구, 삭제 정책, 개인정보 고지, 운영 인력과 보안 검토는 별도 단계입니다. 실제 주문, 스타벅스 제출, 제조 레시피 자동 개발은 범위에서 제외했습니다.</p><a href="README.md">실행, 검증 안내 ↗</a></article></div>`;
  const oldNotice = $("#taste-form .fine");
  oldNotice.textContent =
    "AI 해석은 사용자 확인 후 적용 ,  후보, 매장 조건은 시연 자료";
  const footerText = $("footer p");
  footerText.textContent =
    "STARBUCKS FAN CONCEPT / 개인 포트폴리오 ,  공식 서비스 아님";
  $("#results").setAttribute("aria-live", "polite");
  function renderChat() {
    const box = $("#ai-conversation");
    box.innerHTML = history
      .map(
        (h) =>
          `<div class="chat-line ${h.role}"><strong>${h.role === "user" ? "나" : "Gemini"}</strong><p>${esc(h.text)}</p></div>`,
      )
      .join("");
  }
  function renderInterpretation(meta) {
    const x = interpretation;
    $("#ai-interpretation").innerHTML =
      `<div class="notice-box"><h3>이렇게 이해했어요</h3><p>${esc(x.understanding)}</p><p><strong>좋아하는 감각</strong> ,  ${x.likes.map((t) => C.labels[t]).join(", ") || "아직 확인 필요"}</p><p><strong>피하고 싶은 감각</strong> ,  ${x.dislikes.map((t) => C.labels[t]).join(", ") || "명시된 항목 없음"}</p><p>쌀 풍미 필수 여부: ${{ yes: "필수", no: "필수 아님", unknown: "추가 확인 필요" }[x.essentialRice]}</p><button type="button" id="apply-taste" class="button">확인하고 아래 취향에 적용</button><p class="fine">${esc(meta.model)} ,  ${(meta.ms / 1000).toFixed(1)}초 ,  AI 해석은 틀릴 수 있습니다. 적용 후 선택 항목을 직접 수정할 수 있어요.</p></div>`;
  }
  let tasteController = null,
    tasteEpoch = 0;
  window.addEventListener("nextcup-manual", () => {
    tasteEpoch++;
    tasteController?.abort();
    interpretation = null;
    $("#ai-interpretation").textContent = "";
    $("#ai-error").textContent =
      "직접 선택으로 전환했습니다. 늦게 도착한 AI 답변은 적용하지 않습니다.";
  });
  $("#ai-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!$("#ai-consent").checked) return;
    const text = $("#ai-memory").value.trim();
    if (!text) return;
    $("#ai-error").textContent = "";
    if (history.length >= 8) {
      $("#ai-error").textContent = "취향을 적용하거나 새 대화를 시작해 주세요.";
      return;
    }
    const epoch = ++tasteEpoch;
    tasteController = new AbortController();
    const started = Date.now();
    const timer = setInterval(() => {
      $("#ai-progress").textContent =
        `취향을 정리하고 있습니다. ${Math.floor((Date.now() - started) / 1000)}초 / 기다리지 않고 직접 선택할 수 있습니다.`;
    }, 1000);
    $("#ai-progress").textContent =
      "취향을 정리하고 있습니다. 최대 12초 뒤 직접 선택을 안내합니다.";
    $("#ai-form").setAttribute("aria-busy", "true");
    await busy(e.submitter, async () => {
      const pending = [...history, { role: "user", text }];
      $("#ai-memory").disabled = true;
      $("#ai-reset").disabled = true;
      try {
        const data = await api(
          "/api/ai/taste",
          { history: pending, consent: true },
          tasteController.signal,
        );
        if (epoch !== tasteEpoch) return;
        interpretation = data.result;
        history = [
          ...pending,
          {
            role: "assistant",
            text: data.result.question || data.result.understanding,
          },
        ];
        renderChat();
        renderInterpretation(data.meta);
        $("#ai-memory").value = "";
        const proof = document.createElement("details");
        proof.innerHTML =
          "<summary>내 문장에서 확인한 근거</summary>" +
          (data.result.evidence || [])
            .map(
              (x) =>
                "<p>" +
                esc(C.labels[x.tag]) +
                " / " +
                esc(x.polarity) +
                " : " +
                esc(x.quote) +
                "</p>",
            )
            .join("") +
          '<p class="fine">원문 인용 일치를 검사했습니다. 의미 해석은 직접 확인해 주세요.</p>';
        $("#ai-interpretation").append(proof);
      } catch (error) {
        if (epoch === tasteEpoch) errors("#ai-error", error);
      } finally {
        clearInterval(timer);
        $("#ai-progress").textContent = "";
        $("#ai-form").setAttribute("aria-busy", "false");
        $("#ai-memory").disabled = false;
        $("#ai-reset").disabled = false;
        tasteController = null;
      }
    });
  });
  $("#ai-reset").addEventListener("click", () => {
    history = [];
    interpretation = null;
    $("#ai-memory").value = "";
    $("#ai-interpretation").textContent = "";
    $("#ai-error").textContent = "";
    renderChat();
    toast(
      "대화를 새로 시작합니다. 이미 적용한 취향은 직접 변경할 수 있습니다.",
    );
  });
  $("#ai-interpretation").addEventListener("click", (e) => {
    if (e.target.id !== "apply-taste" || !interpretation) return;
    $$("[name=taste]").forEach(
      (el) => (el.checked = interpretation.likes.includes(el.value)),
    );
    $("#essential").checked = interpretation.essentialRice === "yes";
    if ($("#rice-requirement"))
      $("#rice-requirement").value = interpretation.essentialRice;
    window.NextCupAIState.dislikes = [...interpretation.dislikes];
    $$("[name=avoid]").forEach(
      (el) => (el.checked = interpretation.dislikes.includes(el.value)),
    );
    renderDislikes();
    $("#taste-form").dispatchEvent(new Event("change"));
    $("#taste-form").scrollIntoView({ block: "start" });
    toast("취향을 적용했습니다. 미확인인 쌀 필수 조건은 직접 선택해 주세요.");
  });
  function renderDislikes() {
    const tags = window.NextCupAIState.dislikes;
    $("#dislike-note").hidden = !tags.length;
    $("#dislike-note").innerHTML =
      "<strong>피할 감각:</strong> " +
      tags.map((t) => C.labels[t]).join(", ") +
      ' <button id="clear-dislikes" class="outline small" type="button">비선호 조건 해제</button>';
  }
  $("#dislike-note").addEventListener("click", (e) => {
    if (e.target.id === "clear-dislikes") {
      window.NextCupAIState.dislikes = [];
      $$("[name=avoid]").forEach((el) => (el.checked = false));
      renderDislikes();
      $("#taste-form").dispatchEvent(new Event("change"));
    }
  });
  async function session() {
    try {
      const data = await api("/api/session");
      me = data.user;
      $(".mode").textContent =
        data.model === "test-fixture"
          ? "화면 검증용 가상 AI"
          : data.aiConfigured
            ? "Gemini 설정 감지 ,  사용 시 호출"
            : "Gemini 설정 없음 ,  수동 선택 가능";
      $("#account-panel").hidden = !!me;
      $("#member-panel").hidden = !me;
      $("#ops-panel").hidden = me?.role !== "admin";
      if (me) {
        $("#member-name").textContent =
          me.handle + "님 ,  " + (me.role === "admin" ? "운영자" : "초대 회원");
        await loadBoard();
      }
    } catch (error) {
      $(".mode").textContent = "서버 연결 확인 필요";
      errors("#auth-error", error);
    }
  }
  for (const type of ["login", "signup"])
    $("#" + type + "-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      $("#auth-error").textContent = "";
      await busy(e.submitter, async () => {
        try {
          await api("/api/auth/" + type, {
            handle: $("#" + type + "-handle").value,
            password: $("#" + type + "-password").value,
            ...(type === "signup"
              ? { invite: $("#signup-invite").value.trim() }
              : {}),
          });
          e.target.reset();
          await session();
          toast("로그인했습니다. 개인 기록은 자동으로 공유되지 않습니다.");
        } catch (error) {
          errors("#auth-error", error);
        }
      });
    });
  $("#logout").addEventListener("click", (e) =>
    busy(e.target, async () => {
      try {
        await api("/api/auth/logout", {});
        me = null;
        posts = [];
        boardEpoch++;
        $("#board").textContent = "";
        $("#summary-result").textContent = "";
        $("#ops-result").textContent = "";
        await session();
        toast("로그아웃했습니다.");
      } catch (error) {
        errors("#board-error", error);
      }
    }),
  );
  let boardFilter = "all";
  async function loadBoard() {
    const epoch = ++boardEpoch;
    $("#board-error").textContent = "";
    $("#summary-result").textContent = "";
    try {
      const data = await api("/api/posts");
      if (epoch !== boardEpoch) return;
      posts = data.posts;
      renderBoard();
    } catch (error) {
      if (epoch === boardEpoch) errors("#board-error", error);
    }
  }
  function renderBoard() {
    const visible = posts.filter((p) => p.status === "visible");
    $("#board-stats").textContent =
      `이 목록의 공개 제안 ${visible.length}건 ,  투표 ${visible.reduce((n, p) => n + p.votes.reduce((s, v) => s + v.n, 0), 0)}표 ,  최근 최대 100건 기준 ,  한 사람이 여러 제안에 투표할 수 있습니다.`;
    const items = posts.filter((p) =>
      boardFilter === "mine"
        ? p.mine
        : p.status === "visible" || me.role === "admin",
    );
    $("#board").innerHTML = items.length
      ? items
          .map((p) => {
            const d = p.payload,
              title =
                p.type === "idea"
                  ? d.title
                  : d.kind === "return"
                    ? "이천 햅쌀 크림 프라푸치노"
                    : d.localMenu;
            const text = p.type === "idea" ? d.story : d.reason;
            return `<article class="card" id="post-${p.id}"><span class="status-chip">${p.type === "idea" ? "신메뉴 제안" : "메뉴 요청"} ,  ${{ visible: "공개", withdrawn: "작성자 비공개", hidden: "운영자 숨김" }[p.status]}</span><h3>${esc(title)}</h3><p>${esc(text)}</p>${p.type === "request" ? "<p><strong>꼭 지킬 것</strong> ,  " + esc(d.keep) + "</p><p><strong>바뀌어도 괜찮은 것</strong> ,  " + esc(d.change || "미기재") + "</p>" : "<p>" + esc(C.bases[d.base] + " ,  " + d.ingredients.map((i) => C.ingredients[i]).join(" + ") + " ,  " + C.textures[d.texture]) + "</p>"}<p class="fine">${esc(p.handle)} ,  ${new Date(p.updated).toLocaleDateString("ko-KR")} ,  버전 ${p.version}${p.version > 1 ? " ,  수정 전 투표가 포함될 수 있습니다." : ""}</p><div class="vote-options">${
              p.status === "visible"
                ? Object.entries(reasons)
                    .map(
                      ([k, label]) =>
                        `<button type="button" data-vote="${k}" data-post="${p.id}" aria-pressed="${p.myVote === k}" class="outline">${p.myVote === k ? "✓ " : ""}${label} <strong>${p.votes.find((v) => v.reason === k)?.n || 0}</strong></button>`,
                    )
                    .join("")
                : ""
            }</div>${p.myVote && p.status === "visible" ? '<button class="text-button" type="button" data-unvote="' + p.id + '">내 투표 취소</button>' : ""}<div class="post-actions">${p.mine && p.status !== "hidden" ? '<button class="outline small" type="button" data-post-edit="' + p.id + '">제안 수정</button><button class="outline small" type="button" data-visible="' + p.id + '" data-status="' + (p.status === "visible" ? "withdrawn" : "visible") + '">' + (p.status === "visible" ? "비공개로 전환" : "다시 공개") + "</button>" : ""}${me.role === "admin" ? '<button class="outline small" type="button" data-visible="' + p.id + '" data-status="' + (p.status === "hidden" ? "visible" : "hidden") + '">' + (p.status === "hidden" ? "운영자 복구" : "운영자 숨김") + "</button>" : ""}</div>${p.status === "visible" ? '<details><summary>이 제안 신고</summary><label for="report-' + p.id + '">신고 이유</label><select id="report-' + p.id + '"><option value="personal">개인정보 노출</option><option value="abuse">부적절한 내용</option><option value="misleading">오해를 유발하는 정보</option></select><button class="outline small" type="button" data-report="' + p.id + '">운영자에게 신고</button></details>' : ""}${me.role === "admin" && p.reports?.length ? '<p class="error">접수된 신고 ' + p.reports.length + "건: " + p.reports.map((r) => ({ personal: "개인정보", abuse: "부적절", misleading: "오해 유발" })[r.reason]).join(", ") + "</p>" : ""}</article>`;
          })
          .join("")
      : '<div class="empty"><h2>첫 번째 이야기를 기다리고 있어요.</h2><p>개인 보관함에서 직접 고른 요청이나 아이디어를 공유해 보세요.</p><a class="button" href="#request">메뉴 요청 작성하기 ↗</a></div>';
  }
  $$("[data-board-filter]").forEach((b) =>
    b.addEventListener("click", () => {
      boardFilter = b.dataset.boardFilter;
      $$("[data-board-filter]").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)),
      );
      renderBoard();
    }),
  );
  $("#refresh-board").addEventListener("click", (e) =>
    busy(e.target, loadBoard),
  );
  $("#board").addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.postEdit) {
      const p = posts.find((p) => p.id === b.dataset.postEdit);
      openPublisher({ type: p.type, payload: p.payload }, p);
      return;
    }
    await busy(b, async () => {
      try {
        if (b.dataset.vote)
          await api("/api/posts/" + b.dataset.post + "/vote", {
            reason: b.dataset.vote,
          });
        else if (b.dataset.unvote)
          await api("/api/posts/" + b.dataset.unvote + "/vote", {
            reason: null,
          });
        else if (b.dataset.visible)
          await api("/api/posts/" + b.dataset.visible + "/visibility", {
            status: b.dataset.status,
          });
        else if (b.dataset.report)
          await api("/api/posts/" + b.dataset.report + "/report", {
            reason: $("#report-" + b.dataset.report).value,
          });
        else return;
        await loadBoard();
        toast(
          b.dataset.report
            ? "신고를 접수했습니다. 운영자가 검토할 수 있습니다."
            : "변경 사항을 저장했습니다.",
        );
      } catch (error) {
        errors("#board-error", error);
      }
    });
  });
  function addPublishButtons() {
    const cards = $$("#collection-content .card");
    let records;
    try {
      records = readRecords().filter(
        (r) => filter === "all" || r.type === filter,
      );
    } catch {
      return;
    }
    cards.forEach((card, i) => {
      const r = records[i];
      if (r && r.type !== "candidate" && !card.querySelector("[data-publish]"))
        card.insertAdjacentHTML(
          "beforeend",
          '<button class="button small publish-trigger" type="button" data-publish="' +
            r.id +
            '">커뮤니티에 제안</button>',
        );
    });
  }
  new MutationObserver(addPublishButtons).observe($("#collection-content"), {
    childList: true,
    subtree: true,
  });
  addPublishButtons();
  $("#collection-content").addEventListener("click", (e) => {
    const b = e.target.closest("[data-publish]");
    if (!b) return;
    if (!me) {
      location.hash = "community";
      toast(
        "커뮤니티 게시에는 초대 회원 로그인이 필요합니다. 개인 기록은 그대로 유지됩니다.",
      );
      return;
    }
    const record = readRecords().find((r) => r.id === b.dataset.publish);
    if (record) openPublisher(record);
  });
  function openPublisher(record, post = null) {
    publishDraft = structuredClone(record);
    editPost = post;
    $("#publish-title").textContent = post
      ? "공유한 제안 수정"
      : "커뮤니티에 제안하기";
    const p = publishDraft.payload;
    $("#publish-fields").innerHTML =
      record.type === "request"
        ? `<p>${esc(p.kind === "return" ? "이천 햅쌀 크림 프라푸치노" : p.localMenu)}</p><label for="shared-reason">그리운 이유</label><textarea id="shared-reason" required maxlength="500">${esc(p.reason)}</textarea><label for="shared-keep">꼭 지킬 것</label><input id="shared-keep" required maxlength="160" value="${esc(p.keep)}"><label for="shared-change">달라져도 괜찮은 것</label><input id="shared-change" maxlength="160" value="${esc(p.change)}">`
        : `<label for="shared-title">메뉴 이름</label><input id="shared-title" required maxlength="60" value="${esc(p.title)}"><p>${esc(C.bases[p.base] + " ,  " + p.ingredients.map((i) => C.ingredients[i]).join(" + ") + " ,  " + C.textures[p.texture])}</p><label for="shared-story">누가 언제 좋아할 메뉴인가요?</label><textarea id="shared-story" required maxlength="500">${esc(p.story)}</textarea><p class="fine">공유 글의 이름과 설명을 수정합니다. 다른 조합을 제안하려면 개인 보관함에서 새 제안서를 작성해 주세요.</p>`;
    $("#publish-consent").checked = false;
    $("#publish-error").textContent = "";
    $("#publish-dialog").showModal();
  }
  $("#publish-cancel").addEventListener("click", () =>
    $("#publish-dialog").close(),
  );
  $("#publish-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!publishDraft || !$("#publish-consent").checked) return;
    const p = publishDraft.payload;
    if (publishDraft.type === "request") {
      p.reason = $("#shared-reason").value.trim();
      p.keep = $("#shared-keep").value.trim();
      p.change = $("#shared-change").value.trim();
    } else {
      p.title = $("#shared-title").value.trim();
      p.story = $("#shared-story").value.trim();
    }
    await busy(e.submitter, async () => {
      try {
        await api(
          editPost ? "/api/posts/" + editPost.id + "/edit" : "/api/posts",
          {
            type: publishDraft.type,
            payload: p,
            consent: true,
            ...(editPost ? { version: editPost.version } : {}),
          },
        );
        $("#publish-dialog").close();
        location.hash = "community";
        await loadBoard();
        toast("커뮤니티에 반영했습니다. 스타벅스에 제출한 것은 아닙니다.");
      } catch (error) {
        errors("#publish-error", error);
      }
    });
  });
  $("#summarize").addEventListener("click", (e) =>
    busy(e.target, async () => {
      if (!$("#summary-consent").checked) {
        $("#summary-error").textContent =
          "Google Gemini 전송 안내를 확인하고 선택해 주세요.";
        return;
      }
      $("#summary-error").textContent = "";
      const epoch = boardEpoch;
      try {
        const data = await api("/api/ai/summary", { consent: true });
        if (epoch !== boardEpoch) {
          $("#summary-error").textContent =
            "요약 중 목록이 변경됐습니다. 다시 요약해 주세요.";
          return;
        }
        $("#summary-result").innerHTML =
          '<p class="fine">' +
          esc(data.meta.model) +
          " ,  " +
          (data.meta.ms / 1000).toFixed(1) +
          "초 ,  공개 제안 " +
          data.sourceCount +
          "건 기준 ,  요약 후 다른 회원이 수정했을 수 있습니다.</p>" +
          data.result.groups
            .map(
              (g) =>
                '<article class="summary-group"><h3>' +
                esc(g.label) +
                "</h3>" +
                g.evidence
                  .map(
                    (x) =>
                      "<blockquote>" +
                      esc(x.quote) +
                      '<br><a class="source-jump" href="#community" data-source="' +
                      esc(x.id) +
                      '">근거 제안으로 이동 ↗</a></blockquote>',
                  )
                  .join("") +
                "</article>",
            )
            .join("") +
          '<p class="notice-box">' +
          esc(data.result.caution) +
          "<br>AI가 묶은 해석이며 검토가 필요합니다. 원문 인용 일치는 서버에서 검사했습니다. 투표 수를 수요로 해석하지 않습니다.</p>";
      } catch (error) {
        errors("#summary-error", error);
      }
    }),
  );
  $("#summary-result").addEventListener("click", (e) => {
    const a = e.target.closest("[data-source]");
    if (!a) return;
    e.preventDefault();
    boardFilter = "all";
    $$("[data-board-filter]").forEach((x) =>
      x.setAttribute("aria-pressed", String(x.dataset.boardFilter === "all")),
    );
    renderBoard();
    const card = $("#post-" + a.dataset.source);
    if (card) {
      card.setAttribute("tabindex", "-1");
      card.focus();
      card.scrollIntoView({ block: "center" });
    }
  });
  $("#load-ops").addEventListener("click", (e) =>
    busy(e.target, async () => {
      try {
        const d = await api("/api/ops");
        $("#ops-result").innerHTML =
          "<p>신고 누적 " +
          d.reports +
          "건 ,  게시물 카드에서 내용을 확인할 수 있습니다.</p>" +
          d.calls
            .map(
              (c) =>
                "<p>" +
                esc(c.task) +
                " / " +
                esc(c.model) +
                " ,  호출 " +
                c.count +
                "회 ,  성공 " +
                c.ok +
                "회 ,  평균 " +
                c.avgMs +
                "ms ,  입력 " +
                c.inputTokens +
                " / 출력, 추론 " +
                c.outputTokens +
                "토큰</p>",
            )
            .join("") +
          '<p class="fine">실제 과금 내역은 Google에서 확인해야 합니다. 원문, 키, 비밀번호는 운영 기록에 넣지 않습니다.</p>';
      } catch (error) {
        $("#ops-result").textContent = error.message;
      }
    }),
  );
  window.addEventListener("hashchange", () => {
    if (location.hash === "#community") session();
  });
  session();
  route(true);
})();
