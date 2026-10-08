"use strict";
const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path"),
  { createHash } = require("node:crypto");
const C = require("./core.js"),
  { openStore, fail } = require("./db.cjs"),
  { createAI, pii } = require("./ai.cjs");
const { initResearch } = require("./research.cjs");
const { createCRM } = require("./crm.cjs");
const reasons = {
  original: "원래 맛 그대로",
  lessSweet: "덜 달게",
  newIdea: "새로운 메뉴로",
};
const files = {
  "/portfolio.css": "public/portfolio.css",
  "/portfolio.js": "public/portfolio.js",
  "/simple.js": "public/simple.js",
  "/simple.css": "public/simple.css",
  "/sw.js": "public/sw.js",
  "/choice-evidence.js": "legacy/choice-evidence.js",
  "/focus.js": "legacy/focus.js",
  "/focus.css": "legacy/focus.css",
  "/lab.js": "legacy/lab.js",
  "/lab.css": "legacy/lab.css",
  "/HANDOFF.md": "../docs/HANDOFF.md",
  "/PROTOCOL.md": "../docs/PROTOCOL.md",
  "/": "public/simple.html",
  "/index.html": "public/simple.html",
  "/style.css": "legacy/style.css",
  "/app.js": "legacy/app.js",
  "/core.js": "core.js",
  "/connected.js": "legacy/connected.js",
  "/rice-cup.svg": "public/rice-cup.svg",
  "/PRD.md": "../docs/PRD.md",
  "/README.md": "../README.md",
  "/PROJECT.md": "../docs/PRD.md",
};
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".md": "text/plain; charset=utf-8",
};
const postText = (p) =>
  p.type === "request"
    ? [
        p.payload.kind === "return"
          ? "이천 햅쌀 크림 프라푸치노"
          : p.payload.localMenu,
        p.payload.reason,
        p.payload.keep,
        p.payload.change,
      ]
        .filter(Boolean)
        .join("\n")
    : [
        p.payload.title,
        C.bases[p.payload.base],
        p.payload.ingredients.map((t) => C.ingredients[t]).join(", "),
        C.textures[p.payload.texture],
        p.payload.story,
      ].join("\n");
function createApp({ dbPath, aiOverride, dailyLimit = 40 } = {}) {
  if (!dbPath) {
    fs.mkdirSync(path.join(__dirname, "../runtime"), { recursive: true });
    dbPath = path.join(__dirname, "../runtime/next-cup.sqlite");
  }
  const store = openStore(dbPath),
    ai =
      aiOverride ||
      createAI({
        onStart: (task, model) => store.beginCall(task, model, dailyLimit),
        onEnd: store.endCall,
      });
  const lab = initResearch(store, ai);
  const crm = createCRM(store);
  const limits = new Map();
  let inflight = 0;
  const limit = (key, n, period) => {
    const now = Date.now();
    let v = limits.get(key);
    if (!v || v.until < now) v = { count: 0, until: now + period };
    v.count++;
    limits.set(key, v);
    if (v.count > n) fail(429, "요청이 많습니다. 잠시 후 다시 시도해 주세요.");
    if (limits.size > 1000)
      for (const [k, x] of limits) if (x.until < now) limits.delete(k);
  };
  const json = (res, status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  const payload = async (req) => {
    if (
      !String(req.headers["content-type"] || "").startsWith("application/json")
    )
      fail(415, "JSON 형식 요청만 지원합니다.");
    let size = 0,
      parts = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 20000) fail(413, "입력 내용이 너무 깁니다.");
      parts.push(chunk);
    }
    try {
      return JSON.parse(Buffer.concat(parts).toString("utf8"));
    } catch {
      fail(400, "입력 형식을 확인해 주세요.");
    }
  };
  function checkPost(type, p, consent) {
    if (consent !== true)
      fail(400, "다른 회원 공개 및 AI 요약 활용에 동의해 주세요.");
    if (!["request", "idea"].includes(type))
      fail(400, "메뉴 요청 또는 신메뉴 제안만 게시할 수 있습니다.");
    const error = C.validate(type, p);
    if (error) fail(400, error);
    if (pii(JSON.stringify(p)))
      fail(400, "연락처, 이메일, 인증값 같은 개인정보를 빼고 게시해 주세요.");
  }
  const cookie = (token) =>
    `nc4_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? 43200 : 0}`;
  const server = http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    );
    try {
      const address = server.address();
      const host = `127.0.0.1:${address.port}`;
      if (req.headers.host !== host)
        fail(
          403,
          "허용되지 않은 접속 주소입니다. 127.0.0.1 주소를 사용해 주세요.",
        );
      const url = new URL(req.url, `http://${host}`),
        route = url.pathname;
      if (!route.startsWith("/api/")) {
        if (!["GET", "HEAD"].includes(req.method))
          fail(405, "지원하지 않는 요청입니다.");
        const name = files[route];
        if (!name) fail(404, "파일을 찾을 수 없습니다.");
        const body = fs.readFileSync(path.join(__dirname, name));
        res.writeHead(200, {
          "Content-Type": types[path.extname(name)],
          "Cache-Control": "no-store",
        });
        res.end(req.method === "HEAD" ? undefined : body);
        return;
      }
      const token =
        (req.headers.cookie || "")
          .split(";")
          .map((s) => s.trim())
          .find((s) => s.startsWith("nc4_session="))
          ?.slice(12) || "";
      const u = store.user(token);
      const requireUser = () => {
        if (!u) fail(401, "초대 회원으로 로그인해 주세요.");
        return u;
      };
      if (!["GET", "POST"].includes(req.method))
        fail(405, "지원하지 않는 요청입니다.");
      let body = {};
      if (req.method === "POST") {
        if (
          req.headers.origin !== `http://${host}` ||
          req.headers["x-next-cup"] !== "1"
        )
          fail(403, "다른 사이트에서 보낸 요청은 허용하지 않습니다.");
        limit("all:" + req.socket.remoteAddress, 120, 60000);
        body = await payload(req);
        if (!body || typeof body !== "object" || Array.isArray(body))
          fail(400, "요청 내용을 확인해 주세요.");
      }
      if (route.startsWith("/api/lab/")) {
        if (route === "/api/lab/data" && req.method === "GET") {
          json(res, 200, lab.publicData());
          return;
        }
        requireUser();
        let result;
        if (route === "/api/lab/mine" && req.method === "GET")
          result = lab.mine(u);
        else if (route === "/api/lab/admin" && req.method === "GET")
          result = lab.adminData(u);
        else if (route === "/api/lab/packet" && req.method === "GET")
          result = lab.packet(u);
        else if (req.method === "POST") {
          const action = route.slice(9);
          if (action === "start") result = lab.start(u, body);
          else if (action === "interpret") {
            limit("ai:" + u.id, 10, 3600000);
            if (inflight >= 2)
              fail(429, "AI 처리 중입니다. 잠시 후 다시 시도해 주세요.");
            inflight++;
            try {
              result = await lab.interpret(u, body.id, body);
            } finally {
              inflight--;
            }
          } else if (action === "run") result = lab.run(u, body.id, body);
          else if (action === "rate") result = lab.rate(u, body.id, body);
          else if (action === "withdraw") result = lab.withdraw(u, body.id);
          else if (action === "observe") result = { id: lab.observe(u, body) };
          else if (action === "review") result = lab.review(u, body.id, body);
          else if (action === "rollback") result = lab.rollback(u, body);
          else if (action === "decision")
            result = { id: lab.decision(u, body) };
          else if (action === "note") result = { id: lab.note(u, body) };
          else fail(404, "연구 기능을 찾을 수 없습니다.");
        } else fail(404, "연구 기능을 찾을 수 없습니다.");
        json(res, 200, result === undefined ? { ok: true } : result);
        return;
      }
      if (route === "/api/crm/dashboard" && req.method === "GET") {
        json(res, 200, crm.dashboard());
        return;
      }
      if (route === "/api/crm/status" && req.method === "GET") {
        json(res, 200, crm.status(url.searchParams.get("clientId") || ""));
        return;
      }
      if (["/api/crm/subscribe","/api/crm/unsubscribe","/api/crm/test-notification"].includes(route) && req.method === "POST") {
        const result=route.endsWith("subscribe")&&!route.endsWith("unsubscribe")?crm.subscribe(body):route.endsWith("unsubscribe")?crm.unsubscribe(body):crm.dispatch(body);
        json(res, 200, result);
        return;
      }
      if (route === "/api/session" && req.method === "GET") {
        json(res, 200, {
          user: u,
          aiConfigured: ai.configured,
          model: ai.model,
          localOnly: true,
        });
        return;
      }
      if (route === "/api/auth/logout" && req.method === "POST") {
        store.logout(token);
        res.setHeader("Set-Cookie", cookie(""));
        json(res, 200, { ok: true });
        return;
      }
      if (
        ["/api/auth/signup", "/api/auth/login"].includes(route) &&
        req.method === "POST"
      ) {
        limit("auth:" + req.socket.remoteAddress, 12, 600000);
        const user = route.endsWith("signup")
          ? store.signup(body)
          : store.login(body);
        store.logout(token);
        res.setHeader("Set-Cookie", cookie(store.session(user)));
        json(res, 200, { user });
        return;
      }
      if (route === "/api/recommend" && req.method === "POST") {
        const result = C.compare(body);
        if (result.status === "invalid")
          fail(400, "선호, 비선호가 겹치거나 매장 조건이 올바르지 않습니다.");
        const allowed = require("./research.cjs").compare(
          {
            likes: body.tags,
            dislikes: body.dislikes || [],
            required: body.essential ? ["rice"] : [],
          },
          lab.catalog().items,
        ).candidates;
        result.candidates = result.candidates.filter((d) =>
          allowed.some((a) => a.id === d.id),
        );
        if (result.status === "partial" && !result.candidates.length)
          result.status = "empty";
        json(res, 200, {
          ...result,
          trace: [
            "사용자 확인 취향 수신",
            "등록 후보 목록 조회",
            "필수, 비선호, 매장 조건 검사",
            result.candidates.length ? "부분 대안 반환" : "추천 보류",
          ],
          sources: [
            {id:"strawberry",url:"https://www.starbucks.co.kr/menu/drink_view.do?product_cd=9200000003276",checked:"2026-10-07",scope:"공식 블렌디드 목록 확인, 지점 재고 미확인"},
            {id:"mango",url:"https://www.starbucks.co.kr/menu/drink_view.do?product_cd=167004",checked:"2026-10-07",scope:"공식 블렌디드 목록 확인, 지점 재고 미확인"},
            {
              id: "coldbrew",
              url: "https://www.starbucks.co.kr/store/store_coldbrew.do",
              checked: "2026-10-07",
              scope:
                "공식 소개 목록에서 메뉴명 확인. 감각 태그는 설계 해석이며 실시간 판매 정보가 아닙니다.",
            },
            {
              id: "chocolate",
              url: "https://www.starbucks.co.kr/menu/drink_view.do?product_cd=168066",
              checked: "2026-10-07",
              scope:
                "공식 메뉴 목록에서 확인. 감각 태그는 설계 해석이며 지점별 판매, 재고는 별도 확인이 필요합니다.",
            },
            {
              id: "latte",
              url: "https://www.starbucks.co.kr/menu/drink_list.do",
              checked: "2026-10-07",
              scope:
                "공식 메뉴 목록에서 확인. 감각 태그는 설계 해석이며 지점별 판매, 재고는 별도 확인이 필요합니다.",
            },
          ],
        });
        return;
      }
      if (route === "/api/posts" && req.method === "GET") {
        json(res, 200, { posts: store.list(requireUser()), reasons });
        return;
      }
      if (route === "/api/posts" && req.method === "POST") {
        requireUser();
        checkPost(body.type, body.payload, body.consent);
        const id = store.create(u, body.type, body.payload);
        json(res, 201, { id });
        return;
      }
      const match = route.match(
        /^\/api\/posts\/([a-f0-9-]{36})\/(edit|visibility|vote|report)$/,
      );
      if (match && req.method === "POST") {
        requireUser();
        const [, id, action] = match;
        if (action === "edit") {
          const p = store.post(id);
          if (!p) fail(404, "제안을 찾을 수 없습니다.");
          checkPost(p.type, body.payload, body.consent);
          if (!Number.isInteger(body.version))
            fail(400, "수정 버전이 필요합니다.");
          store.edit(u, id, body.version, body.payload);
        }
        if (action === "visibility") store.visibility(u, id, body.status);
        if (action === "vote") store.vote(u, id, body.reason);
        if (action === "report") store.report(u, id, body.reason);
        json(res, 200, { ok: true });
        return;
      }
      if (route === "/api/ops" && req.method === "GET") {
        requireUser();
        if (u.role !== "admin") fail(403, "운영자만 확인할 수 있습니다.");
        json(res, 200, store.operations());
        return;
      }
      if (
        ["/api/ai/taste", "/api/ai/summary"].includes(route) &&
        req.method === "POST"
      ) {
        if (body.consent !== true)
          fail(400, "선택한 내용을 Google Gemini로 전송하는 데 동의해 주세요.");
        limit("ai:" + (u?.id || req.socket.remoteAddress), 10, 3600000);
        if (inflight >= 2)
          fail(
            429,
            "AI가 다른 요청을 처리 중입니다. 잠시 후 다시 시도해 주세요.",
          );
        let data;
        if (route.endsWith("taste")) {
          if (
            !Array.isArray(body.history) ||
            body.history.length < 1 ||
            body.history.length > 8 ||
            !body.history.every(
              (t) =>
                t &&
                ["user", "assistant"].includes(t.role) &&
                typeof t.text === "string" &&
                t.text.length > 0 &&
                t.text.length <= 1200,
            ) ||
            JSON.stringify(body.history).length > 7000
          )
            fail(400, "대화는 8개 메시지 이내, 각 1~1200자로 입력해 주세요.");
          if (pii(JSON.stringify(body.history)))
            fail(400, "개인정보나 인증값을 빼고 취향만 입력해 주세요.");
          data = body.history;
        } else {
          requireUser();
          data = store
            .list(u)
            .filter((p) => p.status === "visible")
            .slice(0, 30)
            .map((p) => ({ id: p.id, text: postText(p) }));
          if (!data.length)
            fail(
              400,
              "요약할 공개 제안이 없습니다. 먼저 제안을 게시해 주세요.",
            );
        }
        inflight++;
        try {
          const result = route.endsWith("taste")
            ? await ai.taste(data)
            : await ai.summary(data);
          json(res, 200, {
            ...result,
            ...(route.endsWith("summary")
              ? {
                  sourceCount: data.length,
                  snapshot: createHash("sha256")
                    .update(JSON.stringify(data))
                    .digest("hex")
                    .slice(0, 12),
                }
              : {}),
          });
        } finally {
          inflight--;
        }
        return;
      }
      fail(404, "요청한 기능을 찾을 수 없습니다.");
    } catch (error) {
      const status = error.status || 500;
      json(res, status, {
        error:
          status === 500
            ? "처리 중 오류가 발생했습니다. 다시 시도해 주세요."
            : error.message,
        code: error.code || null,
      });
    }
  });
  return {
    server,
    store,
    ai,
    lab,
    crm,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      store.close();
    },
  };
}
if (require.main === module) {
  const app = createApp();
  app.server.listen(4322, "127.0.0.1", () =>
    console.log(
      "NEXT CUP v04: http://127.0.0.1:4322 ,  키 출력 없음 ,  외부 공개 안 함",
    ),
  );
}
module.exports = { createApp, postText };
