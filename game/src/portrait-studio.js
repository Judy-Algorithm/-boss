import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {characters} from './characters.js';

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setSize(256,256);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;pmrem.dispose();
const manifest=await fetch('/models/manifest.json').then(r=>r.json());
const entries=manifest.models||manifest,loader=new GLTFLoader();
for(const [index,c] of characters.entries()){
 try{
  const entry=entries.find(m=>m.id===c.id),gltf=await loader.loadAsync(entry.url),scene=new THREE.Scene();scene.background=new THREE.Color('#f3ddb7');scene.environment=environment;scene.environmentIntensity=.6;
  scene.add(new THREE.HemisphereLight('#fff2de','#9c819a',1.2));const key=new THREE.DirectionalLight('#ffe9cf',2.8);key.position.set(-2,4,6);scene.add(key);const rim=new THREE.DirectionalLight('#cbc1ff',1.4);rim.position.set(3,3,-3);scene.add(rim);
  const root=gltf.scene;scene.add(root);root.updateMatrixWorld(true);root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();if(o.isMesh)o.frustumCulled=false;});
  const head=new THREE.Box3(),point=new THREE.Vector3();let count=0;
  root.traverse(mesh=>{
   if(!mesh.isSkinnedMesh)return;
   const joint=mesh.skeleton.bones.findIndex(b=>b.name==='Head'),indices=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight;
   if(joint<0||!indices||!weights)return;
   for(let i=0;i<indices.count;i++){let weight=0;for(let k=0;k<4;k++)if(indices.getComponent(i,k)===joint)weight+=weights.getComponent(i,k);if(weight<.45)continue;mesh.getVertexPosition(i,point);mesh.localToWorld(point);head.expandByPoint(point);count++;}
  });
  if(count<20){head.setFromObject(root);head.min.y=THREE.MathUtils.lerp(head.min.y,head.max.y,.45);}
  const size=head.getSize(new THREE.Vector3()),center=head.getCenter(new THREE.Vector3()),span=Math.max(size.x,size.y)*(c.id==='it_rescuer'?.91:1.10);if(c.id==='it_rescuer'){center.x-=size.x*.09;center.y+=size.y*.13;}
  const camera=new THREE.OrthographicCamera(-span/2,span/2,span/2,-span/2,.01,100);camera.position.set(center.x,center.y+.025*span,center.z+Math.max(4,span*3));camera.lookAt(center);renderer.render(scene,camera);
  const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.className='portrait-image';img.dataset.character=c.id;img.alt=c.name+'头像';img.width=img.height=256;img.src=renderer.domElement.toDataURL('image/png');caption.textContent=c.name;figure.append(img,caption);document.getElementById('portraits').append(figure);
  document.getElementById('status').textContent=`已生成 ${index+1}/${characters.length}`;
 }catch(error){document.getElementById('status').textContent=`头像生成失败：${c.name}`;console.error(error);throw error;}
}
document.getElementById('status').textContent='十位角色头像已生成';
