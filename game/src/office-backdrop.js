import * as THREE from 'three';

export const OFFICE_BACKDROP='/backgrounds/office-sunset.jpg';

// The supplied portrait artwork is rendered unlit behind the interactive 3D layer.
export function installOfficeBackdrop(renderer,scene,host){
 host.style.backgroundColor='#d89969';
 host.style.backgroundImage=`url("${OFFICE_BACKDROP}")`;
 host.style.backgroundSize='cover';
 host.style.backgroundPosition='center center';
 host.style.backgroundRepeat='no-repeat';
 renderer.setClearColor(0x000000,0);
 scene.background=null;
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.ShadowMaterial({opacity:.16,depthWrite:false}));
 ground.name='backdrop-contact-shadow';ground.rotation.x=-Math.PI/2;ground.position.y=-.04;ground.receiveShadow=true;scene.add(ground);
 return ground;
}
