import {characters} from '../../game/src/characters.js';
import {ROUND_SECONDS, scoreFor, capacity} from '../../game/src/rules.js';

// The clock advances only while the game is visible and playing.
export class Round {
  constructor(random = Math.random) { this.random = random; this.start(); }
  start() {
    this.elapsed = 0;
    this.score = this.combo = this.maxCombo = this.attempts = this.correct = this.misses = 0;
    this.nextSpawn = 0;
    this.finished = false;
    this.slots = characters.map(character => ({character, active: false, until: 0, feedback: '', feedbackUntil: 0}));
  }
  get remaining() { return Math.max(0, ROUND_SECONDS - this.elapsed); }
  update(seconds) {
    if (this.finished) return;
    this.elapsed = Math.min(ROUND_SECONDS, this.elapsed + Math.max(0, seconds));
    if (this.elapsed >= ROUND_SECONDS) {
      this.finished = true;
      this.slots.forEach(s => { s.active = false; });
      return;
    }
    for (const slot of this.slots) {
      if (slot.active && this.elapsed >= slot.until) {
        slot.active = false;
        this.misses++;
        this.combo = 0;
      }
    }
    if (this.elapsed < this.nextSpawn || this.slots.filter(s => s.active).length >= capacity(this.elapsed)) return;
    const available = this.slots.filter(s => !s.active && s.feedbackUntil <= this.elapsed);
    if (!available.length) return;
    const slot = available[Math.min(available.length - 1, Math.floor(this.random() * available.length))];
    slot.active = true;
    slot.until = this.elapsed + (this.elapsed < 10 ? 2.1 : this.elapsed < 20 ? 1.7 : 1.4);
    slot.feedback = '';
    this.nextSpawn = this.elapsed + (this.elapsed < 10 ? .85 : this.elapsed < 20 ? .65 : .48);
  }
  hit(index, kind) {
    if (this.finished || !['hammer', 'chocolate'].includes(kind)) return null;
    const slot = this.slots[index];
    if (!slot?.active) return null;
    const delta = scoreFor(slot.character.relation, kind);
    this.score += delta;
    this.attempts++;
    if (delta > 0) { this.correct++; this.maxCombo = Math.max(this.maxCombo, ++this.combo); }
    else this.combo = 0;
    slot.active = false;
    slot.feedback = `${delta > 0 ? '+' : ''}${delta}`;
    slot.feedbackUntil = this.elapsed + .65;
    slot.positive = delta > 0;
    return {delta, character: slot.character};
  }
}
