import * as THREE from 'three';

export async function loadDetachedITProps(loader){
 const gltf=await loader.loadAsync('/models/it_rescuer_split.glb'),meshes=[];
 gltf.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
 if(meshes.length!==5)throw new Error('Unexpected IT split asset layout');
 const wrench=new THREE.Group();
 for(const i of [3,4]){const m=meshes[i].clone();m.geometry=m.geometry.clone();m.geometry.translate(-.553,.0,-.32);wrench.add(m);}
 // BANG split the handle around the original fingers; bridge that small grip gap.
 const handle=new THREE.Mesh(new THREE.CylinderGeometry(.036,.036,.18,12),new THREE.MeshStandardMaterial({color:'#284f88',roughness:.5}));handle.position.set(-.09,.20,.033);wrench.add(handle);
 for(const m of wrench.children)m.position.y-=.18;wrench.scale.setScalar(.82);
 const laptop=new THREE.Group(),m=meshes[0].clone();m.geometry=m.geometry.clone();const bounds=new THREE.Box3().setFromObject(m),center=bounds.getCenter(new THREE.Vector3());m.geometry.translate(-center.x,-bounds.min.y,-center.z);laptop.add(m);laptop.scale.setScalar(.40/bounds.getSize(new THREE.Vector3()).y);
 for(const g of [wrench,laptop])g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 wrench.name='it-independent-wrench';laptop.name='it-independent-laptop';
 return {wrench,laptop};
}
