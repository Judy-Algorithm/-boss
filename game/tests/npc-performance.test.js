import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {NPCPerformance,NPC_DURATIONS} from '../src/npc-performance.js';
import {fitCharacterHead,NPC_SEAT_OFFSETS,NPC_HEAD_FITS} from '../src/character-fit.js';
import {repairChibiHeadWeights} from '../src/chibi-skin.js';
import {characters} from '../src/characters.js';
import {OFFICE_LAYOUT,COUNTER_BOUNDS} from '../src/workstation.js';

async function loadGeometry(id){
 const bytes=fs.readFileSync(new URL(`../public/models/${id}_rigged.glb`,import.meta.url));
 const size=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+size));
 delete json.materials;delete json.textures;delete json.images;
 for(const mesh of json.meshes)for(const primitive of mesh.primitives)delete primitive.material;
 let content=Buffer.from(JSON.stringify(json));content=Buffer.concat([content,Buffer.alloc((4-content.length%4)%4,32)]);
 const binary=bytes.subarray(20+size),out=Buffer.alloc(20+content.length+binary.length);
 out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(content.length,12);out.writeUInt32LE(0x4e4f534a,16);content.copy(out,20);binary.copy(out,20+content.length);
 const gltf=await new GLTFLoader().parseAsync(out.buffer,'');
 const raw=gltf.scene,b=new THREE.Box3().setFromObject(raw),center=b.getCenter(new THREE.Vector3());raw.position.set(-center.x,-b.min.y,-center.z);
 const root=new THREE.Group();root.add(raw);root.scale.setScalar(1.85/b.getSize(new THREE.Vector3()).y);return root;
}

for(const character of characters.filter(c=>c.id!=='it_rescuer'))test(character.name+' has a real skin, moving joints and bounded head size',async()=>{
 const root=await loadGeometry(character.id);repairChibiHeadWeights(root,character.id);const profile=NPC_HEAD_FITS[character.id]||{width:1.22,height:1.13,top:1.65};const fit=fitCharacterHead(root,profile);assert.ok(fit);assert.ok(fit.headWidth<=profile.width+.001);assert.ok(fit.headHeight<=profile.height+.001);assert.ok(Math.abs(fit.headTop-profile.top)<.001);
 const actor=new THREE.Group();actor.position.set(0,.22,OFFICE_LAYOUT.actorZ+(NPC_SEAT_OFFSETS[character.id]||0));actor.add(root);
 const rig=new NPCPerformance(root,character),head=rig.bones.Head;assert.equal(Object.keys(rig.bones).length,52);
 let difference=0;const q=head.quaternion.clone(),v=new THREE.Vector3();let overlap=0;
 const meshes=[];root.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});assert.ok(meshes.length);
 for(const [name,action] of Object.entries(rig.actions)){
  rig.mixer.stopAllAction();action.reset().play();
  for(let frame=0;frame<=8;frame++){
   rig.mixer.setTime(action.getClip().duration*frame/8);actor.position.y=name==='office'?.22:.44;actor.updateMatrixWorld(true);
   difference=Math.max(difference,q.angleTo(head.quaternion));
   for(const b of Object.values(rig.bones))assert.ok(b.quaternion.toArray().every(Number.isFinite));
   for(const m of meshes)for(let i=0;i<m.geometry.attributes.position.count;i++){m.getVertexPosition(i,v).applyMatrix4(m.matrixWorld);assert.ok(v.toArray().every(Number.isFinite));if(COUNTER_BOUNDS.containsPoint(v))overlap++;}
  }
 }
 rig.setAttention(.8);rig.update({state:'Active'},0,100);const attentive=head.quaternion.clone();for(let i=0;i<30;i++)rig.update({state:'Active'},0,100);assert.ok(attentive.angleTo(head.quaternion)<.00001,'pointer attention must not accumulate into spinning');assert.ok(difference>.1,'head must change pose');assert.equal(overlap,0,'skin vertices must not enter the front counter');assert.equal(rig.duration,NPC_DURATIONS[character.id]);
});
