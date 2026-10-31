import test from 'node:test';import assert from 'node:assert/strict';
import {reactionProfiles,reactionFor} from '../src/reactions.js';
import {canStartNext,State} from '../src/rules.js';
import {characters} from '../src/characters.js';
test('all ten roles have a distinct correct feedback action',()=>{assert.equal(Object.keys(reactionProfiles).length,10);for(const c of characters){const p=reactionFor(c.id,c.relation<0?'hammer':'chocolate',true);assert.ok(p.action);assert.ok(p.duration>=2200);assert.ok(p.text)}assert.equal(new Set(Object.values(reactionProfiles).map(p=>p.action)).size,10)});
test('intern has separate hammer/feed feedback and cat has belly response',()=>{assert.equal(reactionFor('passing_intern','hammer',true).action,'hat-bounce');assert.equal(reactionFor('passing_intern','chocolate',true).action,'catch-and-nod');assert.equal(reactionFor('office_orange_cat','chocolate',true).action,'happy-belly')});
test('next actor waits for React and Retreat as well as cooldown and props',()=>{for(const state of [State.PopUp,State.Active,State.React,State.Retreat])assert.equal(canStartNext([State.Hidden,state],3000,0),false);assert.equal(canStartNext([State.Hidden,State.Hidden],1000,1400),false);assert.equal(canStartNext([State.Hidden],3000,0,1),false);assert.equal(canStartNext([State.Hidden,State.Hidden],3000,2600),true)});
