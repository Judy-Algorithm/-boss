import {isIP} from 'node:net';
import {createPrivateChatMiddleware} from './private-chat-api.js';
import {readAIConfig} from './ai-config.js';

// Only the Vercel adapter trusts Vercel's proxy headers. Local Vite continues
// to use the socket address. This is a per-instance limit, not a global quota.
export function vercelClientAddress(req){
 const header=req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for'];
 const address=(Array.isArray(header)?header[0]:header)?.split(',')[0].trim();
 return isIP(address||'')?address:req.socket?.remoteAddress||'local';
}

export function createVercelHandler({getConfig=readAIConfig,fetchImpl=fetch}={}){
 const middleware=createPrivateChatMiddleware({getConfig,fetchImpl,getClientAddress:vercelClientAddress});
 return (req,res)=>middleware(req,res,()=>{
  res.statusCode=404;res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({code:'NOT_FOUND'}));
 });
}

export default createVercelHandler();
