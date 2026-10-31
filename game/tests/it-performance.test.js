import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {ITPerformance} from '../src/it-performance.js';

test('IT skin has valid bone clips and completes reward before returning to office',()=>{
 const bytes=fs.readFileSync(new URL('../public/models/it_rescuer_rigged.glb',import.meta.url));
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 assert.equal(json.skins.length,1);assert.equal(json.skins[0].joints.length,52);
 const joints=new Set(json.skins[0].joints);
 const objects=json.nodes.map((n,i)=>{const o=joints.has(i)?new THREE.Bone():new THREE.Group();o.name=n.name;if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);return o;});
 json.nodes.forEach((n,i)=>n.children?.forEach(k=>objects[i].add(objects[k])));
 const root=new THREE.Group();objects.filter(o=>!o.parent).forEach(o=>root.add(o));
 const rig=new ITPerformance(root),actor={state:'Hidden',reactCorrect:true};
 let clock=0;
 for(const [state,seconds] of [['Hidden',.8],['PopUp',.42],['Active',.8],['React',4.2],['Retreat',.65],['Hidden',.8]]){
  actor.state=state;for(let t=0;t<seconds;t+=1/60){clock+=1/60;rig.update(actor,t,clock);for(const b of Object.values(rig.bones))assert.ok(b.quaternion.toArray().every(Number.isFinite));}
  if(state==='React')assert.equal(rig.diagnostics.clip,'reward');
 }
 assert.equal(rig.diagnostics.clip,'office');assert.equal(rig.gift.visible,false);
 assert.ok(rig.rewardTarget().toArray().every(Number.isFinite));
 for(const action of Object.values(rig.actions))for(const track of action.getClip().tracks){assert.ok(root.getObjectByName(track.name.split('.')[0]));assert.ok([...track.values].every(Number.isFinite));}
});
