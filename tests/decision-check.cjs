"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  { execFileSync } = require("node:child_process");
const C = require("../core.js"),
  protocol = require("../evidence/heldout-v1.json");
const baselineCommit = "c5f0ae5";
const oldSource = execFileSync("git", ["show", baselineCommit + ":core.js"], {
  cwd: path.join(__dirname, ".."),
  encoding: "utf8",
});
const scope = { module: { exports: {} } };
vm.runInNewContext(oldSource, scope);
const old = scope.module.exports;
const equal = (a, b) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const rows = protocol.cases.map((c) => {
  const input = {
    tags: c.likes,
    dislikes: c.dislikes,
    essential: c.rice === "yes",
    store: "all",
  };
  const before = old.compare(input),
    after = C.compare(input);
  return {
    id: c.id,
    category: c.category,
    input,
    expected: c.candidates,
    before: before.candidates.map((d) => d.id),
    after: after.candidates.map((d) => d.id),
    beforePass: equal(
      before.candidates.map((d) => d.id),
      c.candidates,
    ),
    afterPass: equal(
      after.candidates.map((d) => d.id),
      c.candidates,
    ),
    status: after.status,
  };
});
const report = {
  at: new Date().toISOString(),
  baselineCommit,
  scope: "같은 확인 조건을 이전 코드와 수정 코드에 입력한 회귀 시험",
  humanParticipants: 0,
  rows,
  summary: {
    total: rows.length,
    beforePass: rows.filter((r) => r.beforePass).length,
    afterPass: rows.filter((r) => r.afterPass).length,
  },
  limits:
    "맛 유사도 또는 AI 대 수동의 사용자 효과가 아님. 미확인 쌀 필수 조건은 시험에서 선택 조건으로 가정.",
};
fs.writeFileSync(
  path.join(__dirname, "../evidence/decision-check.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report.summary));
