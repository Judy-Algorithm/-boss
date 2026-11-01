import {characters} from './characters.js';
import {ACHIEVEMENT_BANDS} from './achievements.js';

let language = 'zh';
const listeners = new Set();
export const getLanguage = () => language;
export function setLanguage(value) {
  language = value === 'en' ? 'en' : 'zh';
  for (const listener of listeners) listener(language);
}
export function onLanguageChange(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export const EN_CHARACTERS = {
  overtime_boss: ['Overtime Boss', 'Boss / Final decision maker', 'Everyone is working late!', 'Okay, okay! Go home on time!', 'Chocolate? Two more hours!', 'This office is my home. Yours too, tonight!'],
  deadline_officer: ['Deadline Captain', 'Project manager / Deadline patrol', 'Where is that update?', 'Fine! Deadline extended!', 'Thanks for the sugar. Now, that update?', 'No rush. Just get it to me before you leave!'],
  slacker_ally: ['Break Buddy', 'Colleague / Break-time lookout', 'Has the boss left yet?', 'Nice! I will keep watch for you!', 'Hey! We are on the same team!', 'Researching company strategy... and ordering lunch.'],
  blame_shifter: ['Blame Dodger', 'Cross-team liaison / Blame avoidance', 'That is not my job!', 'Who did that? Not my problem!', 'I will take the gift. You take the blame!', 'I know all about it. Still not my responsibility!'],
  passing_intern: ['Passing Intern', 'Intern / Helpful extra hands', 'Wait, me?', 'Wow! A treat for the intern too!', 'I am just an intern!', 'I came here to learn. Why am I saving the company?'],
  it_rescuer: ['IT Hero', 'Tech support / Computer rescue', 'Have you tried restarting?', 'Got it! Moving your ticket up!', 'The computer is broken. Now I am too!', 'Computer trouble? Try restarting before calling me!'],
  hr_specialist: ['HR Sunshine', 'People team / Employee care', 'We are one big family!', 'Now that is a real benefit!', 'Let us talk about your feelings.', 'We are a family! The benefits are on their way!'],
  finance_manager: ['Budget Guardian', 'Finance / Expenses and budgets', 'Where is the receipt?', 'Okay! I will approve that expense!', 'I need a receipt for this chocolate too!', 'No receipt? No reimbursement. Nothing personal!'],
  office_orange_cat: ['Office Cat', 'Office mascot / Mood booster', 'Meow~', 'Meow! You may pet me now!', 'Meow?! You are on my block list!', 'You handle the work. I will handle the naps.'],
  promise_maker: ['Dream Seller', 'Strategy / Big promises', 'The future is bright!', 'Easy! I will deliver this time!', 'Thanks! Your reward arrives next year!', 'Work hard this year. Next year, we are all owners!']
};
const entries = {
  '摸鱼事务所': 'Office Escape', '摸鱼': 'Take a Break', '事务所': 'Office', '聊聊': 'Chat', '私聊': 'Chat',
  '敲走怨气，喂点快乐。': 'Tap away stress. Share a little joy.', '你的同事，你来定义。投喂、敲击，或者聊两句。': 'Your coworkers, your rules. Tap, treat, or chat.',
  '返回': 'Back', '继续': 'Resume', '暂停': 'Pause', '人物图鉴': 'Characters', '人物': 'People', '音乐': 'Music',
  '音乐设置': 'Music', '玩法说明': 'How to Play', '游戏说明': 'How to Play', '隐私与说明': 'Privacy & Info',
  '30秒挑战': '30-second challenge', '选择角色私聊': 'Choose a coworker', '办公室准备好了': 'Your office is ready',
  '办公室准备中…': 'Getting your office ready...', '摸鱼 · 30秒挑战': 'Play · 30 seconds', '聊聊 · 选择角色': 'Chat · Pick a coworker', '聊聊 · 选择角色私聊': 'Chat · Pick a coworker',
  '休息一下': 'Take a breather', '游戏已暂停，时间不会流逝': 'Paused. Your time is safe.', '继续摸鱼': 'Resume',
  '结束本局，返回首页': 'End round & go home', '返回首页': 'Home', '返回事务所': 'Back to the office', '再摸一局': 'Play again',
  '今天的摸鱼战报': 'Your break-time report', '今天的快乐已经送达。下班记得带走好心情！': 'Joy delivered. Take that good mood home with you!',
  '先选道具再点冒头角色；向上滑角色可直接投喂': 'Pick a tool, then tap a coworker. Swipe up to treat.',
  '选一位同事聊聊': 'Pick a coworker', '上一页': 'Previous', '下一页': 'Next', '本地角色互动 · 预设台词': 'Offline chat · Scripted replies',
  '同事的开场白': 'Your coworker says', '投喂': 'Treat', '敲击': 'Tap', '玩具锤': 'Toy hammer', '你投喂了同事': 'You shared a treat',
  '你轻敲了同事': 'You gave a playful tap', '今天辛苦啦': 'You did great today', '你说：今天辛苦啦': 'You: You did great today!',
  '喵～一起休息一下吧！': 'Meow~ Time for a break together!', '收到这份快乐啦！忙完记得歇一歇。': 'Joy received! Remember to rest when you can.',
  '说一句你的口头禅': 'What is your catchphrase?', '同事的口头禅': 'Your coworker says',
  '1. 每局30秒，角色会从工位冒头。': '1. Each round lasts 30 seconds. Watch for coworkers popping up.',
  '2. 亲疏为负数：用玩具锤敲击。': '2. Negative affinity? Use the toy hammer.',
  '3. 亲疏为正数：用巧克力投喂。': '3. Positive affinity? Share a chocolate treat.',
  '4. 选中道具，轻点冒头角色即可。': '4. Pick a tool, then tap an active coworker.',
  '5. 向上滑角色可直接投喂。': '5. Swipe up on a coworker to give a treat.',
  '6. 正确加分，选错扣分；中立均+5。': '6. Right tool: gain points. Wrong tool: lose points. Neutral: either gives +5.',
  '7. 亲疏绝对值越大，分值越高。': '7. Points equal absolute affinity times 10.',
  '8. 切到后台会暂停，回来手动继续。': '8. Leaving the game pauses it. Tap Resume when you return.',
  '聊聊模式不限时、不计分，使用预设台词。': 'Chat has no timer or score and uses scripted replies.',
  '给摸鱼时间配一点节奏': 'A soundtrack for your break', '背景音乐：开（点击关闭）': 'Music: on · Tap to mute',
  '背景音乐：关（点击开启）': 'Music: off · Tap to play', '音乐暂时无法播放': 'Music is unavailable',
  '清除本地记录': 'Clear local records', '将删除最高分、音乐偏好和称号记录。': 'Delete your best score, music preference and title history?',
  '已清除本地记录': 'Local records cleared', '清除失败，请重试': 'Could not clear records. Try again.',
  '设置本次有效，存储不可用': 'Storage unavailable. Settings apply this session.',
  '本版无需登录，不收集头像、昵称、电话或位置，不向服务器发送数据。': 'No login required. This edition does not collect your profile, phone or location, or send data to a server.',
  '音乐偏好、最高分和称号轮换记录仅保存在当前微信设备的本地存储中。': 'Your language, music preference, best score and title history stay on this device.',
  '“聊聊”使用预设台词，不是在线AI。本版没有自由文字输入、广告或支付。': 'Chat uses scripted replies, not online AI. This edition has no text input, ads or payments.',
  '本版为微信原生3D版本，网页版本继续独立运行。': 'This is the native WeChat 3D edition. The web edition runs separately.',
  '本机存储不可用：本次设置可能无法保留。': 'Storage unavailable: settings may not survive a restart.',
  '你可以随时清除本游戏的本地记录。': 'You can clear local records whenever you like.',
  '正在加载3D办公室…': 'Loading your 3D office...', '重试加载': 'Retry loading',
  '3D资产加载失败，请重试': '3D assets could not load. Please retry.',
  '当前设备不支持所需的3D环境，请更新微信后重试。': 'This device does not support the required 3D renderer. Update WeChat and try again.',
  '锤走加班，投喂同盟。': 'Tap away overtime. Treat your allies.', '摸鱼积分': 'Break points', '连击': 'Combo',
  '投喂同盟': 'Treat your allies', '锤走加班': 'Tap away overtime', '投喂冒头的人物': 'Treat a coworker who pops up',
  '敲击冒头的人物': 'Tap a coworker who pops up', '点一下': 'Tap', '向上滑': 'Swipe up', '锤走坏老板': 'Bonk the boss',
  '投喂好同事': 'Treat your allies', '重新开始': 'Restart', '人物冒头时，点道具直接出手': 'When a coworker pops up, tap a tool to act',
  '正在布置办公室…': 'Setting up your office...', '本地办公室已就绪': 'Your office is ready', '本地办公室已就绪 · 部分资产使用替身': 'Office ready · Some assets use placeholders',
  '打卡成功 · 下班快乐': 'Clocked out · Enjoy your evening', '今日摸鱼成就': 'Today’s break-time title',
  '操作正确率': 'Accuracy', '最高连击': 'Best combo', '成功互动': 'Correct actions', '办公室众生相': 'Meet your coworkers',
  '轻点人物文字或亲疏值，即可修改。': 'Tap a character detail or affinity to edit it.',
  '正式游戏': 'Challenge mode', '正数 ＋': 'Positive +', '负数 －': 'Negative −', '中立 0': 'Neutral 0', '两种都行': 'Either tool',
  '选对加分，选错扣同样的分。': 'The right tool adds points. The wrong tool loses the same amount.',
  '分数＝亲疏值去掉正负号 × 10。': 'Points = absolute affinity × 10.', '亲疏值为 0，两种都加 5 分。': 'At 0 affinity, either tool gives 5 points.',
  '亲疏值可在人物图鉴修改，按当前值计分。30 秒后结算总分。': 'Edit affinity in Characters. Your current settings determine points. Each round lasts 30 seconds.',
  '点「摸鱼」，倒计时后进入 30 秒挑战。': 'Tap Play to start a 30-second challenge after the countdown.',
  '人物冒头时，直接点「投喂」或「敲击」。': 'When a coworker pops up, tap Treat or Tap.',
  '首页点「私聊」，再选一位角色。': 'Tap Chat on the home screen, then choose a coworker.',
  '可以打字聊天，也可以投喂或敲击。': 'Send a message, share a treat, or use the toy hammer.',
  '不限时、不计分，点左上角返回首页。': 'No timer, no score. Use the top-left button to go home.',
  '私聊 · 不限时': 'Chat · No timer', '私聊消息': 'Message', '和 TA 说点什么…': 'Say something to your coworker...',
  '发送': 'Send', '你': 'You', '正在检查 AI 连接…': 'Checking AI connection...', 'AI 尚未配置': 'AI is not configured',
  'AI 尚未配置。': 'AI is not configured.', 'AI 暂未连通': 'AI is unavailable', 'AI 暂未连通，请稍后重试。': 'AI is unavailable. Please try again.',
  '静音': 'Mute', '开启声音': 'Unmute', '关闭声音': 'Mute', '上班时间 · 慢慢来': 'Office hours · Take it easy',
  '老板巡场 · 注意配合': 'Boss patrol · Stay sharp', '下班冲刺 · 火力全开': 'Final stretch · Let’s go!', '开摸': 'GO!',
  '轻点一位角色，开始私聊': 'Tap a coworker to start chatting', '取消': 'Cancel', '保存': 'Save', '恢复默认': 'Reset',
  '关闭人物图鉴': 'Close characters', '关闭音乐设置': 'Close music settings', '关闭游戏说明': 'Close instructions',
  '亲疏值': 'Affinity', '角色标签': 'Character name', '职能介绍': 'Role', '性格与代表台词': 'Personality & catchphrase',
  '办公室电台': 'Office Radio', '背景音乐': 'Background music', '游戏音效': 'Sound effects', '音乐音量': 'Music volume',
  '新一局 / 进入私聊时自动换一首': 'Change tracks for a new round or chat', '下滑选择': 'Scroll to choose',
  '背景音乐已关闭': 'Music is off', '正在播放': 'Now playing', '已选择': 'Selected', '试听并选择': 'Preview and select',
  '摸鱼进行曲': 'Break-time March', '偷偷摸鱼': 'Sneaky Break', '办公室发疯': 'Office Antics', '老板巡逻': 'Boss Patrol',
  '摸鱼小算盘': 'A Cunning Plan', '快乐下班': 'Happy Clock-out', '轻巧俏皮 · 原来的配方': 'Light and playful · The original',
  '蹑手蹑脚 · 老板来了': 'Sneaky steps · Boss approaching', '滑稽跳跃 · 快乐敲击': 'Bouncy fun · Happy tapping',
  '搞怪侦探 · 小心被抓': 'Quirky detective · Stay alert', '古灵精怪 · 悄悄计划': 'Mischievous · Secret plans',
  '明亮轻快 · 放松聊聊天': 'Bright and breezy · Relax and chat', '这首暂时没能播放，试试另一首。': 'This track is unavailable. Try another.',
  '轻点曲目即可开始试听。': 'Tap a track to preview it.', '自定义角色': 'Customize coworker', '关闭角色设置': 'Close character settings',
  '1～8 个字': '1–8 Chinese or 1–24 Latin characters', '1～8中文字／1～24英文字': '1–8 Chinese or 1–24 Latin characters',
  '例如：技术支持 / 电脑急救': 'For example: Tech support / Computer rescue', '写下性格、说话风格或一句代表台词': 'Add a personality, speaking style or catchphrase',
  '疏远 −5': 'Distant −5', '亲近 +5': 'Close +5', '修改保存在本机，可随时恢复。': 'Changes stay on this device. You can reset them anytime.',
  '恢复这个角色的默认设置': 'Reset this coworker', '已保存人物设定。': 'Coworker settings saved.',
  '已更新；浏览器未允许保存，刷新后将恢复。': 'Updated for this session. Browser storage is unavailable.',
  '正在写你的下班评语…': 'Writing your clock-out note...', 'AI 未配置': 'AI is not configured', 'AI 暂时未连通': 'AI is unavailable',
  '提示': 'Notice', '正在回应': 'Replying', '消息有点多，等 TA 回一句再来吧。': 'Let your coworker catch up before sending more.',
  '敲了一下小锤子': 'You gave a playful tap', '投喂了一份猫零食': 'You shared a cat treat', '送出一份巧克力': 'You shared a chocolate',
  '首页菜单': 'Home menu', '选择玩法': 'Choose a mode', '办公室游戏区域': 'Office game area', '十个工位的3D办公室': '3D office with ten desks',
  '对局状态': 'Round status', '选择道具': 'Choose a tool', '对局结算': 'Round results', '暂停菜单': 'Pause menu',
  '私聊对话': 'Private conversation', '聊天记录': 'Chat history', '选择背景音乐': 'Choose background music',
  '轻点挥锤，或向上滑至少28像素': 'Tap to use a tool, or swipe up to treat',
  '112 kbps重新编码、低音量循环播放。': 'Re-encoded at 112 kbps; looped at low volume.', '来源：': 'Source: ', '许可：': 'License: '
  ,'标签需要 1～8 个中文字或 1～24 个英文字': 'Use 1–8 Chinese or 1–24 Latin characters for the name'
};
for (const c of characters) {
  const en = EN_CHARACTERS[c.id];
  for (const [field, index] of [['name', 0], ['role', 1], ['pop', 2], ['correct', 3], ['wrong', 4], ['bio', 5]]) entries[c[field]] = en[index];
}
const titles = ['Happy Reset Legend', 'Plot Twist Master', 'Office Explorer', 'Tool Trainee', 'Happy Little Accident', 'Warming Up', 'Perfect Balance', 'Office Observer', 'Office Whiz', 'Break-time Pro', 'Office Expert', 'On-time Exit Champion', 'Office Legend'];
ACHIEVEMENT_BANDS.forEach((band, i) => band.titles.forEach(title => { entries[title] = titles[i]; }));
const phraseKeys = Object.keys(entries).sort((a, b) => b.length - a.length);
export function translate(value, lang = language) {
  const raw = String(value);
  if (lang !== 'en') return raw;
  if (!/[\u3400-\u9fff]/.test(raw)) return raw;
  if (entries[raw] !== undefined) return entries[raw];
  const trimmed = raw.trim();
  if (entries[trimmed] !== undefined) return raw.replace(trimmed, entries[trimmed]);
  const patterns = [
    [/^得分 (-?\d+)$/, (_, n) => `Score ${n}`], [/^(\d+)秒$/, (_, n) => `${n}s`], [/^(-?\d+) 分$/, (_, n) => `${n} points`],
    [/^连击 (\d+)  ·  敲负数，喂正数，中立都可$/, (_, n) => `Combo ${n} · Tap negatives. Treat positives.`],
    [/^正确 (\d+)\/(\d+) · 最高连击 (\d+)$/, (_, a, b, c) => `Correct ${a}/${b} · Best combo ${c}`],
    [/^漏接 (\d+) · 本机最佳 (-?\d+)$/, (_, a, b) => `Missed ${a} · Best ${b}`],
    [/^([+−-]?\d+)  (冒头啦！|工作中)$/, (_, n, state) => `${n}  ${state === '工作中' ? 'Working' : 'Tap me!'}`],
    [/^([+−-]?\d+) · (两种道具都 \+5|投喂得分|敲击得分)$/, (_, n, label) => `${n} · ${label.startsWith('两种') ? 'Either +5' : label.startsWith('投喂') ? 'Treat' : 'Tap'}`],
    [/^✓? ?玩具锤 · 敲击$/, () => `${raw.startsWith('✓') ? '✓ ' : ''}Hammer · Tap`],
    [/^✓? ?巧克力 · 投喂$/, () => `${raw.startsWith('✓') ? '✓ ' : ''}Chocolate · Treat`],
    [/^角色就位 (\d+)\/(\d+)$/, (_, a, b) => `Coworkers ready ${a}/${b}`],
    [/^3D角色 (\d+)\/10$/, (_, a) => `3D coworkers ${a}/10`],
    [/^(.+)头像$/, (_, name) => `${translate(name, 'en')} portrait`],
    [/^修改(.+)的标签$/, (_, name) => `Edit ${translate(name, 'en')}: name`],
    [/^修改(.+)的亲疏值，当前(-?\d+)$/, (_, name, n) => `Edit ${translate(name, 'en')}: affinity, currently ${n}`],
    [/^修改(.+)的(职能介绍|性格与代表台词)$/, (_, name, field) => `Edit ${translate(name, 'en')}: ${translate(field, 'en')}`],
    [/^原角色：(.+)$/, (_, name) => `Original: ${translate(name, 'en')}`],
    [/^角色：(.+)$/, (_, name) => `Coworker: ${translate(name, 'en')}`],
    [/^中立：敲击、投喂都 \+5 分$/, () => 'Neutral: either tool gives +5 points'],
    [/^投喂 ([+−-]?\d+)，敲击 ([+−-]?\d+)$/, (_, a, b) => `Treat ${a}, tap ${b}`],
    [/^敲击 ([+−-]?\d+)，投喂 ([+−-]?\d+)$/, (_, a, b) => `Tap ${a}, treat ${b}`],
    [/^(\d+) 首配乐$/, (_, n) => `${n} tracks`]
  ];
  for (const [pattern, replacement] of patterns) if (pattern.test(raw)) return raw.replace(pattern, replacement);
  // Accessibility labels, quoted bios and combined short UI labels use the same catalog.
  let result = raw;
  for (const key of phraseKeys) {
    if (key.length >= 2) result = result.split(key).join(entries[key]);
  }
  return result;
}
