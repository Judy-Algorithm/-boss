import * as THREE from 'three';
import {getPose} from './it-pose-settings.js';
const V=THREE.Vector3,Q=THREE.Quaternion;
const smooth=(t,a,b)=>THREE.MathUtils.smoothstep(t,a,b);
const pulse=(t,a,b,c,d)=>smooth(t,a,b)*(1-smooth(t,c,d));
const bell=(t,c,w)=>Math.exp(-Math.pow((t-c)/w,2));

// The A-pose character is driven through actual joints; hands reach actor-local targets.
export class ITCharacterController {
 constructor(model,{wrench=null,laptop=null}={}){
  this.model=model;this.root=model;this.bones={};this.rest={};this.attention=0;this.phase=0;this.current='office';
  model.updateMatrixWorld(true);model.traverse(o=>{if(o.isBone){this.bones[o.name]=o;this.rest[o.name]={q:o.quaternion.clone(),p:o.position.clone()};}});
  this.wrench=wrench;this.laptop=laptop;this.propsSeparate=true;this.facialRig=false;
  this.gift=new THREE.Group();const m=new THREE.Mesh(new THREE.BoxGeometry(.12,.09,.05),new THREE.MeshStandardMaterial({color:'#63372b',roughness:.5}));this.gift.add(m);const r=new THREE.Mesh(new THREE.BoxGeometry(.027,.095,.055),new THREE.MeshStandardMaterial({color:'#f472aa'}));this.gift.add(r);this.gift.visible=false;
  model.parent.add(this.gift);if(wrench)model.parent.add(wrench);
  this.actions={};this.sourceClips=model.userData.animations?.map(c=>c.name)||[];
 }
 setAttention(x){this.attention=THREE.MathUtils.clamp(x,-1,1);}
 worldPoint(x,y,z){return this.model.parent.localToWorld(new V(x,y,z));}
 rotateWorld(bone,axis,angle){const b=this.bones[bone];if(!b)return;const parent=b.parent.getWorldQuaternion(new Q()),world=b.getWorldQuaternion(new Q());world.premultiply(new Q().setFromAxisAngle(axis,angle));b.quaternion.copy(parent.invert().multiply(world));b.updateMatrixWorld(true);}
 reach(side,target,bendHint){
  const arm=this.bones[side+'Arm'],elbow=this.bones[side+'ForeArm'],hand=this.bones[side+'Hand'];if(!arm||!elbow||!hand)return;
  this.model.updateMatrixWorld(true);const s=arm.getWorldPosition(new V()),e=elbow.getWorldPosition(new V()),w=hand.getWorldPosition(new V()),a=s.distanceTo(e),b=e.distanceTo(w);
  const direction=target.clone().sub(s),distance=THREE.MathUtils.clamp(direction.length(),Math.abs(a-b)+.005,a+b-.005);direction.normalize();const goal=s.clone().addScaledVector(direction,distance);
  const along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(.00001,a*a-along*along));
  const bend=bendHint.clone().sub(direction.clone().multiplyScalar(bendHint.dot(direction))).normalize();const middle=s.clone().addScaledVector(direction,along).addScaledVector(bend,height);
  this.aimBone(arm,e.clone().sub(s),middle.clone().sub(s));this.model.updateMatrixWorld(true);
  const e2=elbow.getWorldPosition(new V()),w2=hand.getWorldPosition(new V());this.aimBone(elbow,w2.sub(e2),goal.sub(e2));this.model.updateMatrixWorld(true);
 }
 aimBone(bone,from,to){if(from.lengthSq()<1e-9||to.lengthSq()<1e-9)return;const rotation=new Q().setFromUnitVectors(from.normalize(),to.normalize()),world=bone.getWorldQuaternion(new Q()).premultiply(rotation),parent=bone.parent.getWorldQuaternion(new Q()).invert();bone.quaternion.copy(parent.multiply(world));bone.updateMatrixWorld(true);}
 rewardTarget(){return this.bones.RightHand?.localToWorld(new V(0,.10,.015))||this.worldPoint(-.24,.84,.35);}
 update(a,t,clock){
  const settings=getPose(),rad=THREE.MathUtils.degToRad;
  const phase=a.state==='Hidden'?'office':a.state==='PopUp'?'look-up':a.state==='Active'?'attentive':a.state==='React'?(a.reactCorrect?'reward':'wrong'):'sit-back';this.current=phase;
  for(const [name,b] of Object.entries(this.bones)){b.quaternion.copy(this.rest[name].q);b.position.copy(this.rest[name].p);}this.model.updateMatrixWorld(true);
  const breath=Math.sin(clock*2.1),typing=Math.sin(clock*9),idle=phase==='office'?1:phase==='look-up'?1-smooth(t,.05,.36):phase==='sit-back'?smooth(t,.05,.6):0;
  let bow=.14*idle+breath*.012*settings.headMotion,turn=Math.sin(clock*.7)*.045*settings.headMotion,tilt=Math.sin(clock*1.2)*.025*settings.headMotion;
  let left=new V(.34,.74,.28),right=new V(-.29,.73,.29),salute=0,catchFood=0;
  if(idle>.5){left.y+=typing*.012;right.y+=Math.cos(clock*8)*.01;}
  if(phase==='attentive')turn+=this.attention*.15;
  if(phase==='reward'){
   catchFood=pulse(t,.12,.52,.95,1.45);salute=pulse(t,.88,1.42,2.08,2.75);const surprise=bell(t,.6,.2);
   right.lerp(new V(-.14,.94,.45),catchFood);left.lerp(new V(.43,1.27,.21),salute);
   bow=-surprise*.11+bell(t,2.47,.13)*.17+bell(t,2.92,.15)*.13;turn=salute*.12-catchFood*.10;tilt=surprise*.055;
  }else if(phase==='wrong'){bow=bell(t,.12,.1)*.13;turn=Math.sin(t*12)*.14*Math.exp(-t);}
  bow+=rad(settings.headPitch);turn+=rad(settings.headYaw);tilt+=rad(settings.headRoll);
  this.rotateWorld('Spine2',new V(1,0,0),idle*.04-catchFood*.025);this.rotateWorld('Head',new V(1,0,0),bow);this.rotateWorld('Head',new V(0,1,0),turn);this.rotateWorld('Head',new V(0,0,1),tilt);
  for(const side of ['Left','Right']){this.rotateWorld(side+'UpLeg',new V(1,0,0),-1.03);this.rotateWorld(side+'Leg',new V(1,0,0),1.12);}
  left.add(new V(settings.handX,settings.handY,settings.handZ));this.reach('Left',this.worldPoint(...left.toArray()),new V(.7+settings.elbowOut,-.5,.4));this.reach('Right',this.worldPoint(...right.toArray()),new V(-.7,-.4,.4));
  for(const side of ['Left','Right']){const hand=this.bones[side+'Hand'];if(hand){const parent=hand.parent.getWorldQuaternion(new Q()).invert();hand.quaternion.copy(parent.multiply(new Q().setFromEuler(new THREE.Euler(side==='Left'?Math.PI/2:-Math.PI/2,0,side==='Left'?-.10:.08))));hand.updateMatrixWorld(true);}}
  for(const side of ['Left','Right'])for(const finger of ['Index','Middle','Ring','Pinky'])for(let i=1;i<=3;i++){const b=this.bones[`${side}Hand${finger}${i}`];if(b)b.rotateX((side==='Left'?.72*settings.grip/.7:.20)*(phase==='reward'?1.12:1));}
  if(this.wrench&&this.bones.LeftHand){const hand=this.bones.LeftHand,parent=this.model.parent,actorQ=parent.getWorldQuaternion(new Q());
   if(!this.gripBasis)this.gripBasis=hand.getWorldQuaternion(new Q()).invert().multiply(actorQ);
   this.rotateWorld('LeftHand',new V(1,0,0),rad(settings.wristPitch));this.rotateWorld('LeftHand',new V(0,1,0),rad(settings.wristYaw));this.rotateWorld('LeftHand',new V(0,0,1),rad(settings.wristRoll));
   this.wrench.position.copy(parent.worldToLocal(hand.localToWorld(new V(0,.10,0)))).add(new V(settings.gripX,settings.gripY,settings.gripZ));
   const toolQ=new Q().setFromEuler(new THREE.Euler(rad(settings.toolPitch)+salute*.12,rad(settings.toolYaw),rad(settings.toolRoll)+Math.sin(clock*4)*salute*.035));
   this.wrench.quaternion.copy(actorQ.clone().invert().multiply(hand.getWorldQuaternion(new Q())).multiply(this.gripBasis).multiply(toolQ).normalize());
  }
  this.gift.visible=phase==='reward'&&t>=.28&&t<1.55;this.gift.position.copy(this.model.parent.worldToLocal(this.rewardTarget()));this.gift.position.y+=.04;this.gift.scale.setScalar(Math.min(1,Math.max(0,(t-.28)/.16)));
  this.expression?.update(phase,t,clock);
  this.diagnostics={bones:Object.keys(this.bones).length,skinned:true,clip:phase,propsSeparate:true,facialRig:this.facialRig,handTargets:'two-bone-ik',pose:{headRoll:settings.headRoll,headMotion:settings.headMotion,handY:settings.handY,toolRoll:settings.toolRoll},sourceClips:this.sourceClips};
 }
}
