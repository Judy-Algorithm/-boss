import './music-settings.css';
import {MUSIC_TRACKS} from './music-library.js';

export function installMusicSettings({sheet,sound,onClose,onSoundChange}){
 sheet.setAttribute('aria-label','音乐设置');
 sheet.innerHTML=`<div class="guide-card music-card"><div class="guide-heading"><h2>办公室电台</h2><button id="close-credits" class="icon-button" aria-label="关闭音乐设置">×</button></div>
 <div class="music-switches"><label><span>背景音乐</span><input id="music-enabled" type="checkbox"></label><label><span>游戏音效</span><input id="effects-enabled" type="checkbox"></label></div>
 <label class="music-volume" for="music-volume"><span>音乐音量</span><output id="music-volume-value"></output><input id="music-volume" type="range" min="0" max="100" step="1"></label>
 <label class="music-auto"><input id="music-auto-next" type="checkbox"><span>新一局 / 进入私聊时自动换一首</span></label>
 <p id="music-now" class="music-now" role="status" aria-live="polite"></p>
 <p class="music-list-heading">${MUSIC_TRACKS.length} 首配乐<span>下滑选择</span></p>
 <div class="music-list" aria-label="选择背景音乐">${MUSIC_TRACKS.map(t=>`<button type="button" class="music-track" data-track="${t.id}" aria-label="试听并选择 ${t.title}" aria-pressed="false"><span class="music-track-text"><strong>${t.label}</strong><span>${t.title}</span><small>${t.mood}</small></span><span class="music-track-mark" aria-hidden="true">▷</span></button>`).join('')}</div>
 </div>`;
 const $=id=>sheet.querySelector('#'+id),rows=[...sheet.querySelectorAll('[data-track]')];
 function sync(){
  const s=sound.settings,active=!sound.music.paused&&s.musicEnabled;
  $('music-enabled').checked=s.musicEnabled;$('effects-enabled').checked=s.effectsEnabled;
  $('music-auto-next').checked=s.autoNext;$('music-volume').value=Math.round(s.volume*100);$('music-volume-value').value=Math.round(s.volume*100)+'%';
  $('music-now').textContent=sound.error||(s.musicEnabled?`${active?'正在播放':'已选择'} · ${sound.track.title}`:'背景音乐已关闭');
  for(const row of rows){const selected=row.dataset.track===s.trackId;row.setAttribute('aria-pressed',String(selected));row.querySelector('.music-track-mark').textContent=selected?(active?'♫':'✓'):'▷';}
  onSoundChange?.(sound.muted);
 }
 for(const row of rows)row.onclick=()=>sound.selectTrack(row.dataset.track,{preview:true});
 $('music-enabled').onchange=e=>{sound.setMusicEnabled(e.target.checked);if(e.target.checked)sound.selectTrack(sound.track.id,{preview:true});};
 $('effects-enabled').onchange=e=>{sound.unlock();sound.setEffectsEnabled(e.target.checked);if(e.target.checked)sound.effect('tick');};
 $('music-volume').oninput=e=>sound.setVolume(Number(e.target.value)/100);
 $('music-auto-next').onchange=e=>sound.setAutoNext(e.target.checked);
 $('close-credits').onclick=onClose;
 sound.subscribe(sync);sync();
 return {open:()=>{sheet.querySelector('.music-card').scrollTop=0;sync();},close:()=>sound.endPreview()};
}
