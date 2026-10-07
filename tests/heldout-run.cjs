"use strict";
// Optional 24 paid calls, no customer text. Never auto-runs under npm test.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { createAI } = require("../app/ai.cjs"),
  C = require("../app/core.js");
const protocol = require("../evidence/heldout-v1.json"),
  { PROMPT } = require("../app/taste-policy.cjs");
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");
const equal = (a, b) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
(async () => {
  const ai = createAI();
  if (!ai.configured) throw Error("Gemini 설정 없음");
  const started = new Date().toISOString(),
    rows = [];
  const manifest = {
    started,
    protocolHash: hash(JSON.stringify(protocol)),
    promptHash: hash(PROMPT),
    model: ai.model,
    repeats: protocol.repeats,
    humanParticipants: 0,
  };
  const dir = path.join(__dirname, "../runtime");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, "heldout-" + Date.now() + ".json");
  fs.writeFileSync(
    out,
    JSON.stringify({ ...manifest, status: "running", rows }, null, 2),
    { flag: "wx" },
  );
  for (let repeat = 1; repeat <= protocol.repeats; repeat++)
    for (const c of protocol.cases) {
      const history = c.history || [{ role: "user", text: c.text }],
        start = Date.now();
      let row;
      try {
        const response = await ai.taste(history),
          v = response.result;
        const result = C.compare({
          tags: v.likes,
          dislikes: v.dislikes,
          essential: v.essentialRice === "yes",
          store: "all",
        });
        // Unknown is a required human confirmation in the UI. This comparison isolates tag effects, assuming optional rice.
        row = {
          id: c.id,
          repeat,
          ok: true,
          pass:
            equal(v.likes, c.likes) &&
            equal(v.dislikes, c.dislikes) &&
            v.essentialRice === c.rice,
          candidateMatch: equal(
            result.candidates.map((d) => d.id),
            c.candidates,
          ),
          expected: {
            likes: c.likes,
            dislikes: c.dislikes,
            essentialRice: c.rice,
            candidates: c.candidates,
          },
          result: v,
          candidates: result.candidates.map((d) => d.id),
          meta: response.meta,
        };
      } catch (e) {
        row = {
          id: c.id,
          repeat,
          ok: false,
          pass: false,
          candidateMatch: false,
          error: e.code || "ERROR",
          meta: { ms: Date.now() - start },
        };
      }
      rows.push(row);
      fs.writeFileSync(
        out,
        JSON.stringify({ ...manifest, status: "running", rows }, null, 2),
      );
      console.log(
        JSON.stringify({
          id: row.id,
          repeat,
          pass: row.pass,
          ms: row.meta.ms,
          error: row.error,
        }),
      );
    }
  const times = rows.map((r) => r.meta.ms).sort((a, b) => a - b),
    successTimes = rows.filter((r) => r.ok).map((r) => r.meta.ms);
  const report = {
    ...manifest,
    finished: new Date().toISOString(),
    status: "complete",
    rows,
    summary: {
      total: rows.length,
      exactPass: rows.filter((r) => r.pass).length,
      candidateMatch: rows.filter((r) => r.candidateMatch).length,
      errors: rows.filter((r) => !r.ok).length,
      meanMs: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      successMeanMs: successTimes.length
        ? Math.round(
            successTimes.reduce((a, b) => a + b, 0) / successTimes.length,
          )
        : null,
      p95Ms: times[Math.ceil(times.length * 0.95) - 1],
    },
    limitations: [
      "같은 작성 도구가 설계한 내부 합성 평가",
      "맛 유사도, 만족도, 구매 효과를 측정하지 않음",
      "미확인 필수 조건은 화면에서 사람이 확인하며 후보 시험은 쌀 필수 아님을 가정",
      "결과 확인 후 이 평가에 맞춘 프롬프트 재수정은 하지 않음",
    ],
  };
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ summary: report.summary, file: out }));
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
