const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const {createApp}=require('../app/server.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const app=createApp({dbPath:':memory:'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage();const checks=[];const output='runtime/layout-'+Date.now();fs.mkdirSync(output,{recursive:true});
 try{
  await page.goto('http://127.0.0.1:'+app.server.address().port);await page.evaluate(()=>document.fonts.ready);
  await page.locator('#manual').click();await page.locator('[name=like][value=ice]').check();await page.locator('#rice').selectOption('no');await page.locator('#priority').selectOption('ice');await page.locator('#taste-form button').click();await page.locator('.drink').first().waitFor();
  for(const width of [375,812,1024,1280,1440]){
   await page.setViewportSize({width,height:900});
   for(const route of ['start','confirm','result','request','saved','crm']){
    await page.evaluate(route=>location.hash=route,route);await page.locator('#'+route).waitFor({state:'visible'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' '+width);
    checks.push(route+' / '+width+'px 가로 넘침 없음');
   }
   await page.evaluate(()=>location.hash='start');await page.locator('#start').waitFor({state:'visible'});
   if(width>=1024){const lines=await page.locator('.hero-copy .lead').evaluate(el=>{const r=document.createRange();r.selectNodeContents(el);return new Set([...r.getClientRects()].map(x=>Math.round(x.top))).size;});assert.equal(lines,1,'한 줄 '+width);checks.push('소개 문구 한 줄 / '+width+'px');}
   if([375,1280].includes(width))await page.screenshot({path:output+'/start-'+width+'.png',fullPage:true});
  }
  await page.setViewportSize({width:375,height:812});await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#hero-begin').click();assert.ok(await page.locator('#memory').evaluate(el=>el===document.activeElement));checks.push('모션 줄이기 상태에서 입력 이동');
  fs.writeFileSync(output+'/result.json',JSON.stringify({checks,realAICalls:0},null,2));console.log(JSON.stringify({passed:checks.length,output}));
 }finally{await browser.close();app.server.closeAllConnections();await app.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
