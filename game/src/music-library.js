const source=isrc=>`https://incompetech.com/music/royalty-free/index.html?isrc=${isrc}`;
export const MUSIC_TRACKS=[
 {id:'monkeys-spinning-monkeys',title:'Monkeys Spinning Monkeys',label:'摸鱼进行曲',mood:'轻巧俏皮 · 原来的配方',isrc:'USUAN1400011'},
 {id:'sneaky-snitch',title:'Sneaky Snitch',label:'偷偷摸鱼',mood:'蹑手蹑脚 · 老板来了',isrc:'USUAN1100772'},
 {id:'fluffing-a-duck',title:'Fluffing a Duck',label:'办公室发疯',mood:'滑稽跳跃 · 快乐敲击',isrc:'USUAN1100768'},
 {id:'investigations',title:'Investigations',label:'老板巡逻',mood:'搞怪侦探 · 小心被抓',isrc:'USUAN1100646'},
 {id:'marty-gots-a-plan',title:'Marty Gots a Plan',label:'摸鱼小算盘',mood:'古灵精怪 · 悄悄计划',isrc:'USUAN1500015'},
 {id:'carefree',title:'Carefree',label:'快乐下班',mood:'明亮轻快 · 放松聊聊天',isrc:'USUAN1400037'}
].map(track=>Object.freeze({...track,url:`/audio/${track.id}.mp3`,source:source(track.isrc),author:'Kevin MacLeod',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/'}));
export const MUSIC_SETTINGS_KEY='shushu-music-v1';
export function normalizeMusicSettings(input={}){
 return {trackId:MUSIC_TRACKS.some(t=>t.id===input.trackId)?input.trackId:MUSIC_TRACKS[0].id,
 volume:Number.isFinite(input.volume)?Math.max(0,Math.min(1,input.volume)):.19,
 autoNext:input.autoNext!==false,musicEnabled:input.musicEnabled!==false,effectsEnabled:input.effectsEnabled!==false,
 hasPlayed:input.hasPlayed===true,pendingSelection:input.pendingSelection===true};
}
export function nextMusicId(current,random=Math.random){
 const choices=MUSIC_TRACKS.filter(t=>t.id!==current);
 return choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))].id;
}
