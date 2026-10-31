import {defineConfig,loadEnv} from 'vite';
import {fileURLToPath} from 'node:url';
import {privateChatPlugin} from './server/private-chat-api.js';
import {readAIConfig} from './server/ai-config.js';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,fileURLToPath(new URL('.',import.meta.url)),'');
 return {plugins:[privateChatPlugin(()=>readAIConfig(process.env,env))],build:{rollupOptions:{input:{game:fileURLToPath(new URL('./index.html',import.meta.url)),motion:fileURLToPath(new URL('./it-motion.html',import.meta.url))}}}};
});
