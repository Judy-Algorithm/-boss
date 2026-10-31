// Both upstream OpenAI chunks and our local relay use SSE. Decode UTF-8 incrementally.
export async function* readSSE(body){
 const reader=body.getReader(),decoder=new TextDecoder();let buffer='';
 try{while(true){const {done,value}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});buffer=buffer.replace(/\r\n/g,'\n');
   let boundary;while((boundary=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);let event='message';const lines=[];for(const line of frame.split('\n')){if(line.startsWith('event:'))event=line.slice(6).trim();if(line.startsWith('data:'))lines.push(line.slice(5).trimStart());}if(lines.length){const raw=lines.join('\n');yield {event,data:raw==='[DONE]'?'[DONE]':JSON.parse(raw)};}}
   if(done)break;
 }}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}

export async function requestDialogue(body,signal,onChunk=()=>{},path='/api/private-chat'){
 const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,stream:true}),signal:AbortSignal.any([signal,AbortSignal.timeout(14000)])});
 if(!response.ok){const data=await response.json().catch(()=>({}));throw Object.assign(Error('AI request failed'),{code:data.code});}
 let reply='',complete=false;
 for await(const packet of readSSE(response.body)){
  if(packet.event==='error')throw Object.assign(Error('AI stream failed'),{code:packet.data.code});
  if(packet.event==='delta'){reply+=packet.data.text;onChunk(reply);}
  if(packet.event==='done'){reply=packet.data.reply||reply;complete=true;}
 }
 if(!complete||!reply.trim())throw Error('Incomplete AI response');return {reply,source:'ai'};
}

// Small Unicode steps also make providers that send one large chunk feel natural.
export function createTypewriter(write,{delay=24}={}){
 let text='',shown='',timer=null,stopped=false,done;
 function tick(){timer=null;if(stopped)return;const points=Array.from(text),count=Array.from(shown).length;if(count<points.length){shown=points.slice(0,count+1).join('');write(shown);timer=setTimeout(tick,delay);}else if(done){const callback=done;done=null;callback();}}
 return {set(value){if(stopped)return;text=value;if(!timer)tick();},finish(value,callback){text=value;done=callback;if(!timer)tick();},stop(){stopped=true;clearTimeout(timer);const callback=done;done=null;callback?.();},get text(){return shown;}};
}
