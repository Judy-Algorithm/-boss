import './home-cover.css';

export function installHomeCover({app,enabled=true,onGuide,onInstructions,onMusic}){
 if(!enabled)return {visible:false,show(){},hide(){}};
 const cover=document.createElement('section');
 cover.id='home-cover';cover.setAttribute('aria-label','摸鱼事务所首页');
 cover.innerHTML=`<img class="cover-art" src="/backgrounds/moyu-office-cover-v1.jpg" alt="" fetchpriority="high" decoding="async">
 <div class="cover-wash" aria-hidden="true"></div>
 <div class="cover-brand"><h1><span>摸鱼</span><span>事务所</span></h1></div>
 <div class="cover-actions" aria-label="选择玩法"><p class="cover-tagline">敲走怨气，喂点快乐～</p><p class="cover-loading" role="status">办公室准备中…</p></div>
 <nav class="cover-links" aria-label="首页菜单"><button type="button" data-page="guide">人物图鉴</button><i aria-hidden="true">·</i><button type="button" data-page="instructions">玩法说明</button><i aria-hidden="true">·</i><button type="button" data-page="music">音乐设置</button></nav>`;
 const actions=cover.querySelector('.cover-actions');
 for(const [id,label] of [['practice','摸鱼'],['private-start','私聊']]){
  const button=document.getElementById(id);button.textContent=label;actions.append(button);
 }
 for(const [page,handler] of [['guide',onGuide],['instructions',onInstructions],['music',onMusic]])cover.querySelector(`[data-page="${page}"]`).onclick=handler;
 app.append(cover);
 const underlay=['field','hud','tool-tray','controls','pause'].map(id=>document.getElementById(id));
 function show(){cover.hidden=false;app.classList.add('cover-open');for(const node of underlay)node.inert=true;}
 function hide(){cover.hidden=true;app.classList.remove('cover-open');for(const node of underlay)node.inert=false;}
 show();
 return {show,hide,get visible(){return !cover.hidden;}};
}
