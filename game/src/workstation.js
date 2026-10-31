import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const OFFICE_LAYOUT={rowSpacing:2.6,columnX:1.10,actorZ:-.62,deskTop:.92,counterRear:.53,counterFront:.99};
export const COUNTER_BOUNDS=new THREE.Box3(new THREE.Vector3(-1.02,.84,.53),new THREE.Vector3(1.02,.99,.99));
const cache=new Map();
function material(color,metal=false){const key=color+metal;if(!cache.has(key))cache.set(key,new THREE.MeshStandardMaterial({color,roughness:metal?.3:.46,metalness:metal?.32:0}));return cache.get(key);}
function block(g,w,h,d,c,x,y,z,r=.025,metal=false){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),material(c,metal));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;}
function cylinder(g,r,h,c,x,y,z){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),material(c));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;}
function surface(kind,color){
 const key=kind+color;if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=kind==='wood'?128:256;const c=canvas.getContext('2d');c.fillStyle=color;c.fillRect(0,0,canvas.width,canvas.height);
 let seed=37;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 if(kind==='wood'){for(let i=0;i<100;i++){const y=rand()*128;c.strokeStyle=i%3?'#5e321f24':'#ffe4ae35';c.lineWidth=.6+rand()*1.1;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(160,y+rand()*5,320,y-rand()*5,512,y);c.stroke();}}
 else {for(let i=0;i<256;i+=3){c.strokeStyle=i%2?'#fff8e816':'#3b4a3313';c.beginPath();c.moveTo(0,i);c.lineTo(512,i);c.stroke();}for(let i=0;i<512;i+=3){c.strokeStyle='#fff5de0c';c.beginPath();c.moveTo(i,0);c.lineTo(i,256);c.stroke();}}
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 const m=new THREE.MeshStandardMaterial({map,roughness:kind==='wood'?.50:.9,metalness:0});cache.set(key,m);return m;
}
function batchStation(g){
 g.updateMatrixWorld(true);const inverse=g.matrixWorld.clone().invert(),groups=new Map();g.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)){const list=groups.get(o.material)||[];list.push(o);groups.set(o.material,list);}});
 for(const [material,meshes] of groups){if(meshes.length<2)continue;const geometries=meshes.map(m=>m.geometry.clone().applyMatrix4(inverse.clone().multiply(m.matrixWorld))),geometry=mergeGeometries(geometries,false);geometries.forEach(x=>x.dispose());if(!geometry)continue;const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;meshes.forEach(x=>x.removeFromParent());g.add(m);}
}
export function batchWorkstations(scene,roots){
 const groups=new Map();scene.updateMatrixWorld(true);
 for(const root of roots)root.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)){const list=groups.get(o.material)||[];list.push(o);groups.set(o.material,list);}});
 for(const [material,meshes] of groups){if(meshes.length<2)continue;const geos=meshes.map(o=>o.geometry.clone().applyMatrix4(o.matrixWorld)),geometry=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(!geometry)continue;const mesh=new THREE.Mesh(geometry,material);mesh.name='office-static-batch';mesh.castShadow=true;mesh.receiveShadow=true;meshes.forEach(o=>o.removeFromParent());scene.add(mesh);}
}
function noteMap(index){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle=index%2?'#f8d988':'#ffd997';c.fillRect(0,0,256,256);c.fillStyle='#4e384c';c.font='bold 37px "PingFang SC",sans-serif';c.textAlign='center';const words=['老板','DDL','摸鱼','甩锅','实习生','IT救援侠','HR','财务','橘猫','画饼'];c.fillText(words[index]||'摸鱼',128,76);c.strokeStyle=['#e77c9a','#7672b5','#78a9a1'][index%3];c.lineWidth=9;c.beginPath();c.moveTo(67,184);c.lineTo(67,128);c.lineTo(102,153);c.lineTo(135,117);c.lineTo(188,133);c.stroke();const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;}

// A seated bay is open behind the front counter. The desk never occupies the actor's seat.
export function buildWorkstation(parent,index){
 const g=new THREE.Group();g.name='open-seat-workstation';parent.add(g);
 const panel=index%2?'#ad713b':'#b87c42';
 const frame='#774728',trim='#d6a165';
 block(g,2.16,.07,1.87,'#885536',0,.045,.06,.025);
 const apron=block(g,2.12,.12,.46,frame,0,.90,.76,.04);apron.material=surface('wood',frame);
 const top=block(g,2.08,.025,.43,'#dba768',0,.973,.76,.018);top.material=surface('wood','#dba768');
 const front=block(g,2.13,.88,.08,panel,0,.49,1.0,.035);front.material=surface('wood',panel);
 block(g,2.15,.065,.11,trim,0,.96,1.0,.025);
 // Rounded timber frame, inset wooden panel and small brass fittings.
 for(const x of [-1.015,1.015]){const stile=block(g,.065,.77,.018,frame,x,.52,1.05,.012);stile.material=surface('wood',frame);}
 const rail=block(g,2.06,.055,.018,frame,0,.19,1.05,.012);rail.material=surface('wood',frame);
 const plinth=block(g,2.14,.14,.10,frame,0,.15,1.005,.025);plinth.material=surface('wood',frame);
 for(const x of [-1.055,1.055]){
  const side=block(g,.075,1.02,2.54,panel,x,.55,-.30,.025);side.material=surface('wood',panel);
  const cap=block(g,.10,.055,2.60,trim,x,1.07,-.30,.025);cap.material=surface('wood',trim);
  const post=block(g,.075,1.10,.075,frame,x,.57,1.0,.022);post.material=surface('wood',frame);
  const ledge=block(g,.21,.08,.68,'#d8a56d',Math.sign(x)*.93,.90,.19,.025);ledge.material=surface('wood','#d8a56d');
 }
 // Front pocket, labels and rivets provide detail without covering the face.
 const label=new THREE.Mesh(new THREE.PlaneGeometry(.43,.43),new THREE.MeshStandardMaterial({map:noteMap(index),roughness:.8}));label.position.set(-.65,.65,1.046);label.rotation.z=index%2?.08:-.07;g.add(label);
 for(const [x,y,c] of [[.58,.67,'#edb0b9'],[.79,.51,'#c8c0e1'],[.34,.46,'#c8d7bc']])block(g,.13,.15,.007,c,x,y,1.047,.003);
 for(const x of [-.99,.99])for(const y of [.13,.87]){const screw=new THREE.Mesh(new THREE.SphereGeometry(.017,8,6),material('#c9954c',true));screw.scale.z=.35;screw.position.set(x,y,1.047);g.add(screw);}
 // Decorative objects stay on the two side ledges, leaving the central silhouette open.
 for(const x of [-.82,.81]){
  cylinder(g,.071,.15,x<0?'#fff0d2':'#cfb88e',x,1.055,.75);
  if(x<0){cylinder(g,.054,.008,'#80543b',x,1.135,.75);const handle=new THREE.Mesh(new THREE.TorusGeometry(.04,.011,6,12),material('#ffe1b2'));handle.position.set(x-.075,1.055,.75);g.add(handle);}
  else for(let k=0;k<5;k++){const p=cylinder(g,.009,.24,['#ce6d96','#628da1','#dfad58','#9173ac','#a9bb79'][k],x-.035+(k%3)*.03,1.20,.72+Math.floor(k/3)*.04);p.rotation.z=(k-2)*.08;}
 }
 for(let i=0;i<3;i++)block(g,.25,.025,.26,i%2?'#a9b89b':'#f4dfb8',-.77,1.0+i*.026,.28,.008);
 // Small blue desk mat, no extra freestanding monitor.
 block(g,.61,.012,.25,'#8a6045',0,.993,.75,.025);
 // The oversized chibi bodies sit lower/deeper than a standard chair fits.
 // Omit the hidden chair geometry: its back and seat projected through torsos.
 batchStation(g);return {group:g,counterBounds:COUNTER_BOUNDS.clone(),seatZ:OFFICE_LAYOUT.actorZ};
}
