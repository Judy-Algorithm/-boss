import test from 'node:test';
import assert from 'node:assert/strict';
import {Round} from '../src/round.js';
import {characters} from '../../game/src/characters.js';
import {capacity, scoreFor} from '../../game/src/rules.js';

test('all ten roles score identically to the web game and cannot be hit twice', () => {
  for (let i = 0; i < characters.length; i++) for (const kind of ['hammer', 'chocolate']) {
    const round = new Round(); round.slots[i].active = true;
    assert.equal(round.hit(i, kind).delta, scoreFor(characters[i].relation, kind));
    assert.equal(round.hit(i, kind), null);
    assert.equal(round.attempts, 1);
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
  round.slots[0].active = true; round.hit(0, 'hammer');
  round.slots[1].active = true; round.hit(1, 'hammer');
  assert.equal(round.combo, 2); assert.equal(round.maxCombo, 2);
  round.slots[2].active = true; round.hit(2, 'hammer'); assert.equal(round.combo, 0);
  round.slots[0].active = true; round.hit(0, 'hammer');
  round.slots[1].active = true; round.slots[1].until = 1;
  round.update(1); assert.equal(round.combo, 0); assert.equal(round.misses, 1);
  round.start(); assert.equal(round.score, 0); assert.equal(round.attempts, 0); assert.equal(round.finished, false);
});
