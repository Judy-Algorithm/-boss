import './home-cover.css';
import {coverLayout} from './cover-layout.js';
import {getLanguage,onLanguageChange} from './i18n.js';

export function installHomeCover({app,enabled=true,onGuide,onInstructions,onMusic}){
 if(!enabled)return {visible:false,show(){},hide(){}};
 const cover=document.createElement('section');
 cover.id='home-cover';cover.setAttribute('aria-label','摸鱼事务所首页');
 cover.innerHTML=`<div class="cover-stage">
 <div class="cover-art-viewport"><img class="cover-art" alt="" fetchpriority="high" decoding="async"></div>
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
 const stage=cover.querySelector('.cover-stage'),art=cover.querySelector('.cover-art');
 const controls=[...actions.querySelectorAll('button'),...cover.querySelectorAll('.cover-links button')];
 function updateArt(){
  const layout=coverLayout(getLanguage()),ratio=layout.width/layout.height;
  stage.style.width=`min(100cqw,${ratio*100}cqh)`;stage.style.height=`min(${100/ratio}cqw,100cqh)`;
  art.src=layout.image;art.width=layout.sourceWidth;art.height=layout.sourceHeight;
  art.style.width=`${layout.sourceWidth/layout.cropWidth*100}%`;
  controls.forEach((button,i)=>{
   const [x,y,w,h]=layout.controls[i];
   Object.assign(button.style,{left:`${x*100}%`,top:`${y*100}%`,width:`${w*100}%`,height:`${h*100}%`});
  });
 }
 onLanguageChange(updateArt);updateArt();
 const underlay=['field','hud','tool-tray','controls','pause'].map(id=>document.getElementById(id));
 function show(){cover.hidden=false;app.classList.add('cover-open');for(const node of underlay)node.inert=true;}
 function hide(){cover.hidden=true;app.classList.remove('cover-open');for(const node of underlay)node.inert=false;}
 show();
 return {show,hide,get visible(){return !cover.hidden;}};
}
