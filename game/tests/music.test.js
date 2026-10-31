import test from 'node:test';
import assert from 'node:assert/strict';
import {Sound} from '../src/audio.js';
import {MUSIC_TRACKS,MUSIC_SETTINGS_KEY,normalizeMusicSettings} from '../src/music-library.js';

class FakeAudio extends EventTarget {
 constructor(src){super();this.src=src;this.paused=true;this.currentTime=0;}
 play(){this.paused=false;this.dispatchEvent(new Event('playing'));return Promise.resolve();}
 pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
}
function memoryStorage(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}
const createAudio=src=>new FakeAudio(src);

test('manual selection survives navigation into private chat; the following session changes tracks',()=>{
 const storage=memoryStorage(),sound=new Sound({storage,createAudio,random:()=>0});
 sound.beginSession();assert.equal(sound.track.id,'monkeys-spinning-monkeys');
 sound.stop();sound.selectTrack('sneaky-snitch',{preview:true});assert.equal(sound.music.paused,false);
 sound.endPreview();assert.equal(sound.music.paused,true);
 const room=new Sound({storage,createAudio,random:()=>0});room.beginSession();
 assert.equal(room.track.id,'sneaky-snitch','a manual choice must play for the next session');
 room.music.currentTime=23;room.stop();room.start();
 assert.equal(room.track.id,'sneaky-snitch','pause/resume must not choose another track');assert.equal(room.music.currentTime,23);
 room.stop();room.beginSession();assert.notEqual(room.track.id,'sneaky-snitch');
 const nextRoom=new Sound({storage,createAudio,random:()=>.5});nextRoom.beginSession();assert.notEqual(nextRoom.track.id,room.track.id);
});

test('fixed playback, volume and independent music/effects choices persist',()=>{
 const storage=memoryStorage(),sound=new Sound({storage,createAudio});
 sound.selectTrack('investigations');sound.setAutoNext(false);sound.setVolume(.37);sound.setMusicEnabled(false);
 sound.beginSession();assert.equal(sound.music.paused,true);assert.equal(sound.settings.effectsEnabled,true);
 sound.setMusicEnabled(true);assert.equal(sound.music.paused,false);assert.equal(sound.music.volume,.37);
 sound.setEffectsEnabled(false);sound.stop();
 const next=new Sound({storage,createAudio});next.beginSession();
 assert.equal(next.track.id,'investigations');assert.equal(next.settings.effectsEnabled,false);assert.equal(next.music.volume,.37);
 next.beginSession();assert.equal(next.track.id,'investigations');
});

test('invalid saved preferences and unavailable storage do not break game audio',()=>{
 assert.equal(normalizeMusicSettings({trackId:'missing',volume:9}).volume,1);
 const storage={getItem(){throw new Error('storage disabled');},setItem(){throw new Error('storage disabled');}};
 const sound=new Sound({storage,createAudio});assert.equal(sound.track.id,MUSIC_TRACKS[0].id);
 assert.doesNotThrow(()=>{sound.beginSession();sound.setVolume(.2);sound.nextTrack();sound.stop();});
 assert.equal(sound.selectTrack('missing'),false);
 const corrupted=memoryStorage();corrupted.setItem(MUSIC_SETTINGS_KEY,'{');
 assert.equal(new Sound({storage:corrupted,createAudio}).track.id,MUSIC_TRACKS[0].id);
});

test('legacy mute is preserved and previewing only enables background music',()=>{
 const storage=memoryStorage();storage.setItem('shushu-muted','1');
 const sound=new Sound({storage,createAudio});assert.equal(sound.muted,true);
 sound.beginSession();assert.equal(sound.music.paused,true);
 sound.selectTrack('carefree',{preview:true});assert.equal(sound.music.paused,false);
 assert.equal(sound.settings.effectsEnabled,false);assert.equal(sound.settings.musicEnabled,true);
 sound.stop();assert.equal(sound.music.paused,true);
});
