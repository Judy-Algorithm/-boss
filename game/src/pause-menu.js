import './pause-menu.css';
import {installMusicSettings} from './music-settings.js';

export function installPauseMenu({pauseGame,resumeGame,sound,onMuteChange}){
 const $=id=>document.getElementById(id),pause=$('pause-modal'),card=pause.querySelector('.pause-card');
 const instructions=document.createElement('section');
 instructions.id='instructions-modal';instructions.className='modal';instructions.hidden=true;
 instructions.setAttribute('role','dialog');instructions.setAttribute('aria-modal','true');instructions.setAttribute('aria-label','游戏说明');
 instructions.innerHTML=`<div class="guide-card instructions-card"><div class="guide-heading"><h2>游戏说明</h2><button id="close-instructions" class="icon-button" aria-label="关闭游戏说明">×</button></div>
 <h3>正式游戏</h3>
 <p>点「摸鱼」，倒计时后进入 30 秒挑战。<br>人物冒头时，直接点「投喂」或「敲击」。</p>
 <div class="relation-rules"><span><b>正数 ＋</b>投喂</span><span><b>负数 －</b>敲击</span><span><b>中立 0</b>两种都行</span></div>
 <p><b>选对加分，选错扣同样的分。</b><br>分数＝亲疏值去掉正负号 × 10。<br>亲疏值为 0，两种都加 5 分。</p>
 <p>亲疏值可在人物图鉴修改，按当前值计分。30 秒后结算总分。</p>
 <h3>私聊</h3>
 <p>首页点「私聊」，再选一位角色。<br>可以打字聊天，也可以投喂或敲击。<br>不限时、不计分，点左上角返回首页。</p>
 </div>`;
 $('app').append(instructions);
 const help=document.createElement('button');help.id='menu-instructions';help.textContent='游戏说明';card.append(help);$('menu-credits')?.remove();
 const status=document.createElement('p');status.id='menu-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');card.append(status);
 const sheets=[$('guide-modal'),$('credits-modal'),instructions];let returnToMenu=false,lastButton=$('resume');
 const musicSettings=installMusicSettings({sheet:$('credits-modal'),sound,onClose:()=>closeSheet($('credits-modal')),onSoundChange:onMuteChange});
 const buttons=[...card.querySelectorAll('button')];
 function highlight(button){lastButton=button;for(const b of buttons){b.classList.toggle('menu-selected',b===button);if(b===button)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');}$('resume').classList.toggle('primary',button===$('resume'));}
 function syncSound(){$('menu-mute').textContent='音乐设置';$('menu-mute').removeAttribute('aria-pressed');onMuteChange?.(sound.muted);}
 function openSheet(sheet,fromMenu,button){returnToMenu=fromMenu;if(button)highlight(button);for(const s of sheets)s.hidden=true;pause.hidden=true;sheet.hidden=false;if(sheet===$('credits-modal'))musicSettings.open();sheet.querySelector('button')?.focus({preventScroll:true});}
 function closeSheet(sheet){if(sheet===$('credits-modal'))musicSettings.close();sheet.hidden=true;if(returnToMenu){pause.hidden=false;lastButton.focus({preventScroll:true});}returnToMenu=false;}
 $('pause').onclick=()=>{for(const s of sheets)s.hidden=true;returnToMenu=false;status.textContent='';highlight($('resume'));syncSound();pauseGame();};
 $('resume').onclick=()=>{highlight($('resume'));for(const s of sheets)s.hidden=true;returnToMenu=false;resumeGame();};
 $('menu-mute').onclick=()=>openSheet($('credits-modal'),true,$('menu-mute'));
 for(const [button,sheet,close] of [[$('menu-guide'),$('guide-modal'),$('close-guide')],[help,instructions,$('close-instructions')]]){
  button.onclick=()=>{sound.effect('tick');openSheet(sheet,true,button);};close.onclick=()=>closeSheet(sheet);
 }
 $('guide').onclick=()=>openSheet($('guide-modal'),false);
 $('credits').onclick=()=>openSheet($('credits-modal'),false);$('close-credits').onclick=()=>closeSheet($('credits-modal'));
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const sheet=sheets.find(s=>!s.hidden);if(sheet){e.preventDefault();e.stopImmediatePropagation();closeSheet(sheet);}},true);
 syncSound();highlight($('resume'));
 return {openGuide:()=>openSheet($('guide-modal'),false),openInstructions:()=>openSheet(instructions,false),openMusic:()=>openSheet($('credits-modal'),false)};
}
