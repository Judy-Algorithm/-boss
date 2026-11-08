import {requestDialogue,createTypewriter} from './ai-stream.js';
import {getLanguage,translate} from './i18n.js';

export function createGameDialogue({onText,onDone,request=requestDialogue,readingDelay=1800}){
 const running=new Map(),histories=new Map(),prepared=new Map(),queued=new Map();
 const profile=c=>({id:c.id,name:c.name,role:c.role,bio:c.bio,relation:c.relation});
 const signature=(character,language)=>JSON.stringify({character,language});
 function cancel(actor){clearTimeout(queued.get(actor)?.timer);queued.delete(actor);const job=running.get(actor);if(job){running.delete(actor);job.controller.abort();job.writer.stop();}actor.aiPending=false;actor.aiReadUntil=0;}
 function flush(actor){
  const pending=queued.get(actor);
  if(!pending||pending.timer!==null||running.has(actor))return;
  pending.timer=setTimeout(()=>{queued.delete(actor);api.start(actor,pending.kind);},Math.max(250,(actor.aiReadUntil||0)-performance.now()));
 }
 const api = {
  queue(actor,kind){
   // Replace the pending action, not a reply already arriving on screen.
   if(running.get(actor)?.kind==='pop')cancel(actor);
   const pending=queued.get(actor);
   if(pending)pending.kind=kind;else queued.set(actor,{kind,timer:null});
   actor.aiPending=true;actor.aiDeadline=Math.max(actor.aiDeadline||0,performance.now()+16000);
   flush(actor);
  },
  prefetch(actor){
   const character=profile(actor.c),language=getLanguage(),key=signature(character,language),old=prepared.get(actor);
   if(old?.signature===key)return;old?.controller.abort();
   const job={signature:key,controller:new AbortController(),partial:'',publish:null};prepared.set(actor,job);
   job.promise=request({character,language,event:{kind:'pop'},history:histories.get(`${character.id}:${language}`)||[]},job.controller.signal,text=>{job.partial=text;job.publish?.(text);},'/api/game-dialogue');job.promise.catch(()=>{});
  },
  start(actor,kind){
   cancel(actor);const language=getLanguage(),cached=kind==='pop'?prepared.get(actor):null,character=profile(actor.c),warm=cached?.signature===signature(character,language)?cached:null;if(cached){prepared.delete(actor);if(!warm)cached.controller.abort();}
   const controller=warm?.controller||new AbortController(),job={controller,writer:null,kind};running.set(actor,job);actor.aiPending=true;actor.aiDeadline=performance.now()+16000;
   const current=()=>running.get(actor)===job;
   job.writer=createTypewriter(text=>{if(current()){actor.aiDeadline=Math.max(actor.aiDeadline,performance.now()+2000);onText(actor,text,'ai');}},{delay:28});onText(actor,'…','pending');
   const c=actor.c,historyKey=`${c.id}:${language}`,history=histories.get(historyKey)||[];const progress=text=>{if(current())job.writer.set(text);};if(warm){warm.publish=progress;if(warm.partial)progress(warm.partial);}
   job.promise=(warm?warm.promise:request({character,language,event:{kind},history},controller.signal,progress,'/api/game-dialogue'))
    .then(({reply})=>{if(!current())return;job.writer.finish(reply,()=>{if(!current())return;histories.set(historyKey,[...history,{role:'user',content:translate(kind==='pop'?'[角色冒头]':kind==='hammer'?'[玩家敲击]':'[玩家投喂]',language)},{role:'assistant',content:reply}].slice(-6));actor.aiPending=queued.has(actor);actor.aiReadUntil=performance.now()+readingDelay;running.delete(actor);onDone?.(actor,kind,'ai');flush(actor);});})
    .catch(error=>{if(!current())return;job.writer.stop();actor.aiPending=queued.has(actor);running.delete(actor);onText(actor,translate(error.code==='AI_NOT_CONFIGURED'?'AI 尚未配置':error.code==='AI_LANGUAGE_MISMATCH'?'AI 回复语言异常，请重试。':error.code==='AI_BUSY'?'AI 正忙，请稍后重试。':error.name==='TimeoutError'?'AI 请求超时，请稍后重试。':'AI 暂未连通',language),'error');actor.aiReadUntil=performance.now()+readingDelay;onDone?.(actor,kind,'error');flush(actor);});
  },
  cancel,
  reset(){for(const actor of [...queued.keys()])cancel(actor);for(const actor of [...running.keys()])cancel(actor);for(const job of prepared.values())job.controller.abort();prepared.clear();histories.clear();}
 };
 return api;
}
