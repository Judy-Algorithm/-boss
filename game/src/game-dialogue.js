import {requestDialogue,createTypewriter} from './ai-stream.js';

export function createGameDialogue({onText,onDone,request=requestDialogue}){
 const running=new Map(),histories=new Map(),prepared=new Map();
 const profile=c=>({id:c.id,name:c.name,role:c.role,bio:c.bio,relation:c.relation});
 function cancel(actor){const job=running.get(actor);if(job){running.delete(actor);job.controller.abort();job.writer.stop();}actor.aiPending=false;actor.aiReadUntil=0;}
 return {
  prefetch(actor){
   const character=profile(actor.c),signature=JSON.stringify(character),old=prepared.get(actor);
   if(old?.signature===signature)return;old?.controller.abort();
   const job={signature,controller:new AbortController(),partial:'',publish:null};prepared.set(actor,job);
   job.promise=request({character,event:{kind:'pop'},history:histories.get(character.id)||[]},job.controller.signal,text=>{job.partial=text;job.publish?.(text);},'/api/game-dialogue');job.promise.catch(()=>{});
  },
  start(actor,kind){
   cancel(actor);const cached=kind==='pop'?prepared.get(actor):null,character=profile(actor.c),warm=cached?.signature===JSON.stringify(character)?cached:null;if(cached){prepared.delete(actor);if(!warm)cached.controller.abort();}
   const controller=warm?.controller||new AbortController(),job={controller,writer:null};running.set(actor,job);actor.aiPending=true;actor.aiDeadline=performance.now()+6500;
   const current=()=>running.get(actor)===job;
   job.writer=createTypewriter(text=>{if(current())onText(actor,text,'ai');},{delay:28});onText(actor,'…','pending');
   const c=actor.c,history=histories.get(c.id)||[];const progress=text=>{if(current())job.writer.set(text);};if(warm){warm.publish=progress;if(warm.partial)progress(warm.partial);}
   job.promise=(warm?warm.promise:request({character,event:{kind},history},controller.signal,progress,'/api/game-dialogue'))
    .then(({reply})=>{if(!current())return;job.writer.finish(reply,()=>{if(!current())return;histories.set(c.id,[...history,{role:'user',content:kind==='pop'?'[角色冒头]':kind==='hammer'?'[玩家敲击]':'[玩家投喂]'},{role:'assistant',content:reply}].slice(-6));actor.aiPending=false;actor.aiReadUntil=performance.now()+1000;running.delete(actor);onDone?.(actor,kind,'ai');});})
    .catch(error=>{if(!current())return;job.writer.stop();actor.aiPending=false;running.delete(actor);onText(actor,error.code==='AI_NOT_CONFIGURED'?'AI 尚未配置':'AI 暂未连通','error');actor.aiReadUntil=performance.now()+500;onDone?.(actor,kind,'error');});
  },
  cancel,
  reset(){for(const actor of [...running.keys()])cancel(actor);for(const job of prepared.values())job.controller.abort();prepared.clear();histories.clear();}
 };
}
