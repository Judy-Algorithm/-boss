import {scoreFor} from './rules.js';
import {getLanguage,translate} from './i18n.js';

export function privateEvent(character,kind,text=''){
 if(!['greet','message','hammer','chocolate'].includes(kind))throw new Error('未知互动');
 return {kind,text:kind==='message'?text.trim().slice(0,300):'',...(kind==='hammer'||kind==='chocolate'?{correct:scoreFor(character.relation,kind)>0}:{})};
}

// One ordered conversation per room. Leaving cancels queued work and stale replies.
export function createPrivateChatSession({character,request,onReply,onStatus,onStart,onChunk}){
 let history=[],tail=Promise.resolve(),pending=0,closed=false,turn=0,queuedTool=null;
 const language=getLanguage();
 const controllers=new Set();
 return {
  send(kind,text=''){
   if(closed)return false;
   const tool=kind==='hammer'||kind==='chocolate';
   const event=privateEvent(character,kind,text);
   if(tool&&queuedTool&&(queuedTool.kind===kind||pending>=8)){Object.assign(queuedTool,event);return true;}
   if(!tool&&pending>=8)return false;
   if(tool)queuedTool=event;if(kind==='message'&&!event.text)return false;
   pending++;onStatus?.('pending',pending);
   tail=tail.then(async()=>{
    if(closed)return;
    if(queuedTool===event)queuedTool=null;
    const profile={id:character.id,name:character.name,role:character.role,bio:character.bio,relation:character.relation};
    const controller=new AbortController();controllers.add(controller);
    let reply,source='local',reason='',partial='';onStart?.(event);
    try{const result=await request({character:profile,event,history:history.slice(-16),language},controller.signal,text=>{if(closed)return;partial=text;onChunk?.({text,event});});reply=result.reply;source='ai';if(typeof reply!=='string'||!reply.trim())throw Error('empty');}
    catch(error){if(closed)return;source='local';reason=error.code==='AI_NOT_CONFIGURED'?'not-configured':error.code==='AI_LANGUAGE_MISMATCH'?'language-mismatch':'unavailable';reply=reason==='language-mismatch'?translate('AI 回复语言异常，请重试。',language):partial||translate(reason==='not-configured'?'AI 尚未配置。':'AI 暂未连通，请稍后重试。',language);}
    finally{controllers.delete(controller);}
    if(closed)return;
    const content=event.kind==='message'?event.text:event.kind==='greet'?'我来找你私聊。':event.kind==='hammer'?'[玩家敲击了你]':character.id==='office_orange_cat'?'[玩家投喂了猫零食]':'[玩家投喂了巧克力]';
    if(source==='ai'){history.push({role:'user',content:kind==='message'?content:translate(content,language)},{role:'assistant',content:reply});history=history.slice(-16);}turn++;
    await onReply?.({reply,source,reason,event});
   }).finally(()=>{pending--;if(!closed)onStatus?.('settled',pending);});
   return true;
  },
  close(){closed=true;for(const c of controllers)c.abort();history=[];},
  idle:()=>tail,
  get pending(){return pending;}
 };
}
