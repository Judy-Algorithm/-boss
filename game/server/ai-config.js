// Server-only in both Vite and Vercel. Never expose these via VITE_* variables.
export function readAIConfig(primary=process.env,fallback={}){
 return {
  key:primary.AI_API_KEY||fallback.AI_API_KEY,
  baseURL:primary.AI_BASE_URL||fallback.AI_BASE_URL||'https://vibetoken.cn/v1',
  model:primary.AI_MODEL||fallback.AI_MODEL
 };
}
