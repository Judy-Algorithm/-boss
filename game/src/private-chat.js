import './private-chat.css';
import {createPrivateChatSession} from './private-chat-session.js';
import {requestDialogue,createTypewriter} from './ai-stream.js';
import {translate} from './i18n.js';

export function installPrivateChat({app,character,onAction,onReply,onBack}){
 const header=document.createElement('header');header.className='private-header';
 const back=document.createElement('button');back.type='button';back.className='private-back';back.textContent='‹';back.setAttribute('aria-label','返回首页');back.onclick=onBack;
 const name=document.createElement('h1');name.textContent=character.name;const sub=document.createElement('small');sub.textContent='私聊 · 不限时';const heading=document.createElement('div');heading.append(name,sub);header.append(back,heading);
 const panel=document.createElement('section');panel.className='private-chat-panel';panel.setAttribute('aria-label','私聊对话');
 const log=document.createElement('div');log.className='private-messages';log.setAttribute('role','log');log.setAttribute('aria-label','聊天记录');log.setAttribute('aria-live','polite');
 const status=document.createElement('p');status.className='private-status';status.setAttribute('role','status');status.textContent='正在检查 AI 连接…';
 const form=document.createElement('form');form.className='private-composer';
 const input=document.createElement('input');input.type='text';input.maxLength=300;input.placeholder='和 TA 说点什么…';input.autocomplete='off';input.setAttribute('aria-label','私聊消息');
 const send=document.createElement('button');send.type='submit';send.textContent='发送';form.append(input,send);panel.append(log,status,form);app.append(header,panel);
 let sourceStatus='正在检查 AI 连接…',writer=null,responseItem=null,currentSource='ai';
 function append(who,text,event=false){const item=document.createElement('p');item.className=`private-message ${who==='user'?'from-player':'from-character'}${event?' is-action':''}`;const label=document.createElement('small');label.textContent=translate(who==='user'?'你':character.name);const content=document.createElement('span');content.textContent=text;item.append(label,content);log.append(item);while(log.children.length>40)log.firstChild.remove();log.scrollTop=log.scrollHeight;return {item,content,label};}
 const session=createPrivateChatSession({character,
  request:requestDialogue,
  onStart(event){currentSource='ai';responseItem=append('assistant','…');writer?.stop();writer=createTypewriter(text=>{responseItem.content.textContent=text;onReply(text,event,{source:currentSource,streaming:true});log.scrollTop=log.scrollHeight;});onReply('…',event,{source:'pending',streaming:true});},
  onChunk({text}){writer?.set(text);},
  onReply({reply,source,reason,event}){currentSource=source==='ai'?'ai':'error';sourceStatus=source==='ai'?'':reason==='not-configured'?'AI 未配置':'AI 暂时未连通';if(source!=='ai')responseItem.label.textContent='提示';return new Promise(resolve=>writer.finish(reply,()=>{onReply(reply,event,{source:currentSource,streaming:false});resolve();}));},
  onStatus(_,pending){status.textContent=pending?`正在回应${pending>1?` · 还有 ${pending} 条`:''}…`:sourceStatus;send.disabled=pending>=8;}
 });
 const leave=()=>{session.close();writer?.stop();};window.addEventListener('pagehide',leave,{once:true});
 fetch('/api/ai/status').then(r=>r.json()).then(data=>{sourceStatus=data.configured?'':'AI 未配置';if(!session.pending)status.textContent=sourceStatus;}).catch(()=>{sourceStatus='AI 暂时未连通';if(!session.pending)status.textContent=sourceStatus;});
 form.onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(!text)return;if(session.send('message',text)){append('user',text);input.value='';}};
 return {
  greet(){session.send('greet');},
  action(kind){if(session.pending>=8){status.textContent='消息有点多，等 TA 回一句再来吧。';return false;}if(!onAction(kind))return false;session.send(kind);append('user',kind==='hammer'?'敲了一下小锤子':character.id==='office_orange_cat'?'投喂了一份猫零食':'送出一份巧克力',true);return true;},
  setActionReady(ready){for(const kind of ['hammer','chocolate'])document.getElementById(kind+'-select').disabled=!ready;},
  refreshCharacter(){name.textContent=character.name;},
  dispose(){leave();window.removeEventListener('pagehide',leave);header.remove();panel.remove();}
 };
}
