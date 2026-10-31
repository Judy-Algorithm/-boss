import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {ACHIEVEMENT_BANDS,achievementBand,createAchievementPicker,roundSummary} from '../src/achievements.js';
import {createRoundResults} from '../src/round-results.js';
import {buildRoundReviewMessages} from '../server/round-review.js';
import {createPrivateChatMiddleware} from '../server/private-chat-api.js';
import {requestDialogue} from '../src/ai-stream.js';
import {scoreFor} from '../src/rules.js';

const memory=()=>{const data=new Map();return {getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};};
const node=()=>({textContent:'',dataset:{},attributes:{},setAttribute(key,value){this.attributes[key]=value;}});
const stats=(overrides={})=>({score:90,attempts:5,correct:4,maxCombo:2,misses:1,hammer:3,correctHammer:2,chocolate:2,correctChocolate:2,roundActions:[],...overrides});
const zero=()=>stats({score:0,attempts:0,correct:0,maxCombo:0,misses:0,hammer:0,correctHammer:0,chocolate:0,correctChocolate:0});
const payload=(value=stats())=>({summary:roundSummary(value),title:achievementBand(value.score).titles[0],roundId:'test-round'});
async function settled(note){const until=Date.now()+3000;while(note.attributes['aria-busy']!=='false'){if(Date.now()>until)throw Error('review never completed');await new Promise(resolve=>setTimeout(resolve,5));}}

test('score tiers cover negative, zero and positive boundaries with no gaps or overlaps',()=>{
 assert.equal(ACHIEVEMENT_BANDS.length,13);
 for(let score=-1000;score<=1000;score++)assert.equal(ACHIEVEMENT_BANDS.filter(b=>score>=b.min&&score<=b.max).length,1);
 for(const b of ACHIEVEMENT_BANDS){assert.equal(b.titles.length,5);for(const edge of [b.min,b.max].filter(Number.isFinite))assert.equal(achievementBand(edge).id,b.id);}
 assert.equal(achievementBand(-1).id,'negative-starter');assert.equal(achievementBand(0).id,'zero');assert.equal(achievementBand(1).id,'starter');
 assert.equal(new Set(ACHIEVEMENT_BANDS.flatMap(b=>b.titles)).size,65);
 // Current integer relations and neutral base score produce multiples of five.
 for(let r=-5;r<=5;r++)for(const kind of ['hammer','chocolate'])assert.ok(scoreFor(r,kind)%5===0);
});

test('each tier uses all five titles before repeating and persists its deck across reloads',()=>{
 const storage=memory();let picker=createAchievementPicker(storage,()=>.5),last;
 for(let cycle=0;cycle<3;cycle++){
  const titles=[];for(let i=0;i<5;i++){picker=createAchievementPicker(storage,()=>.5);const title=picker.pick(-90).title;assert.notEqual(title,last);last=title;titles.push(title);}
  assert.equal(new Set(titles).size,5);
 }
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.ok(achievementBand(0).titles.includes(createAchievementPicker(blocked).pick(0).title));
});

test('summary snapshots only this round and server rejects scores or titles outside the rules',()=>{
 const value=stats({roundActions:[{event:'interaction',id:'boss',name:'新老板',kind:'hammer',correct:true,delta:50}],events:[{event:'interaction',id:'old-round'}]});
 const request=payload(value),messages=buildRoundReviewMessages(request),input=JSON.parse(messages[1].content);
 assert.equal(input.summary.accuracy,80);assert.equal(input.summary.recentActions[0].name,'新老板');
 value.roundActions[0].name='后来修改';assert.equal(request.summary.recentActions[0].name,'新老板');
 assert.throws(()=>buildRoundReviewMessages({...request,title:achievementBand(-90).titles[0]}));
 assert.throws(()=>buildRoundReviewMessages({...request,summary:{...request.summary,score:501}}));
 assert.throws(()=>buildRoundReviewMessages({...request,summary:{...request.summary,wrong:2}}));
 const noActions=buildRoundReviewMessages(payload(zero()));assert.match(noActions[0].content,/零操作不能夸命中/);assert.equal(JSON.parse(noActions[1].content).summary.accuracy,0);
 const negative=payload(stats({score:-50,attempts:1,correct:0,maxCombo:0,hammer:0,correctHammer:0,chocolate:1,correctChocolate:0}));assert.match(buildRoundReviewMessages(negative)[1].content,/−99～−50/);
});

test('AI review streams actual stats, retries repeated text and replaces a longer discarded line',async()=>{
 const storage=memory(),rank=node(),note=node(),calls=[];
 storage.setItem('shushu.round-reviews.v1',JSON.stringify(['上次已经写过的很长很长的一句鼓励话']));
 const results=createRoundResults({rank,note,storage,typingDelay:0,request:async(body,signal,onChunk,path)=>{
  calls.push({body,path});const reply=calls.length===1?'上次已经写过的很长很长的一句鼓励话':'这局很稳，快乐下班！';onChunk(reply);return {reply};
 }});
 const chosen=results.show(stats());assert.equal(chosen.bandId,'clever');await settled(note);
 assert.equal(calls.length,2);assert.equal(calls[0].path,'/api/round-review');assert.equal(calls[0].body.summary.wrong,1);assert.equal(calls[0].body.summary.chocolate.correct,2);
 assert.equal(note.textContent,'这局很稳，快乐下班！');assert.equal(note.dataset.source,'ai');results.cancel();
});

test('a new round cancels old reviews; provider failure is clearly marked as local encouragement',async()=>{
 const rank=node(),note=node(),pending=[];
 const results=createRoundResults({rank,note,storage:memory(),typingDelay:0,request:(body,signal,onChunk)=>new Promise(resolve=>pending.push({signal,onChunk,resolve}))});
 results.show(stats());results.show(zero());assert.equal(pending[0].signal.aborted,true);
 pending[0].onChunk('过期台词');pending[0].resolve({reply:'过期台词'});pending[1].resolve({reply:'本局先认工位，下次带快乐来上班！'});await settled(note);
 assert.ok(!note.textContent.includes('过期'));assert.equal(rank.dataset.band,'zero');results.cancel();
 const offline=createRoundResults({rank,note,storage:memory(),request:async()=>{throw Error('offline');}});offline.show(zero());await settled(note);assert.equal(note.dataset.source,'local');assert.match(note.textContent,/先认个工位/);offline.cancel();
});

test('round-review API relays only the encouragement and retains credentials on the server',async t=>{
 let sent;const config={key:'fake-test-secret',model:'test-model',baseURL:'https://example.com/v1'};
 const middleware=createPrivateChatMiddleware({getConfig:()=>config,fetchImpl:async(url,options)=>{
  sent=JSON.parse(options.body);return new Response('data: '+JSON.stringify({choices:[{delta:{content:'今天四次配合够默契，快乐 KPI 已打卡！'}}]})+'\n\ndata: [DONE]\n\n');
 }});
 const server=createServer((req,res)=>middleware(req,res,()=>{res.statusCode=404;res.end();}));server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());
 const url=`http://127.0.0.1:${server.address().port}/api/round-review`,chunks=[];
 const output=await requestDialogue(payload(),new AbortController().signal,text=>chunks.push(text),url);
 assert.equal(output.source,'ai');assert.equal(chunks.at(-1),output.reply);assert.equal(JSON.parse(sent.messages[1].content).summary.correct,4);assert.ok(!JSON.stringify(output).includes(config.key));
 const invalid=await fetch(url,{method:'POST',body:JSON.stringify({...payload(),title:'杜撰称号'})});assert.equal(invalid.status,400);
});
