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

test('fixed appearance deadlines override continuous reactions and slow AI',async()=>{
 const {nextActorState,canHitActor,State}=await import('../src/rules.js');
 const actor={state:State.Active,since:420,activeUntil:2800,aiPending:true,aiDeadline:99000,aiReadUntil:99000};
 for(let now=500;now<2800;now+=50){
  assert.equal(canHitActor(actor,now),true);
  actor.state=State.React;actor.since=now;actor.reactUntil=now+4200;
  assert.equal(nextActorState(actor,now),State.React);
  assert.equal(actor.activeUntil,2800);
 }
 assert.equal(canHitActor(actor,2800),false);
 assert.equal(nextActorState(actor,2800),State.Retreat);
 actor.state=State.Retreat;actor.since=2800;
 assert.equal(nextActorState(actor,3449),State.Retreat);
 assert.equal(nextActorState(actor,3450),State.Hidden);
});

test('early reactions return to standing until the original deadline; idle and tapped actors sit together',async()=>{
 const {nextActorState,State}=await import('../src/rules.js');
 const idle={state:State.Active,since:420,activeUntil:2800};
 const tapped={state:State.React,since:500,activeUntil:2800,reactUntil:1000};
 assert.equal(nextActorState(tapped,1000),State.Active);
 assert.equal(nextActorState(idle,2800),State.Retreat);
 assert.equal(nextActorState(tapped,2800),State.Retreat);
 assert.equal(nextActorState({...tapped,activeUntil:Infinity},2800,false),State.Active);
});
