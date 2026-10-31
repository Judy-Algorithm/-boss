export const CHARACTER_SETTINGS_KEY='shushu.character-settings.v1';

export function validateCharacterSettings(value){
 if(!value||typeof value.name!=='string')throw new Error('请输入角色标签');
 const name=value.name.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g,'').trim();
 if(!name||Array.from(name).length>8)throw new Error('标签需要 1～8 个字');
 if(!['number','string'].includes(typeof value.relation)||(typeof value.relation==='string'&&!value.relation.trim()))throw new Error('亲疏值需要是 −5～+5 的整数');
 const relation=typeof value.relation==='number'?value.relation:Number(value.relation);
 if(value.relation===''||!Number.isInteger(relation)||relation< -5||relation>5)throw new Error('亲疏值需要是 −5～+5 的整数');
 const patch={name,relation};
 for(const [field,label,max] of [['role','职能介绍',40],['bio','性格与代表台词',120]]){
  if(!Object.hasOwn(value,field))continue;
  if(typeof value[field]!=='string')throw new Error(`请输入${label}`);
  const text=value[field].normalize('NFC').replace(/[\u0000-\u001f\u007f]/g,'').trim();
  if(!text||Array.from(text).length>max)throw new Error(`${label}需要 1～${max} 个字`);
  patch[field]=text;
 }
 return patch;
}

export function relationPreview(relation){
 if(relation===0)return '中立：敲击、投喂都 +5 分';
 const points=Math.abs(relation)*10;
 return relation>0?`投喂 +${points}，敲击 −${points}`:`敲击 +${points}，投喂 −${points}`;
}

// Keep the original character objects: actors and scoring already hold these references.
export function createCharacterSettings(characters,storage){
 const defaults=new Map(characters.map(c=>[c.id,{name:c.name,relation:c.relation,...(c.role?{role:c.role}:{}),...(c.bio?{bio:c.bio}:{})}]));
 for(const c of characters){c.defaultName=c.name;c.defaultRelation=c.relation;}
 let overrides={};
 try{
  const saved=JSON.parse(storage?.getItem(CHARACTER_SETTINGS_KEY)||'null');
  if(saved?.version===1&&saved.characters&&typeof saved.characters==='object'){
   for(const c of characters){if(!Object.hasOwn(saved.characters,c.id))continue;
    try{const patch=validateCharacterSettings(saved.characters[c.id]);overrides[c.id]=patch;Object.assign(c,patch);}catch{/* One invalid entry must not discard the other saved roles. */}
   }
  }
 }catch{/* A missing, corrupt or unavailable browser store uses the original roster. */}
 function save(id,value){
  const character=characters.find(c=>c.id===id);if(!character)throw new Error('找不到这个角色');
   const patch=validateCharacterSettings({...defaults.get(id),...overrides[id],...value}),next={...overrides,[id]:patch};let persisted=false;
  try{if(storage){storage.setItem(CHARACTER_SETTINGS_KEY,JSON.stringify({version:1,characters:next}));persisted=true;}}catch{/* The current session can still use the change. */}
  overrides=next;Object.assign(character,patch);return {...patch,persisted};
 }
 return {save,reset:id=>save(id,defaults.get(id)),defaults};
}
