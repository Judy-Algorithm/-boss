import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildWorkstation,OFFICE_LAYOUT} from './workstation.js';
import {ITPerformance} from './it-performance.js';
import {ITCharacterController} from './it-character-controller.js';
import {installITExpressions} from './it-expressions.js';
import {loadDetachedITProps} from './it-detached-props.js';
import {mountPoseEditor} from './it-pose-editor.js';
import {installOfficeBackdrop} from './office-backdrop.js';
import {recordIT} from './qa-recording.js';

const editMode=new URLSearchParams(location.search).has('edit'),poseEditor=editMode?mountPoseEditor():null;
const $=id=>document.getElementById(id),qa=new URLSearchParams(location.search).has('qa'),partParam=new URLSearchParams(location.search).get('part');
const renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();installOfficeBackdrop(renderer,scene,$('stage'));
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.65;pmrem.dispose();
scene.add(new THREE.HemisphereLight('#fff0d2','#665281',1));const sun=new THREE.DirectionalLight('#ffe1af',3);sun.position.set(-3,6,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.02;scene.add(sun);const rim=new THREE.DirectionalLight('#bd9bff',1.8);rim.position.set(3,4,-3);scene.add(rim);
const station=new THREE.Group();scene.add(station);if(partParam===null)buildWorkstation(station,5);
const actor=new THREE.Group();actor.position.set(0,.22,OFFICE_LAYOUT.actorZ);station.add(actor);
const camera=new THREE.PerspectiveCamera(32,9/16,.1,50);camera.position.set(0,3.0,6.6);camera.lookAt(0,1.25,-.1);
let rig,model,state='Hidden',since=0,cycleStart=0,lastState='',busy=false,rounds=0,correct=true,flight=null,pending=false,queuedKind=null;
const load=new GLTFLoader();
async function start(){try{
 const gltf=await load.loadAsync(partParam!==null?'/models/it_rescuer_split.glb':'/models/it_rescuer_animation_pbr.glb');if(partParam!==null){let index=0;gltf.scene.traverse(o=>{if(o.isMesh)o.visible=String(index++)===partParam;});}model=new THREE.Group();const b=new THREE.Box3().setFromObject(gltf.scene),center=b.getCenter(new THREE.Vector3());gltf.scene.position.set(-center.x,-b.min.y,-center.z);model.add(gltf.scene);model.scale.setScalar(1.95/b.getSize(new THREE.Vector3()).y);model.userData.animations=gltf.animations;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.metalness=0;m.roughness=.48;}}});actor.add(model);if(partParam===null){const props=await loadDetachedITProps(load);station.add(props.laptop);props.laptop.position.set(-.75,.98,.28);props.laptop.rotation.set(-.10,.16,-.06);rig=new ITCharacterController(model,props);rig.expression=installITExpressions(model);rig.facialRig=rig.expression.enabled;}$('load').textContent=partParam!==null?'道具部件 '+partParam:'';$('reward').disabled=$('hammer').disabled=false;cycleStart=performance.now();
}catch(e){$('load').textContent='模型暂时无法加载，请刷新重试';console.error(e);}}
function transition(next,now){state=next;since=now;lastState=next;}
function interact(kind){if(!rig||busy)return;if(state==='Hidden'||state==='PopUp'){queuedKind=kind;busy=true;if(state==='Hidden')transition('PopUp',performance.now());$('bubble').textContent='重启试过了吗？';$('reward').disabled=$('hammer').disabled=true;return;}busy=true;correct=kind==='reward';rounds++;const now=performance.now();transition('React',now);$('bubble').textContent='';pending=true;const geo=new THREE.BoxGeometry(.14,.10,.07),mat=new THREE.MeshStandardMaterial({color:correct?'#633b2e':'#f26da7'}),obj=new THREE.Mesh(geo,mat);scene.add(obj);flight={obj,start:new THREE.Vector3(correct?.8:-.8,.8,1.8),since:now};$('reward').disabled=$('hammer').disabled=true;}
$('reward').onclick=()=>interact('reward');$('hammer').onclick=()=>interact('hammer');document.addEventListener('keydown',e=>{if(editMode)return;if(e.ctrlKey||e.metaKey)return;if(e.key.toLowerCase()==='a')interact('reward');if(e.key.toLowerCase()==='d')interact('hammer');});
$('stage').addEventListener('pointermove',e=>{if(editMode)return;const r=$('stage').getBoundingClientRect();rig?.setAttention((e.clientX-r.left-r.width/2)/(r.width/2));});
function resize(){const r=$('stage').getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe($('stage'));resize();$('qa').hidden=!qa;
function frame(now){requestAnimationFrame(frame);if(rig&&poseEditor){const view=poseEditor.frame(now);rig.update(view,view.t,view.clock);const rise=view.state==='Hidden'?0:view.state==='PopUp'?THREE.MathUtils.smoothstep(view.t,0,.42):view.state==='Retreat'?1-THREE.MathUtils.smoothstep(view.t,0,.65):1;actor.position.y=.22+rise*.15;$('bubble').textContent=view.state==='React'&&view.t>1.75?'收到！你的工单插个队！':'';renderer.render(scene,camera);return;}if(rig){const t=(now-since)/1000;
 if(state==='Hidden'&&now-cycleStart>2000){transition('PopUp',now);$('bubble').textContent='重启试过了吗？';}
 else if(state==='PopUp'&&t>.42)transition('Active',now);
 else if(state==='Active'&&queuedKind&&t>.45){const kind=queuedKind;queuedKind=null;busy=false;interact(kind);}
 else if(state==='Active'&&t>4){transition('Retreat',now);$('bubble').textContent='';}
 else if(state==='React'){if(pending&&t>1.75){$('bubble').textContent=correct?'收到！你的工单插个队！':'电脑没修好，我先被修了？';pending=false;}if(t>4.2)transition('Retreat',now);}
 else if(state==='Retreat'&&t>.65){transition('Hidden',now);cycleStart=now;busy=false;pending=false;$('bubble').textContent='';$('reward').disabled=$('hammer').disabled=false;}
 rig.update({state,reactCorrect:correct},t,now/1000);const rise=state==='Hidden'?0:state==='PopUp'?THREE.MathUtils.smoothstep(t,0,.42):state==='Retreat'?1-THREE.MathUtils.smoothstep(t,0,.65):1;actor.position.y=.22+rise*.15;
 if(flight){const u=Math.min(1,(now-flight.since)/280),end=rig.rewardTarget();flight.obj.position.lerpVectors(flight.start,end,u);flight.obj.position.y+=Math.sin(u*Math.PI)*.6;if(u>=1){flight.obj.removeFromParent();flight.obj.geometry.dispose();flight.obj.material.dispose();flight=null;}}
 if(qa)$('qa').textContent=JSON.stringify({state,busy,rounds,clip:rig.current,propsSeparate:!!rig.propsSeparate,facialRig:!!rig.facialRig,lidVertices:rig.expression?.lidVertices,bones:Object.keys(rig.bones).length,handTargets:'IK'},null,1);
 }renderer.render(scene,camera);}
requestAnimationFrame(frame);start();

if(qa){const panel=document.createElement('div');panel.style.cssText='position:absolute;left:8px;top:8px;display:flex;flex-direction:column;gap:5px;z-index:10';for(const [label,value] of [['闭眼检查','blink'],['微笑检查','smile'],['惊喜检查','surprise'],['恢复自然',null]]){const b=document.createElement('button');b.textContent=label;b.style.cssText='font-size:11px;padding:7px';b.onclick=()=>rig?.expression?.setOverride(value);panel.append(b);}document.getElementById('stage').append(panel);}

if(qa){const b=document.createElement('button');b.textContent='录制完整动作';b.style.cssText='position:absolute;left:8px;top:162px;font-size:11px;padding:7px;z-index:11';b.onclick=()=>recordIT($('scene'),()=>{busy=false;queuedKind=null;transition('Hidden',performance.now());cycleStart=performance.now();interact('reward');},'/backgrounds/office-sunset.jpg');$('stage').append(b);}
