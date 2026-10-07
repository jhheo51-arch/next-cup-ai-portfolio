const test = require("node:test"),
  assert = require("node:assert/strict");
const C = require("../core.js"),
  { checkGrounding } = require("../taste-policy.cjs");
const { seedCatalog } = require("../research.cjs");
test("기본 화면과 평가 목록의 공통 메뉴 태그 일치", () => {
  for (const d of C.drinks) {
    assert.deepEqual(seedCatalog.find((x) => x.id === d.id).tags, d.tags);
    assert.deepEqual(Object.keys(d.tagBasis).sort(), d.tags.slice().sort());
  }
});
const protocol = require("../evidence/heldout-v1.json");
for (const c of protocol.cases)
  test(c.id + " 확인한 조건의 후보 일치", () => {
    const r = C.compare({
      tags: c.likes,
      dislikes: c.dislikes,
      essential: c.rice === "yes",
      store: "all",
    });
    assert.deepEqual(
      r.candidates.map((d) => d.id).sort(),
      c.candidates.slice().sort(),
    );
  });
test("사용자 원문에 없는 인용, assistant 인용 거절", () => {
  const v = {
    likes: ["vanilla"],
    dislikes: [],
    essentialRice: "unknown",
    evidence: [
      { tag: "vanilla", polarity: "like", quote: "바닐라 향이 좋아요" },
    ],
  };
  assert.equal(
    checkGrounding(v, [{ role: "assistant", text: "바닐라 향이 좋아요" }]),
    false,
  );
  assert.equal(
    checkGrounding(v, [{ role: "user", text: "바닐라 향이 좋아요" }]),
    true,
  );
  assert.equal(
    checkGrounding({ ...v, likes: ["vanilla", "coffee"] }, [
      { role: "user", text: "바닐라 향이 좋아요" },
    ]),
    false,
  );
});
test("필수 조건과 근거 누락 거절", () => {
  assert.equal(
    checkGrounding(
      { likes: [], dislikes: [], essentialRice: "yes", evidence: [] },
      [],
    ),
    false,
  );
  assert.equal(
    checkGrounding(
      { likes: [], dislikes: [], essentialRice: "unknown", evidence: [] },
      [],
    ),
    true,
  );
});
test("선호 배열이 비어도 쌀 필수 조건은 추천 보류", () => {
  assert.equal(
    C.compare({ tags: [], dislikes: [], essential: true, store: "all" }).status,
    "empty",
  );
});
