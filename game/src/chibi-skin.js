import * as THREE from 'three';

const HEAD_BANDS={overtime_boss:[.39,.55],deadline_officer:[.46,.60],slacker_ally:[.43,.58],blame_shifter:[.44,.59],passing_intern:[.44,.60],hr_specialist:[.49,.65],finance_manager:[.42,.58],office_orange_cat:[.40,.56],promise_maker:[.43,.59]};

// Auto-rigging small torsos can put a chibi's entire head on Spine2.
// Repair only upper central vertices dominated by the torso; keep arm/prop weights.
export function repairChibiHeadWeights(root,id){
 if(!HEAD_BANDS[id])return {repaired:0};let repaired=0,headVertices=0;
 root.traverse(mesh=>{
  if(!mesh.isSkinnedMesh)return;const bones=mesh.skeleton.bones,head=bones.findIndex(b=>b.name==='Head');if(head<0)return;
  let geo=mesh.geometry,indices=geo.attributes.skinIndex,weights=geo.attributes.skinWeight,valid=0;
  for(let i=0;i<indices.count;i++){for(let c=0;c<4;c++)if(indices.getComponent(i,c)===head&&weights.getComponent(i,c)>.35){valid++;break;}}
  if(valid>geo.attributes.position.count*.08){headVertices+=valid;return;}
  geo=geo.clone();indices=indices.clone();weights=weights.clone();geo.setAttribute('skinIndex',indices);geo.setAttribute('skinWeight',weights);mesh.geometry=geo;geo.computeBoundingBox();
  const bounds=geo.boundingBox,size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),position=geo.attributes.position;
  const [low,high]=HEAD_BANDS[id];
  for(let i=0;i<position.count;i++){
   const yn=(position.getY(i)-bounds.min.y)/size.y,xn=Math.abs(position.getX(i)-center.x)/size.x;
   const values=[];let torso=0;
   for(let c=0;c<4;c++){const joint=indices.getComponent(i,c),weight=weights.getComponent(i,c);values.push([joint,weight]);if(/^(Spine\d*|Head|Neck|.*Shoulder)$/.test(bones[joint]?.name||''))torso+=weight;}
   if(torso<.55||yn<low||xn>.49)continue;
   const alpha=THREE.MathUtils.smoothstep(yn,low,high);if(alpha<.01)continue;
   const map=new Map();for(const [joint,w] of values)map.set(joint,(map.get(joint)||0)+w*(1-alpha));map.set(head,(map.get(head)||0)+alpha);
   const sorted=[...map].sort((a,b)=>b[1]-a[1]).slice(0,4),total=sorted.reduce((s,x)=>s+x[1],0);
   for(let c=0;c<4;c++){indices.setComponent(i,c,sorted[c]?.[0]||0);weights.setComponent(i,c,(sorted[c]?.[1]||0)/total);}
   repaired++;if((map.get(head)||0)>.35)headVertices++;
  }
  indices.needsUpdate=weights.needsUpdate=true;mesh.normalizeSkinWeights();
 });
 const report={repaired,headVertices};root.userData.chibiSkin=report;return report;
}
