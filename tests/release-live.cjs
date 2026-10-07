const fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const {createApp}=require('../app/server.cjs'),C=require('../app/core.js'),P=require('../app/taste-policy.cjs');
const protocol=require('../evidence/connection-scenarios.json');
const out=process.env.RELEASE_OUTPUT_DIR||'runtime/release-'+new Date().toISOString().replace(/[:.]/g,'-');fs.mkdirSync(out,{recursive:true});
(async()=>{
const app=createApp({dbPath:':memory:'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'msedge',headless:true});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const report={started:new Date().toISOString(),kind:protocol.kind,externalParticipants:0,promptVersion:P.VERSION,promptHash:hash(P.PROMPT),catalogHash:hash(JSON.stringify(C.drinks)),rows:[]};
try{for(const c of protocol.cases.filter(c=>!process.env.RELEASE_CASE||c.id===process.env.RELEASE_CASE)){
 const page=await browser.newPage({viewport:{width:1280,height:960}});
 const row={id:c.id,input:c.text,expected:c.expected};const started=Date.now();
 try{
 await page.goto('http://127.0.0.1:'+app.server.address().port);
 await page.locator('#memory').fill(c.text);await page.locator('#consent').check();
 const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/ai/taste'));
 await page.locator('#interpret').click();const response=await responsePromise;row.ms=Date.now()-started;row.httpStatus=response.status();row.response=await response.json();
 if(!response.ok())throw Error('AI HTTP '+response.status());
 await page.locator('#confirm').waitFor({state:'visible'});
 const result=row.response.result;const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
 row.extractionMatch=same(result.likes,c.likes)&&same(result.dislikes,c.dislikes)&&result.essentialRice===c.rice;
 await page.screenshot({path:out+'/release-'+c.id+'-confirm.png',fullPage:true});
 if(c.override){await page.locator('#more-likes').evaluate(el=>el.parentElement.open=true);await page.locator('#dislikes').evaluate(el=>el.parentElement.open=true);for(const name of ['like','avoid'])for(const input of await page.locator('[name='+name+']').all())await input.setChecked((name==='like'?c.override.likes:c.override.dislikes).includes(await input.getAttribute('value')));await page.locator('#rice').selectOption(c.override.rice);}
 await page.locator('#priority').selectOption((c.override||c).priority);
 const recommendPromise=page.waitForResponse(r=>r.url().endsWith('/api/recommend'));await page.locator('#taste-form button').click();const rec=await recommendPromise;row.recommendation=await rec.json();
 await page.locator('#result').waitFor({state:'visible'});
 row.confirmed=await page.evaluate(()=>({likes:[...document.querySelectorAll('[name=like]:checked')].map(x=>x.value),dislikes:[...document.querySelectorAll('[name=avoid]:checked')].map(x=>x.value),rice:document.querySelector('#rice').value,priority:document.querySelector('#priority').value}));
 row.candidates=row.recommendation.candidates.map(d=>d.id);row.candidateMatch=same(row.candidates,c.expected);row.manualOverride=!!c.override;
 await page.screenshot({path:out+'/release-'+c.id+'-result.png',fullPage:true});
 row.pass=row.extractionMatch&&row.candidateMatch;
 }catch(e){row.error=e.message;row.pass=false;}
 report.rows.push(row);await page.close();
 }
}finally{report.finished=new Date().toISOString();fs.writeFileSync(out+'/release-live.json',JSON.stringify(report,null,2));await browser.close();app.server.closeAllConnections();await app.close();}
console.log(JSON.stringify(report.rows.map(({id,ms,httpStatus,extractionMatch,candidateMatch,error})=>({id,ms,httpStatus,extractionMatch,candidateMatch,error}))));
})().catch(e=>{console.error(e);process.exitCode=1});
