import {achievementBand} from './achievements.js';
export const ROUND_SECONDS=30;
export const State=Object.freeze({Hidden:'Hidden',PopUp:'PopUp',Active:'Active',React:'React',Retreat:'Retreat'});
export function canInteract(state){return state===State.Active||state===State.React}
export function scoreFor(relation,kind){return relation===0?5:10*relation*(kind==='hammer'?-1:1)}
export function capacity(elapsed){return elapsed<10?1:elapsed<20?2:3}
export function classifyGesture(dx,dy,ms,maxDistance=Math.hypot(dx,dy)){
 if(ms>850||ms<0)return null;
 if(dy<=-28 && -dy>Math.abs(dx)*1.25 && ms<=700)return 'chocolate';
 if(Math.hypot(dx,dy)<=14 && maxDistance<=18 && ms<=450)return 'hammer';
 return null;
}
export function titleFor(score){return achievementBand(score).titles[0]}
export function hitFeedback(c,kind,correct){
 const original=c.defaultRelation??c.relation;
 if(Math.sign(original)!==Math.sign(c.relation)){
  if(correct)return kind==='chocolate'?'谢谢投喂，元气满满！':'哎哟，收到提醒了！';
  return kind==='hammer'?'轻点！我是你这边的呀！':'这份礼物不太对哦！';
 }
 if(c.relation===0)return kind==='hammer'?'这也算入职培训吗？！':c.correct;
 return correct?c.correct:c.wrong;
}

export function canStartNext(states,now,nextAt,flights=0){return now>=nextAt&&flights===0&&states.every(s=>s===State.Hidden)}
