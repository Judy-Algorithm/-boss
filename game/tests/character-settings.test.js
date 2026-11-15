import test from 'node:test';
import assert from 'node:assert/strict';
import {createCharacterSettings,validateCharacterSettings,CHARACTER_SETTINGS_KEY,relationPreview} from '../src/character-settings.js';
import {scoreFor,hitFeedback} from '../src/rules.js';

function roster(){return [{id:'boss',name:'加班大魔王',relation:-5,correct:'准点下班',wrong:'再加班'},{id:'intern',name:'实习生',relation:0,correct:'谢谢',wrong:'啊？'}];}
function storage(initial){let value=initial;return {getItem:()=>value,setItem:(key,next)=>{assert.equal(key,CHARACTER_SETTINGS_KEY);value=next;}};}

test('custom labels and relations update the shared actor and survive a reload',()=>{
 const characters=roster(),actor=characters[0],store=storage(null),settings=createCharacterSettings(characters,store);
 settings.save('boss',{name:'准点下班王',relation:3});
 assert.equal(characters[0],actor);assert.equal(actor.name,'准点下班王');assert.equal(scoreFor(actor.relation,'chocolate'),30);assert.equal(scoreFor(actor.relation,'hammer'),-30);
 assert.equal(actor.defaultRelation,-5);assert.equal(hitFeedback(actor,'chocolate',true),'谢谢投喂，元气满满！');
 const reloaded=roster();createCharacterSettings(reloaded,store);assert.equal(reloaded[0].name,'准点下班王');assert.equal(reloaded[0].relation,3);
 settings.save('boss',{name:'中立老板',relation:0});assert.equal(scoreFor(actor.relation,'hammer'),5);assert.equal(scoreFor(actor.relation,'chocolate'),5);
 settings.save('boss',{name:'轻微加班',relation:-1});assert.equal(scoreFor(actor.relation,'hammer'),10);assert.equal(scoreFor(actor.relation,'chocolate'),-10);
 settings.reset('boss');assert.equal(actor.name,'加班大魔王');assert.equal(actor.relation,-5);
});

test('invalid preferences cannot inject unknown roles or invalid scores',()=>{
 const characters=roster(),store=storage(JSON.stringify({version:1,characters:{boss:{name:'',relation:99},intern:{name:'小新人',relation:2},unknown:{name:'不存在',relation:5}}}));
 createCharacterSettings(characters,store);assert.equal(characters[0].relation,-5);assert.equal(characters[1].name,'小新人');assert.equal(characters.length,2);
 for(const relation of [6,-6,1.5,NaN,Infinity,'',null,true,' '])assert.throws(()=>validateCharacterSettings({name:'老板',relation}));
 for(const name of ['', '   ','一二三四五六七八九'])assert.throws(()=>validateCharacterSettings({name,relation:0}));
 assert.deepEqual(validateCharacterSettings({name:' 新同事 ',relation:'-3'}),{name:'新同事',relation:-3});
});

test('corrupt or blocked storage has an explicit session-only fallback',()=>{
 const characters=roster();createCharacterSettings(characters,storage('{broken'));assert.equal(characters[0].name,'加班大魔王');
 const settings=createCharacterSettings(roster(),{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});
 assert.equal(settings.save('boss',{name:'老板',relation:1}).persisted,false);
 assert.equal(relationPreview(-4),'敲击 +40，投喂 −40');assert.equal(relationPreview(0),'中立：敲击、投喂都 +5 分');
});

test('editable role and personality survive partial saves, reloads, and reset',()=>{
 const make=()=>[{id:'boss',name:'加班大魔王',relation:-5,role:'老板 / 终极决策者',bio:'今晚别回家！'}];
 const store=storage(JSON.stringify({version:1,characters:{boss:{name:'新老板',relation:2}}}));
 const characters=make(),actor=characters[0],settings=createCharacterSettings(characters,store);
 assert.equal(actor.name,'新老板');assert.equal(actor.role,'老板 / 终极决策者');
 settings.save('boss',{name:actor.name,relation:actor.relation,role:'  同事 / 快乐队长 ',bio:'嘴硬心软，喜欢鼓励同事。'});
 assert.equal(actor.role,'同事 / 快乐队长');assert.equal(actor.bio,'嘴硬心软，喜欢鼓励同事。');assert.equal(scoreFor(actor.relation,'chocolate'),20);
 settings.save('boss',{name:'快乐队长',relation:3});
 const reloaded=make();createCharacterSettings(reloaded,store);
 assert.equal(reloaded[0].role,'同事 / 快乐队长');assert.equal(reloaded[0].bio,actor.bio);assert.equal(reloaded[0].name,'快乐队长');
 settings.reset('boss');assert.equal(actor.role,'老板 / 终极决策者');assert.equal(actor.bio,'今晚别回家！');assert.equal(actor.name,'加班大魔王');assert.equal(actor.relation,-5);
});

test('invalid character descriptions are rejected without mutating the actor',()=>{
 const characters=[{id:'boss',name:'老板',relation:-5,role:'老板',bio:'加班啦'}],settings=createCharacterSettings(characters,storage(null));
 for(const patch of [{role:''},{bio:' '},{role:'字'.repeat(41)},{bio:'字'.repeat(121)},{bio:null}])assert.throws(()=>settings.save('boss',patch));
 assert.equal(characters[0].role,'老板');assert.equal(characters[0].bio,'加班啦');
 assert.equal(settings.save('boss',{role:'<b>老板</b>',bio:'A\nB'}).bio,'AB');
 assert.equal(characters[0].role,'<b>老板</b>'); // Rendered with textContent, never interpreted as HTML.
});

test('retired stock name migrates to Senior Manager while player names and affinity survive',()=>{
 const defaults=()=>[{id:'blame_shifter',name:'上级领导',relation:-4,role:'管理层 / 工作督导',bio:'目标要清楚，事情一步一步做好。'}];
 const saved=name=>storage(JSON.stringify({version:1,characters:{blame_shifter:{name,relation:2,role:'跨部门协作 / 责任转移',bio:'这事儿我熟！但不是我负责！'}}}));
 const migrated=defaults();createCharacterSettings(migrated,saved('甩锅大师'));
 assert.equal(migrated[0].name,'上级领导');assert.equal(migrated[0].relation,2);assert.equal(migrated[0].role,'管理层 / 工作督导');
 const custom=defaults();createCharacterSettings(custom,saved('王经理'));assert.equal(custom[0].name,'王经理');assert.equal(custom[0].relation,2);
});
