import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ITPerformance} from '../src/it-performance.js';
import {COUNTER_BOUNDS,OFFICE_LAYOUT} from '../src/workstation.js';

async function loadGeometry(){
 const bytes=fs.readFileSync(new URL('../public/models/it_rescuer_rigged.glb',import.meta.url));
 const size=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+size));
 // Keep the real mesh, skeleton and animation; image decoding is unnecessary for collision checks.
 delete json.materials;delete json.textures;delete json.images;
 for(const mesh of json.meshes)for(const primitive of mesh.primitives)delete primitive.material;
 let content=Buffer.from(JSON.stringify(json));content=Buffer.concat([content,Buffer.alloc((4-content.length%4)%4,32)]);
 const binary=bytes.subarray(20+size),out=Buffer.alloc(20+content.length+binary.length);
 out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(content.length,12);out.writeUInt32LE(0x4e4f534a,16);content.copy(out,20);binary.copy(out,20+content.length);
 return new GLTFLoader().parseAsync(out.buffer,'');
}

test('the IT skin stays out of the front counter throughout all six body clips',async()=>{
 const gltf=await loadGeometry(),raw=gltf.scene,bounds=new THREE.Box3().setFromObject(raw),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 raw.position.set(-center.x,-bounds.min.y,-center.z);const root=new THREE.Group();root.add(raw);root.scale.setScalar(1.85/size.y);
 const actor=new THREE.Group();actor.position.set(0,.22,OFFICE_LAYOUT.actorZ);actor.add(root);
 const rig=new ITPerformance(root),meshes=[];raw.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
 assert.ok(meshes.length>0);const v=new THREE.Vector3();let tested=0;
 for(const [name,action] of Object.entries(rig.actions)){
  rig.mixer.stopAllAction();action.reset().play();
  for(let frame=0;frame<=12;frame++){
   rig.mixer.setTime(action.getClip().duration*frame/12);actor.position.y=name==='office'?.22:.40;actor.updateMatrixWorld(true);
   let overlap=0;
   for(const mesh of meshes)for(let i=0;i<mesh.geometry.attributes.position.count;i++){
    mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);tested++;
    if(COUNTER_BOUNDS.containsPoint(v))overlap++;
   }
   assert.equal(overlap,0,`${name}, frame ${frame}: ${overlap} vertices inside the desk`);
  }
 }
 assert.ok(tested>100000);
});
