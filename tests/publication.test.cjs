const test=require('node:test'),assert=require('node:assert/strict'),{settings}=require('../ai.cjs');
test('공개본: 개인 응답 원문과 개인 컴퓨터 경로 없음',()=>{
 const fs=require('node:fs'),path=require('node:path'),root=path.join(__dirname,'..');
 const e=require('../evidence.json');assert.equal(e.ownerInterview,undefined);assert.ok(e.cases.every(c=>!c.ownerEvidence));
 for(const name of ['ai.cjs','README.md','PRD.md','HANDOFF.md','CONTENT.md','EVIDENCE.md']){
  const text=fs.readFileSync(path.join(root,name),'utf8');assert.ok(!/C:[/\\]Users[/\\]/i.test(text),name);
 }
 assert.ok(!settings.toString().includes('next-cup-2026-10-07-v02'));
});
