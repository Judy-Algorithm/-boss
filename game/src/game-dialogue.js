import {requestDialogue,createTypewriter} from './ai-stream.js';
import {getLanguage,translate} from './i18n.js';

export function createGameDialogue({onText,onDone,request=requestDialogue}){
 const running=new Map(),histories=new Map(),prepared=new Map(),queued=new Map();
 const profile=c=>({id:c.id,name:c.name,role:c.role,bio:c.bio,relation:c.relation});
 const signature=(character,language)=>JSON.stringify({character,language});
 function cancel(actor){clearTimeout(queued.get(actor));queued.delete(actor);const job=running.get(actor);if(job){running.delete(actor);job.controller.abort();job.writer.stop();}actor.aiPending=false;actor.aiReadUntil=0;}
 const api = {
  queue(actor,kind){cancel(actor);queued.set(actor,setTimeout(()=>{queued.delete(actor);api.start(actor,kind);},250));},
  prefetch(actor){
   const character=profile(actor.c),language=getLanguage(),key=signature(character,language),old=prepared.get(actor);
   if(old?.signature===key)return;old?.controller.abort();
   const job={signature:key,controller:new AbortController(),partial:'',publish:null};prepared.set(actor,job);
   job.promise=request({character,language,event:{kind:'pop'},history:histories.get(`${character.id}:${language}`)||[]},job.controller.signal,text=>{job.partial=text;job.publish?.(text);},'/api/game-dialogue');job.promise.catch(()=>{});
  },
  start(actor,kind){
   cancel(actor);const language=getLanguage(),cached=kind==='pop'?prepared.get(actor):null,character=profile(actor.c),warm=cached?.signature===signature(character,language)?cached:null;if(cached){prepared.delete(actor);if(!warm)cached.controller.abort();}
   const controller=warm?.controller||new AbortController(),job={controller,writer:null};running.set(actor,job);actor.aiPending=true;actor.aiDeadline=performance.now()+6500;
   const current=()=>running.get(actor)===job;
   job.writer=createTypewriter(text=>{if(current())onText(actor,text,'ai');},{delay:28});onText(actor,'…','pending');
   const c=actor.c,historyKey=`${c.id}:${language}`,history=histories.get(historyKey)||[];const progress=text=>{if(current())job.writer.set(text);};if(warm){warm.publish=progress;if(warm.partial)progress(warm.partial);}
   job.promise=(warm?warm.promise:request({character,language,event:{kind},history},controller.signal,progress,'/api/game-dialogue'))
    .then(({reply})=>{if(!current())return;job.writer.finish(reply,()=>{if(!current())return;histories.set(historyKey,[...history,{role:'user',content:translate(kind==='pop'?'[角色冒头]':kind==='hammer'?'[玩家敲击]':'[玩家投喂]',language)},{role:'assistant',content:reply}].slice(-6));actor.aiPending=false;actor.aiReadUntil=performance.now()+1000;running.delete(actor);onDone?.(actor,kind,'ai');});})
    .catch(error=>{if(!current())return;job.writer.stop();actor.aiPending=false;running.delete(actor);onText(actor,translate(error.code==='AI_NOT_CONFIGURED'?'AI 尚未配置':error.code==='AI_LANGUAGE_MISMATCH'?'AI 回复语言异常，请重试。':'AI 暂未连通',language),'error');actor.aiReadUntil=performance.now()+500;onDone?.(actor,kind,'error');});
  },
  cancel,
  reset(){for(const actor of [...queued.keys()])cancel(actor);for(const actor of [...running.keys()])cancel(actor);for(const job of prepared.values())job.controller.abort();prepared.clear();histories.clear();}
 };
 return api;
}
