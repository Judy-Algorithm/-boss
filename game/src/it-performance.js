import * as THREE from 'three';
const TAU=Math.PI*2;
const pulse=(t,a,b,c,d)=>THREE.MathUtils.smoothstep(t,a,b)*(1-THREE.MathUtils.smoothstep(t,c,d));
const bell=(t,center,width)=>Math.exp(-Math.pow((t-center)/width,2));
const samples=(duration)=>Array.from({length:Math.ceil(duration*30)+1},(_,i)=>Math.min(duration,i/30));
const JOINTS=['Hips','Head','Neck','Spine','Spine2','LeftShoulder','RightShoulder','LeftArm','LeftForeArm','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','RightUpLeg','RightLeg'];

// Body clips animate the actual Hyper3D skeleton. Facial expressions stay authored.
export class ITPerformance {
 constructor(root){
  this.root=root;this.bones={};this.rest={};this.restPosition={};this.attention=0;
  root.updateMatrixWorld(true);
  root.traverse(o=>{if(o.isBone){this.bones[o.name]=o;this.rest[o.name]=o.quaternion.clone();this.restPosition[o.name]=o.position.clone();}});
  this.mixer=new THREE.AnimationMixer(root);this.actions={};this.current=null;
  this.sourceClips=(root.userData.animations||[]).map(c=>c.name);
  this.axes={};for(const [name,b] of Object.entries(this.bones)){
   const q=b.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
   this.axes[name]={x:new THREE.Vector3(1,0,0).applyQuaternion(q),y:new THREE.Vector3(0,1,0).applyQuaternion(q),z:new THREE.Vector3(0,0,1).applyQuaternion(q)};
  }
  this.add('office',5.2,t=>{
   const breath=Math.sin(t*TAU/5.2),glance=Math.sin(t*TAU/5.2),typing=Math.sin(t*TAU*13/5.2);
   return {Head:[.25+breath*.023,glance*.065,Math.sin(t*TAU*2/5.2)*.025],Neck:[.06,glance*.016,0],Spine2:[.055+breath*.015,0,breath*.012],LeftForeArm:[1.10+typing*.065,0,0],RightForeArm:[typing*.045,0,0],bob:breath*.014};
  },true);
  this.add('look-up',.42,t=>{
   const u=t/.42,lift=THREE.MathUtils.smoothstep(t,.07,.33),anticipate=bell(t,.07,.055),settle=bell(t,.31,.065);
   return {Head:[.25*(1-lift)+anticipate*.075-settle*.075,-.055*(1-lift),settle*.025],Neck:[.06*(1-lift),0,0],Spine2:[.055*(1-lift)-settle*.025,0,0],LeftForeArm:[1.10-.40*lift,0,0],bob:-anticipate*.025+settle*.035};
  });
  this.add('attentive',3.6,t=>{
   const w=Math.sin(t*TAU/3.6);
   return {Head:[-.035+w*.023,w*.045,w*.024],Neck:[0,w*.015,0],Spine2:[w*.015,0,-w*.012],LeftForeArm:[.70+w*.035,0,0],RightShoulder:[0,0,w*.018],bob:w*.018};
  },true);
  this.add('reward',4.2,t=>{
   const catchFood=pulse(t,.18,.58,1.15,1.65),salute=pulse(t,.84,1.48,2.12,2.8);
   const anticipation=bell(t,.18,.12),surprise=bell(t,.65,.2);
   const nod=bell(t,2.58,.14)*.20+bell(t,3.06,.16)*.145;
   return {Head:[anticipation*.11-surprise*.10+nod,salute*.13-catchFood*.08,surprise*.065+salute*.045],Neck:[nod*.25,0,0],Spine2:[catchFood*.045-salute*.055,0,-salute*.035],LeftShoulder:[0,0,salute*.055],RightShoulder:[catchFood*.025,0,0],LeftArm:[0,0,salute*.09],LeftForeArm:[.70*(1-salute)-.08*salute,0,0],RightArm:[-.30*catchFood,0,.06*catchFood],RightForeArm:[-.36*catchFood,0,0],RightHand:[0,.10*catchFood,.04*catchFood],bob:-anticipation*.035+surprise*.055+salute*.018};
  });
  this.add('wrong',2.2,t=>({Head:[.12*bell(t,.18,.15),Math.sin(t*10)*.19*Math.exp(-t),Math.sin(t*18)*.065*Math.exp(-t)],Spine2:[.07*bell(t,.18,.15),0,0],LeftForeArm:[.70,0,0],bob:-bell(t,.2,.14)*.04}));
  this.add('sit-back',.65,t=>{
   const u=THREE.MathUtils.smoothstep(t,0,.6),settle=bell(t,.42,.12);
   return {Head:[.25*u+settle*.04,0,0],Neck:[.06*u,0,0],Spine2:[.055*u,0,0],LeftForeArm:[.70+.40*u,0,0],bob:-settle*.025};
  });
  this.gift=new THREE.Group();
  const chocolate=new THREE.Mesh(new THREE.BoxGeometry(.15,.11,.065),new THREE.MeshStandardMaterial({color:'#583324',roughness:.48}));this.gift.add(chocolate);
  const ribbon=new THREE.Mesh(new THREE.BoxGeometry(.035,.115,.07),new THREE.MeshStandardMaterial({color:'#ff76ab',roughness:.45}));this.gift.add(ribbon);
  this.gift.visible=false;const hand=this.bones.RightHand;if(hand){hand.add(this.gift);hand.updateWorldMatrix(true,false);const palm=hand.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.14,.25));this.gift.position.copy(hand.worldToLocal(palm));}this.switch('office');
 }
 add(name,duration,pose,loop=false){
  const times=samples(duration),tracks=[];
  for(const bone of JOINTS){if(!this.bones[bone])continue;const values=[];
   for(const t of times){
    const angles=pose(t)[bone]||(['LeftUpLeg','RightUpLeg'].includes(bone)?[-.85,0,0]:['LeftLeg','RightLeg'].includes(bone)?[.95,0,0]:[0,0,0]),q=this.rest[bone].clone();
    for(let i=0;i<3;i++)q.premultiply(new THREE.Quaternion().setFromAxisAngle(this.axes[bone][['x','y','z'][i]],angles[i]));
    values.push(...q.toArray());
   }
   tracks.push(new THREE.QuaternionKeyframeTrack(`${bone}.quaternion`,times,values));
  }
  if(this.bones.Hips){const values=[];for(const t of times){const p=this.restPosition.Hips.clone();p.y+=pose(t).bob||0;values.push(...p.toArray());}tracks.push(new THREE.VectorKeyframeTrack('Hips.position',times,values));}
  const action=this.mixer.clipAction(new THREE.AnimationClip(name,duration,tracks));action.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);action.clampWhenFinished=!loop;this.actions[name]=action;
 }
 switch(name){if(name===this.current)return;const next=this.actions[name],old=this.actions[this.current];next.reset().setEffectiveWeight(1).play();if(old)next.crossFadeFrom(old,name==='sit-back'?.20:.16,false);this.current=name;}
 setAttention(x){this.attention=THREE.MathUtils.clamp(x,-1,1);}
 rewardTarget(){this.root.updateMatrixWorld(true);return this.gift.getWorldPosition(new THREE.Vector3());}
 update(a,t,clock){
  const name=a.state==='Hidden'?'office':a.state==='PopUp'?'look-up':a.state==='Active'?'attentive':a.state==='React'?(a.reactCorrect?'reward':'wrong'):'sit-back';
  this.switch(name);this.gift.visible=name==='reward'&&t>=.28&&t<1.9;this.gift.scale.setScalar(name==='reward'?Math.min(1,Math.max(0,(t-.28)/.18)):0);
  const dt=this.lastClock===undefined?0:Math.max(0,Math.min(.06,clock-this.lastClock));this.lastClock=clock;this.mixer.update(dt);
  if(name==='attentive'&&this.bones.Head)this.bones.Head.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(this.axes.Head.y,this.attention*.12));
  this.diagnostics={bones:Object.keys(this.bones).length,skinned:true,clip:name,time:Number(this.actions[name].time.toFixed(2)),sourceClips:this.sourceClips,facialRig:false};
 }
}
