import './home-cover.css';

export function installHomeCover({app,enabled=true,onGuide,onInstructions,onMusic}){
 if(!enabled)return {visible:false,show(){},hide(){}};
 const cover=document.createElement('section');
 cover.id='home-cover';cover.setAttribute('aria-label','摸鱼事务所首页');
 cover.innerHTML=`<div class="cover-stage">
 <img class="cover-art" src="/backgrounds/moyu-office-cover-v2.png" alt="" fetchpriority="high" decoding="async" width="941" height="1672">
 <div class="cover-english-heading" data-no-translate="true" aria-hidden="true">OFFICE<b>ESCAPE</b><small>Tap away stress. Share a little joy.</small></div>
 <div class="cover-english-note" data-no-translate="true" aria-hidden="true">Your coworkers, your rules.<br>Tap, treat, or chat.</div>
 <h1 class="cover-sr-only">摸鱼事务所 · 敲走怨气，喂点快乐。</h1>
 <p class="cover-sr-only">你的同事，你来定义。投喂、敲击，或者聊两句。</p>
 <div class="cover-actions" aria-label="选择玩法"><p class="cover-loading" role="status">办公室准备中…</p></div>
 <nav class="cover-links" aria-label="首页菜单"><button type="button" data-page="guide">人物图鉴</button><button type="button" data-page="instructions">玩法说明</button><button type="button" data-page="music">音乐设置</button></nav></div>`;
 const actions=cover.querySelector('.cover-actions');
 for(const [id,label,description] of [['practice','摸鱼','30秒挑战'],['private-start','聊聊','选择角色私聊']]){
  const button=document.getElementById(id);button.textContent=label;button.setAttribute('aria-label',`${label} · ${description}`);actions.append(button);
 }
 for(const [page,handler] of [['guide',onGuide],['instructions',onInstructions],['music',onMusic]])cover.querySelector(`[data-page="${page}"]`).onclick=handler;
 app.append(cover);
 const underlay=['field','hud','tool-tray','controls','pause'].map(id=>document.getElementById(id));
 function show(){cover.hidden=false;app.classList.add('cover-open');for(const node of underlay)node.inert=true;}
 function hide(){cover.hidden=true;app.classList.remove('cover-open');for(const node of underlay)node.inert=false;}
 show();
 return {show,hide,get visible(){return !cover.hidden;}};
}
