// Decorative canvas art shared by the DOM HUD and the native WeChat renderer.
// Scores and time remain live text, never part of the reference image.
export const HUD_PAUSE = {x:342,y:8,w:36,h:38};

function path(ctx, points, fill, stroke, lineWidth=3) {
  ctx.beginPath();
  for(const [command,...args] of points) ctx[command](...args);
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.lineJoin='round';ctx.stroke();}
}
function circle(ctx,x,y,r,fill,stroke,width=3){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function gradient(ctx, top, bottom, h=100){const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,top);g.addColorStop(1,bottom);return g;}

export function drawHudIcon(ctx, name, x, y, size) {
  ctx.save();ctx.translate(x,y);ctx.scale(size/100,size/100);
  if(name==='watch'){
    path(ctx,[['moveTo',41,6],['lineTo',61,6],['lineTo',61,19],['lineTo',41,19]],'#ffb8bc','#d84b68',4);
    path(ctx,[['moveTo',73,20],['lineTo',82,27],['lineTo',87,20],['lineTo',78,14]],'#fc7591','#d84b68',3);
    circle(ctx,50,57,39,gradient(ctx,'#ffabb7','#ee4d78'),'#c7476a',4);
    circle(ctx,50,57,29,'#fff7e1','#ffcfb9',3);
    ctx.strokeStyle='#754052';ctx.lineWidth=3.5;ctx.lineCap='round';
    for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(50+24*Math.sin(a),57-24*Math.cos(a));ctx.lineTo(50+21*Math.sin(a),57-21*Math.cos(a));ctx.stroke();}
    ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(50,36);ctx.lineTo(50,57);ctx.lineTo(61,64);ctx.stroke();circle(ctx,50,57,3.5,'#754052');
    ctx.strokeStyle='#ffe5e5';ctx.lineWidth=3;ctx.beginPath();ctx.arc(50,57,34,Math.PI*1.12,Math.PI*1.65);ctx.stroke();
  }else if(name==='fish'){
    circle(ctx,50,50,46,'#fff2d7','#b57489',3);
    path(ctx,[['moveTo',25,46],['bezierCurveTo',0,22,3,78,28,61]],'#70baff','#554b9a',4);
    path(ctx,[['moveTo',44,24],['bezierCurveTo',50,3,69,12,66,29]],'#8fbbff','#554b9a',4);
    path(ctx,[['moveTo',35,70],['bezierCurveTo',28,90,58,89,62,71]],'#6da7f0','#554b9a',4);
    ctx.save();ctx.translate(56,49);ctx.rotate(-.25);ctx.scale(1.2,.84);circle(ctx,0,0,28,gradient(ctx,'#b6ecff','#76baff'),'#554b9a',3);ctx.restore();
    circle(ctx,63,37,5,'#2f355b');circle(ctx,65,35,1.7,'white');
    path(ctx,[['moveTo',78,44],['quadraticCurveTo',93,46,80,52]],'#f68faa','#5a4783',2);
    circle(ctx,61,51,4,'#fba9bb');
  }else if(name==='star'){
    const points=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?23:43;points.push([i?'lineTo':'moveTo',50+Math.cos(a)*r,50+Math.sin(a)*r]);}
    path(ctx,points,gradient(ctx,'#fff49a','#ffbf25'),'#d79532',5);
    ctx.strokeStyle='#fff6bd';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(37,38);ctx.lineTo(48,17);ctx.stroke();
  }else if(name==='flame'){
    path(ctx,[['moveTo',48,5],['bezierCurveTo',61,22,47,31,63,42],['quadraticCurveTo',73,31,72,23],['bezierCurveTo',110,67,83,96,49,96],['bezierCurveTo',8,96,0,64,24,33],['quadraticCurveTo',23,56,35,57],['quadraticCurveTo',25,29,48,5]],gradient(ctx,'#ff9a67','#ff512e'),'#f17449',3);
    path(ctx,[['moveTo',52,45],['bezierCurveTo',65,63,54,66,66,70],['bezierCurveTo',79,93,38,103,34,81],['quadraticCurveTo',29,70,42,60],['quadraticCurveTo',39,77,48,75],['quadraticCurveTo',45,60,52,45]],'#ffe05c');
  }else if(name==='pause'){
    ctx.fillStyle='#fff7ed';
    path(ctx,[['moveTo',31,26],['quadraticCurveTo',26,26,26,31],['lineTo',26,69],['quadraticCurveTo',26,74,31,74],['lineTo',38,74],['quadraticCurveTo',43,74,43,69],['lineTo',43,31],['quadraticCurveTo',43,26,38,26]],'#fff7ed');
    path(ctx,[['moveTo',62,26],['quadraticCurveTo',57,26,57,31],['lineTo',57,69],['quadraticCurveTo',57,74,62,74],['lineTo',69,74],['quadraticCurveTo',74,74,74,69],['lineTo',74,31],['quadraticCurveTo',74,26,69,26]],'#fff7ed');
  }
  ctx.restore();
}

export function installHudIcons() {
  for(const canvas of document.querySelectorAll('[data-hud-icon]')){
    canvas.width=160;canvas.height=160;
    drawHudIcon(canvas.getContext('2d'),canvas.dataset.hudIcon,0,0,160);
  }
}

function rounded(ctx,x,y,w,h,r,fill,stroke){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=1.6;ctx.strokeStyle=stroke;ctx.stroke();}
}
export function drawNativeHud(ctx,{top,score,time,combo,scoreLabel,comboLabel}) {
  ctx.save();ctx.translate(0,top);
  const card=(x,y,w,h,light=false,r=17)=>{
    rounded(ctx,x,y+3,w,h,r,light?'#a46a42':'#442d51');
    const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,light?'#fff0d2':'#58405f');g.addColorStop(1,light?'#f8cd96':'#2c2039');
    rounded(ctx,x,y,w,h,r,g,light?'#ffeac2':'#b087b6');
  };
  card(12,8,108,58,true);card(128,2,116,68);card(252,8,82,58);card(HUD_PAUSE.x,HUD_PAUSE.y,HUD_PAUSE.w,HUD_PAUSE.h,false,20);
  const label=(value,x,y,size,color)=>{ctx.font=`900 ${size}px sans-serif`;ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(String(value),x,y);};
  label(scoreLabel,76,23,11,'#4a2c3c');label('TIME',186,17,13,'#fff4e5');label(comboLabel,293,23,12,'#fff1ce');
  drawHudIcon(ctx,'fish',5,0,32);drawHudIcon(ctx,'watch',20,30,33);drawHudIcon(ctx,'star',53,58,24);
  drawHudIcon(ctx,'watch',138,29,36);drawHudIcon(ctx,'flame',259,32,28);
  label(score<0?score:String(score).padStart(3,'0'),84,46,String(score).length>3?25:29,'#4a2c3c');
  label(time,204,46,40,time<=5?'#ffb59b':'#fff8ef');label(`×${combo}`,306,46,27,'#ffda48');
  drawHudIcon(ctx,'pause',HUD_PAUSE.x+2,HUD_PAUSE.y+3,32);
  ctx.restore();return {...HUD_PAUSE,y:top+HUD_PAUSE.y};
}
