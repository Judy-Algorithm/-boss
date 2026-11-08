import test from 'node:test';
import assert from 'node:assert/strict';
import {Round} from '../src/round.js';
import {characters} from '../../game/src/characters.js';
import {capacity, scoreFor} from '../../game/src/rules.js';

test('all ten roles score identically to the web game and accumulate repeated hits while visible', () => {
  for (let i = 0; i < characters.length; i++) for (const kind of ['hammer', 'chocolate']) {
    const round = new Round(); round.slots[i].active = true; round.slots[i].until = 2;
    assert.equal(round.hit(i, kind).delta, scoreFor(characters[i].relation, kind));
    assert.equal(round.hit(i, kind).delta, scoreFor(characters[i].relation, kind));
    assert.equal(round.score, 2 * scoreFor(characters[i].relation, kind));
    assert.equal(round.attempts, 2);
  }
});
test('30-second round ends exactly, clears targets and rejects late input', () => {
  const round = new Round(() => 0); round.update(0);
  assert.equal(round.slots[0].active, true);
  round.update(29.999); assert.equal(round.finished, false);
  round.update(.001); assert.equal(round.finished, true);
  assert.equal(round.remaining, 0);
  assert.equal(round.slots.some(s => s.active), false);
  assert.equal(round.hit(0, 'hammer'), null);
});
test('difficulty never exceeds shared simultaneous-target limits', () => {
  const round = new Round(() => .5);
  for (let n = 0; n < 3000; n++) {
    round.update(.01);
    assert.ok(round.slots.filter(s => s.active).length <= capacity(round.elapsed));
  }
  assert.ok(round.misses > 0);
});
test('correct streak resets after a wrong hit or a missed target', () => {
  const round = new Round(() => 0);
  round.slots[0].active = true; round.slots[0].until = 2; round.hit(0, 'hammer');
  round.slots[1].active = true; round.slots[1].until = 2; round.hit(1, 'hammer');
  assert.equal(round.combo, 2); assert.equal(round.maxCombo, 2);
  round.slots[2].active = true; round.slots[2].until = 2; round.hit(2, 'hammer'); assert.equal(round.combo, 0);
  round.slots[0].active = true; round.slots[0].until = 2; round.hit(0, 'hammer');
  round.slots[1].active = true; round.slots[1].until = 1; round.slots[1].hits = 0;
  round.update(1); assert.equal(round.combo, 0); assert.equal(round.misses, 1);
  round.start(); assert.equal(round.score, 0); assert.equal(round.attempts, 0); assert.equal(round.finished, false);
});

test('rapid alternating tools sum every hit and a handled target is not counted as missed',()=>{
 const round=new Round(()=>0);round.update(0);
 for(let i=0;i<20;i++)assert.equal(round.hit(0,'hammer').delta,50);
 for(let i=0;i<5;i++)assert.equal(round.hit(0,'chocolate').delta,-50);
 assert.equal(round.score,750);assert.equal(round.attempts,25);assert.equal(round.correct,20);assert.equal(round.combo,0);assert.equal(round.maxCombo,20);
 round.elapsed=2.1;assert.equal(round.hit(0,'hammer'),null);round.update(0);assert.equal(round.misses,0);
});

test('continuous hits cannot extend a spawn and the next spawn is a different coworker',()=>{
 const round=new Round(()=>0);round.update(0);
 const first=round.slots[0],deadline=first.until;
 for(let i=0;i<41;i++){
  assert.ok(round.hit(0,i%2?'hammer':'chocolate'));
  assert.equal(first.until,deadline);
  round.update(.05);
 }
 round.update(.1);
 assert.equal(first.active,false);assert.equal(first.until,deadline);
 const score=round.score;assert.equal(round.hit(0,'hammer'),null);assert.equal(round.score,score);
 assert.ok(round.slots.some((slot,index)=>index!==0&&slot.active));
});
