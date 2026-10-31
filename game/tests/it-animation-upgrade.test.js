import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ITCharacterController} from '../src/it-character-controller.js';
import {installITExpressions} from '../src/it-expressions.js';
import {loadDetachedITProps} from '../src/it-detached-props.js';
import {COUNTER_BOUNDS} from '../src/workstation.js';

async function geometryOnly(filename){
 const bytes=fs.readFileSync(new URL('../public/models/'+filename,import.meta.url)),size=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+size));
 delete json.materials;delete json.textures;delete json.images;for(const m of json.meshes)for(const p of m.primitives)delete p.material;
 let content=Buffer.from(JSON.stringify(json));content=Buffer.concat([content,Buffer.alloc((4-content.length%4)%4,32)]);const binary=bytes.subarray(20+size),out=Buffer.alloc(20+content.length+binary.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(content.length,12);out.writeUInt32LE(0x4e4f534a,16);content.copy(out,20);binary.copy(out,20+content.length);return new GLTFLoader().parseAsync(out.buffer,'');
}

test('the empty-handed IT model has independent props, working reach and local facial shapes',async()=>{
 const gltf=await geometryOnly('it_rescuer_animation_pbr.glb'),raw=gltf.scene,b=new THREE.Box3().setFromObject(raw),center=b.getCenter(new THREE.Vector3()),model=new THREE.Group(),actor=new THREE.Group();
 raw.position.set(-center.x,-b.min.y,-center.z);model.add(raw);model.scale.setScalar(1.95/b.getSize(new THREE.Vector3()).y);actor.position.set(0,.22,-.62);actor.add(model);
 const props=await loadDetachedITProps({loadAsync:()=>geometryOnly('it_rescuer_split.glb')});const rig=new ITCharacterController(model,props),expressions=installITExpressions(model);rig.expression=expressions;
 assert.equal(Object.keys(rig.bones).length,52);assert.equal(props.wrench.parent,actor);assert.equal(props.laptop.parent,null);assert.equal(rig.propsSeparate,true);assert.equal(expressions.enabled,true);
 const upper=rig.bones.RightArm.getWorldPosition(new THREE.Vector3()),hand=rig.bones.RightHand.getWorldPosition(new THREE.Vector3()),target=upper.clone().lerp(hand,.75);
 rig.reach('Right',target,new THREE.Vector3(-1,-.4,.4));assert.ok(rig.bones.RightHand.getWorldPosition(new THREE.Vector3()).distanceTo(target)<.002,JSON.stringify({debug:rig.lastReach,target:target.toArray(),got:rig.bones.RightHand.getWorldPosition(new THREE.Vector3()).toArray(),shoulder:upper.toArray(),hand:hand.toArray()}));
 expressions.setOverride('blink');expressions.update('office',0,1);assert.ok(expressions.meshes.every(m=>m.morphTargetInfluences[0]===1));expressions.setOverride(null);
 const v=new THREE.Vector3(),meshes=expressions.meshes;let clock=0,checks=0;
 for(let cycle=0;cycle<10;cycle++)for(const [state,duration] of [['Hidden',.8],['PopUp',.42],['Active',.7],['React',4.2],['Retreat',.65]])for(let t=0;t<duration;t+=.20){
  clock+=.20;rig.update({state,reactCorrect:cycle%3!==0},t,clock);actor.updateMatrixWorld(true);
  for(const bone of Object.values(rig.bones))assert.ok(bone.quaternion.toArray().every(Number.isFinite));
  for(const mesh of meshes)for(let i=0;i<mesh.geometry.attributes.position.count;i+=7){mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);assert.ok(!COUNTER_BOUNDS.containsPoint(v),`${state}: body penetrated counter`);checks++;}
 }
 assert.ok(checks>100000);rig.update({state:'Hidden'},0,clock+.2);assert.equal(rig.current,'office');assert.equal(rig.gift.visible,false);assert.equal(actor.children.filter(o=>o.name==='it-independent-wrench').length,1);
});
