import * as THREE from 'three';

export const NPC_SEAT_OFFSETS={passing_intern:-.40,deadline_officer:-.28};
// DDL's bun needs extra clearance so her face stays above the counter even at rest.
export const NPC_HEAD_FITS={
 deadline_officer:{width:1.06,height:.98,top:1.91},
 hr_specialist:{width:1.35,height:1.25,top:1.72}
};

// Signature props must not determine a character's screen size.
export function fitCharacterHead(root,{width=1.22,height=1.13,top=1.65,apply=true}={}){
 root.updateMatrixWorld(true);const head=new THREE.Box3(),p=new THREE.Vector3();let count=0;
 root.traverse(mesh=>{
  if(!mesh.isSkinnedMesh)return;
  const headIndex=mesh.skeleton.bones.findIndex(b=>b.name==='Head'),j=mesh.geometry.attributes.skinIndex,w=mesh.geometry.attributes.skinWeight;
  if(headIndex<0||!j||!w)return;
  for(let i=0;i<j.count;i++){
   let weight=0;for(let c=0;c<4;c++)if(j.getComponent(i,c)===headIndex)weight+=w.getComponent(i,c);
   if(weight<.35)continue;
   mesh.getVertexPosition(i,p);mesh.localToWorld(p);if(root.parent)root.parent.worldToLocal(p);head.expandByPoint(p);count++;
  }
 });
 if(count<20||head.isEmpty())return null;
 const size=head.getSize(new THREE.Vector3()),center=head.getCenter(new THREE.Vector3());
 const factor=THREE.MathUtils.clamp(Math.min(width/size.x,height/size.y),.70,1.65);
 if(apply){root.scale.multiplyScalar(factor);root.position.x-=center.x*factor;root.position.y+=top-head.max.y*factor;root.position.z+=.03-center.z*factor;root.updateMatrixWorld(true);}
 const result={factor,headWidth:size.x*factor,headHeight:size.y*factor,headTop:top,headVertices:count,offsetY:top-head.max.y*factor,offsetX:-center.x*factor,offsetZ:.03-center.z*factor};root.userData.characterFit=result;return result;
}
