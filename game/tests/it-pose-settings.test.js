import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {DEFAULT_POSE,normalizePose,setPose,getPose,savePose,loadPose} from '../src/it-pose-settings.js';
import {ITCharacterController} from '../src/it-character-controller.js';

test('pose imports reject invalid numbers, clamp unsafe ranges and round-trip saved settings',()=>{
 const pose=normalizePose({pose:{headRoll:999,headYaw:NaN,grip:Infinity,handY:-100,unknown:2}});
 assert.equal(pose.headRoll,30);assert.equal(pose.headYaw,0);assert.equal(pose.grip,.7);assert.equal(pose.handY,-.18);assert.equal(pose.unknown,undefined);
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 setPose({...DEFAULT_POSE,headRoll:9,toolRoll:18});savePose(storage);assert.deepEqual(loadPose(storage),getPose());
 assert.deepEqual(loadPose({getItem:()=>'{broken'}),DEFAULT_POSE);setPose(DEFAULT_POSE);
});

test('head edits stay stable frame to frame, and the independent wrench follows wrist rotation',()=>{
 const bytes=fs.readFileSync(new URL('../public/models/it_rescuer_animation_rigged.glb',import.meta.url)),json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
 const joints=new Set(json.skins.flatMap(s=>s.joints)),nodes=json.nodes.map((n,i)=>{const o=joints.has(i)?new THREE.Bone():new THREE.Group();o.name=n.name;if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);if(n.matrix)o.applyMatrix4(new THREE.Matrix4().fromArray(n.matrix));return o;});
 json.nodes.forEach((n,i)=>n.children?.forEach(k=>nodes[i].add(nodes[k])));
 const actor=new THREE.Group(),model=new THREE.Group();actor.add(model);nodes.filter(o=>!o.parent).forEach(o=>model.add(o));
 const wrench=new THREE.Group(),rig=new ITCharacterController(model,{wrench}),view={state:'Active',reactCorrect:true};
 try{
  setPose({...DEFAULT_POSE,headMotion:0});rig.update(view,0,100);const head=rig.bones.Head.getWorldQuaternion(new THREE.Quaternion()),tool=wrench.quaternion.clone();
  setPose({...getPose(),headRoll:12,wristRoll:20});rig.update(view,0,100);const changed=rig.bones.Head.getWorldQuaternion(new THREE.Quaternion()),changedTool=wrench.quaternion.clone();
  assert.ok(Math.abs(THREE.MathUtils.radToDeg(head.angleTo(changed))-12)<.001);
  assert.ok(Math.abs(THREE.MathUtils.radToDeg(tool.angleTo(changedTool))-20)<.001);
  for(let i=0;i<120;i++)rig.update(view,0,100);
  assert.ok(changed.angleTo(rig.bones.Head.getWorldQuaternion(new THREE.Quaternion()))<.00001);
  assert.ok(changedTool.angleTo(wrench.quaternion)<.00001);
  assert.ok(rig.rewardTarget().toArray().every(Number.isFinite));
 }finally{setPose(DEFAULT_POSE);}
});
