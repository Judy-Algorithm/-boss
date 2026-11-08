import test from 'node:test';import assert from 'node:assert/strict';
import {scoreFor,capacity,classifyGesture} from '../src/rules.js';
import {characters} from '../src/characters.js';
test('every role follows signed scoring and neutral base points',()=>{assert.equal(characters.length,10);for(const c of characters){if(c.relation){assert.equal(scoreFor(c.relation,c.relation<0?'hammer':'chocolate'),10*Math.abs(c.relation));assert.equal(scoreFor(c.relation,c.relation<0?'chocolate':'hammer'),-10*Math.abs(c.relation))}else{assert.equal(scoreFor(0,'hammer'),5);assert.equal(scoreFor(0,'chocolate'),5)}}});
test('difficulty boundaries are exactly 10 and 20 seconds',()=>{assert.deepEqual([0,9.99,10,19.99,20,29.99].map(capacity),[1,1,2,2,3,3])});
test('gestures reject sideways drags, down swipes, long holds and drag-return taps',()=>{assert.equal(classifyGesture(3,-4,100),'hammer');assert.equal(classifyGesture(8,-40,280),'chocolate');for(const args of [[40,0,120],[0,40,150],[0,0,900],[0,-20,150],[0,0,200,50],[40,-35,150]])assert.equal(classifyGesture(...args),null)});

test('a visible character remains interactive throughout its reaction, but not while retreating',async()=>{
 const {canInteract,State}=await import('../src/rules.js');
 for(const state of [State.Active,State.React])assert.equal(canInteract(state),true);
 for(const state of [State.Hidden,State.PopUp,State.Retreat,undefined])assert.equal(canInteract(state),false);
});

test('slow AI and its reading interval keep characters visible until the reply has settled',async()=>{
 const {dialogueSettled}=await import('../src/rules.js');
 const actor={aiPending:true,aiDeadline:16000,aiReadUntil:0};
 assert.equal(dialogueSettled(actor,3000),false);assert.equal(dialogueSettled(actor,14000),false);
 actor.aiPending=false;actor.aiReadUntil=17000;
 assert.equal(dialogueSettled(actor,16000),false);assert.equal(dialogueSettled(actor,17000),true);
 actor.aiPending=true;actor.aiReadUntil=0;assert.equal(dialogueSettled(actor,16001),true);
});
