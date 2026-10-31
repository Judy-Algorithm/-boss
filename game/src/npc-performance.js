import * as THREE from 'three';

const TAU=Math.PI*2;
const smooth=THREE.MathUtils.smoothstep;
const bell=(t,c,w)=>Math.exp(-Math.pow((t-c)/w,2));
const pulse=(t,a,b,c,d)=>smooth(t,a,b)*(1-smooth(t,c,d));
const JOINTS=['Head','Neck','Spine','Spine1','Spine2','LeftShoulder','RightShoulder','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand'];
export const NPC_DURATIONS={overtime_boss:2900,deadline_officer:2850,slacker_ally:2900,blame_shifter:3100,passing_intern:2850,hr_specialist:3100,finance_manager:2900,office_orange_cat:3200,promise_maker:2950};

// Each existing model keeps its identity. The 9 new Hyper3D skins are animated
// through their real neck, shoulder, elbow and wrist joints, never a fake hand mesh.
export class NPCPerformance {
 constructor(root,character,index=0){
  this.root=root;this.character=character;this.index=index;this.bones={};this.rest={};this.axes={};this.attention=0;this.idleBow={deadline_officer:.055,finance_manager:.095,hr_specialist:.10,slacker_ally:.20}[character.id]??.12;
  root.updateMatrixWorld(true);root.traverse(o=>{if(o.isBone){this.bones[o.name]=o;this.rest[o.name]={q:o.quaternion.clone(),p:o.position.clone()};}});
  for(const [name,b] of Object.entries(this.bones)){const q=b.parent.getWorldQuaternion(new THREE.Quaternion()).invert();this.axes[name]=[new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)].map(v=>v.applyQuaternion(q));}
  this.mixer=new THREE.AnimationMixer(root);this.actions={};this.current=null;this.duration=NPC_DURATIONS[character.id]||2900;
  this.makeClip('office',5.4,t=>this.idle(t,true),true);
  this.makeClip('attentive',3.8,t=>this.idle(t,false),true);
  this.makeClip('look-up',.42,t=>{const u=smooth(t,.05,.36),anticipate=bell(t,.06,.05),overshoot=bell(t,.30,.07);return this.combine(this.idle(0,true),{Head:[this.idleBow*(1-u)+anticipate*.07-overshoot*.08,0,overshoot*.025],Neck:[.04*(1-u),0,0],Spine2:[.035*(1-u)-overshoot*.025,0,0],bob:-anticipate*.018+overshoot*.018});});
  this.makeClip('sit-back',.65,t=>{const u=smooth(t,.02,.61);return this.combine(this.idle(0,false),{Head:[this.idleBow*u,0,0],Neck:[.04*u,0,0],Spine2:[.035*u,0,0],bob:-bell(t,.40,.12)*.018});});
  for(const kind of ['hammer','chocolate']){
   this.makeClip('correct-'+kind,this.duration/1000,t=>this.response(t,kind,true));
   this.makeClip('wrong-'+kind,2.2,t=>this.response(t,kind,false));
  }
  this.switch('office');this.actions.office.time=(index*.53)%5.4;
 }
 combine(a,b){return {...a,...b};}
 idle(t,working){
  const phase=this.index*.71,w=Math.sin(t*TAU/(working?5.4:3.8)+phase),look=Math.sin(t*TAU/(working?5.4:3.8)+phase+.8);
  const id=this.character.id,cat=id==='office_orange_cat',sleepy=id==='slacker_ally';
  return {Head:[(working?this.idleBow:-.025)+w*.018,look*(working?.045:.07),w*(cat?.035:.018)],Neck:[working?.04:0,look*.014,0],Spine2:[(working?.035:0)+w*.010,0,w*.010],LeftShoulder:[0,0,w*.013],RightShoulder:[0,0,-w*.013],LeftForeArm:[working?Math.sin(t*TAU*9/5.4+phase)*.025:0,0,0],RightForeArm:[working?Math.cos(t*TAU*9/5.4+phase)*.025:0,0,0],bob:w*(cat?.012:.008)};
 }
 response(t,kind,correct){
  const hit=bell(t,.28,.13),prepare=bell(t,.12,.075),gesture=pulse(t,.34,.75,1.65,2.45),settle=1-smooth(t,2.3,this.duration/1000);
  const nod=bell(t,1.75,.13)*.16+bell(t,2.1,.14)*.10;
  let p={Head:[.06*prepare-.05*hit,0,0],Neck:[0,0,0],Spine2:[.025*prepare-.025*hit,0,0],bob:-prepare*.018+hit*.018};
  if(!correct){
   if(kind==='hammer')return {...p,Head:[.15*hit,Math.sin(t*12)*.10*Math.exp(-t),Math.sin(t*19)*.055*Math.exp(-t)],Spine2:[.07*hit,0,0],LeftShoulder:[0,0,.045*hit],RightShoulder:[0,0,-.045*hit]};
   return {...p,Head:[-.035,Math.sin(t*5)*.14*settle,.10*gesture],RightForeArm:[-.14*gesture,0,0]};
  }
  switch(this.character.id){
   case 'overtime_boss':p={...p,Head:[.17*gesture+.06*hit,0,Math.sin(t*21)*.035*Math.exp(-t*1.8)],Neck:[.08*gesture,0,0],Spine2:[.09*gesture,0,0],LeftArm:[-.18*gesture,0,-.30*gesture],RightArm:[-.18*gesture,0,.30*gesture],LeftForeArm:[-.55*gesture,0,0],RightForeArm:[-.55*gesture,0,0],LeftHand:[0,0,-.1*gesture],RightHand:[0,0,.1*gesture]};break;
   case 'deadline_officer':p={...p,Head:[.12*gesture+nod,0,-.06*gesture],Spine2:[.06*gesture,0,0],LeftArm:[-.18*gesture,0,-.10*gesture],LeftForeArm:[-.37*gesture,0,0],RightForeArm:[-.22*gesture,0,0]};break;
   case 'slacker_ally':p={...p,Head:[-.10*hit+nod,-.12*gesture,-.05*gesture],Neck:[-.035*hit,0,0],Spine2:[-.055*gesture,0,0],RightArm:[-.14*gesture,0,.10*gesture],RightForeArm:[-.48*gesture,0,0],RightHand:[0,.12*gesture,.16*gesture]};break;
   case 'blame_shifter':p={...p,Head:[.025,Math.sin(Math.max(0,t-.36)*5.4)*.30*gesture,-.09*gesture],Neck:[0,Math.sin(t*5.4)*.07*gesture,0],Spine2:[0,-Math.sin(t*5.4)*.045*gesture,0],RightShoulder:[0,0,-.06*gesture],LeftShoulder:[0,0,.06*gesture]};break;
   case 'passing_intern':p=kind==='hammer'?{...p,Head:[.12*hit+nod,0,Math.sin(t*10)*.04*Math.exp(-t)],Neck:[-.06*hit,0,0],Spine2:[.065*gesture,0,0],LeftForeArm:[-.12*gesture,0,0],RightForeArm:[-.12*gesture,0,0],bob:.045*hit}:{...p,Head:[-.1*hit+nod,-.055*gesture,.055*gesture],Spine2:[-.045*hit,0,0],LeftForeArm:[-.20*gesture,0,0],RightForeArm:[-.24*gesture,0,0],bob:.025*hit};break;
   case 'hr_specialist':p={...p,Head:[-.045+nod,-.06*gesture,.075*gesture],Neck:[nod*.2,0,0],Spine2:[-.035*gesture,0,-.025*gesture],LeftArm:[-.12*gesture,0,-.28*gesture],RightArm:[-.12*gesture,0,.28*gesture],LeftForeArm:[-.35*gesture,0,0],RightForeArm:[-.35*gesture,0,0],LeftHand:[0,0,-.13*gesture],RightHand:[0,0,.13*gesture]};break;
   case 'finance_manager':p={...p,Head:[.07*gesture+nod,0,-.035*gesture],Spine2:[.05*gesture,0,0],LeftArm:[-.13*gesture,0,-.04*gesture],LeftForeArm:[-.28*gesture,0,0],RightForeArm:[-.10*gesture,0,0]};break;
   case 'office_orange_cat':p={...p,Head:[-.10*gesture+nod*.5,.13*gesture,Math.sin(t*5)*.08*gesture],Neck:[-.04*gesture,0,0],Spine2:[-.12*gesture,0,-Math.sin(t*5)*.035*gesture],LeftArm:[-.16*gesture,0,-.13*gesture],RightArm:[-.16*gesture,0,.13*gesture],LeftForeArm:[-.12*gesture,0,0],RightForeArm:[-.16*gesture,0,0],bob:.023*Math.sin(t*6)*gesture};break;
   case 'promise_maker':p={...p,Head:[.09*gesture+nod,-.09*gesture,-.06*gesture],Spine2:[.06*gesture,0,0],LeftArm:[-.15*gesture,0,-.08*gesture],LeftForeArm:[-.34*gesture,0,0],RightForeArm:[-.25*gesture,0,0]};break;
  }
  return p;
 }
 makeClip(name,duration,pose,loop=false){
  const count=Math.ceil(duration*30),times=Array.from({length:count+1},(_,i)=>Math.min(duration,i/30)),tracks=[];
  for(const bone of JOINTS){if(!this.bones[bone])continue;const values=[];for(const t of times){const angles=pose(t)[bone]||[0,0,0],q=this.rest[bone].q.clone();for(let k=0;k<3;k++)q.premultiply(new THREE.Quaternion().setFromAxisAngle(this.axes[bone][k],angles[k]));values.push(...q.toArray());}tracks.push(new THREE.QuaternionKeyframeTrack(bone+'.quaternion',times,values));}
  if(this.bones.Hips){const values=[];for(const t of times){const v=this.rest.Hips.p.clone();v.y+=pose(t).bob||0;values.push(...v.toArray());}tracks.push(new THREE.VectorKeyframeTrack('Hips.position',times,values));}
  const action=this.mixer.clipAction(new THREE.AnimationClip(name,duration,tracks));action.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);action.clampWhenFinished=!loop;this.actions[name]=action;
 }
 switch(name){if(this.current===name)return;const previous=this.actions[this.current],next=this.actions[name];next.reset().setEffectiveWeight(1).play();if(previous)next.crossFadeFrom(previous,.14,false);this.current=name;}
 setAttention(x){this.attention=THREE.MathUtils.clamp(x,-1,1);}
 rewardTarget(){const bone=this.bones.RightHand||this.bones.Head;this.root.updateMatrixWorld(true);return bone?.getWorldPosition(new THREE.Vector3())||this.root.getWorldPosition(new THREE.Vector3());}
 update(a,t,clock){
  const name=a.state==='Hidden'?'office':a.state==='PopUp'?'look-up':a.state==='Active'?'attentive':a.state==='React'?(a.reactCorrect?'correct-':'wrong-')+(a.reactKind||'hammer'):'sit-back';
  this.switch(name);const dt=this.lastClock===undefined?0:THREE.MathUtils.clamp(clock-this.lastClock,0,.06);this.lastClock=clock;if(this.attentionOffset&&this.bones.Head)this.bones.Head.quaternion.premultiply(this.attentionOffset.clone().invert());this.attentionOffset=null;this.mixer.update(dt);
  if(name==='attentive'&&this.bones.Head){this.attentionOffset=new THREE.Quaternion().setFromAxisAngle(this.axes.Head[1],this.attention*.08);this.bones.Head.quaternion.premultiply(this.attentionOffset);}
  this.diagnostics={id:this.character.id,bones:Object.keys(this.bones).length,clip:name,time:+this.actions[name].time.toFixed(2)};
 }
}
