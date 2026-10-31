import './role-stickers.css';
import {OFFICE_LAYOUT} from './workstation.js';

function fillName(title,name,wrapped=false){
 title.replaceChildren();
 const groups=wrapped&&name==='加班大魔王'?['加班','大魔王']:wrapped&&name==='路过的实习生'?['路过的','实习生']:[name];
 groups.forEach((group,index)=>{
  if(index)title.append(document.createElement('br'));
  for(const part of group.split(/(DDL|HR|IT)/).filter(Boolean)){
   const span=document.createElement('span');span.textContent=part;
   if(['DDL','HR','IT'].includes(part))span.className='sticker-latin';
   title.append(span);
  }
 });
}

export function createRoleSticker(character,index,parent){
 const label=document.createElement('div');
 label.className=`nameplate role-sticker ${index%2?'side-right':'side-left'}`;
 label.dataset.character=character.id;
 label.setAttribute('aria-label',`角色：${character.name}`);
 const title=document.createElement('span');title.className='sticker-title';
 fillName(title,character.name);label.dataset.wrapped='false';
 label.append(title);
 parent.append(label);return label;
}

export function refreshRoleSticker(label,character){
 fillName(label.firstChild,character.name,label.dataset.wrapped==='true');
 label.dataset.name=character.name;label.setAttribute('aria-label',`角色：${character.name}`);
}

export function positionRoleSticker(actor,project,field,single=false){
 const side=single?-1:actor.i%2?1:-1,w=field.clientWidth,h=field.clientHeight;
 const unit=1.5*Math.max(9,Math.min(12,w*.028));
 const edge=project(actor.station.position.x+side*1.10,1.24,actor.station.position.z+.12);
 const rowPixels=Math.abs(project(0,1.24,actor.station.position.z+OFFICE_LAYOUT.rowSpacing).y-project(0,1.24,actor.station.position.z).y);
 const textHeight=Math.max(32,Math.min(78,rowPixels-18));
 const glyphs=actor.c.name.replace(/DDL|HR|IT/g,'字').length;
 const rows=Math.max(3,Math.floor(textHeight/(unit+1)));
 const columns=Math.ceil(glyphs/rows);
 const halfWidth=(columns*unit*1.15+13)/2;
 const halfHeight=(Math.min(rows,glyphs)*(unit+1)+18)/2;
 const x=Math.max(halfWidth+5,Math.min(w-halfWidth-5,edge.x-side*3));
 const y=Math.max(104+halfHeight,Math.min(h-halfHeight-8,edge.y));
 const label=actor.label;label.style.left=`${x}px`;label.style.top=`${y}px`;label.style.fontSize=`${unit}px`;
 const wrapped=columns>1&&['加班大魔王','路过的实习生'].includes(actor.c.name);
 if(label.dataset.wrapped!==String(wrapped)||label.dataset.name!==actor.c.name){fillName(label.firstChild,actor.c.name,wrapped);label.dataset.wrapped=String(wrapped);label.dataset.name=actor.c.name;label.setAttribute('aria-label',`角色：${actor.c.name}`);}
 label.style.setProperty('--sticker-text-height',`${rows*(unit+1)}px`);
 label.classList.toggle('active',actor.state==='Active'||actor.state==='React');
}
