import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const mats=new Map();
function material(color){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.8}));return mats.get(color)}
export function box(parent,w,h,d,color,x=0,y=0,z=0,r=.04){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
export function flattenSolid(root){root.updateMatrixWorld(true);const geos=[];let textured=false;root.traverse(o=>{if(o.isMesh){const ms=Array.isArray(o.material)?o.material:[o.material];if(ms.some(m=>m.map))textured=true}});if(textured)return root;
 root.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!g.attributes.normal)g.computeVertexNormals();const cols=new Float32Array(g.attributes.position.count*3);const ms=Array.isArray(o.material)?o.material:[o.material];const groups=g.groups.length?g.groups:[{start:0,count:g.attributes.position.count,materialIndex:0}];for(const group of groups){const m=ms[group.materialIndex]||ms[0],c=m.color||new THREE.Color('white');for(let i=group.start;i<Math.min(cols.length/3,group.start+group.count);i++){cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b}}for(const key of Object.keys(g.attributes))if(!['position','normal'].includes(key))g.deleteAttribute(key);g.setAttribute('color',new THREE.BufferAttribute(cols,3));g.clearGroups();geos.push(g)});
 if(!geos.length)return root;const geom=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geom,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.02}));mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
function canvasMap(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
function wallSign(parent,text,w,h,x,y,z){const tex=canvasMap(768,384,(c,W,H)=>{c.fillStyle='#fff6dd';c.fillRect(0,0,W,H);c.strokeStyle='#b49b6e';c.lineWidth=18;c.strokeRect(8,8,W-16,H-16);c.textAlign='center';c.fillStyle='#476153';c.font='bold 67px "PingFang SC",sans-serif';text.split('\n').forEach((line,i)=>c.fillText(line,W/2,110+i*88));c.fillStyle='#d69568';c.font='42px sans-serif';c.fillText('✧   ( ˘ ᵕ ˘ )   ✧',W/2,H-45)});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));mesh.position.set(x,y,z);parent.add(mesh);return mesh}
export function buildOffice(scene,{focus=false}={}){
 const back=focus?-3.9:-7.65;
 const wood=canvasMap(512,512,(c,w,h)=>{
  let seed=17;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  c.fillStyle='#b67d51';c.fillRect(0,0,w,h);
  for(let row=0;row<4;row++){const y=row*128;const grad=c.createLinearGradient(0,y,0,y+127);grad.addColorStop(0,['#c98e5b','#dba66e','#c7925d','#d7a16b'][row]);grad.addColorStop(.5,['#daa16a','#e4b37c','#dba672','#e0b17c'][row]);grad.addColorStop(1,'#bd8756');c.fillStyle=grad;c.fillRect(0,y,512,127);c.fillStyle='#845735';c.fillRect(0,y+126,512,2);c.fillStyle='#f6cc9b55';c.fillRect(0,y+2,512,2);
   for(let k=0;k<65;k++){const yy=y+rand()*124;c.strokeStyle=k%3?'#69452c10':'#ffe4b929';c.lineWidth=.5+rand();c.beginPath();c.moveTo(0,yy);c.bezierCurveTo(130,yy+rand()*6,330,yy-rand()*6,512,yy+rand()*3);c.stroke();}
   const joint=(row%3)*170;c.fillStyle='#8c5e3c88';c.fillRect(joint,y,1,128);
  }
 });wood.wrapS=wood.wrapT=THREE.RepeatWrapping;wood.repeat.set(2,4);
 const floor=new THREE.Mesh(new THREE.BoxGeometry(8.6,.18,16.2),new THREE.MeshStandardMaterial({map:wood,roughness:.6}));floor.position.set(0,-.12,.25);floor.receiveShadow=true;scene.add(floor);
 box(scene,8.6,5.5,.16,'#ac777f',0,2.65,back);
 box(scene,.15,4.1,5.7,'#b98181',-4.28,1.97,back+2.8);box(scene,.15,4.1,5.7,'#a9717f',4.28,1.97,back+2.8);
 box(scene,8.5,.23,.21,'#72505b',0,.10,back+.11);
 const sky=canvasMap(1024,768,(c,w,h)=>{
  const grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#6154c6');grad.addColorStop(.4,'#c07ccf');grad.addColorStop(.7,'#ffbd9d');grad.addColorStop(1,'#ffd797');c.fillStyle=grad;c.fillRect(0,0,w,h);
  for(let i=0;i<8;i++){c.fillStyle=i%2?'#ffbca955':'#ffd4ac66';c.beginPath();c.ellipse(i*147-40,130+(i%3)*70,100,24+i*3,-.2,0,7);c.fill();}
  const halo=c.createRadialGradient(750,320,20,750,320,180);halo.addColorStop(0,'#fff3bedd');halo.addColorStop(1,'#ffca9a00');c.fillStyle=halo;c.fillRect(500,80,500,500);
  for(let layer=0;layer<2;layer++)for(let i=0;i<23;i++){const bw=30+(i%4)*14,bh=80+(i*71%260),x=i*51-20,y=h-bh-(layer?0:75);c.fillStyle=layer?(i%2?'#6a67aa':'#7e6ab4'):'#a48bc5';c.fillRect(x,y,bw,bh+100);for(let yy=y+14;yy<h;yy+=24)for(let xx=x+8;xx<x+bw-4;xx+=14){c.fillStyle=(xx+yy+i)%3?'#ffcf94':'#bdaee7';c.fillRect(xx,yy,5,10);}}
 });
 const window=new THREE.Mesh(new THREE.PlaneGeometry(6.1,3.8),new THREE.MeshBasicMaterial({map:sky,toneMapped:false}));window.position.set(-.1,3.1,back+.11);scene.add(window);
 for(const x of [-3.2,-1.15,1.0,3.0])box(scene,.09,3.97,.13,'#dbaa78',x,3.1,back+.19,.02);for(const y of [1.17,5.05])box(scene,6.45,.11,.18,'#efc68c',-.1,y,back+.21,.02);
 box(scene,6.7,.15,.49,'#cf9864',-.1,1.14,back+.27);
 for(const x of [-3.58,3.38]){box(scene,.55,4.2,.22,'#8d506a',x,3.0,back+.23,.06);for(let k=0;k<6;k++)box(scene,.06,4.15,.28,k%2?'#a05f7b':'#bc7d8a',x-.23+k*.085,3.0,back+.30,.025);}
 const board=new THREE.Group();board.position.set(3.13,2.30,back+1.0);board.rotation.y=-.20;scene.add(board);box(board,1.85,1.55,.13,'#c4905c',0,0,0,.05);wallSign(board,'今天也要\n好好摸鱼！',1.69,1.39,0,0,.075);for(const x of [-.65,.65])box(board,.045,1.27,.045,'#a27e60',x,-1.30,0,.01);
 for(const x of [-3.5,3.5]){
  const shade=new THREE.Mesh(new THREE.CylinderGeometry(.22,.37,.37,24,1,true),new THREE.MeshStandardMaterial({color:'#ffd5a1',emissive:'#f1a858',emissiveIntensity:.4,side:THREE.DoubleSide,roughness:.75}));shade.position.set(x,3.7,back+1.5);scene.add(shade);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.11,12,8),new THREE.MeshBasicMaterial({color:'#fff0be'}));bulb.position.set(x,3.5,back+1.5);scene.add(bulb);
  const light=new THREE.PointLight('#ffbd73',2.2,5,2);light.position.copy(bulb.position);scene.add(light);
 }
 const foreground=new THREE.Group();foreground.position.set(0,.70,8.25);scene.add(foreground);box(foreground,8.4,.24,2.1,'#b77a4e',0,0,0,.08);const top=box(foreground,8.25,.05,2.0,'#edbd84',0,.15,0,.02);const tableWood=wood.clone();tableWood.repeat.set(1,1);top.material=new THREE.MeshStandardMaterial({map:tableWood,roughness:.42});
 const mug=new THREE.Group();mug.position.set(-2.55,.87,focus?6.2:8.2);scene.add(mug);const cup=new THREE.Mesh(new THREE.CylinderGeometry(.24,.19,.34,20),material('#f8d4af'));cup.position.y=.18;cup.castShadow=true;mug.add(cup);const coffee=new THREE.Mesh(new THREE.CircleGeometry(.212,20),material('#5e3727'));coffee.rotation.x=-Math.PI/2;coffee.position.y=.354;mug.add(coffee);const handle=new THREE.Mesh(new THREE.TorusGeometry(.12,.035,7,16),material('#f8d4af'));handle.position.set(-.23,.2,0);mug.add(handle);
 for(let i=0;i<3;i++)box(scene,.55,.03,.8,i===1?'#d2c8a4':'#f7dfbb',2.8,.9+i*.035,focus?6.1:8.1,.01);
 return {foreground};
}
export function finishStaticBatch(scene,exclude){const meshes=[];scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isMesh&&!exclude(o)&&!Array.isArray(o.material)&&!o.material.map&&!o.material.vertexColors&&!o.material.clippingPlanes?.length)meshes.push(o)});const grouped=new Map();for(const m of meshes){const key=m.material.uuid;const arr=grouped.get(key)||[];arr.push(m);grouped.set(key,arr)}for(const arr of grouped.values()){if(arr.length<2)continue;const geos=arr.map(m=>{const g=m.geometry.clone();g.applyMatrix4(m.matrixWorld);return g});const geom=mergeGeometries(geos,false);if(!geom){geos.forEach(g=>g.dispose());continue}const m=new THREE.Mesh(geom,arr[0].material);m.castShadow=arr.some(o=>o.castShadow);m.receiveShadow=true;scene.add(m);arr.forEach(o=>o.removeFromParent());geos.forEach(g=>g.dispose())}}
