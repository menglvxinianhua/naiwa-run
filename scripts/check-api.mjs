import assert from 'node:assert/strict';
const base=process.argv[2]||'http://127.0.0.1:5187';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Only disposable local test data');
const response=await fetch(base+'/api/game?action=profile');assert.equal(response.status,200);
const cookie=response.headers.get('set-cookie').split(';')[0];
async function post(body,origin=base){return fetch(base+'/api/game',{method:'POST',headers:{cookie,origin,'content-type':'application/json'},body:JSON.stringify(body)});}
assert.equal((await post({action:'name',name:''})).status,400);
assert.equal((await post({action:'name',name:'API 检查'})).status,200);
assert.equal((await post({action:'start'},'https://example.invalid')).status,403);
const start=await post({action:'start'});assert.equal(start.status,200);const {id}=await start.json();
assert.equal((await post({action:'finish',id,duration:900000})).status,400);
const finish=await post({action:'finish',id,duration:0});assert.equal(finish.status,200);assert.equal((await finish.json()).score,0);
assert.equal((await post({action:'finish',id,duration:0})).status,200);
const profile=await (await fetch(base+'/api/game?action=profile',{headers:{cookie}})).json();assert.equal(profile.history.length,1);assert.equal(profile.name,'API 检查');
console.log('PASS: cookie identity, nickname validation, origin guard, elapsed-time guard, save, idempotency, history');
