import * as THREE from 'three';
const ellipse=(x,y,cx,cy,rx,ry)=>{const r=((x-cx)/rx)**2+((y-cy)/ry)**2;return r<1?(1-r)**2:0;};

// Small, local blend shapes for eyelids and mouth. Glasses and hair stay outside the masks.
export function installITExpressions(model){
 model.updateMatrixWorld(true);const meshes=[],actor=model.parent,point=new THREE.Vector3();let lidVertices=0;
 model.traverse(mesh=>{
  if(!mesh.isSkinnedMesh)return;const geometry=mesh.geometry.clone(),pos=geometry.attributes.position;
  const deltas=Array.from({length:3},()=>new Float32Array(pos.count*3)),inverse=mesh.matrixWorld.clone().invert();
  const origin=actor.localToWorld(new THREE.Vector3()),up=actor.localToWorld(new THREE.Vector3(0,1,0)).sub(origin),right=actor.localToWorld(new THREE.Vector3(1,0,0)).sub(origin);
  const upLocal=up.clone().transformDirection(inverse).multiplyScalar(1/mesh.getWorldScale(new THREE.Vector3()).y),rightLocal=right.clone().transformDirection(inverse).multiplyScalar(1/mesh.getWorldScale(new THREE.Vector3()).x);
  for(let i=0;i<pos.count;i++){
   point.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);actor.worldToLocal(point);const {x,y,z}=point;
   if(y<1.04||y>1.63||z<.17||z>.43)continue;
   const depth=THREE.MathUtils.smoothstep(z,.17,.27)*(1-THREE.MathUtils.smoothstep(z,.39,.43));
   const lidMask=(cx)=>{const r=Math.sqrt(((x-cx)/.098)**2+((y-1.302)/.061)**2);return (1-THREE.MathUtils.smoothstep(r,.68,1.03))*THREE.MathUtils.smoothstep(z,.17,.23)*(1-THREE.MathUtils.smoothstep(z,.33,.355));};const lids=lidMask(-.15)+lidMask(.15);
   const mouth=ellipse(x,y,0,1.155,.12,.065)*depth;
   const brow=(ellipse(x,y,-.18,1.47,.14,.055)+ellipse(x,y,.18,1.47,.14,.055))*depth;
   if(lids>.05)lidVertices++;
   const dy=(1.282-y)*lids*.97;const blink=upLocal.clone().multiplyScalar(dy);blink.toArray(deltas[0],i*3);
   const smile=rightLocal.clone().multiplyScalar(x*.12*mouth).addScaledVector(upLocal,(Math.abs(x)*.12-.006)*mouth);smile.toArray(deltas[1],i*3);
   const surprise=upLocal.clone().multiplyScalar((y-1.155)*.38*mouth+brow*.025);surprise.toArray(deltas[2],i*3);
  }
  geometry.morphTargetsRelative=true;geometry.morphAttributes.position=deltas.map(a=>new THREE.BufferAttribute(a,3));mesh.geometry=geometry;mesh.updateMorphTargets();mesh.morphTargetDictionary={blink:0,smile:1,surprise:2};meshes.push(mesh);
 });
 let override=null;return {enabled:lidVertices>10,lidVertices,meshes,setOverride(value){override=value;},update(phase,t,clock){
  const tick=(clock+1.2)%3.7,blink=tick<.16?Math.sin(tick/.16*Math.PI):0;
  const smile=phase==='reward'?THREE.MathUtils.smoothstep(t,.38,.8)*(1-THREE.MathUtils.smoothstep(t,3.1,3.7))*.75:0;
  const surprise=phase==='reward'?Math.exp(-Math.pow((t-.48)/.20,2)):phase==='wrong'?Math.exp(-t*3)*.5:0;
  for(const mesh of meshes){mesh.morphTargetInfluences[0]=override==='blink'?1:blink;mesh.morphTargetInfluences[1]=override==='smile'?1:smile;mesh.morphTargetInfluences[2]=override==='surprise'?1:surprise;}
 }};
}
