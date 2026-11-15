import * as T from '../node_modules/three/build/three.module.js';
import {RoundedBoxGeometry} from '../node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries,mergeVertices} from '../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
import {GLTFExporter} from '../node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs/promises';
import {NPCPerformance} from '../src/npc-performance.js';
import {characters} from '../src/characters.js';
// Build new visible geometry using the established 52-joint naming convention.
const original=await fs.readFile(new URL('../public/models/blame_shifter_rigged.glb',import.meta.url));
const meta=JSON.parse(original.subarray(20,20+original.readUInt32LE(12)));
const names=meta.skins[0].joints.map(i=>meta.nodes[i].name),bones=Object.fromEntries(names.map(n=>[n,new T.Bone()]));
const positions={Hips:[0,.57,0],Spine:[0,.69,0],Spine1:[0,.83,0],Spine2:[0,.98,0],Neck:[0,1.08,0],Head:[0,1.25,0]};
for(const [side,s] of [['Left',1],['Right',-1]]){
 Object.assign(positions,{[side+'Shoulder']:[s*.23,.99,0],[side+'Arm']:[s*.30,.96,0],[side+'ForeArm']:[s*.39,.80,.06],[side+'Hand']:[s*.40,.63,.12],[side+'UpLeg']:[s*.13,.55,0],[side+'Leg']:[s*.14,.32,0],[side+'Foot']:[s*.14,.11,.04],[side+'ToeBase']:[s*.14,.07,.18]});
 for(const [f,offset] of [['Thumb',-.04],['Index',-.02],['Middle',0],['Ring',.02],['Pinky',.04]])for(let i=1;i<=3;i++)positions[side+'Hand'+f+i]=[s*(.40+offset),.63-i*.025,.14];
}
const root=new T.Group();root.name='CoolCoworker_ReferenceChibi';
for(const name of names){const bone=bones[name];bone.name=name;const index=meta.nodes.findIndex(n=>n.name===name);const parentName=meta.nodes.find(n=>n.children?.includes(index))?.name;const parent=bones[parentName];const p=positions[name],q=positions[parentName]||[0,0,0];bone.position.fromArray(p.map((v,i)=>v-q[i]));(parent||root).add(bone);}
root.updateMatrixWorld(true);const skeleton=new T.Skeleton(names.map(n=>bones[n]));
const materials={skin:new T.MeshStandardMaterial({color:'#dca077',roughness:.48}),ear:new T.MeshStandardMaterial({color:'#d9917e',roughness:.55}),hair:new T.MeshStandardMaterial({color:'#20292a',roughness:.43}),hairLight:new T.MeshStandardMaterial({color:'#283234',roughness:.42}),shirt:new T.MeshStandardMaterial({color:'#22232b',roughness:.82}),pants:new T.MeshStandardMaterial({color:'#283c61',roughness:.8}),frame:new T.MeshStandardMaterial({color:'#111c21',roughness:.32}),lens:new T.MeshStandardMaterial({color:'#252431',roughness:.2,metalness:.22}),white:new T.MeshStandardMaterial({color:'#fff5df',roughness:.3}),mouth:new T.MeshStandardMaterial({color:'#80483c',roughness:.7}),hardware:new T.MeshStandardMaterial({color:'#46565b',roughness:.36,metalness:.25})};
const groups=new Map();let parts=0;
function add(geometry,material,bone='Head',position=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){
 const matrix=new T.Matrix4().compose(new T.Vector3(...position),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(...scale));
 geometry.applyMatrix4(matrix);if(geometry.index)geometry=geometry.toNonIndexed();geometry.deleteAttribute('uv');
 const count=geometry.attributes.position.count,indices=new Uint16Array(count*4),weights=new Float32Array(count*4),joint=names.indexOf(bone);
 for(let i=0;i<count;i++){indices[i*4]=joint;weights[i*4]=1;}
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 const list=groups.get(material)||[];list.push(geometry);groups.set(material,list);parts++;
}
function ell(mat,pos,scale,bone='Head',rot=[0,0,0]){add(new T.SphereGeometry(1,20,12),mat,bone,pos,scale,rot);}
function lock(mat,pos,scale,rot){const g=new T.SphereGeometry(1,20,12),p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)*(.75-.25*y)+.22*(y+1)*(y+1));p.setZ(i,p.getZ(i)*(.75-.25*y));}g.computeVertexNormals();add(g,mat,'Head',pos,scale,rot);}
function box(mat,pos,size,r=.03,bone='Head',rot=[0,0,0]){add(new RoundedBoxGeometry(...size,2,r),mat,bone,pos,[1,1,1],rot);}
function tube(mat,points,r,bone='Head'){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));add(new T.TubeGeometry(curve,16,r,6,false),mat,bone);}
// Small body, large soft cheeked head, friendly toy-like proportions.
ell('skin',[0,1.37,0],[.455,.43,.36]);
for(const s of [-1,1]){ell('skin',[s*.455,1.34,0],[.10,.145,.077]);ell('ear',[s*.493,1.34,.052],[.045,.086,.023]);}
ell('skin',[0,1.29,.333],[.043,.068,.041]);
// Swept-back black hair cap plus individually sculpted pointed locks.
ell('hair',[0,1.66,-.06],[.46,.30,.315]);
for(let i=0;i<11;i++){const a=i*.58;lock(i%3?'hair':'hairLight',[Math.sin(a)*.32,1.73+Math.cos(a*1.7)*.045,-.05+Math.cos(a)*.19],[.14,.25,.13],[.20,0,-.48+Math.sin(a)*.55]);}
for(const s of [-1,1]){ell('hair',[s*.392,1.51,-.06],[.075,.23,.23],'Head',[0,0,s*.08]);ell('hair',[s*.37,1.60,.19],[.105,.18,.11],'Head',[.25,0,s*.48]);}
ell('hair',[.04,1.75,.20],[.12,.22,.10],'Head',[.12,.1,-.53]);ell('hair',[-.14,1.68,.28],[.11,.18,.09],'Head',[.2,0,.4]);
// Separate sunglasses frame, inset lenses, diamond-shaped highlights and stern brows.
for(const s of [-1,1]){
 box('frame',[s*.205,1.405,.31],[.36,.235,.085],.067,'Head',[0,s*.07,s*.04]);
 box('lens',[s*.205,1.407,.357],[.302,.182,.018],.052,'Head',[0,s*.07,s*.04]);
 box('hair',[s*.198,1.555,.345],[.285,.037,.03],.015,'Head',[0,0,s*.23]);
 const star=new T.Shape();star.moveTo(0,.056);star.lineTo(.015,.016);star.lineTo(.045,0);star.lineTo(.015,-.015);star.lineTo(0,-.055);star.lineTo(-.015,-.015);star.lineTo(-.045,0);star.lineTo(-.015,.016);star.closePath();
 add(new T.ShapeGeometry(star),'white','Head',[s*.205,1.415,.374]);
 tube('frame',[[s*.365,1.45,.32],[s*.455,1.46,.14],[s*.46,1.38,-.01]],.016);
}
box('frame',[0,1.435,.35],[.09,.032,.032],.015);
tube('mouth',[[-.085,1.15,.335],[0,1.164,.346],[.085,1.15,.335]],.008);
// T-shirt and neckband; no tie or suit from the previous character.
box('shirt',[0,.805,0],[.53,.49,.33],.10,'Spine1');ell('shirt',[0,.61,0],[.27,.085,.17],'Hips');ell('skin',[0,1.065,0],[.12,.13,.12],'Neck');
tube('frame',[[-.14,1.06,.02],[-.16,1.02,.16],[0,.985,.19],[.16,1.02,.16],[.14,1.06,.02]],.025,'Neck');
for(const s of [-1,1]){box('hardware',[s*.15,1.015,.16],[.047,.12,.045],.02,'Neck',[0,0,-s*.25]);box('white',[s*.15,1.005,.185],[.008,.025,.004],.003,'Neck');}
ell('hardware',[-.485,1.35,.08],[.031,.05,.032]);tube('frame',[[-.485,1.34,.08],[-.45,1.14,.09],[-.16,1.03,.16]],.009);
// A subtle non-lettered white flourish on the chest.
tube('white',[[-.10,.855,.177],[-.04,.87,.182],[-.06,.82,.181],[.02,.85,.182],[.10,.84,.177]],.005,'Spine1');
for(const [side,s] of [['Left',1],['Right',-1]]){
 ell('shirt',[s*.29,.945,0],[.115,.13,.17],side+'Arm',[0,0,s*.27]);
 ell('skin',[s*.365,.845,.04],[.083,.145,.09],side+'Arm',[0,0,-s*.28]);
 ell('skin',[s*.40,.715,.095],[.078,.13,.08],side+'ForeArm');ell('skin',[s*.40,.61,.13],[.085,.105,.07],side+'Hand');ell('skin',[s*.335,.63,.15],[.04,.055,.043],side+'HandThumb1');
 box('pants',[s*.135,.37,0],[.235,.45,.29],.07,side+'UpLeg');box('pants',[s*.14,.20,.01],[.23,.19,.28],.05,side+'Leg');box('shirt',[s*.14,.085,.075],[.24,.14,.40],.055,side+'Foot');box('white',[s*.14,.025,.08],[.25,.045,.41],.02,side+'Foot');
 for(const y of [.109,.139])box('white',[s*.14,y,.205],[.13,.012,.02],.005,side+'Foot');
}
const matNames=[...groups.keys()],merged=mergeGeometries(matNames.map(n=>mergeGeometries(groups.get(n))),true);
const mesh=new T.SkinnedMesh(mergeVertices(merged,1e-5),matNames.map(n=>materials[n]));mesh.name='CoolCoworker_SkinnedBody';root.add(mesh);root.updateMatrixWorld(true);mesh.bind(skeleton);mesh.normalizeSkinWeights();
root.userData={assetId:'blame_shifter',version:2,design:'Reference chibi: swept black hair, star sunglasses, black tee, neckband earphones',bones:names.length,parts};
const rig=new NPCPerformance(root,characters.find(c=>c.id==='blame_shifter'));
const animations=Object.values(rig.actions).map(a=>a.getClip());
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}};
const output=await new GLTFExporter().parseAsync(root,{binary:true,animations,onlyVisible:false});
const dest=new URL('../public/models/blame_shifter_rigged.glb',import.meta.url);await fs.writeFile(dest,Buffer.from(output));
console.log(JSON.stringify({path:dest.pathname,bytes:output.byteLength,bones:names.length,animations:animations.length,parts,vertices:merged.attributes.position.count,triangles:merged.attributes.position.count/3}));

const report={assetId:'blame_shifter',designVersion:2,source:'game/scripts/build-cool-coworker.mjs',bytes:output.byteLength,vertices:mesh.geometry.attributes.position.count,triangles:mesh.geometry.index.count/3,images:[],animations:animations.length,meshCount:1,rigged:true,bones:names.length,materials:matNames};
const crypto=await import('node:crypto');report.sha256=crypto.createHash('sha256').update(Buffer.from(output)).digest('hex');
const manifestPath=new URL('../public/models/manifest.json',import.meta.url),manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
const entry=manifest.models.find(m=>m.id==='blame_shifter');Object.assign(entry,report);delete entry.nodeTransforms;delete entry.sourceBytes;
const bounds=new T.Box3().setFromObject(root);entry.bounds={min:bounds.min.toArray(),max:bounds.max.toArray(),size:bounds.getSize(new T.Vector3()).toArray()};
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');await fs.writeFile(new URL('../art/characters/blame-shifter/asset.json',import.meta.url),JSON.stringify({...report,reference:'User-supplied avatar; concept.png is design guidance, portrait-render.png is rendered from the actual GLB.',clips:animations.map(a=>a.name)},null,2)+'\n');
