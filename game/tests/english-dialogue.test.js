import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {characters} from '../src/characters.js';
import {setLanguage,translate} from '../src/i18n.js';
import {createPrivateChatMiddleware,buildPrivateMessages,buildGameMessages} from '../server/private-chat-api.js';
import {createGameDialogue} from '../src/game-dialogue.js';
import {createPrivateChatSession} from '../src/private-chat-session.js';
import {requestDialogue} from '../src/ai-stream.js';

const body={character:characters[0],event:{kind:'hammer'},history:[],language:'en'};
const config={key:'test-only',model:'test-model',baseURL:'https://provider.example/v1'};
async function serve(t,fetchImpl){
 const middleware=createPrivateChatMiddleware({getConfig:()=>config,fetchImpl});
 const server=createServer((req,res)=>middleware(req,res,()=>{res.statusCode=404;res.end();}));
 server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());
 return `http://127.0.0.1:${server.address().port}`;
}
function upstream(text,stream){
 return stream?new Response([...text].map(character=>'data: '+JSON.stringify({choices:[{delta:{content:character}}]})+'\n\n').join('')+'data: [DONE]\n\n')
  :Response.json({choices:[{message:{content:text}}]});
}
test('English prompts and stock profiles contain no contradictory Chinese instruction',()=>{
 for(const build of [buildPrivateMessages,buildGameMessages])for(const kind of ['greet','pop','message','hammer','chocolate']){
  const messages=build({...body,event:{kind,text:'今天好累'}});
  assert.match(messages[0].content,/Reply only in natural English/);
  assert.doesNotMatch(messages[0].content,/\p{Script=Han}/u);
  if(kind!=='message')assert.doesNotMatch(messages.at(-1).content,/\p{Script=Han}/u);
 }
});
test('English JSON and SSE retry a Chinese reply before exposing any of it',async t=>{
 for(const stream of [false,true]){
  const calls=[],url=await serve(t,async(_,options)=>{
   const payload=JSON.parse(options.body);calls.push(payload);
   return upstream(calls.length===1?'Okay，马上下班！':'Okay! Clocking out now!',payload.stream);
  });
  const progress=[];
  const result=stream?await requestDialogue(body,new AbortController().signal,text=>progress.push(text),url+'/api/game-dialogue')
   :await fetch(url+'/api/game-dialogue',{method:'POST',body:JSON.stringify(body)}).then(r=>r.json());
  assert.equal(result.reply,'Okay! Clocking out now!');assert.equal(calls.length,2);
  assert.doesNotMatch(JSON.stringify(progress),/\p{Script=Han}/u);
  assert.match(calls[1].messages[0].content,/Regenerate entirely in English/);
 }
});
test('two wrong-language replies become a localized error and never enter chat history',async t=>{
 let count=0;const url=await serve(t,async(_,options)=>{count++;return upstream('还是中文',JSON.parse(options.body).stream);});
 const progress=[];
 await assert.rejects(requestDialogue(body,new AbortController().signal,text=>progress.push(text),url+'/api/private-chat'),{code:'AI_LANGUAGE_MISMATCH'});
 assert.equal(count,2);assert.deepEqual(progress,[]);
 setLanguage('en');t.after(()=>setLanguage('zh'));
 const replies=[],calls=[];
 const session=createPrivateChatSession({character:characters[0],request:async payload=>{calls.push(payload);throw Object.assign(Error('language'),{code:'AI_LANGUAGE_MISMATCH'});},onReply:r=>replies.push(r)});
 session.send('hammer');session.send('chocolate');await session.idle();
 assert.equal(calls[0].language,'en');assert.deepEqual(calls[1].history,[]);
 assert.equal(replies[0].source,'local');assert.doesNotMatch(replies[0].reply,/\p{Script=Han}/u);
 assert.equal(translate('正在回应 · 还有 2 条…'),'Replying · 2 more queued…');
});
test('changing language invalidates preloaded pop dialogue and isolates conversation history',async t=>{
 setLanguage('zh');t.after(()=>setLanguage('zh'));
 const calls=[],words=[],actor={c:characters[0]};let done;
 const dialogue=createGameDialogue({request:(body,signal)=>new Promise(resolve=>calls.push({body,signal,resolve})),onText:(_,text)=>words.push(text),onDone:()=>done?.()});
 dialogue.prefetch(actor);calls[0].resolve({reply:'中文缓存'});
 setLanguage('en');const completed=new Promise(resolve=>done=resolve);dialogue.start(actor,'pop');
 assert.equal(calls[0].signal.aborted,true);assert.equal(calls[1].body.language,'en');assert.deepEqual(calls[1].body.history,[]);
 calls[1].resolve({reply:'Hi!'});await completed;assert.ok(!words.some(text=>/\p{Script=Han}/u.test(text)));
 setLanguage('zh');dialogue.prefetch(actor);assert.deepEqual(calls[2].body.history,[]);dialogue.reset();
});
test('English chat keeps the player\'s original message while localizing tool history',async t=>{
 setLanguage('en');t.after(()=>setLanguage('zh'));
 const calls=[],session=createPrivateChatSession({character:characters[0],request:async payload=>{calls.push(payload);return {reply:'Take a break!'};}});
 session.send('message','摸鱼');session.send('hammer');session.send('chocolate');await session.idle();
 assert.equal(calls[1].history[0].content,'摸鱼');
 assert.equal(calls[2].history[2].content,'[The player gave you a playful tap]');
 assert.equal(calls[2].language,'en');
});
