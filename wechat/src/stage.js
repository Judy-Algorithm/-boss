import * as THREE from '../../game/node_modules/three/build/three.module.js';
import {GLTFLoader} from '../../game/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from '../../game/node_modules/three/examples/jsm/environments/RoomEnvironment.js';
import {characters} from '../../game/src/characters.js';
import {buildWorkstation, batchWorkstations, OFFICE_LAYOUT} from '../../game/src/workstation.js';
import {NPCPerformance} from '../../game/src/npc-performance.js';
import {ITCharacterController} from '../../game/src/it-character-controller.js';
import {installITExpressions} from '../../game/src/it-expressions.js';
import {loadDetachedITProps} from '../../game/src/it-detached-props.js';
import {repairChibiHeadWeights} from '../../game/src/chibi-skin.js';
import {fitCharacterHead, NPC_HEAD_FITS, NPC_SEAT_OFFSETS} from '../../game/src/character-fit.js';

export function createNativeStage(onChange) {
  const display = wx.createCanvas();
  display.addEventListener ||= () => {};
  display.removeEventListener ||= () => {};
  let renderer;
  // In Mini Games the first createCanvas() is the display; subsequent canvases are offscreen.
  const hudCanvas = wx.createCanvas(); hudCanvas.width = 390; hudCanvas.height = 844;
  let error = '', loaded = 0, loading = null, ready = false, clock = 0, rects = [];
  try {
    const context = display.getContext('webgl2', {alpha: false, antialias: false});
    if (!context) throw Error('WEBGL2_REQUIRED');
    renderer = new THREE.WebGLRenderer({canvas: display, context, antialias: false});
    renderer.autoClear = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .86;
  } catch (e) { error = 'WEBGL2_REQUIRED'; console.error('Native 3D initialization failed', e); }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d6a283');
  scene.add(new THREE.HemisphereLight('#fff0d6', '#7a6087', .72));
  const sun = new THREE.DirectionalLight('#ffe6bb', 2.4); sun.position.set(-4, 9, 8); scene.add(sun);
  const fill = new THREE.DirectionalLight('#bfbcff', .72); fill.position.set(5, 6, -4); scene.add(fill);
  const camera = new THREE.OrthographicCamera(-2.8, 2.8, 5.2, -5.2, .1, 80);
  const actors = characters.map((c, i) => {
    const station = new THREE.Group();
    station.position.set(i % 2 ? OFFICE_LAYOUT.columnX : -OFFICE_LAYOUT.columnX, 0, (Math.floor(i / 2) - 2) * OFFICE_LAYOUT.rowSpacing);
    scene.add(station);
    const unit = buildWorkstation(station, i);
    const actor = new THREE.Group(); actor.position.set(0, .2, OFFICE_LAYOUT.actorZ + (NPC_SEAT_OFFSETS[c.id] || 0)); station.add(actor);
    return {c, station, actor, desk: unit.group, motion: null, state: 'Hidden', since: 0, reactKind: 'hammer', reactCorrect: true};
  });
  if (renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), .05).texture;
    scene.environmentIntensity = .65; pmrem.dispose();
  }
  const overlay = new THREE.Scene(), overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  const hudTexture = new THREE.CanvasTexture(hudCanvas); hudTexture.colorSpace = THREE.SRGBColorSpace;
  const hudPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({map: hudTexture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false}));
  hudPlane.position.z = -1; overlay.add(hudPlane);
  const manager = new THREE.LoadingManager();
  let textureFailures = 0;
  const textureLoader = {
    load(path, onLoad, progress, onError) {
      const texture = new THREE.Texture(), image = wx.createImage();
      manager.itemStart(path);
      image.onload = () => { texture.image = image; texture.needsUpdate = true; onLoad(texture); manager.itemEnd(path); };
      image.onerror = e => { textureFailures++; manager.itemError(path); manager.itemEnd(path); onError?.(e); };
      image.src = path; return texture;
    }
  };
  manager.addHandler(/\.(png|jpe?g)$/i, textureLoader);
  const gltfLoader = new GLTFLoader(manager);
  function read(path) { return new Promise((resolve, reject) => wx.getFileSystemManager().readFile({filePath: path, success: r => resolve(r.data), fail: reject})); }
  async function loadModel(file) {
    const path = `models3d/${file}.glb`;
    const data = await read(path);
    const before = textureFailures;
    const gltf = await gltfLoader.parseAsync(data, 'models3d/');
    // GLTFLoader otherwise swallows texture errors and silently renders untextured models.
    if (textureFailures !== before) throw Error(`Missing texture: ${file}`);
    return gltf;
  }
  function normalized(gltf, span) {
    const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const root = new THREE.Group(); gltf.scene.position.set(-center.x, -box.min.y, -center.z); root.add(gltf.scene);
    root.scale.setScalar(span / size.y); root.userData.animations = gltf.animations;
    root.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
    return root;
  }
  const props = {}, batchedDesks = [];
  async function loadAll() {
    if (error === 'WEBGL2_REQUIRED' || ready) return;
    if (loading) return loading;
    error = ''; loaded = actors.filter(a => a.motion).length; onChange();
    loading = (async () => {
      await new Promise((resolve, reject) => wx.loadSubpackage({name: 'models3d', success: resolve, fail: reject}));
      const backdrop = await new Promise((resolve, reject) => textureLoader.load('models3d/office-sunset.jpg', resolve, null, reject));
      backdrop.colorSpace = THREE.SRGBColorSpace; scene.background = backdrop;
      // Limit concurrent texture decoding and GLB allocations on phones.
      for (const a of actors) {
        if (a.motion) continue;
        a.model?.removeFromParent();
        const file = a.c.id === 'it_rescuer' ? 'it_rescuer_animation_rigged' : `${a.c.id}_rigged`;
        const root = normalized(await loadModel(file), a.c.id === 'it_rescuer' ? 1.95 : 1.85);
        a.actor.add(root); a.model = root;
        if (a.c.id === 'it_rescuer') {
          const detached = await loadDetachedITProps({loadAsync: () => loadModel('it_rescuer_split')});
          a.motion = new ITCharacterController(root, detached); a.motion.expression = installITExpressions(root);
          detached.laptop.position.set(-.75, .98, .28); a.station.add(detached.laptop);
        } else {
          repairChibiHeadWeights(root, a.c.id); fitCharacterHead(root, NPC_HEAD_FITS[a.c.id]);
          a.motion = new NPCPerformance(root, a.c, actors.indexOf(a));
        }
        loaded++; onChange();
      }
      for (const [kind, file] of [['hammer', 'star_hammer'], ['chocolate', 'heart_chocolates']]) {
        if (props[kind]) continue;
        props[kind] = normalized(await loadModel(file), kind === 'hammer' ? .65 : .45);
        scene.add(props[kind]);
      }
      if (!scene.userData.furnished) {
        for (const [file, x, z, span] of [['bookshelf_mobile', -3.5, -4, 2.4], ['water_dispenser_mobile', 3.5, -4, 1.8], ['plant_small_mobile', -3.4, 4, 1]]) {
          const model = normalized(await loadModel(file), span); model.position.set(x, 0, z); scene.add(model);
        }
        scene.userData.furnished = true;
      }
      for (const a of actors) { a.privateDesk = a.desk.clone(true); a.privateDesk.visible = false; a.station.add(a.privateDesk); }
      const previousChildren = new Set(scene.children);
      batchWorkstations(scene, actors.map(a => a.desk));
      batchedDesks.push(...scene.children.filter(child => !previousChildren.has(child))); ready = true;
      console.info('Native 3D ready', {characters: actors.filter(a => a.motion).length, props: Object.keys(props).length});
    })().catch(e => { error = 'ASSET_LOAD_FAILED'; console.error('Native 3D asset load failed', e); })
      .finally(() => { loading = null; onChange(); });
    return loading;
  }
  let logicalHeight = 844, viewportTop = 160, viewportBottom = 700, pixelRatio = 1, viewWidth = 390;
  function resize(info, top, bottom) {
    logicalHeight = info.windowHeight / (info.windowWidth / 390);
    viewportTop = top + 78; viewportBottom = bottom - 100;
    viewWidth = info.windowWidth; pixelRatio = Math.min(info.pixelRatio || 1, 1.5);
    if (renderer) { renderer.setPixelRatio(pixelRatio); renderer.setSize(info.windowWidth, info.windowHeight, false); }
  }
  function setupCamera(chatIndex = -1, activeBottom = viewportBottom) {
    const h = activeBottom - viewportTop;
    const width = chatIndex >= 0 ? Math.max(3.6, 2.2 * 390 / h) : Math.max(5.6, 7.4 * 390 / h);
    camera.left = -width / 2; camera.right = width / 2; camera.top = width * h / 390 / 2; camera.bottom = -camera.top;
    const target = chatIndex >= 0 ? actors[chatIndex].station.position : new THREE.Vector3(0, 0, 0);
    camera.position.set(target.x, chatIndex >= 0 ? 4.2 : 14, target.z + (chatIndex >= 0 ? 12 : 26));
    camera.lookAt(target.x, 1.05, target.z); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  }
  function project(position) {
    const v = position.clone().project(camera);
    return {x: (v.x + 1) * 195, y: viewportTop + (1 - v.y) * (viewportBottom - viewportTop) / 2};
  }
  function hit(index, kind, correct) {
    const a = actors[index]; a.motion.actions?.[a.motion.current]?.reset().play(); a.state = 'React'; a.since = clock; a.reactionUntil = clock + 1.1; a.reactKind = kind; a.reactCorrect = correct;
    props[kind] && (props[kind].userData.flight = {index, since: clock});
  }
  function present({world = false, dt = 0, round, chatIndex = -1, selected = 'chocolate'} = {}) {
    if (!renderer) return;
    clock += Math.min(.06, dt);
    renderer.setScissorTest(false); renderer.setViewport(0, 0, viewWidth, logicalHeight * viewWidth / 390); renderer.clear();
    if (world && ready) {
      const activeBottom = chatIndex >= 0 ? viewportTop - 18 + Math.min(190, (viewportBottom - viewportTop + 178) * .25) : viewportBottom;
      setupCamera(chatIndex, activeBottom);
      if (scene.background.isTexture) {
        const bg = scene.background, aspect = bg.image.width / bg.image.height, viewportAspect = 390 / (activeBottom - viewportTop);
        bg.repeat.set(viewportAspect < aspect ? viewportAspect / aspect : 1, viewportAspect > aspect ? aspect / viewportAspect : 1);
        bg.offset.set((1 - bg.repeat.x) / 2, (1 - bg.repeat.y) / 2); bg.updateMatrix();
      }
      actors.forEach((a, i) => {
        const active = chatIndex >= 0 ? i === chatIndex : round?.slots[i].active;
        a.station.visible = chatIndex < 0 || i === chatIndex;
        a.privateDesk.visible = chatIndex >= 0;
        const next = a.reactionUntil > clock ? 'React' : active ? 'Active' : 'Hidden';
        if (next !== a.state) { a.state = next; a.since = clock; }
        const desired = next === 'Hidden' ? -.32 : .24;
        a.actor.position.y += (desired - a.actor.position.y) * Math.min(1, dt * 12);
        a.motion.update(a, clock - a.since, clock);
      });
      batchedDesks.forEach(mesh => { mesh.visible = chatIndex < 0; });
      rects = actors.map(a => {
        const pos = a.station.position.clone().add(new THREE.Vector3(0, 1.1 + a.actor.position.y, a.actor.position.z)); const p = project(pos);
        return {x: p.x - 42, y: p.y - 29, w: 84, h: 58, labelX: p.x, labelY: p.y + 34};
      });
      for (const [kind, object] of Object.entries(props)) {
        object.visible = chatIndex < 0;
        const f = object.userData.flight;
        if (f && clock - f.since < .5) {
          const t = (clock - f.since) / .5, end = actors[f.index].station.position.clone().add(new THREE.Vector3(0, 1.7, -.3));
          object.position.lerpVectors(new THREE.Vector3(kind === 'hammer' ? -1.5 : 1.5, .8, 6.5), end, t);
          object.position.y += Math.sin(t * Math.PI); object.rotation.z = kind === 'hammer' ? t * Math.PI * 2 : t * .4;
        } else { object.position.set(kind === 'hammer' ? -1.5 : 1.5, .85, 6.5); object.rotation.set(0, 0, 0); }
        object.scale.setScalar(object.userData.baseScale ||= object.scale.x);
        if (kind === selected) object.scale.multiplyScalar(1.1);
      }
      const factor = viewWidth / 390;
      renderer.setViewport(0, (logicalHeight - activeBottom) * factor, viewWidth, (activeBottom - viewportTop) * factor);
      renderer.render(scene, camera);
    }
    renderer.setViewport(0, 0, viewWidth, logicalHeight * viewWidth / 390);
    renderer.clearDepth(); hudTexture.needsUpdate = true; renderer.render(overlay, overlayCamera);
  }
  return {hudCanvas, resize, present, load: loadAll, hit, get rects() { return rects; },
    get ready() { return ready; }, get error() { return error; }, get progress() { return loaded; }};
}
