export const POSE_KEY='shushu.it-pose.v1';
export const POSE_FIELDS={
 headPitch:['低头 / 抬头',-25,25,1,0,'头部'],headYaw:['左右转头',-30,30,1,0,'头部'],headRoll:['头部侧倾',-30,30,1,0,'头部'],headMotion:['头部晃动幅度',0,1,.05,0,'头部'],
 handX:['拿扳手的手 · 左右',-.18,.18,.01,0,'手臂'],handY:['拿扳手的手 · 高低',-.18,.2,.01,0,'手臂'],handZ:['拿扳手的手 · 前后',-.18,.18,.01,0,'手臂'],elbowOut:['手肘向外',-.25,.35,.01,0,'手臂'],
 wristPitch:['手腕俯仰',-70,70,1,0,'手腕与扳手'],wristYaw:['手腕转向',-70,70,1,0,'手腕与扳手'],wristRoll:['手腕旋转',-80,80,1,0,'手腕与扳手'],
 toolPitch:['扳手俯仰',-90,90,1,-3,'手腕与扳手'],toolYaw:['扳手转向',-90,90,1,0,'手腕与扳手'],toolRoll:['扳手侧倾',-90,90,1,-12,'手腕与扳手'],grip:['握手程度',0,1,.05,.7,'手腕与扳手'],
 gripX:['握点 · 左右',-.12,.12,.005,0,'握点微调'],gripY:['握点 · 高低',-.12,.12,.005,0,'握点微调'],gripZ:['握点 · 前后',-.12,.12,.005,0,'握点微调']
};
export const DEFAULT_POSE=Object.freeze(Object.fromEntries(Object.entries(POSE_FIELDS).map(([key,v])=>[key,v[4]])));
export function normalizePose(input){const data=input?.pose||input||{};return Object.fromEntries(Object.entries(POSE_FIELDS).map(([key,[,min,max]])=>{const v=data[key];return[key,typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):DEFAULT_POSE[key]];}));}
export function loadPose(storage=typeof localStorage==='undefined'?null:localStorage){try{return normalizePose(JSON.parse(storage?.getItem(POSE_KEY)||'null'));}catch{return {...DEFAULT_POSE};}}
let current=loadPose();
export function getPose(){return current;}
export function setPose(pose){current=normalizePose(pose);return current;}
export function savePose(storage=typeof localStorage==='undefined'?null:localStorage){if(!storage)throw new Error('无法访问浏览器存储，请导出参数文件。');storage.setItem(POSE_KEY,JSON.stringify({version:1,pose:current}));}
if(typeof window!=='undefined')window.addEventListener('storage',e=>{if(e.key===POSE_KEY)current=loadPose();});
