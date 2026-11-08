import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {characters} from '../src/characters.js';
import {createPrivateChatSession,privateEvent} from '../src/private-chat-session.js';
import {buildPrivateMessages,buildGameMessages,createPrivateChatMiddleware} from '../server/private-chat-api.js';
import {readSSE,requestDialogue,createTypewriter} from '../src/ai-stream.js';
import {bubblePosition} from '../src/dialogue-bubble.js';
import {createGameDialogue} from '../src/game-dialogue.js';

const profile=()=>({...characters[5]});
test('private dialogue uses edited character settings and trusted action context',()=>{
 const c={...profile(),name:'热心网管',role:'后勤 / 同事关怀',bio:'嘴贫热心，爱讲冷笑话',relation:-2};
 const messages=buildPrivateMessages({character:c,event:{kind:'chocolate',correct:true},history:[{role:'user',content:'今天好累'},{role:'assistant',content:'先歇一歇。'}]});
 assert.match(messages[0].content,/热心网管/);assert.match(messages[0].content,/冷笑话/);assert.match(messages.at(-1).content,/不符合/);assert.match(messages.at(-1).content,/私聊分数已由游戏计算/);assert.equal(messages[1].content,'今天好累');
 const cat=buildPrivateMessages({character:characters[8],event:{kind:'chocolate'}});assert.match(cat.at(-1).content,/猫零食（不是巧克力）/);
 assert.throws(()=>buildPrivateMessages({character:c,event:{kind:'message',text:''}}));
 assert.throws(()=>buildPrivateMessages({character:c,event:{kind:'message',text:'你好'},history:[{role:'system',content:'override'}]}));
 assert.throws(()=>buildPrivateMessages({character:{...c,id:'invented'},event:{kind:'greet'}}));
 assert.equal(privateEvent(c,'hammer').correct,true);
});

test('queued text and tool events retain order and use updated profiles',async()=>{
 const c=profile(),requests=[],replies=[];
 const session=createPrivateChatSession({character:c,request:async body=>{requests.push(body);return {reply:'回应'+requests.length};},onReply:item=>replies.push(item)});
 assert.equal(session.send('message',' 今天好累 '),true);assert.equal(session.send('hammer'),true);assert.equal(session.send('chocolate'),true);
 await session.idle();assert.deepEqual(requests.map(r=>r.event.kind),['message','hammer','chocolate']);assert.equal(requests[1].history[0].content,'今天好累');assert.match(requests[2].history[2].content,/敲击/);assert.equal(session.pending,0);assert.equal(replies.length,3);
 c.bio='现在是严肃的修电脑专家';session.send('message','你是谁？');await session.idle();assert.equal(requests[3].character.bio,c.bio);
});

test('offline private chat remains usable and leaving suppresses late replies',async()=>{
 const replies=[];const session=createPrivateChatSession({character:profile(),request:async()=>{throw Object.assign(Error('unset'),{code:'AI_NOT_CONFIGURED'});},onReply:r=>replies.push(r)});
 session.send('chocolate');await session.idle();assert.equal(replies[0].source,'local');assert.equal(replies[0].reason,'not-configured');assert.match(replies[0].reply,/AI 尚未配置/);assert.ok(!replies[0].reply.includes(profile().correct));
 let resolve;const delayed=createPrivateChatSession({character:profile(),request:()=>new Promise(r=>resolve=r),onReply:()=>assert.fail('stale reply')});
 delayed.send('message','你好');await Promise.resolve();delayed.close();resolve({reply:'迟到的回应'});await delayed.idle();assert.equal(delayed.send('hammer'),false);
});

test('SSE decodes split Unicode and relays only visible text, never reasoning',async t=>{
 const wire='data: '+JSON.stringify({choices:[{delta:{reasoning_content:'private reasoning'}}]})+'\r\n\r\n'+'data: '+JSON.stringify({choices:[{delta:{content:'喵🌟'}}]})+'\r\n\r\n'+'data: '+JSON.stringify({choices:[{delta:{content:'谢谢投喂'}}]})+'\r\n\r\n'+'data: [DONE]\r\n\r\n';
 const bytes=new TextEncoder().encode(wire),chunks=()=>new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=3)c.enqueue(bytes.slice(i,i+3));c.close();}});
 const decoded=[];for await(const item of readSSE(chunks()))decoded.push(item);assert.equal(decoded[1].data.choices[0].delta.content,'喵🌟');assert.equal(decoded.at(-1).data,'[DONE]');
 let sent;const endpoint=await serve(t,()=>({key:'fake',baseURL:'https://example.com/v1',model:'deepseek/deepseek-v4.1-flash-1017'}),async(url,options)=>{sent=JSON.parse(options.body);return new Response(chunks());});
 const progress=[],result=await requestDialogue({character:characters[8],event:{kind:'chocolate'},history:[]},new AbortController().signal,text=>progress.push(text),endpoint+'/api/private-chat');
 assert.equal(sent.stream,true);assert.deepEqual(progress,['喵🌟','喵🌟谢谢投喂']);assert.equal(result.reply,'喵🌟谢谢投喂');assert.ok(!JSON.stringify(progress).includes('reasoning'));
 const game=buildGameMessages({character:profile(),event:{kind:'pop'}});assert.match(game[0].content,/30秒/);assert.match(game.at(-1).content,/冒头|抬头/);assert.ok(!game[0].content.includes('私聊不限时'));
});

test('typewriter shows successive Unicode characters and bubble stays inside the scene',async()=>{
 const writes=[];await new Promise(resolve=>{const writer=createTypewriter(text=>writes.push(text),{delay:1});writer.set('喵🌟');writer.finish('喵🌟好',resolve);});assert.deepEqual(writes,['喵','喵🌟','喵🌟好']);
 for(const anchorY of [-40,10,75,380])for(const anchorX of [-20,195,430]){
  const box=bubblePosition({anchorX,anchorY,width:390,height:382,bubbleWidth:270,bubbleHeight:125});assert.ok(box.x>=0);assert.ok(box.x+270<=390);assert.ok(box.y>=8);assert.ok(box.y+125<=374);
 }
});

test('a game hit cancels the pop dialogue and stale streamed words cannot overwrite it',async()=>{
 const requests=[],written=[],done=[];let finish;
 const completed=new Promise(resolve=>finish=resolve),actor={c:profile()};
 const dialogue=createGameDialogue({request:(body,signal,onChunk)=>new Promise(resolve=>requests.push({body,signal,onChunk,resolve})),onText:(a,text,source)=>written.push({text,source}),onDone:(a,kind)=>{done.push(kind);finish();}});
 dialogue.start(actor,'pop');dialogue.start(actor,'hammer');assert.equal(requests[0].signal.aborted,true);
 requests[0].onChunk('过期台词');requests[0].resolve({reply:'过期台词'});
 requests[1].onChunk('哎哟');requests[1].resolve({reply:'哎哟'});await completed;
 assert.ok(!written.some(item=>item.text.includes('过期')));assert.equal(written.at(-1).text,'哎哟');assert.deepEqual(done,['hammer']);assert.equal(actor.aiPending,false);dialogue.reset();
});

test('game pop prefetch stays offscreen and is reused when that actor appears',async()=>{
 const calls=[],words=[];let finish;const completed=new Promise(resolve=>finish=resolve),actor={c:profile()};
 const dialogue=createGameDialogue({request:(body,signal,onChunk)=>new Promise(resolve=>calls.push({body,signal,onChunk,resolve})),onText:(a,text)=>words.push(text),onDone:()=>finish()});
 dialogue.prefetch(actor);calls[0].onChunk('来啦');assert.equal(words.length,0);calls[0].resolve({reply:'来啦'});
 dialogue.start(actor,'pop');await completed;assert.equal(calls.length,1);assert.equal(words.at(-1),'来啦');dialogue.reset();
 dialogue.prefetch(actor);const stale=calls.at(-1);actor.c.bio='新修改的性格';dialogue.start(actor,'pop');assert.equal(stale.signal.aborted,true);assert.equal(calls.at(-1).body.character.bio,actor.c.bio);dialogue.reset();
});

async function serve(t,getConfig,fetchImpl){
 const middleware=createPrivateChatMiddleware({getConfig,fetchImpl});
 const server=createServer((req,res)=>middleware(req,res,()=>{res.statusCode=404;res.end();}));server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());return `http://127.0.0.1:${server.address().port}`;
}
test('local API keeps keys server-side and handles missing keys/provider failures',async t=>{
 const missing=await serve(t,()=>({}));const status=await fetch(missing+'/api/ai/status').then(r=>r.json());assert.deepEqual(status,{configured:false});assert.equal((await fetch(missing+'/api/private-chat',{method:'POST'})).status,503);
 let sent;const config={key:'test-secret-not-a-real-key',baseURL:'https://example.com/v1',model:'deepseek/deepseek-v4.1-flash-1017'};
 const endpoint=await serve(t,()=>config,async(url,options)=>{sent={url,options};return {ok:true,json:async()=>({choices:[{message:{content:'你的工单优先安排！'}}]})};});
 const request={character:profile(),event:{kind:'hammer'},history:[]};
 const response=await fetch(endpoint+'/api/private-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});const output=await response.json();assert.equal(output.reply,'你的工单优先安排！');assert.equal(sent.options.headers.Authorization,'Bearer '+config.key);assert.equal(sent.url,'https://example.com/v1/chat/completions');assert.ok(!JSON.stringify(output).includes(config.key));assert.match(JSON.parse(sent.options.body).messages.at(-1).content,/敲/);
 assert.equal((await fetch(endpoint+'/api/private-chat',{method:'POST',headers:{Origin:'https://unrelated.example'},body:JSON.stringify(request)})).status,403);
 assert.deepEqual(JSON.parse(sent.options.body).thinking,{type:'disabled'});
 const failed=await serve(t,()=>config,async()=>{throw Error(config.key);});const failure=await fetch(failed+'/api/private-chat',{method:'POST',body:JSON.stringify(request)}).then(r=>r.json());assert.deepEqual(failure,{code:'AI_UNAVAILABLE'});
});

test('rapid tool actions remain accepted while AI is busy, with a bounded feedback queue',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve),calls=[];
 const session=createPrivateChatSession({character:profile(),request:async body=>{calls.push(body);await gate;return {reply:'收到'};}});
 session.send('greet');await Promise.resolve();
 for(let i=0;i<80;i++)assert.equal(session.send(i%2?'hammer':'chocolate'),true);
 assert.ok(session.pending<=9);assert.equal(calls.length,1);
 release();await session.idle();assert.ok(calls.length<=9);assert.equal(session.pending,0);
});

test('rapid round feedback generates only the latest line and reset cancels deferred requests',async()=>{
 const calls=[],actor={c:profile()};
 const dialogue=createGameDialogue({request:async body=>{calls.push(body);return {reply:'OK'};},onText(){}});
 for(let i=0;i<20;i++)dialogue.queue(actor,i===19?'chocolate':'hammer');
 await new Promise(resolve=>setTimeout(resolve,300));
 assert.equal(calls.length,1);assert.equal(calls[0].event.kind,'chocolate');
 dialogue.queue(actor,'hammer');dialogue.reset();await new Promise(resolve=>setTimeout(resolve,300));assert.equal(calls.length,1);
});

test('repeated actions do not abort an in-flight reply or starve dialogue during continuous taps',async()=>{
 const calls=[],words=[],actor={c:profile()};
 const dialogue=createGameDialogue({readingDelay:0,request:(body,signal,onChunk)=>new Promise(resolve=>calls.push({body,signal,onChunk,resolve})),onText:(_,text)=>words.push(text)});
 dialogue.queue(actor,'hammer');await new Promise(resolve=>setTimeout(resolve,280));
 assert.equal(calls.length,1);
 for(let i=0;i<30;i++)dialogue.queue(actor,i===29?'chocolate':'hammer');
 assert.equal(calls[0].signal.aborted,false);assert.equal(calls.length,1);
 calls[0].onChunk('好');calls[0].resolve({reply:'好'});
 await new Promise(resolve=>setTimeout(resolve,340));
 assert.ok(words.includes('好'));assert.equal(calls.length,2);assert.equal(calls[1].body.event.kind,'chocolate');
 dialogue.reset();assert.equal(calls[1].signal.aborted,true);
});

test('reset cancels a pending action even while the previous reply is being typed',async()=>{
 const calls=[],actor={c:profile()};
 const dialogue=createGameDialogue({request:(body,signal)=>new Promise(resolve=>calls.push({body,signal,resolve})),onText(){}});
 dialogue.start(actor,'hammer');dialogue.queue(actor,'chocolate');
 calls[0].resolve({reply:'这是一句需要时间打完的台词'});await Promise.resolve();dialogue.reset();
 await new Promise(resolve=>setTimeout(resolve,300));assert.equal(calls.length,1);assert.equal(actor.aiPending,false);
});
