import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {createVercelHandler,vercelClientAddress} from '../server/vercel-handler.js';
import {readAIConfig} from '../server/ai-config.js';
import {characters} from '../src/characters.js';
import {achievementBand} from '../src/achievements.js';
import {requestDialogue} from '../src/ai-stream.js';

const config={key:'fake-server-only-key',baseURL:'https://provider.example/v1',model:'deepseek/test'};
const privateBody={character:characters[0],event:{kind:'hammer'},history:[]};
const gameBody={character:characters[5],event:{kind:'pop'},history:[]};
const reviewBody={title:achievementBand(-50).titles[0],summary:{score:-50,attempts:1,correct:0,wrong:1,maxCombo:0,misses:0,hammer:{total:0,correct:0},chocolate:{total:1,correct:0},recentActions:[]}};
const provider=record=>async(url,options)=>{
 const body=JSON.parse(options.body);record?.({url,body,headers:options.headers});
 const reply=body.messages[0].content.includes('Reply only in natural English')?'Got it!':'收到啦！';
 if(body.stream)return new Response('data: '+JSON.stringify({choices:[{delta:{content:reply}}]})+'\n\ndata: [DONE]\n\n');
 return Response.json({choices:[{message:{content:reply}}]});
};
async function serve(t,{bodyMode='raw',getConfig=()=>config,fetchImpl=provider()}={}){
 const handler=createVercelHandler({getConfig,fetchImpl});
 const server=createServer(async(req,res)=>{
  if(bodyMode!=='raw'&&req.method==='POST'){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);const raw=Buffer.concat(chunks);
   Object.defineProperty(req,'body',{get:()=>bodyMode==='parsed'?JSON.parse(raw.toString('utf8')):bodyMode==='buffer'?raw:raw.toString('utf8')});
  }
  await handler(req,res);
 });server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());return `http://127.0.0.1:${server.address().port}`;
}
const post=(url,body)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});

test('English requests keep validated canonical profiles and apply English generation instructions',async t=>{
 const sent=[],endpoint=await serve(t,{fetchImpl:provider(value=>sent.push(value))});
 for(const [route,body] of [['private-chat',privateBody],['game-dialogue',gameBody],['round-review',reviewBody]]){
  const response=await post(endpoint+'/api/'+route,{...body,language:'en'});assert.equal(response.status,200);
  assert.match(sent.at(-1).body.messages[0].content,/Reply only in natural English/);
  assert.doesNotMatch(sent.at(-1).body.messages[0].content,/只输出一句中文|中文说话|字的中文/);
  assert.equal((await response.json()).reply,'Got it!');
 }
 const invalid=await post(endpoint+'/api/private-chat',{...privateBody,language:'en',character:{...characters[0],relation:99}});
 assert.equal(invalid.status,400);
});

test('local and cloud config use the same server-only names and preserve local fallback',()=>{
 assert.deepEqual(readAIConfig({AI_API_KEY:'cloud',AI_MODEL:'cloud-model'},{AI_API_KEY:'local',AI_MODEL:'local-model'}),{key:'cloud',baseURL:'https://vibetoken.cn/v1',model:'cloud-model'});
 assert.equal(readAIConfig({},{AI_API_KEY:'local'}).key,'local');
 assert.equal(readAIConfig({VITE_AI_API_KEY:'must-not-be-used'}).key,undefined);
});

test('Vercel route files export Node handlers and status reveals only configuration state',async t=>{
 for(const file of ['ai/status','private-chat','game-dialogue','round-review'])assert.equal(typeof (await import(`../api/${file}.js`)).default,'function');
 const endpoint=await serve(t);const response=await fetch(endpoint+'/api/ai/status');assert.deepEqual(await response.json(),{configured:true});assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal((await fetch(endpoint+'/api/unknown')).status,404);assert.equal((await fetch(endpoint+'/api/private-chat')).status,405);
 const missing=await serve(t,{getConfig:()=>({})});assert.equal((await post(missing+'/api/private-chat',privateBody)).status,503);
});

test('all three AI routes accept raw streams and Vercel parsed objects, strings or buffers',async t=>{
 for(const bodyMode of ['raw','parsed','string','buffer']){
  const sent=[],endpoint=await serve(t,{bodyMode,fetchImpl:provider(value=>sent.push(value))});
  for(const [route,body] of [['private-chat',privateBody],['game-dialogue',gameBody],['round-review',reviewBody]]){
   const response=await post(endpoint+'/api/'+route,body);assert.equal(response.status,200,bodyMode+' '+route);
   const output=await response.json();assert.deepEqual(output,{reply:'收到啦！',source:'ai'});assert.ok(!JSON.stringify(output).includes(config.key));
  }
  assert.match(sent[0].body.messages.at(-1).content,/敲/);assert.match(sent[1].body.messages[0].content,/30秒/);assert.equal(JSON.parse(sent[2].body.messages[1].content).summary.score,-50);
 }
});

test('Vercel parsed requests retain SSE, reject malformed/oversized bodies and foreign origins',async t=>{
 const endpoint=await serve(t,{bodyMode:'parsed'}),updates=[];
 const result=await requestDialogue({...privateBody,stream:true},new AbortController().signal,text=>updates.push(text),endpoint+'/api/private-chat');assert.equal(result.reply,'收到啦！');assert.deepEqual(updates,['收到啦！']);
 assert.equal((await fetch(endpoint+'/api/private-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken'})).status,400);
 assert.equal((await post(endpoint+'/api/private-chat',{...privateBody,padding:'大'.repeat(9000)})).status,413);
 const denied=await fetch(endpoint+'/api/private-chat',{method:'POST',headers:{Origin:'https://foreign.example','Content-Type':'application/json'},body:JSON.stringify(privateBody)});assert.equal(denied.status,403);
});

test('cloud rate limits use distinct client IPs while invalid headers fall back to socket',()=>{
 const req={headers:{'x-vercel-forwarded-for':'203.0.113.5','x-forwarded-for':'198.51.100.7'},socket:{remoteAddress:'127.0.0.1'}};
 assert.equal(vercelClientAddress(req),'203.0.113.5');req.headers['x-vercel-forwarded-for']='203.0.113.6';assert.equal(vercelClientAddress(req),'203.0.113.6');
 req.headers['x-vercel-forwarded-for']='invalid';assert.equal(vercelClientAddress(req),'127.0.0.1');
});
