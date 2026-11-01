import {build} from '../game/node_modules/esbuild/lib/main.js';
import {cp, mkdir, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {unpackGLB} from './wechat-glb.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'wechat/dist');
await rm(out, {recursive: true, force: true});
await mkdir(path.join(out, 'assets/portraits'), {recursive: true});
await build({entryPoints: [path.join(root, 'wechat/src/main.js')], outfile: path.join(out, 'game.js'),
  bundle: true, platform: 'neutral', format: 'iife', target: 'es2018', minify: true, legalComments: 'none',
  inject: [path.join(root, 'wechat/src/native-platform.js')], mainFields: ['module', 'main'],
  define: {__WECHAT_QA__: JSON.stringify(process.env.WECHAT_QA || '')},
  alias: {'three/addons': path.join(root, 'game/node_modules/three/examples/jsm'), three: path.join(root, 'game/node_modules/three')}});
await cp(path.join(root, 'wechat/game.json'), path.join(out, 'game.json'));
await cp(path.join(root, 'wechat/cover.jpg'), path.join(out, 'assets/cover.jpg'));
await cp(path.join(root, 'game/public/portraits'), path.join(out, 'assets/portraits'), {recursive: true});
await cp(path.join(root, 'game/public/audio/fluffing-a-duck.mp3'), path.join(out, 'assets/music.mp3'));
await writeFile(path.join(out, 'assets/MUSIC-LICENSE.txt'), 'Fluffing a Duck — Kevin MacLeod (incompetech.com)\nhttps://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100768\nCC BY 4.0 — https://creativecommons.org/licenses/by/4.0/\nRe-encoded to 112 kbps MP3 at 44.1 kHz; looped at reduced volume.\n');
await mkdir(path.join(out, 'models3d'), {recursive: true});
await cp(path.join(root, 'game/public/backgrounds/office-sunset.jpg'), path.join(out, 'models3d/office-sunset.jpg'));
const roles = ['overtime_boss', 'deadline_officer', 'slacker_ally', 'blame_shifter', 'passing_intern', 'hr_specialist', 'finance_manager', 'office_orange_cat', 'promise_maker'];
const models = [...roles.map(id => `${id}_rigged`), 'it_rescuer_animation_rigged', 'it_rescuer_split', 'star_hammer', 'heart_chocolates', 'bookshelf_mobile', 'water_dispenser_mobile', 'plant_small_mobile'];
for (const id of models) {
  const {glb, images} = unpackGLB(await readFile(path.join(root, `game/public/models/${id}.glb`)), id);
  await writeFile(path.join(out, `models3d/${id}.glb`), glb);
  for (const image of images) await writeFile(path.join(out, 'models3d', image.name), image.bytes);
}
await writeFile(path.join(out, 'models3d/game.js'), '// Assets loaded by the native 3D runtime.\n');
async function files(dir) {
  return (await Promise.all((await readdir(dir, {withFileTypes: true})).map(async e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : [{path: path.relative(out, p), size: (await stat(p)).size}];
  }))).flat();
}
const entries = await files(out);
const total = entries.reduce((sum, f) => sum + f.size, 0);
const main = entries.filter(f => !f.path.startsWith('models3d/')).reduce((sum, f) => sum + f.size, 0);
// Conservative local budget; the developer tools' upload report is authoritative.
if (main >= 4 * 1024 * 1024) throw Error(`主包超过本项目4MiB预算：${main} bytes`);
if (total >= 30 * 1024 * 1024) throw Error(`总包超过本项目30MiB预算：${total} bytes`);
await writeFile(path.join(root, 'wechat/build-report.json'), JSON.stringify({mainMiB: main / 1024 / 1024, totalMiB: total / 1024 / 1024, models, files: entries}, null, 2));
console.log(`微信3D版构建完成：主包 ${(main / 1024 / 1024).toFixed(2)} MiB，总包 ${(total / 1024 / 1024).toFixed(2)} MiB，${models.length} 个3D资产。导入 wechat 文件夹。`);
