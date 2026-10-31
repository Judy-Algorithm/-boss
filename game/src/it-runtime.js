import * as THREE from 'three';
import {ITCharacterController} from './it-character-controller.js';
import {installITExpressions} from './it-expressions.js';
import {loadDetachedITProps} from './it-detached-props.js';

export async function installEditableIT(actor,loader){
 const [gltf,props]=await Promise.all([loader.loadAsync('/models/it_rescuer_animation_rigged.glb'),loadDetachedITProps(loader)]);
 const bounds=new THREE.Box3().setFromObject(gltf.scene),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 if(!Number.isFinite(size.y)||size.y<=0)throw new Error('IT 模型尺寸异常');
 const model=new THREE.Group();gltf.scene.position.set(-center.x,-bounds.min.y,-center.z);model.add(gltf.scene);model.scale.setScalar(1.95/size.y);model.userData.animations=gltf.animations;
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
 actor.actor.add(model);
 try{const controller=new ITCharacterController(model,props);controller.expression=installITExpressions(model);controller.facialRig=controller.expression.enabled;
  actor.actor.remove(actor.model);actor.model=model;actor.height=1.95;actor.performance=controller;actor.loaded=true;
  props.laptop.position.set(-.75,.98,.28);props.laptop.rotation.set(-.10,.16,-.06);actor.station.add(props.laptop);
 }catch(error){model.removeFromParent();props.wrench.removeFromParent();throw error;}
}
