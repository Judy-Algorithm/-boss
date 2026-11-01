import {characters} from '../../game/src/characters.js';
import {classifyGesture} from '../../game/src/rules.js';
import {createAchievementPicker} from '../../game/src/achievements.js';
import {Round} from './round.js';
import {createNativeStage} from './stage.js';
import {translate, getLanguage, setLanguage} from '../../game/src/i18n.js';

const STORE = 'moyu.wechat.settings.v1';
const stage = createNativeStage(() => { dirty = true; });
const canvas = stage.hudCanvas;
const ctx = canvas.getContext('2d');
const round = new Round();
let page = 'home', pageIndex = 0, selected = 'chocolate', hidden = false;
let buttons = [], gesture = null, lastFrame = null, width, height, scale, top, bottom;
let dirty = true, epoch = 0, result = null, chatCharacter = null, chatText = '', chatAction = '';
let musicEnabled = false, best = null, storageFailed = false;
try {
  const saved = wx.getStorageSync(STORE);
  musicEnabled = saved?.musicEnabled === true;
  best = Number.isFinite(saved?.best) ? saved.best : null;
  setLanguage(saved?.language);
} catch { storageFailed = true; }
const achievementStorage = {
  getItem: key => { try { return wx.getStorageSync(key) || null; } catch { return null; } },
  setItem: (key, value) => { try { wx.setStorageSync(key, value); } catch { storageFailed = true; } }
};
let picker = createAchievementPicker(achievementStorage);
const music = wx.createInnerAudioContext();
music.src = 'assets/music.mp3';
music.loop = true;
music.volume = .19;
music.onError(() => { musicEnabled = false; dirty = true; wx.showToast({title: translate('音乐暂时无法播放'), icon: 'none'}); });
function save() {
  try { wx.setStorageSync(STORE, {musicEnabled, best, language: getLanguage()}); }
  catch { storageFailed = true; wx.showToast({title: translate('设置本次有效，存储不可用'), icon: 'none'}); }
}
function playMusic() { if (musicEnabled && !hidden && page !== 'paused') music.play(); }
function go(next) { page = next; gesture = null; buttons = []; epoch++; dirty = true; }
let afterLoading = 'playing';
function enterWorld(target) {
  if (stage.ready) { go(target); playMusic(); return; }
  afterLoading = target; go('loading');
  stage.load().then(() => { if (page === 'loading' && stage.ready) { go(afterLoading); lastFrame = null; playMusic(); } });
}
function start() { round.start(); lastFrame = null; enterWorld('playing'); }
function pause() { if (page === 'playing') { go('paused'); music.pause(); lastFrame = null; } }
function resume() { lastFrame = null; go('playing'); playMusic(); }
function home() { go('home'); playMusic(); }
function finish() {
  result = picker.pick(round.score);
  best = best === null ? round.score : Math.max(best, round.score);
  save(); go('results');
}
function layout() {
  const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  width = info.windowWidth;
  scale = width / 390;
  height = info.windowHeight / scale;
  const ratio = Math.min(info.pixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(info.windowHeight * ratio);
  ctx.setTransform(ratio * scale, 0, 0, ratio * scale, 0, 0);
  let capsule;
  try { capsule = wx.getMenuButtonBoundingClientRect(); } catch {}
  // Some game runtimes return an empty capsule rectangle; reserve its height too.
  top = Math.max((info.safeArea?.top || 0) / scale + 40, (capsule?.bottom || 0) / scale) + 12;
  bottom = height - Math.max(12, (info.screenHeight - (info.safeArea?.bottom || info.screenHeight)) / scale);
  stage.resize(info, top, bottom);
  dirty = true;
}
const assets = new Map();
function load(key, src) {
  const img = wx.createImage();
  img.onload = () => { assets.set(key, img); dirty = true; };
  img.onerror = () => { assets.set(key, null); dirty = true; };
  img.src = src;
}
load('cover', 'assets/cover.jpg');
characters.forEach(c => load(c.id, `assets/portraits/${c.id}.jpg`));

function panel(x, y, w, h, color = '#fff4df', radius = 16) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
}
function text(value, x, y, size = 16, color = '#663548', align = 'left') {
  value = translate(value);
  ctx.font = `${size >= 20 ? 'bold ' : ''}${size}px sans-serif`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(String(value), x, y);
}
function wrap(value, x, y, maxWidth, size = 15, lineHeight = 25) {
  value = translate(value);
  let line = '';
  const tokens = getLanguage() === 'en' ? (value.match(/\n|[^\S\n]+|[^\s]+/g) || []) : Array.from(value);
  for (const char of tokens) {
    ctx.font = `${size}px sans-serif`;
    if (char === '\n' || ctx.measureText(line + char).width > maxWidth) {
      text(line.trimEnd(), x, y, size); y += lineHeight; line = char === '\n' ? '' : char.trimStart();
    } else line += char;
  }
  if (line) text(line, x, y, size);
  return y + lineHeight;
}
function button(label, x, y, w, h, action, color = '#f5cf9f', size = 17) {
  panel(x, y + 3, w, h, '#8e4c5728'); panel(x, y, w, h, color);
  text(label, x + w / 2, y + h / 2, size, '#663548', 'center');
  buttons.push({x, y, w, h, action});
}
function portrait(c, x, y, size, active = true) {
  panel(x, y, size, size, active ? '#f9d5ad' : '#d1b4ad', 12);
  const img = assets.get(c.id);
  if (img) {
    ctx.save(); ctx.beginPath(); ctx.rect(x + 3, y + 3, size - 6, size - 6); ctx.clip();
    ctx.globalAlpha = active ? 1 : .25;
    const side = Math.min(img.width, img.height), sx = (img.width - side) / 2, sy = (img.height - side) / 2;
    ctx.drawImage(img, sx, sy, side, side, x + 3, y + 3, size - 6, size - 6); ctx.restore();
  } else text(c.emoji, x + size / 2, y + size / 2, size * .45, '#663548', 'center');
}
function header(title, back = home) {
  text(title, 24, top + 26, getLanguage() === 'en' ? 19 : 25);
  if (back) button('返回', 300, top + 5, 66, 36, back, '#fff4df', 15);
}
function cover() {
  const art = assets.get('cover');
  if (!art) {
    header('摸鱼事务所', null);
    text(assets.has('cover') ? '办公室准备好了' : '办公室准备中…', 195, top + 100, 20, '#663548', 'center');
    button('摸鱼 · 30秒挑战', 45, top + 180, 300, 60, start, '#ffb4a9');
    button('聊聊 · 选择角色', 45, top + 260, 300, 60, () => { pageIndex = 0; go('picker'); }, '#ddc0ff');
    button('人物图鉴', 30, bottom - 150, 100, 46, () => { pageIndex = 0; go('guide'); }, '#fff4df', 14);
    button('玩法说明', 145, bottom - 150, 100, 46, () => go('instructions'), '#fff4df', 14);
    button('音乐设置', 260, bottom - 150, 100, 46, () => go('music'), '#fff4df', 14);
  } else {
    const h = Math.min(bottom - top - 24, 390 * 1672 / 941), w = h * 941 / 1672;
    const x = (390 - w) / 2, y = top + (bottom - top - 24 - h) / 2;
    ctx.drawImage(art, x, y, w, h);
    if (getLanguage() === 'en') {
      panel(x + .015 * w, y + .035 * h, .97 * w, .205 * h, '#75404d', 20);
      text('OFFICE', 195, y + .095 * h, w * .10, '#fff2d0', 'center');
      text('ESCAPE', 195, y + .16 * h, w * .125, '#ffd174', 'center');
      text('Tap away stress. Share a little joy.', 195, y + .211 * h, w * .035, '#fff2d0', 'center');
      panel(x + .27 * w, y + .25 * h, .44 * w, .085 * h, '#ffe9ad', 4);
      text('Your coworkers, your rules.', 195, y + .277 * h, w * .03, '#663548', 'center');
      text('Tap, treat, or chat.', 195, y + .31 * h, w * .035, '#663548', 'center');
      for (const [label, nx, ny, nw, nh, color] of [['PLAY', .08, .721, .405, .10, '#ffaaa1'], ['CHAT', .525, .721, .4, .1, '#d1a4fc'], ['People', .143, .845, .21, .074, '#ffdfb6'], ['How to', .40, .845, .21, .074, '#ffdfb6'], ['Music', .65, .845, .21, .074, '#ffdfb6']]) {
        panel(x + nx * w, y + ny * h, nw * w, nh * h, color, 25);
        text(label, x + (nx + nw / 2) * w, y + (ny + nh / 2) * h, w * (ny < .8 ? .065 : .039), '#663548', 'center');
      }
    }
    // Transparent controls align to the supplied cover's five illustrated buttons.
    const hot = (nx, ny, nw, nh, action) => buttons.push({x: x + nx * w, y: y + ny * h, w: nw * w, h: nh * h, action});
    hot(.08, .721, .405, .10, start);
    hot(.525, .721, .40, .10, () => { pageIndex = 0; go('picker'); playMusic(); });
    hot(.143, .845, .21, .074, () => { pageIndex = 0; go('guide'); });
    hot(.40, .845, .21, .074, () => go('instructions'));
    hot(.65, .845, .21, .074, () => go('music'));
  }
  button('隐私与说明', 145, bottom - 22, 100, 22, () => go('privacy'), '#fff1d9', 12);
  button(getLanguage() === 'en' ? '中文' : 'English', 22, top + 4, 88, 29, () => { setLanguage(getLanguage() === 'en' ? 'zh' : 'en'); save(); dirty = true; }, '#fff1d9', 14);
}
function boardRects() {
  return stage.rects;
}
function board() {
  text(`得分 ${round.score}`, 20, top + 22, 23);
  text(`${Math.ceil(round.remaining)}秒`, 242, top + 22, 22, round.remaining <= 5 ? '#c93d57' : '#663548', 'center');
  button('暂停', 302, top + 2, 68, 38, pause, '#fff4df', 15);
  text(`连击 ${round.combo}  ·  敲负数，喂正数，中立都可`, 20, top + 55, 13);
  boardRects().forEach((rect, index) => {
    const slot = round.slots[index], c = slot.character;
    if (!slot.active && slot.feedbackUntil <= round.elapsed) return;
    const label = rect.labelY;
    panel(rect.labelX - 55, label - 10, 110, 20, slot.active ? '#fff7e5' : '#f2dccbce', 7);
    text(`${translate(c.name)} ${c.relation > 0 ? '+' : ''}${c.relation}`, rect.labelX, label, getLanguage() === 'en' ? 10 : 11, '#663548', 'center');
    if (slot.feedbackUntil > round.elapsed) {
      panel(rect.x + rect.w - 58, rect.y + 3, 52, 27, slot.positive ? '#d1f1d0' : '#ffd3cf', 10);
      text(slot.feedback, rect.x + rect.w - 32, rect.y + 17, 18, '#663548', 'center');
    }
  });
  button(`${selected === 'hammer' ? '✓ ' : ''}玩具锤 · 敲击`, 20, bottom - 85, 170, 48, () => { selected = 'hammer'; dirty = true; }, selected === 'hammer' ? '#ffaca9' : '#fff1dd', 16);
  button(`${selected === 'chocolate' ? '✓ ' : ''}巧克力 · 投喂`, 200, bottom - 85, 170, 48, () => { selected = 'chocolate'; dirty = true; }, selected === 'chocolate' ? '#d5b6f9' : '#fff1dd', 16);
  text('先选道具再点冒头角色；向上滑角色可直接投喂', 195, bottom - 20, 12, '#663548', 'center');
}
function interact(index, kind) {
  const hit = round.hit(index, kind);
  if (hit) { stage.hit(index, kind, hit.delta > 0); chatAction = hit.delta > 0 ? hit.character.correct : hit.character.wrong; dirty = true; }
}
function roster(mode) {
  header(mode === 'guide' ? '人物图鉴' : '选一位同事聊聊');
  const perPage = Math.max(1, Math.min(5, Math.floor((bottom - top - 120) / 94)));
  const pages = Math.ceil(characters.length / perPage);
  pageIndex = Math.min(pageIndex, pages - 1);
  characters.slice(pageIndex * perPage, (pageIndex + 1) * perPage).forEach((c, n) => {
    const y = top + 66 + n * 94;
    panel(20, y, 350, 84); portrait(c, 27, y + 10, 64);
    text(c.name, 102, y + 23, 17);
    text(`${c.relation > 0 ? '+' : ''}${c.relation} · ${c.relation === 0 ? '两种道具都 +5' : c.relation > 0 ? '投喂得分' : '敲击得分'}`, 102, y + 49, 13);
    if (mode === 'picker') button('聊聊', 296, y + 22, 62, 40, () => {
      chatCharacter = c; chatText = c.bio; chatAction = '同事的开场白'; enterWorld('chat');
    }, '#dfc3fc', 14);
    else text(translate(c.role).split(' / ')[0], 102, y + 69, 12);
  });
  if (pageIndex > 0) button('上一页', 20, bottom - 45, 95, 40, () => { pageIndex--; dirty = true; }, '#fff1dd', 14);
  text(`${pageIndex + 1} / ${pages}`, 195, bottom - 25, 14, '#663548', 'center');
  if (pageIndex < pages - 1) button('下一页', 275, bottom - 45, 95, 40, () => { pageIndex++; dirty = true; }, '#fff1dd', 14);
}
function chat() {
  header(chatCharacter.name, () => go('picker'));
  const heroHeight = Math.min(190, (bottom - top) * .25), bubbleHeight = Math.min(132, (bottom - top) * .21);
  text('本地角色互动 · 预设台词', 195, top + 60 + heroHeight + 8, 12, '#8a6170', 'center');
  const y = top + 60 + heroHeight + 22;
  panel(24, y, 342, bubbleHeight);
  text(chatAction, 40, y + 22, 12, '#a06b72');
  wrap(chatText, 40, y + 48, 310, getLanguage() === 'en' ? 15 : 17, 23);
  button('投喂', 24, bottom - 157, 164, 44, () => {
    stage.hit(characters.indexOf(chatCharacter), 'chocolate', chatCharacter.relation >= 0);
    chatAction = '你投喂了同事'; chatText = chatCharacter.relation >= 0 ? chatCharacter.correct : chatCharacter.wrong; dirty = true;
  }, '#ddc0ff');
  button('玩具锤', 202, bottom - 157, 164, 44, () => {
    stage.hit(characters.indexOf(chatCharacter), 'hammer', chatCharacter.relation <= 0);
    chatAction = '你轻敲了同事'; chatText = chatCharacter.relation < 0 ? chatCharacter.correct : chatCharacter.wrong; dirty = true;
  }, '#ffbcb2');
  button('今天辛苦啦', 24, bottom - 101, 342, 42, () => {
    chatAction = '你说：今天辛苦啦'; chatText = chatCharacter.id === 'office_orange_cat' ? '喵～一起休息一下吧！' : '收到这份快乐啦！忙完记得歇一歇。'; dirty = true;
  }, '#fff1dd', 16);
  button('说一句你的口头禅', 24, bottom - 47, 342, 42, () => {
    chatAction = '同事的口头禅'; chatText = chatCharacter.bio; dirty = true;
  }, '#fff1dd', 16);
}
function results() {
  header('今天的摸鱼战报', null);
  panel(24, top + 74, 342, 245);
  text(`${round.score} 分`, 195, top + 126, 46, '#c85169', 'center');
  text(result.title, 195, top + 187, 25, '#663548', 'center');
  text(`正确 ${round.correct}/${round.attempts} · 最高连击 ${round.maxCombo}`, 195, top + 238, 16, '#663548', 'center');
  text(`漏接 ${round.misses} · 本机最佳 ${best}`, 195, top + 276, 15, '#663548', 'center');
  if (bottom - top > 550) wrap('今天的快乐已经送达。下班记得带走好心情！', 38, top + 352, 310, 18, 29);
  button('再摸一局', 24, bottom - 116, 342, 48, start, '#ffb4a9');
  button('返回事务所', 24, bottom - 55, 342, 44, home, '#fff1dd');
}
function instructions() {
  header('玩法说明');
  const lines = [
    '1. 每局30秒，角色会从工位冒头。',
    '2. 亲疏为负数：用玩具锤敲击。',
    '3. 亲疏为正数：用巧克力投喂。',
    '4. 选中道具，轻点冒头角色即可。',
    '5. 向上滑角色可直接投喂。',
    '6. 正确加分，选错扣分；中立均+5。',
    '7. 亲疏绝对值越大，分值越高。',
    '8. 切到后台会暂停，回来手动继续。',
    '聊聊模式不限时、不计分，使用预设台词。'
  ];
  let y = top + 70;
  for (const line of lines) y = wrap(line, 26, y, 338, 15, 23) + 6;
}
function musicSettings() {
  header('音乐设置');
  text('给摸鱼时间配一点节奏', 26, top + 91, 20);
  button(musicEnabled ? '背景音乐：开（点击关闭）' : '背景音乐：关（点击开启）', 24, top + 138, 342, 58, () => {
    musicEnabled = !musicEnabled; save(); if (musicEnabled) playMusic(); else music.pause(); dirty = true;
  }, '#e1c4fc', 17);
  wrap('Fluffing a Duck\nKevin MacLeod (incompetech.com)\nCC BY 4.0\n112 kbps重新编码、低音量循环播放。', 26, top + 241, 338, 15, 27);
  wrap('来源：incompetech.com/music/royalty-free/\nindex.html?isrc=USUAN1100768\n许可：creativecommons.org/licenses/by/4.0/', 26, top + 365, 338, 12, 23);
}
function privacy() {
  header('隐私与说明');
  let y = top + 68;
  for (const line of [
    '本版无需登录，不收集头像、昵称、电话或位置，不向服务器发送数据。',
    '音乐偏好、最高分和称号轮换记录仅保存在当前微信设备的本地存储中。',
    '“聊聊”使用预设台词，不是在线AI。本版没有自由文字输入、广告或支付。',
    '本版为微信原生3D版本，网页版本继续独立运行。',
    storageFailed ? '本机存储不可用：本次设置可能无法保留。' : '你可以随时清除本游戏的本地记录。'
  ]) y = wrap(line, 26, y, 338, 14, 22) + 10;
  button('清除本地记录', 24, bottom - 65, 342, 48, () => wx.showModal({
    title: translate('清除本地记录'), content: translate('将删除最高分、音乐偏好和称号记录。'),
    success: res => {
      if (!res.confirm) return;
      try {
        wx.removeStorageSync(STORE); wx.removeStorageSync('shushu.achievements.v1');
        best = null; musicEnabled = false; setLanguage('zh'); music.pause();
        picker = createAchievementPicker(achievementStorage);
        wx.showToast({title: translate('已清除本地记录'), icon: 'none'}); dirty = true;
      } catch { wx.showToast({title: translate('清除失败，请重试'), icon: 'none'}); }
    }
  }), '#ffcfbd', 16);
}
function render() {
  buttons = [];
  const gradient = ctx.createLinearGradient(0, 0, 390, height);
  gradient.addColorStop(0, '#f9c693'); gradient.addColorStop(1, '#b9796f');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 390, height);
  if (page === 'playing') ctx.clearRect(0, top + 78, 390, bottom - 100 - top - 78);
  else if (page === 'chat') ctx.clearRect(0, top + 78, 390, Math.min(190, (bottom - top) * .25) - 18);
  if (page === 'home') cover();
  else if (page === 'playing') board();
  else if (page === 'guide' || page === 'picker') roster(page);
  else if (page === 'chat') chat();
  else if (page === 'results') results();
  else if (page === 'instructions') instructions();
  else if (page === 'music') musicSettings();
  else if (page === 'privacy') privacy();
  else if (page === 'loading') {
    header('正在加载3D办公室…');
    text(`3D角色 ${stage.progress}/10`, 195, top + 150, 24, '#663548', 'center');
    if (stage.error) {
      wrap(stage.error === 'WEBGL2_REQUIRED' ? '当前设备不支持所需的3D环境，请更新微信后重试。' : '3D资产加载失败，请重试', 30, top + 215, 330, 18, 28);
      button('重试加载', 35, bottom - 90, 320, 48, () => enterWorld(afterLoading));
    }
  }
  else if (page === 'paused') {
    header('休息一下', null);
    text('游戏已暂停，时间不会流逝', 195, top + 143, 22, '#663548', 'center');
    button('继续摸鱼', 35, top + 210, 320, 58, resume, '#ffb4a9');
    button('结束本局，返回首页', 35, top + 292, 320, 52, home, '#fff1dd');
  }
  dirty = false;
}
function point(touch) { return {x: (touch.clientX ?? touch.pageX) / scale, y: (touch.clientY ?? touch.pageY) / scale}; }
function inside(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
wx.onTouchStart(event => {
  if (hidden || gesture || event.touches.length !== 1) return;
  const t = event.touches[0], p = point(t);
  const index = page === 'playing' ? boardRects().findIndex((r, i) => round.slots[i].active && inside(p, r)) : -1;
  gesture = {...p, id: t.identifier, at: Date.now(), epoch, distance: 0, index};
});
wx.onTouchMove(event => {
  if (!gesture) return;
  const t = event.touches.find(t => t.identifier === gesture.id);
  if (t) { const p = point(t); gesture.distance = Math.max(gesture.distance, Math.hypot(p.x - gesture.x, p.y - gesture.y)); }
});
wx.onTouchEnd(event => {
  if (!gesture) return;
  const t = event.changedTouches.find(t => t.identifier === gesture.id);
  if (!t) return;
  const g = gesture; gesture = null;
  if (g.epoch !== epoch || hidden) return;
  const p = point(t), ms = Date.now() - g.at;
  const kind = classifyGesture(p.x - g.x, p.y - g.y, ms, g.distance);
  if (page === 'playing' && g.index >= 0) {
    if (kind === 'chocolate') interact(g.index, 'chocolate');
    else if (kind === 'hammer' && inside(p, boardRects()[g.index])) interact(g.index, selected);
    return;
  }
  if (kind !== 'hammer') return;
  const control = buttons.find(b => inside(g, b) && inside(p, b));
  control?.action();
});
wx.onTouchCancel(() => { gesture = null; });
wx.onHide(() => { hidden = true; gesture = null; pause(); music.pause(); lastFrame = null; });
wx.onShow(() => { hidden = false; dirty = true; lastFrame = null; });
wx.onWindowResize?.(() => { gesture = null; layout(); });
function frame(now) {
  const dt = lastFrame === null ? 0 : Math.max(0, now - lastFrame) / 1000;
  if (!hidden) {
    if (page === 'playing') {
      if (lastFrame !== null && __WECHAT_QA__ !== 'pose') round.update(Math.max(0, now - lastFrame) / 1000);
      if (__WECHAT_QA__ === 'pose') round.slots.forEach(s => { s.active = true; });
      lastFrame = now;
      if (round.finished) finish();
      dirty = true;
    } else lastFrame = null;
    if (page === 'chat') dirty = true;
    if (dirty) {
      render();
      stage.present({world: page === 'playing' || page === 'chat', dt: page === 'playing' || page === 'chat' ? dt : 0,
        round, chatIndex: page === 'chat' ? characters.indexOf(chatCharacter) : -1, selected});
    }
    lastFrame = now;
  }
  requestAnimationFrame(frame);
}
layout(); render(); stage.present(); requestAnimationFrame(frame);
if (stage.error === 'WEBGL2_REQUIRED') wx.showModal({title: '3D', content: translate('当前设备不支持所需的3D环境，请更新微信后重试。'), showCancel: false});
// Removed by the production build; lets native loading/rendering be checked without an AppID.
if (__WECHAT_QA__) { setLanguage('en'); start(); }
