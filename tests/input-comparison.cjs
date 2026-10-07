// Replay earlier real model responses. This is a UI state comparison, not a user study.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const {createApp}=require('../app/server.cjs');
const fs=require('node:fs'),assert=require('node:assert/strict');
const cases=require('../evidence/connection-scenarios.json').cases;
const original=require('../evidence/connection-results.json').rows;
(async()=>{const app=createApp({dbPath:':memory:'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});const rows=[];try{
 for(const c of cases){const target=c.override||c,row={id:c.id,input:c.text,kind:c.override?'의도적으로 취향을 바꾼 사례':'초기 조건'};
  for(const mode of ['manual','aiReplay']){const page=await browser.newPage();try{await page.goto('http://127.0.0.1:'+app.server.address().port);
   if(mode==='manual')await page.locator('#manual').click();else{const recorded=original.find(r=>r.id===c.id).response;await page.route('**/api/ai/taste',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(recorded)}));await page.locator('#memory').fill(c.text);await page.locator('#consent').check();await page.locator('#interpret').click();await page.locator('#confirm').waitFor({state:'visible'});}
   const changes=[];for(const [name,wanted]of [['like',target.likes],['avoid',target.dislikes]]){for(const input of await page.locator('[name='+name+']').all()){const tag=await input.getAttribute('value'),want=wanted.includes(tag);if(await input.isChecked()!==want){await input.evaluate(el=>{const details=el.closest('details');if(details)details.open=true;});await input.setChecked(want);changes.push(name+':'+tag+'='+want);}}}
   if(await page.locator('#rice').inputValue()!==target.rice){await page.locator('#rice').selectOption(target.rice);changes.push('rice='+target.rice);}
   if(await page.locator('#priority').inputValue()!==target.priority){await page.locator('#priority').selectOption(target.priority);changes.push('priority='+target.priority);}
   await page.locator('#taste-form button').click();await page.locator('#result').waitFor({state:'visible'});
   const candidates=await page.locator('.drink h2').allTextContents();row[mode]={fieldChanges:changes.length,changes,candidates};
  }finally{await page.close();}}
  assert.deepEqual(row.manual.candidates,row.aiReplay.candidates);rows.push(row);
 }
 const dir='runtime/comparison-'+Date.now();fs.mkdirSync(dir,{recursive:true});const report={kind:'retrospective-response-replay',realAICallsThisRun:0,externalParticipants:0,source:'evidence/connection-results.json / connection-scenarios.json'};report.definition='확인 화면에서 목표 조건으로 바꾼 체크/선택 값의 개수. 클릭 수, 수행 시간, 인지 부담이 아님.';report.excluded='기억 입력, 전송 동의, API 대기, 읽기/확인 시간, 펼침/제출 동작은 제외. R03은 AI 오류가 아니라 의도적 조건 변경.';report.rows=rows;fs.writeFileSync(dir+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify({dir,rows}));
 }finally{await browser.close();app.server.closeAllConnections();await app.close();}})().catch(e=>{console.error(e.message);process.exitCode=1});
