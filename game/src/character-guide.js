import './character-guide.css';
import {relationPreview} from './character-settings.js';

const instances=new WeakMap();

export function renderCharacterGuide(container,characters,options={}){
 let instance=instances.get(container);
 if(!instance){instance={container,characters,options};instances.set(container,instance);}
 Object.assign(instance,{characters,options});
 container.replaceChildren(...characters.map(c=>{
  const row=document.createElement('article');row.className='roster-item';row.dataset.character=c.id;
  const portrait=document.createElement('img');portrait.className='roster-portrait';portrait.src=`/portraits/${c.id}.jpg`;portrait.alt=`${c.name}头像`;portrait.width=portrait.height=64;portrait.decoding='async';
  const details=document.createElement('div'),name=document.createElement('h3'),role=document.createElement('small'),quote=document.createElement('p');
  const title=document.createElement(options.settings?'button':'span');title.className='role-name-edit';title.textContent=c.name;
  if(options.settings){title.type='button';title.setAttribute('aria-label',`修改${c.name}的标签`);title.onclick=()=>openEditor(instance,c,'name');}
  name.append(title);
  for(const [element,field,text] of [[role,'role',c.role],[quote,'bio',`“${c.bio}”`]]){
   if(options.settings){const edit=document.createElement('button');edit.type='button';edit.className='role-detail-edit';edit.textContent=text;edit.setAttribute('aria-label',`修改${c.name}的${field==='role'?'职能介绍':'性格与代表台词'}`);edit.onclick=()=>openEditor(instance,c,field);element.append(edit);}else element.textContent=text;
  }
  details.append(name,role,quote);
  const relation=document.createElement(options.settings?'button':'span');relation.className=`relation relation-edit ${c.relation>0?'positive':''}`;relation.textContent=`${c.relation>0?'+':''}${c.relation}`;
  if(options.settings){relation.type='button';relation.setAttribute('aria-label',`修改${c.name}的亲疏值，当前${c.relation}`);relation.onclick=()=>openEditor(instance,c,'relation');}
  row.append(portrait,details,relation);return row;
 }));
}

function openEditor(instance,character,focus){
 if(!instance.editor)installEditor(instance);
 const {editor,form}=instance;instance.character=character;
 form.elements.label.value=character.name;form.elements.relation.value=character.relation;
 form.elements.role.value=character.role||'';form.elements.bio.value=character.bio||'';
 editor.querySelector('.settings-error').textContent='';
 editor.querySelector('.settings-original').textContent=`原角色：${character.defaultName||character.name}`;
 updatePreview(instance);editor.hidden=false;
 document.getElementById('guide-modal').hidden=true;
 const target=form.elements[focus==='name'?'label':focus];target.focus({preventScroll:true});target.scrollIntoView({block:'nearest'});
}

function updatePreview(instance){
 const value=Number(instance.form.elements.relation.value),out=instance.editor.querySelector('output');
 out.textContent=`${value>0?'+':''}${value}`;out.classList.toggle('positive',value>0);
 instance.editor.querySelector('.settings-preview').textContent=relationPreview(value);
}

function closeEditor(instance){
 instance.editor.hidden=true;document.getElementById('guide-modal').hidden=false;
 instance.container.querySelector(`[data-character="${instance.character.id}"] .role-name-edit`)?.focus({preventScroll:true});
}

function installEditor(instance){
 const editor=document.createElement('section');editor.id='character-settings-modal';editor.className='modal';editor.hidden=true;
 editor.setAttribute('role','dialog');editor.setAttribute('aria-modal','true');editor.setAttribute('aria-label','自定义角色');
 editor.innerHTML=`<form class="character-settings-card"><div class="guide-heading"><h2>自定义角色</h2><button type="button" class="icon-button settings-close" aria-label="关闭角色设置">×</button></div>
 <p class="settings-original"></p><label class="settings-label" for="character-label">角色标签</label><input id="character-label" name="label" type="text" maxlength="16" autocomplete="off" placeholder="1～8 个字" required>
 <label class="settings-label" for="character-role">职能介绍</label><input id="character-role" name="role" type="text" maxlength="80" autocomplete="off" placeholder="例如：技术支持 / 电脑急救" required>
 <label class="settings-label" for="character-bio">性格与代表台词</label><textarea id="character-bio" name="bio" rows="3" maxlength="240" placeholder="写下性格、说话风格或一句代表台词" required></textarea>
 <div class="settings-relation-heading"><label class="settings-label" for="character-relation">亲疏值</label><output for="character-relation">0</output></div>
 <div class="settings-stepper"><button type="button" class="relation-decrease" aria-label="亲疏值减一">−</button><input id="character-relation" name="relation" type="range" min="-5" max="5" step="1"><button type="button" class="relation-increase" aria-label="亲疏值加一">＋</button></div>
 <div class="settings-range-ends"><span>疏远 −5</span><span>亲近 +5</span></div><p class="settings-preview" aria-live="polite"></p>
 <p class="settings-note">修改保存在本机，可随时恢复。</p><p class="settings-error" role="alert"></p>
 <div class="settings-actions"><button type="button" class="settings-cancel">取消</button><button type="submit" class="primary">保存</button></div><button type="button" class="settings-reset">恢复这个角色的默认设置</button></form>`;
 document.getElementById('app').append(editor);instance.editor=editor;instance.form=editor.querySelector('form');const {form}=instance;
 editor.querySelector('.settings-close').onclick=editor.querySelector('.settings-cancel').onclick=()=>closeEditor(instance);
 form.elements.relation.oninput=()=>updatePreview(instance);
 for(const [selector,delta] of [['.relation-decrease',-1],['.relation-increase',1]])editor.querySelector(selector).onclick=()=>{form.elements.relation.value=Math.max(-5,Math.min(5,Number(form.elements.relation.value)+delta));updatePreview(instance);};
 const commit=reset=>{
  try{
   const result=reset?instance.options.settings.reset(instance.character.id):instance.options.settings.save(instance.character.id,{name:form.elements.label.value,relation:Number(form.elements.relation.value),role:form.elements.role.value,bio:form.elements.bio.value});
   instance.options.onChange?.(instance.character);
   renderCharacterGuide(instance.container,instance.characters,instance.options);
   const status=document.getElementById('customization-status');if(status)status.textContent=result.persisted?'已保存人物设定。':'已更新；浏览器未允许保存，刷新后将恢复。';
   closeEditor(instance);
  }catch(error){editor.querySelector('.settings-error').textContent=error.message;}
 };
 form.onsubmit=event=>{event.preventDefault();commit(false);};editor.querySelector('.settings-reset').onclick=()=>commit(true);
 document.addEventListener('keydown',event=>{
  if(editor.hidden)return;
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeEditor(instance);}
  if(event.key==='Tab'){
   const controls=[...form.querySelectorAll('button,input,textarea')].filter(e=>!e.disabled),first=controls[0],last=controls.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
 },true);
}
