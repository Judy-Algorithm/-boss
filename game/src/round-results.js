import {createAchievementPicker,roundSummary} from './achievements.js';
import {requestDialogue,createTypewriter} from './ai-stream.js';

const REVIEW_KEY='shushu.round-reviews.v1';
export function createRoundResults({rank,note,storage,request=requestDialogue,random=Math.random,typingDelay=26}){
 const picker=createAchievementPicker(storage,random);let controller=null,writer=null,revision=0,recent=[];
 try{const value=JSON.parse(storage?.getItem(REVIEW_KEY)||'null');if(Array.isArray(value))recent=value.filter(t=>typeof t==='string').slice(-12);}catch{}
 function remember(text){recent=[...recent.filter(t=>t!==text),text].slice(-12);try{storage?.setItem(REVIEW_KEY,JSON.stringify(recent));}catch{}}
 function cancel(){revision++;controller?.abort();controller=null;writer?.stop();writer=null;}
 return {
  cancel,
  show(stats){
   cancel();const token=revision,achievement=picker.pick(stats.score),summary=roundSummary(stats);rank.textContent=achievement.title;rank.title=achievement.range;rank.dataset.band=achievement.bandId;
   note.textContent='正在写你的下班评语…';note.dataset.source='pending';note.setAttribute('aria-busy','true');controller=new AbortController();const signal=controller.signal;
   const resetWriter=()=>{writer?.stop();writer=createTypewriter(text=>{if(token===revision)note.textContent=text;},{delay:typingDelay});};resetWriter();
   const roundId=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${random()}`;
   const run=async()=>{
    try{
     for(let attempt=0;attempt<2;attempt++){
      if(attempt)resetWriter();
      const result=await request({summary,title:achievement.title,previousReplies:recent.slice(-5),roundId:`${roundId}-${attempt}`},signal,text=>{if(token===revision)writer.set(text);},'/api/round-review');
      if(token!==revision)return;const reply=result.reply.trim();
      if(recent.includes(reply)){if(!attempt)continue;throw Error('duplicate');}
      note.dataset.source='ai';writer.finish(reply,()=>{if(token!==revision)return;remember(reply);note.setAttribute('aria-busy','false');});return;
     }
    }catch(error){if(token!==revision||signal.aborted)return;writer.stop();
     const endings=['工位先存档，快乐继续加班！','这份快乐 KPI，明天接着涨！','今天先给自己批个快乐假！','键盘可以休息，你的快乐不下班！','下班铃还没响，快乐先打卡！'];
     const candidates=endings.map(line=>`${summary.attempts?`这局完成 ${summary.correct} 次默契配合`:'这局先认个工位'}，${line}`).filter(line=>!recent.includes(line));
     const reply=candidates[Math.floor(random()*candidates.length)]||`第 ${recent.length+1} 次快乐打卡，下局再来一起摸鱼！`;
     note.textContent=reply;note.dataset.source='local';note.setAttribute('aria-busy','false');remember(reply);
    }
   };run();return {...achievement,summary};
  }
 };
}
