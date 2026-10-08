const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createApp}=require('../app/server.cjs');
(async()=>{
const root=path.resolve(__dirname,'..'),checks=[],errors=[];
for(const name of ['README.md',...fs.readdirSync(path.join(root,'docs')).filter(x=>x.endsWith('.md')).map(x=>'docs/'+x)]){
const text=fs.readFileSync(path.join(root,name),'utf8');
assert.ok(!/[\u00b7\u2022\u2027\u318d]/u.test(text),name+' punctuation');
for(const m of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){const url=m[1];if(/^(https?:|#)/.test(url))continue;const target=path.resolve(path.dirname(path.join(root,name)),url.split('#')[0]);if(!fs.existsSync(target))errors.push(name+' -> '+url);}
checks.push(name+' links');
}
assert.deepEqual(errors,[]);
const app=createApp({dbPath:':memory:'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
try{const base='http://127.0.0.1:'+app.server.address().port;
for(const route of ['/','/simple.js','/simple.css','/portfolio.js','/portfolio.css','/rice-cup.svg','/sw.js','/core.js','/README.md','/PRD.md','/HANDOFF.md','/PROTOCOL.md']){const response=await fetch(base+route);assert.equal(response.status,200,route);checks.push('HTTP 200 '+route);}
for(const route of ['/.env','/app/ai.cjs','/runtime/next-cup.sqlite'])assert.equal((await fetch(base+route)).status,404,route);
checks.push('private files blocked');
}finally{app.server.closeAllConnections();await app.close();}
const result={checked:new Date().toISOString(),scope:'folder-reorganization',checks,realAICalls:0,externalParticipants:0};
fs.mkdirSync(path.join(root,'runtime'),{recursive:true});fs.writeFileSync(path.join(root,'runtime/repository-check.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({checks:checks.length,errors:errors.length}));
})().catch(e=>{console.error(e);process.exitCode=1});
