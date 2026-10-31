import {MUSIC_TRACKS,MUSIC_SETTINGS_KEY,normalizeMusicSettings,nextMusicId} from './music-library.js';
function defaultStorage(){try{return globalThis.localStorage;}catch{return null;}}
// Local playback only. Only the selected track is loaded, never the whole playlist.
export class Sound {
 constructor({storage=defaultStorage(),createAudio=src=>new Audio(src),random=Math.random}={}){
  this.ctx=null;this.storage=storage;this.random=random;this.listeners=new Set();this.playing=false;this.previewing=false;this.error='';let saved={};
  try{const raw=storage?.getItem(MUSIC_SETTINGS_KEY);saved=raw?JSON.parse(raw):storage?.getItem('shushu-muted')==='1'?{musicEnabled:false,effectsEnabled:false}:{};}catch{}
  this.settings=normalizeMusicSettings(saved||{});this.music=createAudio(this.track.url);this.music.loop=true;this.music.preload='none';this.syncVolumes();
  for(const event of ['playing','pause'])this.music.addEventListener(event,()=>this.notify());
  this.music.addEventListener('error',()=>{this.error='这首暂时没能播放，试试另一首。';this.notify();});
  globalThis.document?.addEventListener('pointerdown',()=>this.unlock(),{passive:true});
 }
 get track(){return MUSIC_TRACKS.find(t=>t.id===this.settings.trackId);}
 get muted(){return !this.settings.musicEnabled&&!this.settings.effectsEnabled;}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 notify(){for(const fn of this.listeners)fn();}
 save(){try{this.storage?.setItem(MUSIC_SETTINGS_KEY,JSON.stringify(this.settings));this.storage?.setItem('shushu-muted',this.muted?'1':'0');}catch{}this.notify();}
 syncVolumes(){this.music.volume=this.settings.musicEnabled?this.settings.volume:0;if(this.master)this.master.gain.setTargetAtTime(this.settings.effectsEnabled ? .42 : 0,this.ctx.currentTime,.04);}
 playMusic(){if(!this.settings.musicEnabled)return;this.error='';const pending=this.music.play();pending?.catch(e=>{if(e.name!=='AbortError'){this.error=e.name==='NotAllowedError'?'轻点曲目即可开始试听。':'这首暂时没能播放，试试另一首。';this.notify();}});}
 unlock(){if(!this.ctx){const C=globalThis.window?.AudioContext||globalThis.window?.webkitAudioContext;if(C){this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=this.settings.effectsEnabled ? .42 : 0;this.master.connect(this.ctx.destination)}}if(this.ctx?.state==='suspended')this.ctx.resume().catch(()=>{});if((this.playing||this.previewing)&&this.music.paused)this.playMusic();}
 toggle(){const enabled=this.muted;this.settings.musicEnabled=enabled;this.settings.effectsEnabled=enabled;this.syncVolumes();if(enabled&&(this.playing||this.previewing))this.playMusic();else if(!enabled)this.music.pause();this.save();return this.muted;}
 setMusicEnabled(enabled){this.settings.musicEnabled=!!enabled;this.syncVolumes();if(enabled&&(this.playing||this.previewing))this.playMusic();else if(!enabled)this.music.pause();this.save();}
 setEffectsEnabled(enabled){this.settings.effectsEnabled=!!enabled;this.syncVolumes();this.save();}
 setVolume(volume){this.settings.volume=normalizeMusicSettings({volume}).volume;this.syncVolumes();this.save();}
 setAutoNext(enabled){this.settings.autoNext=!!enabled;this.save();}
 selectTrack(id,{preview=false,manual=true}={}){
  const track=MUSIC_TRACKS.find(t=>t.id===id);if(!track)return false;
  const changed=this.settings.trackId!==id;if(changed){this.music.pause();this.settings.trackId=id;this.music.src=track.url;this.error='';}
  if(manual)this.settings.pendingSelection=true;
  if(preview){this.previewing=true;this.settings.musicEnabled=true;this.unlock();}
  this.syncVolumes();if(this.playing||this.previewing)this.playMusic();this.save();return true;
 }
 nextTrack({preview=false}={}){return this.selectTrack(nextMusicId(this.track.id,this.random),{preview});}
 beginSession(){if(this.settings.autoNext&&this.settings.hasPlayed&&!this.settings.pendingSelection)this.selectTrack(nextMusicId(this.track.id,this.random),{manual:false});this.settings.pendingSelection=false;this.settings.hasPlayed=true;this.save();this.start();}
 endPreview(){this.previewing=false;if(!this.playing)this.music.pause();this.notify();}
 tone(freq,duration=.1,type='sine',volume=.25,delay=0,endFreq=null){if(!this.ctx||!this.settings.effectsEnabled)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(endFreq)o.frequency.exponentialRampToValueAtTime(endFreq,t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02)}
 noise(duration=.1,volume=.12){if(!this.ctx||!this.settings.effectsEnabled)return;const count=Math.floor(this.ctx.sampleRate*duration),buffer=this.ctx.createBuffer(1,count,this.ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<count;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/count*6);const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();src.buffer=buffer;filter.type='lowpass';filter.frequency.value=900;gain.gain.value=volume;src.connect(filter);filter.connect(gain);gain.connect(this.master);src.start()}
 effect(name){if(name==='hammer'){this.tone(180,.13,'sine',.65,0,52);this.tone(780,.1,'triangle',.13,.035,240);this.noise(.1,.22);return}if(name==='pop'){this.tone(260,.13,'sine',.28,0,610);return}if(name==='chocolate'){this.tone(510,.08,'sine',.2,0,660);this.tone(740,.15,'sine',.22,.075);return}if(name==='wrong'){this.tone(210,.2,'triangle',.25,0,100);return}const seq={combo:[659,784,1047],end:[523,659,784,1047],tick:[660]}[name]||[];seq.forEach((n,i)=>this.tone(n,name==='end'?.3:.08,'sine',.25,i*.07))}
 start(){this.playing=true;this.previewing=false;this.unlock();this.syncVolumes();this.playMusic();}
 stop(){this.playing=false;this.previewing=false;this.music.pause();}
}
