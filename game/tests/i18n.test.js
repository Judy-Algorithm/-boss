import test from 'node:test';
import assert from 'node:assert/strict';
import {characters} from '../src/characters.js';
import {getLanguage, setLanguage, translate, EN_CHARACTERS} from '../src/i18n.js';
import {ACHIEVEMENT_BANDS} from '../src/achievements.js';

test('all stock character names, roles, bios and dialogue have English translations', () => {
  for (const c of characters) {
    assert.equal(EN_CHARACTERS[c.id].length, 6);
    for (const key of ['name', 'role', 'bio', 'pop', 'correct', 'wrong']) {
      const text = translate(c[key], 'en'); assert.notEqual(text, c[key]); assert.doesNotMatch(text, /[\u3400-\u9fff]/);
    }
  }
  for (const band of ACHIEVEMENT_BANDS) for (const title of band.titles) assert.doesNotMatch(translate(title, 'en'), /[\u3400-\u9fff]/);
});
test('switching language leaves the canonical roster and score rules intact', () => {
  const snapshot = JSON.stringify(characters);
  setLanguage('en'); assert.equal(getLanguage(), 'en'); assert.equal(translate('摸鱼事务所'), 'Office Escape');
  setLanguage('zh'); assert.equal(translate('摸鱼事务所'), '摸鱼事务所'); assert.equal(JSON.stringify(characters), snapshot);
});
test('dynamic scores, signs and action instructions retain their values in English', () => {
  for (const source of ['得分 -50', '正确 3/5 · 最高连击 2', '漏接 1 · 本机最佳 150', '✓ 巧克力 · 投喂', '3D角色 10/10', '修改加班大魔王的亲疏值，当前-5', '中立：敲击、投喂都 +5 分']) {
    const output = translate(source, 'en'); assert.doesNotMatch(output, /[\u3400-\u9fff]/);
    assert.deepEqual(output.match(/-?\d+/g), source.match(/-?\d+/g));
  }
  assert.equal(translate('My custom coworker', 'en'), 'My custom coworker');
});
