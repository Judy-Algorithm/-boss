export const ACHIEVEMENT_BANDS=[
 {id:'negative-legend',min:-Infinity,max:-300,label:'≤−300 分',titles:['快乐重启大师','反向操作传说','工位彩蛋收藏家','办公室喜剧担当','下局翻盘预备役']},
 {id:'negative-master',min:-299,max:-200,label:'−299～−200 分',titles:['乌龙气氛组长','反向冲刺选手','工位惊喜制造家','办公室梗王','下班回血队长']},
 {id:'negative-expert',min:-199,max:-150,label:'−199～−150 分',titles:['工位探险家','乌龙补给队长','快乐试错高手','办公室绕路达人','摸鱼回炉高手']},
 {id:'negative-skilled',min:-149,max:-100,label:'−149～−100 分',titles:['道具认亲学员','工位迷路达人','乌龙练习生','反向默契选手','快乐调试员']},
 {id:'negative-clever',min:-99,max:-50,label:'−99～−50 分',titles:['手滑小能手','工位小迷糊','乌龙小机灵','道具探索员','快乐缓冲员']},
 {id:'negative-starter',min:-49,max:-1,label:'−49～−1 分',titles:['偶尔手滑选手','摸鱼热身员','工位试水员','快乐试错员','下局找回手感']},
 {id:'zero',min:0,max:0,label:'0 分',titles:['收支平衡大师','工位归零选手','快乐起跑员','摸鱼蓄力员','下班充电员']},
 {id:'starter',min:1,max:49,label:'1～49 分',titles:['工位观察员','茶水间侦察兵','键盘热身员','摸鱼练习生','快乐打卡员']},
 {id:'clever',min:50,max:99,label:'50～99 分',titles:['职场小机灵','工位潜伏者','摸鱼小能手','下班预备役','办公室机智星']},
 {id:'skilled',min:100,max:149,label:'100～149 分',titles:['摸鱼熟练工','工位节奏达人','快乐派送员','反卷小先锋','下班行动派']},
 {id:'expert',min:150,max:199,label:'150～199 分',titles:['摸鱼高手','办公室外交官','加班拆招王','工位气氛组长','快乐补给队长']},
 {id:'master',min:200,max:299,label:'200～299 分',titles:['准点下班王','加班终结者','工位节奏大师','摸鱼领航员','反卷带头人']},
 {id:'legend',min:300,max:Infinity,label:'≥300 分',titles:['办公室传说','反卷大宗师','摸鱼满级玩家','全司快乐担当','下班之光']}
];
export const ACHIEVEMENT_STORAGE_KEY='shushu.achievements.v1';
export function achievementBand(score){if(!Number.isFinite(score))throw Error('分数无效');return ACHIEVEMENT_BANDS.find(b=>score>=b.min&&score<=b.max);}
export function createAchievementPicker(storage,random=Math.random){
 let saved={};try{const value=JSON.parse(storage?.getItem(ACHIEVEMENT_STORAGE_KEY)||'null');if(value?.version===1)saved=value.bands||{};}catch{}
 return {pick(score){
  const band=achievementBand(score),old=saved[band.id]||{};
  let bag=Array.isArray(old.bag)?[...new Set(old.bag.filter(t=>band.titles.includes(t)))]:[];
  if(!bag.length){bag=[...band.titles];for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.max(0,Math.min(.999999,random()))*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag.at(-1)===old.last)[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];}
  const title=bag.pop();saved[band.id]={bag,last:title};try{storage?.setItem(ACHIEVEMENT_STORAGE_KEY,JSON.stringify({version:1,bands:saved}));}catch{}
  return {title,bandId:band.id,range:band.label};
 }};
}

export function roundSummary(stats){
 const summary={score:stats.score,attempts:stats.attempts,correct:stats.correct,wrong:stats.attempts-stats.correct,maxCombo:stats.maxCombo,misses:stats.misses,hammer:{total:stats.hammer||0,correct:stats.correctHammer||0},chocolate:{total:stats.chocolate||0,correct:stats.correctChocolate||0}};
 summary.accuracy=summary.attempts?Math.round(summary.correct/summary.attempts*100):0;
 summary.recentActions=(stats.roundActions||stats.events||[]).filter(e=>e.event==='interaction').slice(-8).map(e=>({name:e.name||e.id,kind:e.kind,correct:e.correct,delta:e.delta}));
 return summary;
}
