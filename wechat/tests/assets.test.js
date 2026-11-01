import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {unpackGLB} from '../../scripts/wechat-glb.mjs';
import {GLTFLoader} from '../../game/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {LoadingManager, Texture} from '../../game/node_modules/three/build/three.module.js';

test('all packaged models preserve geometry, textures and character skeletons after native conversion', async () => {
  const report = JSON.parse(await readFile(new URL('../build-report.json', import.meta.url)));
  assert.ok(report.mainMiB < 4); assert.ok(report.totalMiB < 30); assert.equal(report.models.length, 16);
  globalThis.self = globalThis;
  const manager = new LoadingManager();
  manager.addHandler(/\.(png|jpe?g)$/i, {load(path, done) { const texture = new Texture(); done(texture); return texture; }});
  for (const id of report.models) {
    const source = await readFile(new URL(`../../game/public/models/${id}.glb`, import.meta.url));
    const {glb, images} = unpackGLB(source, id);
    const built = await readFile(new URL(`../dist/models3d/${id}.glb`, import.meta.url));
    assert.deepEqual(built, glb, id);
    for (const image of images) assert.deepEqual(await readFile(new URL(`../dist/models3d/${image.name}`, import.meta.url)), image.bytes);
    const gltf = await new GLTFLoader(manager).parseAsync(built.buffer.slice(built.byteOffset, built.byteOffset + built.byteLength), '');
    let meshes = 0, bones = 0; gltf.scene.traverse(o => { if (o.isMesh) meshes++; if (o.isBone) bones++; });
    assert.ok(meshes > 0, id);
    if (id.endsWith('_rigged')) assert.ok(bones >= 20, `${id} skeleton`);
    assert.ok(gltf.parser.json.images?.every(i => i.uri && i.bufferView === undefined) ?? true);
  }
  await access(new URL('../dist/models3d/office-sunset.jpg', import.meta.url));
});
