// Local developer recording: composite the CSS backdrop with the real WebGL canvas.
export async function recordIT(source,start,backgroundURL){
 if(!source.captureStream||!window.MediaRecorder)return;
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const ctx=canvas.getContext('2d'),image=new Image();image.src=backgroundURL;
 try{await image.decode();}catch{/* A warm fallback keeps the recording usable offline. */}
 let running=true;
 function draw(){ctx.fillStyle='#d89969';ctx.fillRect(0,0,canvas.width,canvas.height);
  if(image.naturalWidth){const scale=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,(canvas.width-w)/2,(canvas.height-h)/2,w,h);}
  ctx.drawImage(source,0,0,canvas.width,canvas.height);if(running)requestAnimationFrame(draw);
 }
 const stream=canvas.captureStream(30),mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
 const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000}),chunks=[];
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
 recorder.onstop=()=>{running=false;const blob=new Blob(chunks,{type:'video/webm'}),link=document.createElement('a');document.getElementById('qa-recording-download')?.remove();link.href=URL.createObjectURL(blob);link.download='it-body-animation.webm';link.textContent='下载 IT 动作录像';link.id='qa-recording-download';link.style.cssText='position:fixed;bottom:8px;left:8px;z-index:60;background:#fff;padding:8px';document.body.append(link);stream.getTracks().forEach(t=>t.stop());};
 recorder.start();start();draw();setTimeout(()=>recorder.stop(),8000);
}
