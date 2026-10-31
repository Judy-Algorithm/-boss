import {readFile,readdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,relative} from 'node:path';
import {loadEnv} from 'vite';

const root=fileURLToPath(new URL('../',import.meta.url)),errors=[];
async function files(dir){const found=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())found.push(...await files(path));else if(entry.isFile())found.push(path);else errors.push(`不支持上传的符号链接：${relative(root,path)}`);}return found;}
async function exists(path){try{return (await stat(path)).isFile();}catch{return false;}}
const config=JSON.parse(await readFile(join(root,'vercel.json'),'utf8'));
if(config.framework!=='vite'||config.outputDirectory!=='dist'||config.buildCommand!=='npm run build')errors.push('Vercel 构建配置不匹配');
for(const route of ['ai/status','private-chat','game-dialogue','round-review'])if(!await exists(join(root,`api/${route}.js`)))errors.push(`缺少函数入口：${route}`);
for(const path of ['index.html','it-motion.html'])if(!await exists(join(root,'dist',path)))errors.push(`缺少构建结果：dist/${path}，请先 npm run build`);

const publicFiles=await files(join(root,'public'));let total=0,largest=0;
for(const path of publicFiles){const size=(await stat(path)).size;total+=size;largest=Math.max(largest,size);if(size>=90*1024*1024)errors.push(`单文件过大，请先优化：${relative(root,path)}`);if(/(^|\/)\.env(?:\.|$)/.test(path))errors.push('public 中不能包含环境变量文件');}
const manifest=JSON.parse(await readFile(join(root,'public/models/manifest.json'),'utf8'));
for(const item of Object.values(manifest.models||manifest))if(item?.url?.startsWith('/')&&!await exists(join(root,'public',item.url)))errors.push(`缺少运行模型：${item.url}`);
for(const path of (await files(join(root,'src'))).filter(path=>/\.(js|css)$/.test(path))){
 const text=await readFile(path,'utf8');
 for(const match of text.matchAll(/['"`](\/(?:models|audio|backgrounds|fonts|portraits)\/[^'"`\r\n]*)['"`]/g)){
  const asset=match[1];if(asset.includes('${'))continue;
  if(!await exists(join(root,'public',asset)))errors.push(`缺少资源：${asset}（${relative(root,path)}）`);
 }
}

// Inspect the actual local secret without ever printing its value.
const env=loadEnv('production',root,''),key=process.env.AI_API_KEY||env.AI_API_KEY;
if(key)for(const path of [...publicFiles,...await files(join(root,'dist'))]){
 const content=await readFile(path);if(content.includes(Buffer.from(key))||content.includes(Buffer.from(JSON.stringify(key).slice(1,-1))))errors.push(`发现密钥进入公开产物：${relative(root,path)}`);
}
if(errors.length){for(const error of [...new Set(errors)])console.error(error);process.exitCode=1;}
else console.log(`部署文件检查通过：4 个 API 入口；${publicFiles.length} 个本地资源，合计 ${(total/1024/1024).toFixed(1)} MiB，最大单文件 ${(largest/1024/1024).toFixed(1)} MiB；构建资源完整${key?'，公开产物未包含本机 API Key':''}。`);
