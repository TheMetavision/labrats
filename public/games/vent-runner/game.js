(() => {
'use strict';

/* ============================================================
   CONFIG
   ============================================================ */
const LANES = [-1.7, 0, 1.7];
const LANE_W = 1.6;
const FULL_W = LANES[2] - LANES[0] + LANE_W;
const DUCT_W = 6.2, DUCT_H = 4.4, SEG_L = 4, SEG_N = 34;
const SPAWN_Z = -125, DESPAWN_Z = 9;
const GRAVITY = -38, JUMP_V = 12;
const RAT_H = 0.9, RAT_SLIDE_H = 0.42;
const RAT_FRONT = -0.55, RAT_BACK = 0.45, RAT_HALF_W = 0.3;
const SECTION_LEN = 700;
const CART_H = 1.5, CART_W = 1.45, RAMP_L = 3.4;
/* ---------------- stages (stage map) ---------------- */
const STAGES = [
  { id: 'ductways', name: 'The Ductways', blurb: "The basement's covert access network", goal: 1500,
    tex: { wall: 'wall', wallN: 'wallN', floor: 'floor', floorN: 'floorN', vista: 'vista', hazard: 'fan' }, card: 'card',
    wallColor: 0x9aa3ab, ceilColor: 0x6c747c, floorColor: 0xb4bac0, ribs: true, chaser: 'mecha', chaserName: 'MechaMouser 9000', crash: ['Smacked into a fan unit', 'Fan units need a lane change, or Spring Paws to clear them.'],
    decals: [['d0', 0.72, 0.71], ['d1', 0.86, 0.59], ['d2', 0.74, 0.65], ['d3', 0.8, 0.69], ['d4', 1.0, 0.46], ['d5', 1.7, 0.4, 2.75]], decalY: [1.35, 2.65],
    sections: [
      { name: 'The Ductways',       light: [0.00, 2.30, 2.60], fog: 0x04090b, ui: '#00c2d4' },
      { name: 'Duct Junction B-7',  light: [2.80, 2.10, 0.20], fog: 0x0e0a03, ui: '#f5c518' },
      { name: 'Maintenance Shafts', light: [3.00, 0.45, 0.35], fog: 0x0d0405, ui: '#ff5a4a' } ] },
  { id: 'labzero', name: 'Lab Zero', blurb: 'Where the experiment decided it was done', goal: 1500,
    tex: { wall: 'lz_wall', wallN: 'lz_wallN', floor: 'lz_floor', floorN: 'lz_floorN', vista: 'lz_vista', hazard: 'lz_door' }, card: 'lz_card',
    wallColor: 0xa9b2ad, ceilColor: 0x59605c, floorColor: 0xa8aea8, ribs: false, chaser: 'fenrir', chaserName: 'Ludwig Fenrir', crash: ['Slammed into a blast door', 'Blast doors need a lane change, or Spring Paws to vault them.'],
    unlockNote: 'Clear Lab Zero to unlock Dr. Basil Whiskerworth',
    decals: [['lzd0', 0.62, 0.72], ['lzd1', 1.3, 0.39], ['lzd2', 0.66, 0.66], ['lzd3', 0.8, 0.39], ['lzd4', 0.7, 0.7], ['lzd5', 1.0, 0.48],
             ['lzd6', 0.72, 0.85, 3.05], ['lzd7', 1.9, 0.46, 3.2]], decalY: [0.75, 1.55],
    sections: [
      { name: 'Lab Zero: Intake Wing',  light: [1.50, 2.60, 1.90], fog: 0x050a07, ui: '#8fe3a8' },
      { name: 'The Specimen Halls',     light: [3.00, 0.50, 0.45], fog: 0x0d0405, ui: '#ff5a4a' },
      { name: "The Rat King's Court",   light: [2.40, 2.20, 0.55], fog: 0x0c0a03, ui: '#f5c518' } ] },
  { id: 'vault', name: 'The Cheese Vault', blurb: 'Six minutes in. Cheese still where they left it.', goal: 1500,
    tex: { wall: 'cv_wall', wallN: 'cv_wallN', floor: 'cv_floor', floorN: 'cv_floorN', vista: 'cv_vista', hazard: 'cv_door' }, card: 'cv_card',
    wallColor: 0x8c98a4, ceilColor: 0x4c5660, floorColor: 0x93a0ae, ribs: false, chaser: 'drone', chaserName: 'The Vault Security Drone',
    crash: ['Froze against a freezer door', 'Freezer doors need a lane change, or Spring Paws to clear them.'],
    decals: [['cvd0', 0.9, 0.62], ['cvd1', 0.68, 0.64], ['cvd2', 0.6, 0.29], ['cvd3', 0.62, 0.63], ['cvd4', 0.8, 0.56], ['cvd5', 0.75, 0.59]], decalY: [1.05, 2.3],
    sections: [
      { name: 'The Cheese Vault: Cold Store', light: [0.90, 1.90, 3.00], fog: 0x050a12, ui: '#7fc8ff' },
      { name: 'The Aged Cheddar Aisles',      light: [2.80, 2.00, 0.40], fog: 0x0e0a03, ui: '#f5c518' },
      { name: 'Vault B: Security Level 4',    light: [3.00, 0.45, 0.35], fog: 0x0d0405, ui: '#ff5a4a' } ] },
];
const DEBUG = new URLSearchParams(location.search).has('debug');
const UNLOCK_ALL = DEBUG;  // ?debug unlocks every stage and runner for testing; players unlock them by clearing stages
let stageIdx = Math.min(STAGES.length - 1, store0('lr_vent_stage', 0));
let SECTIONS = STAGES[stageIdx].sections;
function store0(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const $ = id => document.getElementById(id);

/* ============================================================
   RENDERER + POST
   ============================================================ */
if (typeof THREE === 'undefined') { $('err').style.display = 'grid'; return; }
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) { $('err').style.display = 'grid'; return; }
const small = Math.min(innerWidth, innerHeight) < 700;
const PR = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
renderer.setPixelRatio(PR);
renderer.setSize(innerWidth, innerHeight);
$('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const fogColor = new THREE.Color(SECTIONS[0].fog);
scene.background = fogColor.clone();
scene.fog = new THREE.Fog(fogColor.clone(), 16, 110);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 220);
camera.position.set(0, 2.4, 5.6);

const rt = new THREE.WebGLRenderTarget(innerWidth * PR, innerHeight * PR, { type: THREE.HalfFloatType });
const composer = new THREE.EffectComposer(renderer, rt);
composer.addPass(new THREE.RenderPass(scene, camera));
const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.9, 0.55, 0.92);
composer.addPass(bloom);
const FinalShader = {
  uniforms: { tDiffuse: { value: null }, flash: { value: 0 }, tint: { value: new THREE.Color(1, 0.1, 0.15) }, boost: { value: 0 }, time: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: [
    'uniform sampler2D tDiffuse; uniform float flash; uniform vec3 tint; uniform float boost; uniform float time; varying vec2 vUv;',
    'void main(){',
    '  vec2 d = vUv - 0.5;',
    '  float ab = 0.0015 + boost * 0.004;',
    '  vec3 c;',
    '  c.r = texture2D(tDiffuse, vUv + d * ab * 2.0).r;',
    '  c.g = texture2D(tDiffuse, vUv).g;',
    '  c.b = texture2D(tDiffuse, vUv - d * ab * 2.0).b;',
    '  c = 1.0 - exp(-c * 1.35);',                       // soft HDR tone map
    '  float v = 1.0 - smoothstep(0.3, 0.86, length(d) * 1.05);',
    '  c *= mix(0.32, 1.0, v);',
    '  c = mix(c, tint, flash * (1.0 - v * 0.55));',
    '  c += vec3(0.25, 1.0, 0.4) * boost * 0.12 * (1.0 - v);',
    '  float g = fract(sin(dot(vUv * (time + 1.0), vec2(12.9898, 78.233))) * 43758.5453);',
    '  c += (g - 0.5) * 0.025;',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n')
};
const finalPass = new THREE.ShaderPass(FinalShader);
composer.addPass(finalPass);

/* ============================================================
   TEXTURES (procedural, no external files)
   ============================================================ */
function canvasTex(w, h, draw, rx, ry) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx || 1, ry || 1);
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
function speckle(g, w, h, n, base, spread, a) {
  for (let i = 0; i < n; i++) {
    const v = base + Math.random() * spread | 0;
    g.fillStyle = `rgba(${v},${v},${v + 4},${a})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}
const plateTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#7a8189'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 3000, 95, 70, 0.22);
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, 'rgba(255,255,255,0.05)'); grd.addColorStop(1, 'rgba(0,0,0,0.18)');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#33383e'; g.lineWidth = 5;
  g.strokeRect(2, 2, w - 4, h - 4);
  g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  g.fillStyle = '#4a5057';
  [[14, 14], [w - 14, 14], [14, h - 14], [w - 14, h - 14], [14, h / 2 - 12], [w - 14, h / 2 - 12], [14, h / 2 + 12], [w - 14, h / 2 + 12]].forEach(([x, y]) => {
    g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(x - 1.5, y - 1.5, 2, 0, Math.PI * 2); g.fill(); g.fillStyle = '#4a5057';
  });
  // streaks of grime
  for (let i = 0; i < 14; i++) {
    g.fillStyle = `rgba(20,24,28,${0.05 + Math.random() * 0.08})`;
    g.fillRect(Math.random() * w, h / 2 + Math.random() * 20, 3 + Math.random() * 6, 40 + Math.random() * 80);
  }
}, 1, 1);
const grateTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#5c6269'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 2200, 80, 60, 0.25);
  g.fillStyle = '#16191c';
  for (let y = 18; y < h - 10; y += 30) for (let x = 16; x < w - 16; x += 56) {
    g.beginPath(); g.roundRect ? g.roundRect(x, y, 40, 12, 6) : g.rect(x, y, 40, 12); g.fill();
  }
  g.strokeStyle = '#2b3035'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
}, 1, 1);
const hazardTex = canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#f5c518'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#111';
  for (let x = -h; x < w + h; x += 48) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 24, h); g.lineTo(x + 24 + h, 0); g.lineTo(x + h, 0); g.closePath(); g.fill(); }
  speckle(g, w, h, 500, 40, 60, 0.18);
}, 2, 1);
const signTex = canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#15191d'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#f5c518'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = '#f5c518'; g.font = 'bold 44px "Bebas Neue", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('NO RODENTS', w / 2, h / 2 + 2);
}, 1, 1);

/* ============================================================
   MATERIALS
   ============================================================ */
const lightCol = new THREE.Color().setRGB(...SECTIONS[0].light);
const M = {
  wall:    new THREE.MeshStandardMaterial({ map: plateTex, color: 0x80878f, metalness: 0.55, roughness: 0.5 }),
  floor:   new THREE.MeshStandardMaterial({ map: grateTex, color: 0xa0a7af, metalness: 0.65, roughness: 0.45 }),
  rib:     new THREE.MeshStandardMaterial({ color: 0x2a3036, metalness: 0.85, roughness: 0.3 }),
  dark:    new THREE.MeshStandardMaterial({ color: 0x1b1f24, metalness: 0.7, roughness: 0.38 }),
  steel:   new THREE.MeshStandardMaterial({ color: 0x8d969f, metalness: 0.9, roughness: 0.28 }),
  strip:   new THREE.MeshBasicMaterial({ color: lightCol.clone() }),
  lamp:    new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(3, 3, 3) }),
  hazard:  new THREE.MeshStandardMaterial({ map: hazardTex, metalness: 0.3, roughness: 0.55 }),
  sign:    new THREE.MeshStandardMaterial({ map: signTex, metalness: 0.2, roughness: 0.6, emissive: 0x111111 }),
  laser:   new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(4, 0.35, 0.5) }),
  red:     new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(3.5, 0.3, 0.3) }),
  cheese:  new THREE.MeshStandardMaterial({ color: 0xf5c518, emissive: 0x8a6400, emissiveIntensity: 1.0, roughness: 0.5 }),
  hole:    new THREE.MeshStandardMaterial({ color: 0xa87a00, roughness: 0.9 }),
  glass:   new THREE.MeshStandardMaterial({ color: 0xd8fff0, transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.1 }),
  formula: new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.9, 3.2, 1.2) }),
  cork:    new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 0.9 }),
  steam:   new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }),
  cart:    new THREE.MeshStandardMaterial({ color: 0x1f6f7a, metalness: 0.55, roughness: 0.42 }),
  cartRed: new THREE.MeshStandardMaterial({ color: 0x8e1d27, metalness: 0.55, roughness: 0.42 }),
  rubber:  new THREE.MeshStandardMaterial({ color: 0x121416, roughness: 0.9 }),
};

/* ============================================================
   LIGHTS
   ============================================================ */
scene.add(new THREE.HemisphereLight(0x9fd8e0, 0x0a0c0e, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 0.55);
key.position.set(2, 6, 4); scene.add(key);
const ratLight = new THREE.PointLight(0xffffff, 0.55, 10, 2);
scene.add(ratLight);
const aheadLight = new THREE.PointLight(lightCol.clone(), 1.3, 30, 2);
scene.add(aheadLight);

/* ============================================================
   DUCT (recycled segments)
   ============================================================ */
/* ---------- Ductways artwork (Higgsfield renders, processed: seam fixes + normal maps) ---------- */
// all artwork is served as static files; textures load only when a stage that uses them is shown
const VR_BASE = window.VR_BASE || '/games/vent-runner/';
const TX = Object.fromEntries(Object.entries({"wall":"tex/wall.webp","wallN":"tex/wallN.webp","floor":"tex/floor.webp","floorN":"tex/floorN.webp","vista":"tex/vista.webp","fan":"tex/fan.webp","card":"tex/card.jpg","d0":"tex/d0.webp","d1":"tex/d1.webp","d2":"tex/d2.webp","d3":"tex/d3.webp","d4":"tex/d4.webp","d5":"tex/d5.webp","lz_wall":"tex/lz_wall.webp","lz_wallN":"tex/lz_wallN.webp","lz_floor":"tex/lz_floor.webp","lz_floorN":"tex/lz_floorN.webp","lz_vista":"tex/lz_vista.webp","lz_door":"tex/lz_door.webp","lz_card":"tex/lz_card.jpg","lzd0":"tex/lzd0.webp","lzd1":"tex/lzd1.webp","lzd2":"tex/lzd2.webp","lzd3":"tex/lzd3.webp","lzd4":"tex/lzd4.webp","lzd5":"tex/lzd5.webp","lzd6":"tex/lzd6.webp","lzd7":"tex/lzd7.webp","cv_wall":"tex/cv_wall.webp","cv_wallN":"tex/cv_wallN.webp","cv_floor":"tex/cv_floor.webp","cv_floorN":"tex/cv_floorN.webp","cv_vista":"tex/cv_vista.webp","cv_door":"tex/cv_door.webp","cv_card":"tex/cv_card.jpg","cvd0":"tex/cvd0.webp","cvd1":"tex/cvd1.webp","cvd2":"tex/cvd2.webp","cvd3":"tex/cvd3.webp","cvd4":"tex/cvd4.webp","cvd5":"tex/cvd5.webp"}).map(([k, f]) => [k, VR_BASE + f]));
const texLoader = new THREE.TextureLoader();
function artTex(key, rx, ry, ox) {
  if (!TX[key]) return null;
  const t = texLoader.load(TX[key]);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx || 1, ry || 1); t.offset.set(ox || 0, 0);
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
if (TX.wall) {
  const wallMat = (ox) => new THREE.MeshStandardMaterial({
    map: artTex('wall', 0.5, 1, ox), normalMap: artTex('wallN', 0.5, 1, ox), normalScale: new THREE.Vector2(0.3, 0.3),
    color: 0x9aa3ab, metalness: 0.5, roughness: 0.52 });
  M.wallA = wallMat(0); M.wallB = wallMat(0.5);
  M.ceil = new THREE.MeshStandardMaterial({ map: artTex('wall', 0.8, 0.6), normalMap: artTex('wallN', 0.8, 0.6), normalScale: new THREE.Vector2(0.25, 0.25), color: 0x6c747c, metalness: 0.5, roughness: 0.55 });
  M.floor.map = artTex('floor', 1, 1); M.floor.normalMap = artTex('floorN', 1, 1); M.floor.normalScale = new THREE.Vector2(0.45, 0.45);
  M.floor.color.set(0xb4bac0); M.floor.needsUpdate = true;
} else { M.wallA = M.wallB = M.ceil = M.wall; }
const DECAL_GEO = new THREE.PlaneGeometry(1, 1);
const DECAL_SETS = {};
function decalSet(st) {
  if (DECAL_SETS[st.id]) return DECAL_SETS[st.id];
  return DECAL_SETS[st.id] = st.decals.filter(d => TX[d[0]]).map(([k, w, h, fixedY]) => ({ w, h, fixedY, mat: new THREE.MeshStandardMaterial({
    map: artTex(k), transparent: true, alphaTest: 0.35, depthWrite: false, roughness: fixedY ? 0.9 : 0.6, metalness: 0.1,
    polygonOffset: true, polygonOffsetFactor: -2, emissive: 0x111111 }) }));
}
const STAGE_TEX = {};
function stageTex(st) {
  if (STAGE_TEX[st.id]) return STAGE_TEX[st.id];
  const k = st.tex;
  return STAGE_TEX[st.id] = {
    wallA: artTex(k.wall, 0.5, 1, 0), wallAN: artTex(k.wallN, 0.5, 1, 0), wallB: artTex(k.wall, 0.5, 1, 0.5), wallBN: artTex(k.wallN, 0.5, 1, 0.5),
    ceil: artTex(k.wall, 0.8, 0.6), ceilN: artTex(k.wallN, 0.8, 0.6), floor: artTex(k.floor, 1, 1), floorN: artTex(k.floorN, 1, 1),
    vista: artTex(k.vista), hazard: artTex(k.hazard) };
}
const G = {
  floor: new THREE.BoxGeometry(DUCT_W, 0.2, SEG_L),
  wall:  new THREE.BoxGeometry(0.2, DUCT_H, SEG_L),
  ribV:  new THREE.BoxGeometry(0.34, DUCT_H, 0.34),
  ribH:  new THREE.BoxGeometry(DUCT_W, 0.34, 0.34),
  ribF:  new THREE.BoxGeometry(DUCT_W, 0.04, 0.3),
  strip: new THREE.BoxGeometry(0.07, 0.07, SEG_L * 0.9),
  lamp:  new THREE.BoxGeometry(1.5, 0.06, 0.55),
  pipe:  new THREE.CylinderGeometry(0.11, 0.11, SEG_L, 10),
  sign:  new THREE.PlaneGeometry(1.4, 0.7),
};
const duct = new THREE.Group(); scene.add(duct);
let vista = null;
if (TX.vista) {
  vista = new THREE.Mesh(new THREE.PlaneGeometry(DUCT_W, DUCT_H), new THREE.MeshBasicMaterial({ map: artTex('vista'), fog: false }));
  vista.position.set(0, DUCT_H / 2, -100); scene.add(vista);
}
const segs = [];
for (let i = 0; i < SEG_N; i++) {
  const s = new THREE.Group();
  const fl = new THREE.Mesh(G.floor, M.floor); fl.position.y = -0.1; s.add(fl);
  const ce = new THREE.Mesh(G.floor, M.wall); ce.position.y = DUCT_H + 0.1; s.add(ce);
  [-1, 1].forEach(side => {
    const w = new THREE.Mesh(G.wall, M.wall); w.position.set(side * (DUCT_W / 2 + 0.1), DUCT_H / 2, 0); s.add(w);
    const r = new THREE.Mesh(G.ribV, M.rib); r.position.set(side * (DUCT_W / 2 - 0.12), DUCT_H / 2, -SEG_L / 2); s.add(r);
    if (i % 2 === 0) {
      const a = new THREE.Mesh(G.strip, M.strip); a.position.set(side * (DUCT_W / 2 - 0.06), 0.12, 0); s.add(a);
      const b = new THREE.Mesh(G.strip, M.strip); b.position.set(side * (DUCT_W / 2 - 0.06), DUCT_H - 0.12, 0); s.add(b);
    }
    // conduit pipes along the walls
    const p = new THREE.Mesh(G.pipe, M.steel); p.rotation.x = Math.PI / 2; p.position.set(side * (DUCT_W / 2 - 0.22), 3.55 + (side > 0 ? 0.3 : 0), 0); s.add(p);
  });
  const top = new THREE.Mesh(G.ribH, M.rib); top.position.set(0, DUCT_H - 0.12, -SEG_L / 2); s.add(top);
  const bot = new THREE.Mesh(G.ribF, M.rib); bot.position.set(0, 0.02, -SEG_L / 2); s.add(bot);
  if (i % 3 === 0) { const l = new THREE.Mesh(G.lamp, M.lamp); l.position.set(0, DUCT_H - 0.03, 0); s.add(l); }
  // Ductways art: alternate the wall texture half per segment so panels run continuously
  s.children.forEach(m => { if (m.material === M.wall) m.material = (m.geometry === G.wall) ? (i % 2 ? M.wallB : M.wallA) : M.ceil; });
  s.position.z = -i * SEG_L + SEG_L;
  duct.add(s); segs.push(s);
}

function decorateSegments(st) {
  const set = decalSet(st);
  segs.forEach(s => {
    s.children.filter(m => m.userData.decal).forEach(m => s.remove(m));
    s.children.forEach(m => { if (m.geometry === G.ribV || m.geometry === G.ribH || m.geometry === G.ribF) m.visible = st.ribs; });
    if (!set.length || Math.random() > 0.4) return;
    const d = set[(Math.random() * set.length) | 0], side = Math.random() < 0.5 ? -1 : 1;
    const dm = new THREE.Mesh(DECAL_GEO, d.mat); dm.userData.decal = true;
    dm.scale.set(d.w, d.h, 1);
    dm.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    dm.rotation.z = (Math.random() - 0.5) * (d.fixedY ? 0.04 : 0.22);
    dm.position.set(side * (DUCT_W / 2 - 0.006), d.fixedY || (st.decalY[0] + Math.random() * (st.decalY[1] - st.decalY[0])), (Math.random() - 0.5) * 1.8);
    s.add(dm);
  });
}
/* ============================================================
   CHARACTERS (stand-ins — swap for Higgsfield GLB models later)
   ============================================================ */
function makeRat() {
  const root = new THREE.Group();
  const pivot = new THREE.Group(); root.add(pivot);
  const fur = new THREE.MeshStandardMaterial({ color: 0x7a746b, roughness: 0.82 });
  const furLight = new THREE.MeshStandardMaterial({ color: 0xb5ab9b, roughness: 0.85 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xf0a0a8, roughness: 0.55 });
  const eyeM = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.15, metalness: 0.3 });
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 18), fur);
  body.scale.set(1, 0.86, 1.45); body.position.set(0, 0.42, 0.02); pivot.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.29, 20, 14), furLight);
  belly.scale.set(0.82, 0.72, 1.2); belly.position.set(0, 0.33, -0.06); pivot.add(belly);

  const head = new THREE.Group(); head.position.set(0, 0.6, -0.5); pivot.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 16), fur); skull.scale.set(1, 0.9, 1.1); head.add(skull);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), furLight); snout.scale.set(0.82, 0.7, 1.45); snout.position.set(0, -0.06, -0.24); head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), pink); nose.position.set(0, -0.03, -0.46); head.add(nose);
  [-1, 1].forEach(s => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 10), eyeM); e.position.set(s * 0.12, 0.07, -0.17); head.add(e);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), shine); h.position.set(s * 0.12 - 0.012, 0.09, -0.21); head.add(h);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), fur); ear.scale.set(1, 1.05, 0.28); ear.position.set(s * 0.18, 0.21, 0.04); ear.rotation.z = -s * 0.35; head.add(ear);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), pink); inner.scale.set(1, 1.05, 0.2); inner.position.set(s * 0.18, 0.21, 0.01); inner.rotation.z = -s * 0.35; head.add(inner);
    for (let k = -1; k <= 1; k++) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.32, 4), shine);
      wh.rotation.z = Math.PI / 2 + k * 0.18; wh.rotation.y = s * 0.25;
      wh.position.set(s * 0.17, -0.04 + k * 0.025, -0.36); head.add(wh);
    }
  });

  const legs = [];
  [[-0.2, -0.3], [0.2, -0.3], [-0.2, 0.3], [0.2, 0.3]].forEach(([x, z], i) => {
    const hip = new THREE.Group(); hip.position.set(x, 0.32, z); pivot.add(hip);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.28, 8), fur); leg.position.y = -0.14; hip.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), pink); foot.scale.set(1, 0.6, 1.5); foot.position.set(0, -0.29, -0.03); hip.add(foot);
    legs.push(hip);
  });
  const arms = [];
  const tail = [];
  const tailRoot = new THREE.Group(); tailRoot.position.set(0, 0.36, 0.5); pivot.add(tailRoot);
  for (let i = 0; i < 14; i++) {
    const r = 0.055 * (1 - i / 16);
    const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), pink);
    tailRoot.add(seg); tail.push(seg);
  }
  root.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return { root, pivot, head, legs, arms, tail, body };
}

function makeMecha() {
  const root = new THREE.Group();
  const pivot = new THREE.Group(); root.add(pivot);
  const metal = new THREE.MeshStandardMaterial({ color: 0x9aa4ae, metalness: 0.92, roughness: 0.26 });
  const plate = new THREE.MeshStandardMaterial({ color: 0x3b434b, metalness: 0.8, roughness: 0.35 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 0.9, 8, 20), metal);
  body.rotation.x = Math.PI / 2; body.position.y = 0.95; pivot.add(body);
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 1.5), plate); spine.position.set(0, 1.58, 0.05); pivot.add(spine);
  const head = new THREE.Group(); head.position.set(0, 1.35, -0.85); pivot.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), metal); skull.scale.set(1, 0.85, 1.15); head.add(skull);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.13, 0.3), M.red); visor.position.set(0, 0.08, -0.42); head.add(visor);
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.07, 28), plate);
    ear.rotation.x = Math.PI / 2; ear.position.set(s * 0.43, 0.5, 0.05); head.add(ear);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 8, 28), metal); ring.position.set(s * 0.43, 0.5, 0.1); head.add(ring);
    // treads
    const tread = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 1.9), plate); tread.position.set(s * 0.68, 0.22, 0); pivot.add(tread);
    for (let k = -2; k <= 2; k++) { const wl = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.32, 14), metal); wl.rotation.z = Math.PI / 2; wl.position.set(s * 0.68, 0.2, k * 0.38); pivot.add(wl); }
    // claw arms raised
    const arm = new THREE.Group(); arm.position.set(s * 0.6, 1.2, -0.55); pivot.add(arm);
    const a1 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.75), metal); a1.position.z = -0.35; arm.add(a1);
    const cl = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 8), M.red); cl.rotation.x = -Math.PI / 2; cl.position.z = -0.85; arm.add(cl);
    arm.rotation.x = 0.5; arm.userData.side = s;
    pivot.userData['arm' + s] = arm;
  });
  // rear tail lights + antenna beacon (visible from the chase camera)
  const tl = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.06), M.red); tl.position.set(0, 0.95, 1.08); pivot.add(tl);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), metal); ant.position.set(0, 1.95, 0.2); pivot.add(ant);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), M.red); beacon.position.set(0, 2.27, 0.2); pivot.add(beacon);
  const tailCable = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 6, 20, Math.PI), plate); tailCable.position.set(0, 0.95, 1.15); tailCable.rotation.y = Math.PI / 2; pivot.add(tailCable);
  root.scale.setScalar(0.9);
  return { root, pivot, head, beacon };
}

const rat = makeRat(); scene.add(rat.root);
const mecha = makeMecha(); scene.add(mecha.root); mecha.root.position.set(0, 0, 16);

/* ---------- Higgsfield character models (Shadow Sneakerson + MechaMouser 9000) ----------
   Each GLB carries one skinned mesh plus its animation clips. Until they finish loading
   (or if anything fails) the hand-built stand-ins above stay on screen. */
const CH = { shadow: null, mecha: null };
const heroFill = new THREE.PointLight(0xcfe8ff, 0, 7, 1.6); scene.add(heroFill);
function loadCharacter(id, height, parent, done) {
  if (!THREE.GLTFLoader) return;
  fetch(VR_BASE + 'models/' + id.replace('glb-', '') + '.glb')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
    .then(buf => new THREE.GLTFLoader().parse(buf, '', gltf => {
    const holder = new THREE.Group();
    const model = gltf.scene;
    model.scale.multiplyScalar(height);       // rigs were generated at 1 m tall
    model.rotation.y = Math.PI;                // face down the vent (-z)
    model.traverse(o => {
      if (o.isMesh) {
        o.castShadow = false; o.frustumCulled = false;
        const m = o.material; if (m) { m.envMapIntensity = 1; if (m.emissiveMap) m.emissiveIntensity = 1.6; }
      }
    });
    holder.add(model); parent.add(holder);
    const mixer = new THREE.AnimationMixer(model);
    const actions = {};
    gltf.animations.forEach(c => { actions[c.name] = mixer.clipAction(c); });
    const ch = { holder, model, mixer, actions, cur: null };
    playClip(ch, 'run', { fade: 0 });
    done(ch);
  }, err => console.warn('model load failed', id, err)))
    .catch(err => console.warn('model fetch failed', id, err));
}
function playClip(ch, name, opt) {
  opt = opt || {};
  const a = ch.actions[name]; if (!a) return;
  if (ch.cur === name && !opt.restart) { if (opt.timeScale !== undefined) a.timeScale = opt.timeScale; return; }
  const prev = ch.cur && ch.actions[ch.cur];
  a.reset();
  a.setLoop(opt.once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
  a.clampWhenFinished = !!opt.once;
  a.timeScale = opt.timeScale !== undefined ? opt.timeScale : 1;
  if (opt.startAt) a.time = opt.startAt;
  a.play();
  const f = opt.fade !== undefined ? opt.fade : 0.12;
  if (prev && prev !== a) { if (f > 0) prev.crossFadeTo(a, f, false); else prev.stop(); }
  ch.cur = name;
}
/* ---------------- playable runners (unlocked by clearing stages) ---------------- */
const RUNNERS = [
  { id: 'shadow', name: 'Shadow Sneakerson', role: 'Stealth specialist', fill: 2.2 },
  { id: 'basil',  name: 'Dr. Basil Whiskerworth', role: 'Leader of the Rat Pack', unlockStage: 'labzero', fill: 1.2 },
];
let runnerIdx = Math.min(RUNNERS.length - 1, store.get('lr_vent_runner', 0));
function runnerUnlocked(i) { const r = RUNNERS[i]; return UNLOCK_ALL || !r.unlockStage || store.get('lr_vent_clear_' + r.unlockStage, false); }
if (!runnerUnlocked(runnerIdx)) runnerIdx = 0;
function runnerCh() { return CH[RUNNERS[runnerIdx].id] || CH.shadow || null; }
function syncRunner() {
  ensureChar(RUNNERS[runnerIdx].id);
  const act = runnerCh();
  RUNNERS.forEach(r => { if (CH[r.id]) CH[r.id].holder.visible = (CH[r.id] === act); });
  rat.pivot.visible = !act;
}
function renderRunnerPicker() {
  const el = $('runnerPicker'); if (!el) return;
  el.innerHTML = '<span class="rp-label">Runner</span>' + RUNNERS.map((r, i) => {
    const open = runnerUnlocked(i), st = r.unlockStage && STAGES.find(x => x.id === r.unlockStage);
    return `<button class="rp${i === runnerIdx ? ' sel' : ''}${open ? '' : ' locked'}" data-i="${i}">${r.name}<small>${open ? r.role : 'Clear ' + st.name + ' to unlock'}</small></button>`;
  }).join('');
  el.querySelectorAll('.rp').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); const i = +b.dataset.i; if (!runnerUnlocked(i)) return;
    runnerIdx = i; store.set('lr_vent_runner', i); syncRunner(); renderRunnerPicker();
  }));
}
/* ---------------- Vault Security Drone (built in code, no model needed) ---------------- */
function makeDrone() {
  const holder = new THREE.Group(), model = new THREE.Group(); holder.add(model);
  const shell = new THREE.MeshStandardMaterial({ color: 0xc9d2da, metalness: 0.75, roughness: 0.32 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1d2328, metalness: 0.6, roughness: 0.45 });
  const red = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 28, 18), shell); body.scale.set(1.25, 0.72, 1.05); model.add(body);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.69, 0.69, 0.14, 28, 1, true), M.hazard); band.scale.set(1, 1, 0.84); model.add(band);
  const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 10, 24), dark); lensRing.position.set(0, -0.05, 0.56); model.add(lensRing);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 12), red); eye.position.set(0, -0.05, 0.53); model.add(eye);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.2, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  beam.rotation.x = -Math.PI / 2 - 0.5; beam.position.set(0, -0.75, 1.6); model.add(beam);
  const rotors = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.07, 0.1), dark); arm.position.set(sx * 0.72, 0.18, sz * 0.42); arm.rotation.y = sx * sz * 0.6; model.add(arm);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 10), dark); hub.position.set(sx * 0.98, 0.26, sz * 0.6); model.add(hub);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), new THREE.MeshBasicMaterial({ color: 0xaab8c4, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.set(sx * 0.98, 0.33, sz * 0.6); model.add(disc);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.015, 0.06), dark); blade.position.copy(disc.position); model.add(blade); rotors.push(blade);
  });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), red); beacon.position.set(0, 0.42, -0.1); model.add(beacon);
  model.position.y = 1.55; model.scale.setScalar(1.05); model.rotation.y = Math.PI;  // eye and beam face down the vault
  let t = 0;
  return { holder, model, actions: {}, cur: null, mixer: { update() {} },
    update(dt) { t += dt; model.position.y = 1.55 + Math.sin(t * 2.4) * 0.09; model.rotation.z = Math.sin(t * 1.7) * 0.06;
      rotors.forEach((r, i) => r.rotation.y += dt * (38 + i * 3)); beacon.visible = Math.sin(t * 9) > 0; eye.scale.setScalar(1 + Math.sin(t * 6) * 0.08); } };
}
CH.drone = makeDrone(); mecha.root.add(CH.drone.holder); CH.drone.holder.visible = false;
// show the active stage's chaser; fall back to MechaMouser (or the stand-in) until its model exists
function chaserCh() { return CH[STAGES[stageIdx].chaser] || CH.mecha || null; }
function syncChaser() {
  ensureChar(STAGES[stageIdx].chaser);
  const act = chaserCh();
  ['mecha', 'fenrir', 'drone'].forEach(k => { if (CH[k]) CH[k].holder.visible = (CH[k] === act); });
  mecha.pivot.visible = !act;
}
// characters download on demand: only the chosen runner and the current stage's chaser
const CHAR_LOAD = {
  shadow: () => loadCharacter('glb-shadow', 1.3, rat.root, ch => { CH.shadow = ch; syncRunner(); }),
  basil: () => loadCharacter('glb-basil', 1.3 / 1.27, rat.root, ch => { ch.model.traverse(o => { if (o.isMesh) { o.material.emissiveIntensity = 0.12; o.material.metalness = 0.15; o.material.roughness = 0.75; o.material.needsUpdate = true; } }); CH.basil = ch; syncRunner(); }),
  mecha: () => loadCharacter('glb-mecha', 1.75 / 0.9, mecha.root, ch => { CH.mecha = ch; syncChaser(); }),
  fenrir: () => loadCharacter('glb-fenrir', 2.0 / 0.9, mecha.root, ch => { CH.fenrir = ch; syncChaser(); })
};
const CHAR_LOADING = {};
function ensureChar(k) { if (!k || CH[k] || CHAR_LOADING[k] || !CHAR_LOAD[k]) return; CHAR_LOADING[k] = true; CHAR_LOAD[k](); }
setTimeout(() => { syncRunner(); syncChaser(); }, 0);

/* ============================================================
   OBSTACLES + PICKUPS
   ============================================================ */
const OG = {
  housing: new THREE.BoxGeometry(1.5, 1.75, 1.1),
  band:    new THREE.BoxGeometry(1.52, 0.24, 1.12),
  ring:    new THREE.TorusGeometry(0.58, 0.06, 8, 28),
  blade:   new THREE.BoxGeometry(0.14, 1.02, 0.03),
  hub:     new THREE.SphereGeometry(0.11, 12, 10),
  bulb:    new THREE.SphereGeometry(0.07, 10, 8),
  post:    new THREE.BoxGeometry(0.16, 2.35, 0.16),
  emit:    new THREE.BoxGeometry(0.22, 0.12, 0.22),
  pipeR:   new THREE.CylinderGeometry(0.22, 0.22, 1, 14),
  flange:  new THREE.TorusGeometry(0.26, 0.05, 8, 18),
  valve:   new THREE.TorusGeometry(0.14, 0.03, 6, 14),
  plume:   new THREE.ConeGeometry(0.4, 1.3, 14, 1, true),
  wedge:   new THREE.CylinderGeometry(0.34, 0.34, 0.22, 3),
  holeS:   new THREE.SphereGeometry(0.055, 8, 6),
  vial:    new THREE.CylinderGeometry(0.13, 0.13, 0.48, 14),
  liquid:  new THREE.CylinderGeometry(0.1, 0.1, 0.32, 12),
  cork:    new THREE.CylinderGeometry(0.075, 0.09, 0.1, 10),
};
const beamGeo = w => new THREE.CylinderGeometry(0.035, 0.035, w, 6);
const BEAM = { lane: beamGeo(LANE_W), full: beamGeo(FULL_W) };

const FAN_GEO = new THREE.PlaneGeometry(1.5, 1.54);
const FAN_MAT = TX.fan ? new THREE.MeshStandardMaterial({ map: artTex('fan'), metalness: 0.4, roughness: 0.5, emissive: 0x161a1d }) : null;
function buildFan() {
  const g = new THREE.Group();
  const h = new THREE.Mesh(OG.housing, M.dark); h.position.y = 0.875; g.add(h);
  const b = new THREE.Mesh(OG.band, M.hazard); b.position.y = 0.22; g.add(b);
  const ring = new THREE.Mesh(OG.ring, M.steel); ring.position.set(0, 1.05, -0.57); g.add(ring);
  const blades = new THREE.Group(); blades.position.set(0, 1.05, -0.58); g.add(blades);
  for (let i = 0; i < 3; i++) { const bl = new THREE.Mesh(OG.blade, M.steel); bl.rotation.z = i * Math.PI / 3; blades.add(bl); }
  blades.add(new THREE.Mesh(OG.hub, M.rib));
  const bulb = new THREE.Mesh(OG.bulb, M.red); bulb.position.set(0.55, 1.82, -0.4); g.add(bulb);
  if (FAN_MAT) { const face = new THREE.Mesh(FAN_GEO, FAN_MAT); face.position.set(0, 0.98, 0.556); g.add(face); }
  return { g, spin: blades, ymin: 0, ymax: 1.78, hd: 0.58, lethal: true, bulb };
}
function buildLaser(full) {
  const w = full ? FULL_W : LANE_W;
  const g = new THREE.Group();
  [-1, 1].forEach(s => {
    const p = new THREE.Mesh(OG.post, M.dark); p.position.set(s * w / 2, 1.18, 0); g.add(p);
    [0.75, 1.15, 1.55, 1.95].forEach(y => { const e = new THREE.Mesh(OG.emit, M.red); e.position.set(s * (w / 2 - 0.02), y, 0); g.add(e); });
  });
  const beams = [];
  [0.75, 1.15, 1.55, 1.95].forEach(y => { const bm = new THREE.Mesh(full ? BEAM.full : BEAM.lane, M.laser); bm.rotation.z = Math.PI / 2; bm.position.y = y; g.add(bm); beams.push(bm); });
  return { g, beams, ymin: 0.6, ymax: 2.05, hd: 0.14, lethal: false, w };
}
function buildSteam(full) {
  const w = full ? FULL_W : LANE_W;
  const g = new THREE.Group();
  const pipe = new THREE.Mesh(OG.pipeR, M.steel); pipe.scale.y = w; pipe.rotation.z = Math.PI / 2; pipe.position.y = 0.3; g.add(pipe);
  [-1, 1].forEach(s => { const f = new THREE.Mesh(OG.flange, M.rib); f.rotation.y = Math.PI / 2; f.position.set(s * w / 2, 0.3, 0); g.add(f); });
  const band = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.46), M.hazard); band.position.y = 0.03; g.add(band);
  const plumes = [];
  const n = full ? 4 : 1;
  for (let i = 0; i < n; i++) {
    const x = full ? (-w / 2 + w * (i + 0.5) / n) : 0;
    const v = new THREE.Mesh(OG.valve, M.red); v.position.set(x, 0.55, 0); v.rotation.x = Math.PI / 2; g.add(v);
    const pl = new THREE.Mesh(OG.plume, M.steam); pl.rotation.x = Math.PI; pl.position.set(x, 1.05, 0); g.add(pl); plumes.push(pl);
  }
  return { g, plumes, ymin: 0, ymax: 0.62, hd: 0.26, lethal: false, w, emitXs: plumes.map(p => p.position.x) };
}
function buildCheese() {
  const g = new THREE.Group();
  const w = new THREE.Mesh(OG.wedge, M.cheese); w.rotation.x = Math.PI / 2; g.add(w);
  [[0.06, 0.04, -0.11], [-0.1, -0.06, 0.11], [0.12, -0.09, 0.11], [-0.03, 0.1, -0.11]].forEach(([x, y, z]) => {
    const h = new THREE.Mesh(OG.holeS, M.hole); h.position.set(x, y, z); h.scale.z = 0.35; g.add(h);
  });
  g.scale.setScalar(0.95);
  return g;
}
function buildVial() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(OG.vial, M.glass));
  const l = new THREE.Mesh(OG.liquid, M.formula); l.position.y = -0.06; g.add(l);
  const c = new THREE.Mesh(OG.cork, M.cork); c.position.y = 0.29; g.add(c);
  return g;
}

/* ---------- supply carts: parked (some with ramps you can run up) and oncoming ---------- */
const CG = {
  wheel: new THREE.CylinderGeometry(0.16, 0.16, 0.12, 14),
  rib:   new THREE.BoxGeometry(0.04, CART_H - 0.5, 0.12),
};
function buildCart(len, ramp, moving) {
  const g = new THREE.Group();
  const bodyH = CART_H - 0.28;
  const body = new THREE.Mesh(new THREE.BoxGeometry(CART_W, bodyH, len), moving ? M.cartRed : M.cart); body.position.y = 0.28 + bodyH / 2; g.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(CART_W + 0.06, 0.06, len + 0.04), M.floor); top.position.y = CART_H - 0.02; g.add(top);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(CART_W - 0.1, 0.22, len - 0.3), M.dark); skirt.position.y = 0.17; g.add(skirt);
  const nW = Math.max(2, Math.round(len / 3));
  for (let i = 0; i < nW; i++) {
    const z = -len / 2 + 0.6 + i * (len - 1.2) / (nW - 1);
    [-1, 1].forEach(sd => { const w = new THREE.Mesh(CG.wheel, M.rubber); w.rotation.z = Math.PI / 2; w.position.set(sd * (CART_W / 2 - 0.08), 0.16, z); g.add(w); });
  }
  for (let z = -len / 2 + 1; z < len / 2; z += 2) [-1, 1].forEach(sd => { const rb = new THREE.Mesh(CG.rib, M.rib); rb.position.set(sd * (CART_W / 2 + 0.01), 0.28 + bodyH / 2, z); g.add(rb); });
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(CART_W + 0.02, 0.22, 0.05), M.hazard); stripe.position.set(0, 0.55, len / 2 + 0.01); g.add(stripe);
  const lamps = [];
  [-1, 1].forEach(sd => { const l = new THREE.Mesh(OG.bulb, moving ? M.lamp : M.red); l.scale.setScalar(moving ? 1.7 : 1); l.position.set(sd * 0.48, 1.0, len / 2 + 0.04); g.add(l); lamps.push(l); });
  if (ramp) {
    const a = Math.atan2(CART_H, RAMP_L), hyp = Math.hypot(CART_H, RAMP_L);
    const rp = new THREE.Mesh(new THREE.BoxGeometry(CART_W - 0.05, 0.1, hyp), M.floor); rp.rotation.x = a; rp.position.set(0, CART_H / 2 - 0.04, len / 2 + RAMP_L / 2); g.add(rp);
    const chev = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, hyp - 0.2), M.hazard); chev.rotation.x = a; chev.position.set(0, CART_H / 2 + 0.02, len / 2 + RAMP_L / 2); g.add(chev);
    [-1, 1].forEach(sd => { const leg = new THREE.Mesh(OG.post, M.dark); leg.scale.y = 0.5; leg.position.set(sd * (CART_W / 2 - 0.1), 0.6, len / 2 + 0.5); g.add(leg); });
  }
  return { g, lamps, len, ramp, moving };
}

/* ---------- power-ups ---------- */
const POWERS = {
  vial:   { name: "Fizzy's Formula", css: '#5dff7a', hex: 0x5dff7a, dur: 6,  key: 'boostT' },
  magnet: { name: 'Cheese Magnet',   css: '#ff6b5a', hex: 0xff6b5a, dur: 10, key: 'magnetT' },
  rocket: { name: 'Vent Rocket',     css: '#ff9f1c', hex: 0xff9f1c, dur: 5,  key: 'rocketT' },
  spring: { name: 'Spring Paws',     css: '#7ad7ff', hex: 0x7ad7ff, dur: 10, key: 'springT' },
  dbl:    { name: 'Double Cheese',   css: '#f5c518', hex: 0xf5c518, dur: 15, key: 'dblT' },
};
const BOARD = { name: 'Cheese Board', css: '#ffe9a0', dur: 30, key: 'boardT' };
const PMAT = {};
for (const k in POWERS) PMAT[k] = new THREE.MeshBasicMaterial({ color: new THREE.Color(POWERS[k].hex).multiplyScalar(2.2) });
const PG = {
  halo:  new THREE.TorusGeometry(0.4, 0.03, 8, 32),
  horse: new THREE.TorusGeometry(0.2, 0.065, 10, 20, Math.PI),
  tip:   new THREE.BoxGeometry(0.14, 0.1, 0.14),
  cone:  new THREE.ConeGeometry(0.12, 0.24, 14),
  body:  new THREE.CylinderGeometry(0.12, 0.12, 0.3, 14),
  fin:   new THREE.BoxGeometry(0.02, 0.14, 0.12),
  coil:  new THREE.TorusGeometry(0.14, 0.035, 8, 20),
  plane: new THREE.PlaneGeometry(0.5, 0.36),
};
const dblTex = canvasTex(128, 96, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.fillStyle = '#ffe066'; g.font = 'bold 84px "Bebas Neue", Impact, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('2X', w / 2, h / 2 + 4);
});
const dblMat = new THREE.MeshBasicMaterial({ map: dblTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, color: new THREE.Color(2, 2, 2) });
function buildPower(kind) {
  if (kind === 'vial') return buildVial();
  const g = new THREE.Group(), mat = PMAT[kind];
  g.add(new THREE.Mesh(PG.halo, mat));
  if (kind === 'magnet') {
    const m = new THREE.Mesh(PG.horse, mat); m.rotation.z = Math.PI; m.position.y = 0.08; g.add(m);
    [-1, 1].forEach(sd => { const t = new THREE.Mesh(PG.tip, M.steel); t.position.set(sd * 0.2, 0.06, 0); g.add(t); });
  } else if (kind === 'rocket') {
    const c = new THREE.Mesh(PG.cone, M.steel); c.position.y = 0.22; g.add(c);
    const b = new THREE.Mesh(PG.body, mat); b.position.y = -0.05; g.add(b);
    [0, 1, 2].forEach(i => { const f = new THREE.Mesh(PG.fin, M.dark); const a = i * Math.PI * 2 / 3; f.position.set(Math.sin(a) * 0.13, -0.17, Math.cos(a) * 0.13); f.rotation.y = a; g.add(f); });
  } else if (kind === 'spring') {
    [-0.15, 0, 0.15].forEach(y => { const c = new THREE.Mesh(PG.coil, mat); c.rotation.x = Math.PI / 2; c.position.y = y; g.add(c); });
  } else if (kind === 'dbl') {
    g.add(new THREE.Mesh(PG.plane, dblMat));
  }
  return g;
}

/* ---------- Cheese Board (shield) + jetpack attached to the rat ---------- */
rat.board = (() => {
  const b = new THREE.Group();
  b.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 1.25), M.cheese));
  [[0.12, 0.3], [-0.15, -0.2], [0.05, -0.42], [-0.1, 0.45]].forEach(([x, z]) => { const h = new THREE.Mesh(OG.holeS, M.hole); h.position.set(x, 0.045, z); h.scale.set(1.4, 0.35, 1.4); b.add(h); });
  b.position.y = 0.04; b.visible = false; rat.root.add(b); return b;
})();
rat.jet = (() => {
  const j = new THREE.Group();
  [-1, 1].forEach(sd => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.42, 12), M.steel); c.position.x = sd * 0.12; j.add(c);
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.06, 12), PMAT.rocket); n.position.set(sd * 0.12, -0.24, 0); j.add(n);
  });
  j.position.set(0, 0.62, 0.32); j.visible = false; rat.root.add(j); return j;
})();

/* ============================================================
   PARTICLES
   ============================================================ */
const P_MAX = 600;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(P_MAX * 3), pCol = new Float32Array(P_MAX * 3);
const pVel = new Float32Array(P_MAX * 3), pLife = new Float32Array(P_MAX), pMaxLife = new Float32Array(P_MAX), pBase = new Float32Array(P_MAX * 3), pGrav = new Float32Array(P_MAX);
for (let i = 0; i < P_MAX; i++) pPos[i * 3 + 1] = -999;
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const pMat = new THREE.PointsMaterial({ size: 0.13, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
const particles = new THREE.Points(pGeo, pMat); particles.frustumCulled = false; scene.add(particles);
let pCursor = 0;
function emit(x, y, z, color, count, spread, up, life, grav) {
  const c = new THREE.Color(color);
  for (let n = 0; n < count; n++) {
    const i = pCursor; pCursor = (pCursor + 1) % P_MAX;
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z;
    pVel[i * 3] = (Math.random() - 0.5) * spread;
    pVel[i * 3 + 1] = (Math.random() * 0.8 + 0.2) * up;
    pVel[i * 3 + 2] = (Math.random() - 0.5) * spread;
    pBase[i * 3] = c.r; pBase[i * 3 + 1] = c.g; pBase[i * 3 + 2] = c.b;
    pLife[i] = pMaxLife[i] = life * (0.6 + Math.random() * 0.6);
    pGrav[i] = grav === undefined ? -9 : grav;
  }
}
function updateParticles(dt, worldMove) {
  for (let i = 0; i < P_MAX; i++) {
    if (pLife[i] <= 0) continue;
    pLife[i] -= dt;
    if (pLife[i] <= 0) { pPos[i * 3 + 1] = -999; continue; }
    pVel[i * 3 + 1] += pGrav[i] * dt;
    pPos[i * 3] += pVel[i * 3] * dt;
    pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt;
    pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt + worldMove;
    const k = pLife[i] / pMaxLife[i];
    pCol[i * 3] = pBase[i * 3] * k; pCol[i * 3 + 1] = pBase[i * 3 + 1] * k; pCol[i * 3 + 2] = pBase[i * 3 + 2] * k;
  }
  pGeo.attributes.position.needsUpdate = true;
  pGeo.attributes.color.needsUpdate = true;
}

/* ============================================================
   AUDIO (synthesised, no files)
   ============================================================ */
let actx = null;
let muted = store.get('lr_vent_muted', false);
function ensureAudio() {
  if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
  try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
}
function tone(f1, f2, d, wave, v, delay) {
  if (!actx || muted) return;
  const t = actx.currentTime + (delay || 0);
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = wave; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + 0.03);
}
/* ---------------- music: looping stage tracks + title theme (hosted audio assets) ---------------- */
const MUSIC_URLS = Object.fromEntries(['theme', 'ductways', 'labzero', 'vault'].map(k => [k, [VR_BASE + 'audio/' + k + '.mp4', VR_BASE + 'audio/' + k + '.webm']]));
const MUSIC_VOL = 0.42;
const music = { gain: null, bufs: {}, loading: {}, cur: null, key: null, want: null, level: 1 };
function musicGainNode() {
  if (!actx) return null;
  if (!music.gain) { music.gain = actx.createGain(); music.gain.gain.value = muted ? 0 : MUSIC_VOL * music.level; music.gain.connect(actx.destination); }
  return music.gain;
}
function musicBuf(key) {
  if (music.bufs[key]) return Promise.resolve(music.bufs[key]);
  const urls = MUSIC_URLS[key]; if (!urls || !actx) return Promise.resolve(null);
  // each track is hosted twice (AAC/MP4 and Opus/WebM): use whichever this browser decodes
  const tryUrl = i => i >= urls.length ? Promise.resolve(null) : fetch(urls[i]).then(r => { if (!r.ok) throw new Error('music ' + r.status); return r.arrayBuffer(); })
    .then(ab => new Promise((res, rej) => { const pr = actx.decodeAudioData(ab, res, rej); if (pr && pr.catch) pr.catch(() => {}); })).catch(() => tryUrl(i + 1));
  if (!music.loading[key]) music.loading[key] = tryUrl(0).then(b => { if (b) music.bufs[key] = b; else delete music.loading[key]; return b; });
  return music.loading[key];
}
async function playMusic(key) {
  music.want = key;
  if (!actx || (music.key === key && music.cur)) return;
  const buf = await musicBuf(key);
  if (!buf || music.want !== key || music.key === key) return;
  const g = musicGainNode(), t = actx.currentTime;
  if (music.cur) { const old = music.cur; old.g.gain.setTargetAtTime(0, t, 0.35); old.src.stop(t + 2.5); }
  const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
  const sg = actx.createGain(); sg.gain.setValueAtTime(0, t); sg.gain.setTargetAtTime(1, t, 0.4);
  src.connect(sg); sg.connect(g); src.start(t);
  music.cur = { src, g: sg }; music.key = key;
}
function musicDuck(level) {
  music.level = level;
  if (music.gain && actx) music.gain.gain.setTargetAtTime(muted ? 0 : MUSIC_VOL * level, actx.currentTime, 0.25);
}
// browsers only allow sound after a tap or key press: start the title theme on the first one
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { ensureAudio(); if (state === 'title') playMusic('theme'); }, { once: true }));
function noise(d, v, freq) {
  if (!actx || muted) return;
  const len = Math.floor(actx.sampleRate * d), buf = actx.createBuffer(1, len, actx.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = actx.createBufferSource(); src.buffer = buf;
  const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1200;
  const g = actx.createGain(); g.gain.value = v;
  src.connect(f); f.connect(g); g.connect(actx.destination); src.start();
}
const sfx = {
  cheese(n) { const b = 660 * Math.pow(1.06, Math.min(n, 14)); tone(b, b * 1.5, 0.12, 'triangle', 0.18); },
  jump() { tone(260, 620, 0.16, 'square', 0.06); },
  slide() { noise(0.22, 0.25, 900); },
  lane() { tone(500, 420, 0.05, 'sine', 0.05); },
  hit() { tone(180, 40, 0.35, 'sawtooth', 0.2); noise(0.25, 0.5, 400); },
  crash() { tone(140, 30, 0.6, 'sawtooth', 0.25); noise(0.5, 0.7, 300); },
  boost() { [0, 0.07, 0.14, 0.21].forEach((d, i) => tone(440 * Math.pow(1.26, i), 880 * Math.pow(1.26, i), 0.12, 'square', 0.07, d)); },
  smash() { noise(0.18, 0.5, 2000); tone(300, 90, 0.18, 'square', 0.08); },
  close() { tone(900, 1400, 0.1, 'sine', 0.1); tone(1200, 1800, 0.1, 'sine', 0.08, 0.06); },
  section() { [0, 0.12, 0.24].forEach((d, i) => tone(330 * (i + 1), 330 * (i + 1) * 1.01, 0.2, 'triangle', 0.08, d)); },
  alarm() { tone(880, 660, 0.25, 'square', 0.06); tone(880, 660, 0.25, 'square', 0.06, 0.3); },
  horn() { tone(220, 200, 0.4, 'sawtooth', 0.07); tone(277, 262, 0.4, 'sawtooth', 0.05); },
  rocket() { noise(0.6, 0.35, 700); tone(200, 900, 0.5, 'sawtooth', 0.06); },
  power() { [0, 0.06, 0.12].forEach((d, i) => tone(520 * Math.pow(1.335, i), 540 * Math.pow(1.335, i), 0.1, 'triangle', 0.1, d)); },
  board() { tone(300, 600, 0.15, 'square', 0.07); noise(0.2, 0.2, 2500); },
  mission() { [0, 0.1, 0.2, 0.3].forEach((d, i) => tone(392 * Math.pow(1.26, i), 400 * Math.pow(1.26, i), 0.14, 'triangle', 0.09, d)); },
};

/* ============================================================
   GAME STATE
   ============================================================ */
let state = 'title';
const S = {};
let obstacles = [], pickups = [];
let best = store.get('lr_vent_best', 0);

/* ---------------- missions + Lab Rank (permanent multiplier) ---------------- */
const MISSION_POOL = [
  { k: 'cheese', scope: 'run',   t: n => `Collect ${n} cheese in one run`,          n: L => 40 + L * 25 },
  { k: 'dist',   scope: 'run',   t: n => `Run ${n.toLocaleString()} m in one run`,  n: L => 400 + L * 250 },
  { k: 'jumps',  scope: 'total', t: n => `Jump ${n} times`,                         n: L => 20 + L * 10 },
  { k: 'carts',  scope: 'total', t: n => `Run along the top of ${n} supply carts`,  n: L => 3 + L * 2 },
  { k: 'powers', scope: 'total', t: n => `Grab ${n} power-ups`,                     n: L => 2 + L },
  { k: 'shaves', scope: 'total', t: n => `Pull off ${n} close shaves`,              n: L => 3 + L * 2 },
  { k: 'slides', scope: 'total', t: n => `Slide ${n} times`,                        n: L => 15 + L * 8 },
  { k: 'boards', scope: 'total', t: n => `Ride ${n} Cheese Board${n > 1 ? 's' : ''}`, n: L => 1 + Math.floor(L / 3) },
  { k: 'score',  scope: 'run',   t: n => `Score ${n.toLocaleString()} in one run`,  n: L => 3000 + L * 2500 },
];
let rank = store.get('lr_vent_rank', 0);
let boards = store.get('lr_vent_boards', 3);
function missionSet(L) {
  const idx = []; let sd = L * 7 + 3;
  while (idx.length < 3) { sd = (sd * 1103515245 + 12345) & 0x7fffffff; const i = sd % MISSION_POOL.length; if (!idx.includes(i)) idx.push(i); }
  return idx;
}
function newMissions(level) { return { level, set: missionSet(level), prog: [0, 0, 0], done: [false, false, false] }; }
let MS = store.get('lr_vent_missions', null);
if (!MS || !Array.isArray(MS.set) || MS.set.length !== 3) MS = newMissions(0);
const mTarget = i => MISSION_POOL[MS.set[i]].n(MS.level);
function missionEvent(k, add, runVal) {
  if (state !== 'run') return;
  for (let i = 0; i < 3; i++) {
    if (MS.done[i]) continue;
    const m = MISSION_POOL[MS.set[i]];
    if (m.k !== k) continue;
    if (m.scope === 'run') MS.prog[i] = Math.max(MS.prog[i], runVal); else MS.prog[i] += add;
    if (MS.prog[i] >= mTarget(i)) {
      MS.done[i] = true; MS.prog[i] = mTarget(i);
      toast('Mission complete', '#00c2d4'); sfx.mission();
      store.set('lr_vent_missions', MS);
    }
  }
}
function renderMissions(id) {
  const el = $(id); if (!el) return;
  const items = MS.set.map((pi, i) => {
    const m = MISSION_POOL[pi], n = mTarget(i);
    return `<li class="${MS.done[i] ? 'done' : ''}"><span>${m.t(n)}</span><em>${MS.done[i] ? 'Done' : Math.floor(MS.prog[i]).toLocaleString() + ' / ' + n.toLocaleString()}</em></li>`;
  }).join('');
  el.innerHTML = `<h3>Missions <span>Lab Rank ${rank}</span></h3><ul>${items}</ul>`;
}
const themeLight = lightCol.clone(), themeTarget = lightCol.clone();
const fogTarget = new THREE.Color(SECTIONS[0].fog);

function resetRun() {
  obstacles.forEach(o => scene.remove(o.g)); pickups.forEach(p => scene.remove(p.g));
  obstacles = []; pickups = [];
  Object.assign(S, {
    t: 0, dist: 0, speed: 14, speedMul: 1, lane: 1, x: 0, y: 0, vy: 0,
    slideT: 0, jumpBuf: 0, slideBuf: 0, chaserT: 0, invulnT: 0, boostT: 0, boostMax: 6,
    sinceSpawn: -20, cheese: 0, cheesePts: 0, bonusPts: 0, combo: 0, comboT: 0,
    section: 0, laneMoveT: 9, prevLane: 1, shake: 0, flash: 0, dyingT: 0, deathCause: '', lean: 0, nextAlarm: 0,
    stageClear: false, magnetT: 0, rocketT: 0, springT: 0, dblT: 0, boardT: 0, grounded: true, ground: 0, distPts: 0, airSince: 0, airLane: 1
  });
  setTheme(0, true);
  for (let i = 0; i < P_MAX; i++) { pLife[i] = 0; pPos[i * 3 + 1] = -999; }
}
resetRun();

function setTheme(idx, instant) {
  const sec = SECTIONS[idx % SECTIONS.length];
  themeTarget.setRGB(...sec.light);
  fogTarget.set(sec.fog);
  document.documentElement.style.setProperty('--sec', sec.ui);
  if (instant) { themeLight.copy(themeTarget); scene.fog.color.copy(fogTarget); scene.background.copy(fogTarget); }
}

/* ---------------- spawning ---------------- */
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function addObstacle(kind, lane, z, full) {
  let o;
  if (kind === 'fan') o = buildFan();
  else if (kind === 'laser') o = buildLaser(full);
  else o = buildSteam(full);
  o.kind = kind; o.z = z; o.prevZ = z; o.hit = false;
  o.x = full ? 0 : LANES[lane];
  o.halfW = full ? FULL_W / 2 : (kind === 'fan' ? 0.75 : LANE_W / 2);
  o.g.position.set(o.x, 0, z);
  scene.add(o.g); obstacles.push(o);
  return o;
}
function addCheeseLine(lane, z0, count, arc, baseY) {
  const by = baseY === undefined ? 0.55 : baseY;
  for (let i = 0; i < count; i++) {
    const g = buildCheese();
    let y = by;
    if (arc && count > 1) { const t = i / (count - 1); y = by + Math.sin(t * Math.PI) * 1.45; }
    const p = { kind: 'cheese', g, x: LANES[lane], y, z: z0 - i * 2.3, taken: false, spin: Math.random() * 6 };
    g.position.set(p.x, y, p.z); scene.add(g); pickups.push(p);
  }
}
function addPower(kind, lane, z) {
  const g = buildPower(kind);
  const p = { kind, g, x: LANES[lane], y: 0.75, z, taken: false, spin: 0 };
  g.position.set(p.x, p.y, z); scene.add(g); pickups.push(p);
}
function addCart(lane, zNear, len, ramp, moving) {
  const o = buildCart(len, ramp, moving);
  Object.assign(o, { kind: 'cart', z: zNear - len / 2, hit: false, x: LANES[lane], halfW: CART_W / 2, topped: false, rolling: false });
  o.prevZ = o.z;
  o.g.position.set(o.x, 0, o.z); scene.add(o.g); obstacles.push(o);
  return o;
}
// what the rat is standing on: floor (0), a ramp, or a cart roof
function supportAt() {
  let h = 0, on = null;
  for (const o of obstacles) {
    if (o.kind !== 'cart' || !o.g.visible) continue;
    if (Math.abs(o.x - S.x) > 0.55) continue;
    const zb = o.z - o.len / 2, zf = o.z + o.len / 2;
    let y = -1;
    if (zb <= 0.3 && zf >= -0.3) y = CART_H;
    else if (o.ramp && zf < 0 && -zf <= RAMP_L) y = CART_H * (1 + zf / RAMP_L);
    if (y > h) { h = y; on = o; }
  }
  return { h, on };
}
const PKINDS = [['vial', 0.2], ['magnet', 0.25], ['rocket', 0.15], ['spring', 0.2], ['dbl', 0.2]];
function pickPower() { let x = Math.random(); for (const [k, w] of PKINDS) { if ((x -= w) < 0) return k; } return 'magnet'; }
function anyPower() { return S.boostT > 0 || S.magnetT > 0 || S.rocketT > 0 || S.springT > 0 || S.dblT > 0; }
function cartRow(z, d) {
  const lanes = shuffle([0, 1, 2]);
  // lanes that still have a recent cart in them can't take an oncoming one
  const busy = new Set(obstacles.filter(o => o.kind === 'cart' && o.z - o.len / 2 < -30).map(o => LANES.indexOf(o.x)));
  const movLane = lanes.find(l => !busy.has(l));
  if (Math.random() < 0.58 || movLane === undefined) {
    const len = 10 + rnd(7);
    addCart(lanes[0], z, len, true, false);
    addCheeseLine(lanes[0], z - 0.6, Math.floor((len - 1) / 2.3), false, CART_H + 0.55);
    if (Math.random() < 0.65) addCart(lanes[1], z - 1.5 - rnd(3), len - 1 + rnd(5), Math.random() < 0.3, false);
    else addCheeseLine(lanes[1], z + 3, 4, false);
    addCheeseLine(lanes[2], z + 5, 4, false);
    S.sinceSpawn = -len * 0.55;
    return lanes[2];
  }
  const rest = lanes.filter(l => l !== movLane);
  addCart(movLane, z, 8 + rnd(3), false, true);
  if (d > 0.25 && Math.random() < 0.55) {
    const len = 11 + rnd(5);
    addCart(rest[0], z - 4, len, true, false);
    addCheeseLine(rest[0], z - 4.6, Math.floor((len - 1) / 2.3), false, CART_H + 0.55);
  } else addCheeseLine(rest[0], z + 4, 5, true);
  addCheeseLine(rest[1], z + 6, 3, false);
  S.sinceSpawn = -8;
  return rest[1];
}
function spawnRow(z) {
  const d = Math.min(1, S.dist / 2600);
  const free = (S.dist > 140 && Math.random() < 0.2 + d * 0.12) ? cartRow(z, d) : obstacleRow(z);
  if (!anyPower() && S.dist > 220 && Math.random() < 0.1) addPower(pickPower(), free, z + 12);
}
function obstacleRow(z) {
  const d = Math.min(1, S.dist / 2600);
  const roll = Math.random();
  const lanes = shuffle([0, 1, 2]);
  let free = lanes[2];
  if (roll < 0.26) {
    addObstacle('fan', lanes[0], z);
    addCheeseLine(lanes[1], z + 6, 4, false);
    free = lanes[1];
  } else if (roll < 0.26 + 0.18 * (0.4 + d)) {
    addObstacle('fan', lanes[0], z); addObstacle('fan', lanes[1], z);
    addCheeseLine(lanes[2], z + 7, 5, false);
  } else if (roll < 0.62) {
    addObstacle('laser', 1, z, true);
    addCheeseLine(lanes[0], z + 2.3, 3, false);
    pickups.slice(-3).forEach(p => { p.y = 0.3; p.g.position.y = 0.3; });
    free = lanes[0];
  } else if (roll < 0.82) {
    addObstacle('steam', 1, z, true);
    addCheeseLine(lanes[0], z + 4.6, 5, true);
    free = lanes[0];
  } else {
    // mixed row: one of each
    addObstacle('fan', lanes[0], z);
    if (Math.random() < 0.5) { addObstacle('laser', lanes[1], z); addObstacle('steam', lanes[2], z); }
    else { addObstacle('steam', lanes[1], z); }
    addCheeseLine(lanes[2], z + 6, 3, false);
    free = lanes[2];
  }
  return free;
}

/* ---------------- input ---------------- */
function moveLane(dir) {
  if (state !== 'run') return;
  const n = Math.max(0, Math.min(2, S.lane + dir));
  if (n === S.lane) { S.shake = Math.max(S.shake, 0.08); return; }
  S.prevLane = S.lane; S.lane = n; S.laneMoveT = 0; S.lean = -dir;
  sfx.lane();
}
function jump() {
  if (state !== 'run' || S.rocketT > 0) return;
  if (S.grounded) {
    S.vy = JUMP_V * (S.springT > 0 ? 1.25 : 1) * (S.boardT > 0 ? 1.06 : 1);
    S.grounded = false; S.slideT = 0;
    missionEvent('jumps', 1, 0); sfx.jump(); emit(S.x, S.y + 0.05, 0.2, 0xbfc7cf, 10, 3, 2, 0.4);
  } else S.jumpBuf = 0.16;
}
function slide() {
  if (state !== 'run' || S.rocketT > 0) return;
  if (!S.grounded) { S.vy = Math.min(S.vy, -20); S.slideBuf = 0.3; }
  else { S.slideT = 0.62; missionEvent('slides', 1, 0); sfx.slide(); emit(S.x, S.y + 0.05, 0.3, 0xffd36a, 14, 2.5, 1.2, 0.35); }
}
function useBoard() {
  if (state !== 'run' || S.boardT > 0 || boards <= 0) return;
  boards--; store.set('lr_vent_boards', boards);
  S.boardT = BOARD.dur; missionEvent('boards', 1, 0); sfx.board(); toast('Cheese Board!', '#ffe9a0'); updateBoardBtn();
}
function breakBoard() {
  S.boardT = 0; S.invulnT = 1.5; S.shake = Math.max(S.shake, reduceMotion ? 0.08 : 0.4); S.flash = 0.3;
  sfx.smash(); toast('Board took the hit', '#ffe9a0'); emit(S.x, S.y + 0.3, 0, 0xf5c518, 30, 6, 4, 0.6); updateBoardBtn();
}
function activatePower(kind) {
  const P = POWERS[kind]; S[P.key] = P.dur;
  if (kind === 'vial') { S.boostMax = P.dur; S.chaserT = 0; sfx.boost(); }
  else if (kind === 'rocket') { S.chaserT = 0; S.grounded = false; S.vy = 0; S.slideT = 0; S.airSince = 0; S.airLane = S.lane; sfx.rocket(); }
  else sfx.power();
}
addEventListener('keydown', e => {
  const k = e.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
  if (state === 'title' && (k === 'Enter' || k === ' ')) { startRun(); return; }
  if (state === 'over' && (k === 'Enter' || k === ' ') && S.overReady) { startRun(); return; }
  if (k === 'p' || k === 'P' || k === 'Escape') { if (state === 'run') pause(); else if (state === 'paused') resume(); return; }
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') moveLane(-1);
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') moveLane(1);
  else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') jump();
  else if (k === 'ArrowDown' || k === 's' || k === 'S') slide();
  else if (k === 'b' || k === 'B' || k === 'e' || k === 'E') useBoard();
});
let touch = null;
const stageEl = $('stage');
stageEl.addEventListener('pointerdown', e => { touch = { x: e.clientX, y: e.clientY, done: false }; });
stageEl.addEventListener('pointermove', e => {
  if (!touch || touch.done) return;
  const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
  if (Math.hypot(dx, dy) < 28) return;
  touch.done = true;
  if (Math.abs(dx) > Math.abs(dy)) moveLane(dx > 0 ? 1 : -1); else if (dy < 0) jump(); else slide();
});
let lastTap = 0;
stageEl.addEventListener('pointerup', () => {
  if (touch && !touch.done) { const now = performance.now(); if (now - lastTap < 320) { useBoard(); lastTap = 0; } else lastTap = now; }
  touch = null;
});
stageEl.addEventListener('pointercancel', () => { touch = null; });

/* ---------------- UI ---------------- */
$('controlsHelp').innerHTML = coarse
  ? '<div><b>Swipe ← →</b>Change lane</div><div><b>Swipe up</b>Jump</div><div><b>Swipe down</b>Slide</div><div><b>Double-tap</b>Cheese Board</div>'
  : '<div><b>← →</b>Change lane</div><div><b>↑ / Space</b>Jump</div><div><b>↓</b>Slide</div><div><b>B</b>Cheese Board</div>';
function showBestOnTitle() { $('titleBest').textContent = best > 0 ? `Your best: ${best.toLocaleString()}` : ''; }
showBestOnTitle();
renderMissions('missionsTitle');
if (TX.card) $('titleScreen').style.backgroundImage = `radial-gradient(ellipse at center, rgba(5,8,10,.35) 0%, rgba(5,8,10,.88) 75%), url(${TX.card})`;
if (TX.card) { $('titleScreen').style.backgroundSize = 'cover'; $('titleScreen').style.backgroundPosition = 'center'; }
function stageUnlocked(i) { return UNLOCK_ALL || i === 0 || store.get('lr_vent_clear_' + STAGES[i - 1].id, false); }
function applyStage(i) {
  stageIdx = i; store.set('lr_vent_stage', i);
  const st = STAGES[i], T = stageTex(st);
  if (M.wallA !== M.wall) {
    M.wallA.map = T.wallA; M.wallA.normalMap = T.wallAN; M.wallB.map = T.wallB; M.wallB.normalMap = T.wallBN;
    M.ceil.map = T.ceil; M.ceil.normalMap = T.ceilN; M.floor.map = T.floor; M.floor.normalMap = T.floorN;
    M.wallA.color.set(st.wallColor); M.wallB.color.set(st.wallColor); M.ceil.color.set(st.ceilColor); M.floor.color.set(st.floorColor);
    [M.wallA, M.wallB, M.ceil, M.floor].forEach(m => m.needsUpdate = true);
  }
  if (vista && T.vista) { vista.material.map = T.vista; vista.material.needsUpdate = true; }
  if (FAN_MAT && T.hazard) { FAN_MAT.map = T.hazard; FAN_MAT.needsUpdate = true; }
  SECTIONS = st.sections;
  decorateSegments(st);
  setTheme(0, true);
  $('warn').textContent = `${st.chaserName} is right behind you`;
  if (TX[st.card]) $('titleScreen').style.backgroundImage = `radial-gradient(ellipse at center, rgba(5,8,10,.35) 0%, rgba(5,8,10,.88) 75%), url(${TX[st.card]})`;
  if (typeof syncChaser === 'function') syncChaser();
  renderStagePicker();
  if (typeof renderRunnerPicker === 'function') renderRunnerPicker();
}
function renderStagePicker() {
  const el = $('stagePicker'); if (!el) return;
  el.innerHTML = STAGES.map((st, i) => {
    const open = stageUnlocked(i), cleared = store.get('lr_vent_clear_' + st.id, false);
    const status = !open ? `Clear ${STAGES[i - 1].name} to unlock` : (cleared ? (st.unlockNote ? 'Cleared' : 'Cleared') : `Reach ${st.goal.toLocaleString()} m to clear`);
    return `<button class="stage${i === stageIdx ? ' sel' : ''}${open ? '' : ' locked'}" data-i="${i}" style="background-image:url(${TX[st.card] || ''})" ${open ? '' : 'aria-disabled="true"'}>
      ${cleared ? '<span class="badge">Cleared</span>' : ''}<span class="num">Stage ${i + 1}</span><span class="nm">${st.name}</span>
      <span class="st">${status}${st.unlockNote && open && !cleared ? '<br>' + st.unlockNote : ''}</span></button>`;
  }).join('');
  el.querySelectorAll('.stage').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); const i = +b.dataset.i; if (!stageUnlocked(i) || i === stageIdx) return; applyStage(i);
  }));
}
applyStage(stageIdx);
const PW_ROWS = {};
[...Object.entries(POWERS), ['board', BOARD]].forEach(([k, P]) => {
  const d = document.createElement('div'); d.className = 'pw'; d.style.setProperty('--c', P.css);
  d.innerHTML = `<span>${P.name}</span><div class="bar"><i></i></div>`;
  $('powers').appendChild(d); PW_ROWS[k] = { el: d, bar: d.querySelector('i'), P };
});
function updatePowersHud() {
  for (const k in PW_ROWS) {
    const row = PW_ROWS[k], t = S[row.P.key];
    row.el.classList.toggle('on', t > 0);
    if (t > 0) row.bar.style.transform = `scaleX(${Math.max(0, t / row.P.dur)})`;
  }
}
let boardShown = '';
function updateBoardBtn() {
  const key = boards + '|' + (S.boardT > 0);
  if (key === boardShown) return; boardShown = key;
  $('boardCount').textContent = boards;
  $('boardBtn').disabled = boards <= 0 || S.boardT > 0;
}
$('boardBtn').addEventListener('click', e => { e.stopPropagation(); useBoard(); });
function setMuteIcon() {
  $('icoSound').style.display = muted ? 'none' : ''; $('icoMute').style.display = muted ? '' : 'none';
  $('muteBtn').setAttribute('aria-label', muted ? 'Turn sound on' : 'Mute sound');
}
setMuteIcon();
$('muteBtn').addEventListener('click', e => { e.stopPropagation(); muted = !muted; store.set('lr_vent_muted', muted); setMuteIcon(); ensureAudio(); musicDuck(music.level); });
$('pauseBtn').addEventListener('click', e => { e.stopPropagation(); if (state === 'run') pause(); });
$('playBtn').addEventListener('click', startRun);
$('againBtn').addEventListener('click', startRun);
$('resumeBtn').addEventListener('click', resume);
$('quitBtn').addEventListener('click', () => { $('pauseScreen').classList.remove('on'); toTitle(); });

let toastTimer = 0;
function toast(text, color) {
  const el = $('toast'); el.textContent = text; el.style.color = color || '';
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
function banner(name) {
  $('bannerName').textContent = name;
  const el = $('banner'); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

function startRun() {
  ensureAudio();
  resetRun();
  state = 'run';
  ['titleScreen', 'overScreen', 'pauseScreen'].forEach(id => $(id).classList.remove('on'));
  $('hud').classList.add('on');
  banner(SECTIONS[0].name);
  playMusic(STAGES[stageIdx].id); musicDuck(1);
  mecha.root.position.z = 16;
  boardShown = ''; updateBoardBtn(); $('boardBtn').classList.add('on');
}
function toTitle() {
  resetRun(); state = 'title';
  playMusic('theme'); musicDuck(1);
  $('hud').classList.remove('on'); $('warn').classList.remove('on'); $('boardBtn').classList.remove('on');
  renderMissions('missionsTitle'); renderStagePicker(); renderRunnerPicker();
  showBestOnTitle(); $('titleScreen').classList.add('on');
}
function pause() { musicDuck(0.35); state = 'paused'; $('pauseScreen').classList.add('on'); $('resumeBtn').focus(); }
function resume() { musicDuck(1); state = 'run'; $('pauseScreen').classList.remove('on'); last = performance.now(); }
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'run') pause(); });

function scoreNow() { return Math.floor(S.distPts) + S.cheesePts + S.bonusPts; }
function multiplier() { return (1 + rank + Math.min(4, Math.floor(S.dist / 500))) * (S.dblT > 0 ? 2 : 1); }

function die(cause) {
  musicDuck(0.45);
  if (state !== 'run') return;
  state = 'dying'; S.dyingT = 1.3; S.deathCause = cause;
  S.flash = 0.9; S.shake = reduceMotion ? 0.1 : 0.7;
  sfx.crash();
  emit(S.x, 0.6, -0.3, 0xffffff, 40, 7, 6, 0.8);
  emit(S.x, 0.6, -0.3, 0xff3b4a, 30, 6, 5, 0.8);
}
function finish() {
  state = 'over';
  const sc = scoreNow();
  const isBest = sc > best;
  if (isBest) { best = sc; store.set('lr_vent_best', best); }
  const DEATH = {
    caught: [`Caught by ${STAGES[stageIdx].chaserName}`, 'Two slip-ups in a row and they had you.'],
    crash:  STAGES[stageIdx].crash,
    cart:   ['Flattened by a supply cart', 'Run up a ramp to get on top, or switch lanes early. Red carts are moving.'],
  };
  const dd = DEATH[S.deathCause] || DEATH.crash;
  $('overHead').textContent = dd[0]; $('overSub').textContent = dd[1];
  let ranked = false;
  if (MS.done.every(Boolean)) { rank = Math.min(30, rank + 1); store.set('lr_vent_rank', rank); MS = newMissions(MS.level + 1); ranked = true; }
  store.set('lr_vent_missions', MS);
  $('rankUp').innerHTML = ranked ? `<span class="newbest">Lab Rank ${rank}: every run now starts at x${1 + rank}</span>` : '';
  renderMissions('missionsOver');
  $('boardBtn').classList.remove('on');
  $('finalScore').textContent = sc.toLocaleString();
  $('finalDist').textContent = Math.floor(S.dist).toLocaleString() + ' m';
  $('finalCheese').textContent = S.cheese;
  $('finalBest').textContent = best.toLocaleString();
  $('newBest').innerHTML = isBest && sc > 0 ? '<span class="newbest">New best score</span>' : '';
  $('hud').classList.remove('on'); $('warn').classList.remove('on');
  $('overScreen').classList.add('on');
  S.overReady = false; setTimeout(() => { S.overReady = true; $('againBtn').focus(); }, 500);
}

function stumble(o) {
  if (S.boardT > 0) { breakBoard(); return; }
  S.stumbleAnim = 0.85;
  if (S.chaserT > 0) { die('caught'); return; }
  S.chaserT = 7; S.invulnT = 1.1; S.speedMul = 0.62;
  S.shake = reduceMotion ? 0.08 : 0.45; S.flash = 0.45;
  sfx.hit(); setTimeout(() => sfx.alarm(), 180);
  emit(S.x, 0.7, -0.4, 0xffffff, 18, 5, 4, 0.5);
  toast('Ouch!', '#ff3b4a');
}

/* ============================================================
   UPDATE
   ============================================================ */
const _v = new THREE.Vector3();
function update(dt) {
  S.t += dt;
  const running = state === 'run';
  const dying = state === 'dying';

  // speed
  let base;
  if (state === 'title' || state === 'over') base = 9;
  else base = 14 + Math.min(20, S.dist * 0.0078);
  S.speedMul += (1 - S.speedMul) * Math.min(1, dt * 0.9);
  const boostMul = S.boostT > 0 ? 1.35 : (S.rocketT > 0 ? 1.2 : 1);
  const targetSpeed = base * S.speedMul * boostMul;
  S.speed += (targetSpeed - S.speed) * Math.min(1, dt * 3);
  let spd = dying ? S.speed * 0.15 : S.speed;
  const move = spd * dt;

  if (running) {
    S.dist += move;
    if (!S.stageClear && S.dist >= STAGES[stageIdx].goal) {
      S.stageClear = true; const st = STAGES[stageIdx];
      store.set('lr_vent_clear_' + st.id, true);
      toast(`${st.name} cleared!`, '#f5c518'); sfx.mission(); S.bonusPts += 500 * multiplier();
      if (STAGES[stageIdx + 1]) setTimeout(() => toast(`${STAGES[stageIdx + 1].name} unlocked`, '#00c2d4'), 1400);
      const nr = RUNNERS.find(r => r.unlockStage === st.id);
      if (nr) setTimeout(() => toast(`${nr.name} unlocked`, '#f5c518'), 2800);
    }
    S.distPts += move * multiplier();
    // section change
    const sec = Math.floor(S.dist / SECTION_LEN);
    if (sec !== S.section) { S.section = sec; setTheme(sec, false); banner(SECTIONS[sec % SECTIONS.length].name); sfx.section(); }
    // spawning
    S.sinceSpawn += move;
    const gap = 19 + S.speed * 0.42;
    if (S.sinceSpawn >= gap) { S.sinceSpawn = 0; spawnRow(SPAWN_Z); }
    // timers
    S.invulnT = Math.max(0, S.invulnT - dt);
    if (S.chaserT > 0) { S.chaserT -= dt; if (S.chaserT <= 0) toast('Shook it off!', '#00c2d4'); }
    if (S.boostT > 0) { S.boostT -= dt; if (S.boostT <= 0) toast('Formula wore off', '#5dff7a'); }
    for (const k of ['magnetT', 'springT', 'dblT', 'boardT']) if (S[k] > 0) S[k] = Math.max(0, S[k] - dt);
    if (S.rocketT > 0) {
      S.rocketT -= dt;
      if (S.rocketT > 2.0) {  // lay a cheese trail in the air
        S.airSince += move;
        if (S.airSince >= 2.3) {
          S.airSince = 0;
          if (Math.random() < 0.12) S.airLane = Math.max(0, Math.min(2, S.airLane + (Math.random() < 0.5 ? -1 : 1)));
          addCheeseLine(S.airLane, -40, 1, false, 3.25);
        }
      }
      if (S.rocketT <= 0) { S.rocketT = 0; S.grounded = false; S.vy = 2; S.invulnT = 1.2; toast('Rocket burnt out', '#ff9f1c'); }
    }
    missionEvent('dist', 0, Math.floor(S.dist)); missionEvent('score', 0, scoreNow());
    S.comboT -= dt; if (S.comboT <= 0) S.combo = 0;
    S.laneMoveT += dt;
  }

  // theme blend
  themeLight.lerp(themeTarget, Math.min(1, dt * 1.5));
  M.strip.color.copy(themeLight);
  aheadLight.color.copy(themeLight).multiplyScalar(0.45);
  scene.fog.color.lerp(fogTarget, Math.min(1, dt * 1.5));
  scene.background.copy(scene.fog.color);
  if (vista) { const fc = scene.fog.color; vista.material.color.setRGB(0.42 + fc.r * 1.6, 0.42 + fc.g * 1.6, 0.42 + fc.b * 1.6); }

  // duct scroll
  for (const s of segs) { s.position.z += move; if (s.position.z > SEG_L * 2) s.position.z -= SEG_N * SEG_L; }

  // rat physics: ground can be the floor, a ramp or a cart roof
  const targetX = LANES[S.lane];
  S.x += (targetX - S.x) * Math.min(1, dt * 16);
  const sup = supportAt(); S.ground = sup.h;
  if (S.rocketT > 0) {
    S.grounded = false; S.vy = 0;
    S.y += (3.0 - S.y) * Math.min(1, dt * 4);
  } else {
    if (S.grounded) {
      if (sup.h > S.y + 0.001 && sup.h - S.y < 0.6) S.y = sup.h;   // walk up ramps
      else if (sup.h < S.y - 0.001) S.grounded = false;            // run off the end of a cart
    }
    if (!S.grounded) {
      S.vy += GRAVITY * (S.springT > 0 ? 0.85 : 1) * dt; S.y += S.vy * dt;
      const ceil = DUCT_H - RAT_H - 0.15;
      if (S.y > ceil) { S.y = ceil; S.vy = Math.min(S.vy, 0); }
      if (S.y <= sup.h && S.vy <= 0) {
        S.y = sup.h; S.vy = 0; S.grounded = true;
        emit(S.x, S.y + 0.03, 0.2, 0xbfc7cf, 8, 3, 1.5, 0.35);
        if (S.jumpBuf > 0) { S.jumpBuf = 0; jump(); }
        else if (S.slideBuf > 0) { S.slideBuf = 0; slide(); }
      }
    }
    if (S.grounded && sup.on && S.y >= CART_H - 0.01 && !sup.on.topped) { sup.on.topped = true; missionEvent('carts', 1, 0); }
  }
  S.jumpBuf = Math.max(0, S.jumpBuf - dt); S.slideBuf = Math.max(0, S.slideBuf - dt);
  if (S.slideT > 0) S.slideT -= dt;
  const sliding = S.slideT > 0;
  const ratTop = S.y + (sliding ? RAT_SLIDE_H : RAT_H);

  // obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.prevZ = o.z; o.z += move;
    if (o.moving && o.z > -55) {  // oncoming carts roll out of the dark at you
      if (!o.rolling) { o.rolling = true; if (running) sfx.horn(); }
      o.z += (running ? 9 : 4) * dt;
      o.lamps.forEach(l => l.visible = Math.sin(S.t * 16) > -0.6);
    }
    o.g.position.z = o.z;
    if (o.spin) o.spin.rotation.z += dt * (8 + S.speed * 0.3);
    if (o.bulb) o.bulb.visible = Math.sin(S.t * 10 + i) > -0.2;
    if (o.beams) { const f = 0.75 + Math.random() * 0.25; o.beams.forEach(b => b.scale.set(f, 1, f)); }
    if (o.plumes) {
      o.plumes.forEach((p, k) => { const s = 0.85 + Math.sin(S.t * 18 + k) * 0.15; p.scale.set(s, 1 + Math.sin(S.t * 13 + k) * 0.12, s); });
      if (o.z > -70 && o.z < 4 && o.g.visible && Math.random() < 0.6) {
        const ex = o.emitXs[rnd(o.emitXs.length)];
        emit(o.x + ex + (Math.random() - 0.5) * 0.2, 0.55, o.z, 0xcfe6ff, 1, 0.6, 3.2, 0.5, 1.5);
      }
    }
    if (o.z - (o.len ? o.len / 2 : 0) > DESPAWN_Z) { scene.remove(o.g); obstacles.splice(i, 1); continue; }
    if (!running || o.hit || !o.g.visible) continue;
    if (S.rocketT > 0) continue;

    if (o.kind === 'cart') {
      const zb = o.z - o.len / 2, zf = o.z + o.len / 2;
      if (!(zf > RAT_FRONT && zb < RAT_BACK)) continue;
      if (Math.abs(o.x - S.x) >= o.halfW + RAT_HALF_W) continue;
      if (S.y >= CART_H - 0.45) continue;  // on top, or high enough to land on it
      const headOn = (o.prevZ + o.len / 2) <= RAT_FRONT + 0.02;
      const smashIt = () => {
        o.hit = true; o.g.visible = false;
        emit(o.x, 0.9, RAT_FRONT, 0xffffff, 26, 8, 5, 0.6); emit(o.x, 0.9, RAT_FRONT, o.moving ? 0xff3b4a : 0x1fb5c4, 26, 7, 5, 0.6);
      };
      if (S.boostT > 0) { smashIt(); S.bonusPts += 75; sfx.smash(); S.shake = Math.max(S.shake, reduceMotion ? 0.05 : 0.3); toast('Cart smashed +75', '#5dff7a'); continue; }
      if (!headOn) { S.lane = S.prevLane; if (S.invulnT > 0) continue; o.hit = true; stumble(o); continue; }
      if (S.invulnT > 0) { smashIt(); continue; }
      if (S.boardT > 0) { smashIt(); breakBoard(); continue; }
      o.hit = true; die('cart'); continue;
    }

    // collision
    const zOver = (o.z + o.hd > RAT_FRONT) && (o.z - o.hd < RAT_BACK);
    if (!zOver) {
      // close shave: fan passes right beside the rat just after a lane change
      if (o.kind === 'fan' && !o.shaved && o.prevZ - o.hd < RAT_BACK && o.z - o.hd >= RAT_BACK && Math.abs(o.x - S.x) < 1.9 && S.laneMoveT < 0.7) {
        o.shaved = true; missionEvent('shaves', 1, 0); S.bonusPts += 25 * multiplier(); toast('Close shave +' + 25 * multiplier()); sfx.close();
      }
      continue;
    }
    const xOver = Math.abs(o.x - S.x) < o.halfW + RAT_HALF_W;
    const yOver = ratTop > o.ymin && S.y < o.ymax;
    if (!xOver || !yOver) continue;
    if (S.boostT > 0) {
      o.hit = true; o.g.visible = false; S.bonusPts += 50; sfx.smash();
      emit(o.x, 0.9, o.z, 0x5dff7a, 30, 8, 5, 0.6); emit(o.x, 0.9, o.z, 0xffffff, 16, 6, 4, 0.5);
      S.shake = Math.max(S.shake, reduceMotion ? 0.05 : 0.25); toast('Smashed +50', '#5dff7a');
      continue;
    }
    if (S.invulnT > 0) continue;
    o.hit = true;
    const headOn = (o.prevZ + o.hd) <= RAT_FRONT;
    if (o.lethal && headOn) {
      if (S.boardT > 0) { o.g.visible = false; emit(o.x, 0.9, o.z, 0xffffff, 24, 7, 5, 0.5); breakBoard(); }
      else die('crash');
    }
    else if (o.lethal) { S.lane = S.prevLane; stumble(o); }
    else stumble(o);
  }

  // pickups
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.z += move; p.spin += dt * 3;
    if ((S.boostT > 0 || S.magnetT > 0) && p.kind === 'cheese' && !p.taken && p.z > -12 && p.z < 1) {  // magnet
      p.x += (S.x - p.x) * Math.min(1, dt * 7); p.y += (S.y + 0.5 - p.y) * Math.min(1, dt * 7);
    }
    p.g.position.set(p.x, p.y + Math.sin(S.t * 4 + p.spin) * 0.06, p.z);
    p.g.rotation.y = p.spin;
    if (p.kind === 'vial') p.g.rotation.z = Math.sin(S.t * 3) * 0.3;
    if (p.z > DESPAWN_Z || p.taken) { scene.remove(p.g); pickups.splice(i, 1); continue; }
    if (!running) continue;
    if (Math.abs(p.z) < 0.7 && Math.abs(p.x - S.x) < 0.75 && Math.abs(p.y - (S.y + 0.45)) < 0.85) {
      p.taken = true;
      if (p.kind === 'cheese') {
        S.cheese++; S.combo++; S.comboT = 0.6;
        S.cheesePts += 10 * multiplier();
        sfx.cheese(S.combo);
        emit(p.x, p.y, p.z, 0xffd84a, 10, 3, 3, 0.45);
        missionEvent('cheese', 1, S.cheese);
        if (S.cheese % 100 === 0) { boards++; store.set('lr_vent_boards', boards); toast('+1 Cheese Board', '#ffe9a0'); updateBoardBtn(); }
      } else {
        const P = POWERS[p.kind];
        missionEvent('powers', 1, 0);
        emit(p.x, p.y, p.z, P.hex, 40, 6, 5, 0.7);
        toast(P.name + '!', P.css);
        activatePower(p.kind);
      }
    }
  }

  // running dust + boost trail
  if (S.rocketT > 0) [-0.12, 0.12].forEach(ox => emit(S.x + ox, S.y + 0.38, 0.62, 0xff9f1c, 1, 0.3, -2, 0.12, 0));
  if (S.boardT > 0 && running && Math.random() < 0.4) emit(S.x + (Math.random() - 0.5) * 0.5, S.y + 0.05, 0.7, 0xffe9a0, 1, 0.5, 0.5, 0.25, 0);
  if (running && S.grounded && S.boardT <= 0 && Math.random() < Math.min(1, S.speed / 25)) emit(S.x + (Math.random() - 0.5) * 0.3, S.y + 0.04, 0.45, 0x8e979f, 1, 0.8, 0.8, 0.18, -2);
  if (S.boostT > 0) emit(S.x + (Math.random() - 0.5) * 0.4, S.y + 0.3 + Math.random() * 0.5, 0.5, 0x5dff7a, 2, 0.6, 0.4, 0.45, 0);
  if (running && S.speed > 22 && Math.random() < 0.5) {
    const side = Math.random() < 0.5 ? -1 : 1;
    emit(side * (2.2 + Math.random() * 0.6), 0.5 + Math.random() * 3, -30, 0xffffff, 1, 0, 0, 0.6, 0);
  }
  updateParticles(dt, move);

  /* --- animate rat --- */
  const r = rat;
  r.root.position.set(S.x, S.y + (S.boardT > 0 ? 0.12 : 0), 0);
  r.board.visible = S.boardT > 0; r.jet.visible = S.rocketT > 0;
  S.lean += (0 - S.lean) * Math.min(1, dt * 6);
  const runPhase = S.t * (8 + S.speed * 0.42);
  const air = !S.grounded;
  r.pivot.rotation.z = (targetX - S.x) * -0.25;
  if (dying) {
    r.pivot.rotation.x += dt * 9; r.pivot.position.y = 0.2;
  } else if (sliding) {
    r.pivot.scale.set(1.15, 0.5, 1.15); r.pivot.rotation.x = 0.15; r.pivot.position.y = -0.04;
  } else if (air) {
    const stretch = 1 + Math.max(-0.15, Math.min(0.18, S.vy * 0.015));
    r.pivot.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
    r.pivot.rotation.x = Math.max(-0.4, Math.min(0.4, -S.vy * 0.03)); r.pivot.position.y = 0;
  } else {
    const bob = Math.abs(Math.sin(runPhase)) * 0.07;
    r.pivot.scale.set(1, 1 - bob * 0.4, 1 + bob * 0.3); r.pivot.rotation.x = -0.05; r.pivot.position.y = bob;
  }
  if (!dying && !sliding && !air) r.pivot.rotation.x = -0.05 + Math.sin(runPhase * 2) * 0.03;
  r.legs.forEach((l, i) => {
    const ph = runPhase + (i === 0 || i === 3 ? 0 : Math.PI);
    l.rotation.x = air ? (i < 2 ? -0.8 : 0.9) : (sliding ? (i < 2 ? -1.2 : 1.2) : Math.sin(ph) * 0.95);
  });
  r.head.rotation.x = air ? -0.15 : Math.sin(runPhase * 2) * 0.05;
  r.head.rotation.y = (targetX - S.x) * -0.25;
  for (let i = 0; i < r.tail.length; i++) {
    const t = i / r.tail.length;
    const wave = Math.sin(S.t * 9 - i * 0.55) * 0.12 * t * 2;
    r.tail[i].position.set(wave + (targetX - S.x) * 0.25 * t, 0.06 * Math.sin(t * 3) + (air ? -t * 0.3 : t * 0.1), i * 0.075);
  }
  // Shadow's animation state: run / jump / slide / stumble, picked from the same game state
  if (runnerCh()) {
    const c = runnerCh();
    c.holder.rotation.z = (targetX - S.x) * -0.22;
    heroFill.position.set(S.x, S.y + 1.7, 2.2); heroFill.intensity = RUNNERS[runnerIdx].fill;
    c.holder.rotation.x = 0;
    if (S.stumbleAnim > 0) S.stumbleAnim -= dt;
    if (dying) playClip(c, 'stumble', { once: true, timeScale: 1.2 });
    else if (S.rocketT > 0) { playClip(c, 'jump', { timeScale: 0, startAt: 0.85 }); c.holder.rotation.x = -0.35; }
    else if (S.stumbleAnim > 0 && S.grounded) playClip(c, 'stumble', { once: true, timeScale: 1.6 });
    else if (sliding) playClip(c, 'slide', { once: true, timeScale: 1.9, fade: 0.06 });
    else if (air) playClip(c, 'jump', { once: true, timeScale: 1.9, startAt: 0.35, fade: 0.06 });
    else playClip(c, 'run', { timeScale: running ? Math.max(0.9, S.speed / 17) : 0.75, fade: 0.1 });
    c.mixer.update(dt);
  }
  // glow when boosted
  ratLight.position.set(S.x, S.y + 2.2, 0.8);
  ratLight.color.setRGB(S.boostT > 0 ? 0.5 : 1, 1, S.boostT > 0 ? 0.6 : 1);
  ratLight.intensity = S.boostT > 0 ? 1.6 : 0.55;
  aheadLight.position.set(0, 3.6, -14);

  /* --- chaser --- */
  const chaseClose = (running && S.chaserT > 0) || (dying && S.deathCause === 'caught');
  const caughtNow = dying && S.deathCause === 'caught';
  const mz = caughtNow ? 1.0 : (chaseClose ? 3.2 : 17);
  const mx = caughtNow ? S.x : LANES[S.lane] + (S.lane === 2 ? -1.45 : 1.45);
  mecha.root.position.z += (mz - mecha.root.position.z) * Math.min(1, dt * (dying ? 6 : 2.2));
  mecha.root.position.x += (mx - mecha.root.position.x) * Math.min(1, dt * 3);
  mecha.pivot.position.y = Math.abs(Math.sin(S.t * 10)) * 0.06;
  mecha.head.rotation.y = Math.sin(S.t * 2.5) * 0.25;
  mecha.beacon.visible = Math.sin(S.t * 14) > 0;
  if (chaserCh()) {
    const c = chaserCh();
    if (c.update) c.update(dt);
    if (caughtNow && c.actions.pounce) playClip(c, 'pounce', { once: true, timeScale: 1.3, fade: 0.08 });
    else playClip(c, 'run', { timeScale: caughtNow ? 2.2 : (chaseClose ? 1.35 : 1.1) });
    // chasers without a pounce clip (Ludwig) lunge in code: a burst forward with a hard lean
    if (!c.actions.pounce) {
      const k = Math.min(1, dt * (caughtNow ? 9 : 4));
      c.holder.rotation.x += ((caughtNow ? -0.5 : (chaseClose ? -0.12 : 0)) - c.holder.rotation.x) * k;
      c.holder.position.z += ((caughtNow ? -0.9 : 0) - c.holder.position.z) * k;
      c.holder.position.y += ((caughtNow ? 0.25 : 0) - c.holder.position.y) * k;
    }
    c.mixer.update(dt);
  }
  [-1, 1].forEach(s => { const a = mecha.pivot.userData['arm' + s]; a.rotation.x = 0.55 + Math.sin(S.t * 7 + s) * 0.35; });
  $('warn').classList.toggle('on', running && S.chaserT > 0);
  if (running && S.chaserT > 0 && S.t > S.nextAlarm) { S.nextAlarm = S.t + 1.4; }

  /* --- camera --- */
  const camClose = chaseClose ? 1 : 0;
  const flyK = S.rocketT > 0 ? 0.55 : 0.35;
  _v.set(S.x * 0.55, Math.min(DUCT_H - 0.4, 2.35 + S.y * flyK + camClose * 1.1), 5.6 + camClose * 1.8);
  camera.position.lerp(_v, Math.min(1, dt * 6));
  if (S.shake > 0) {
    camera.position.x += (Math.random() - 0.5) * S.shake;
    camera.position.y += (Math.random() - 0.5) * S.shake;
    S.shake = Math.max(0, S.shake - dt * 1.8);
  }
  camera.lookAt(S.x * 0.75, 0.95 - camClose * 0.35 + S.y * (S.rocketT > 0 ? 0.75 : 0.4), -8);
  camera.rotateZ((targetX - S.x) * 0.035);
  const fov = 60 + Math.max(0, S.speed - 14) * 0.42 + (S.boostT > 0 ? 7 : 0);
  camera.fov += (fov - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix();

  // post
  S.flash = Math.max(0, S.flash - dt * 2.2);
  finalPass.uniforms.flash.value = S.flash * 0.6;
  finalPass.uniforms.tint.value.setRGB(S.boostT > 0 ? 0.3 : 1, S.boostT > 0 ? 1 : 0.1, S.boostT > 0 ? 0.4 : 0.15);
  finalPass.uniforms.boost.value += ((S.boostT > 0 ? 1 : 0) - finalPass.uniforms.boost.value) * Math.min(1, dt * 4);
  finalPass.uniforms.time.value = S.t % 100;

  // HUD
  if (running) {
    $('score').textContent = scoreNow().toLocaleString();
    $('dist').textContent = Math.floor(S.dist).toLocaleString() + ' m';
    $('cheese').textContent = S.cheese;
    $('mult').textContent = 'x' + multiplier();
    updatePowersHud(); updateBoardBtn();
  }

  if (dying) { S.dyingT -= dt; if (S.dyingT <= 0) finish(); }
}

/* ============================================================
   LOOP
   ============================================================ */
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.05) dt = 0.05;
  if (state !== 'paused') update(dt);
  composer.render();
}
requestAnimationFrame(frame);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth, innerHeight);
});

// test hook for automated checks
if (DEBUG) window.__vent = { S, get state() { return state; }, startRun, obstacles: () => obstacles.length, pickups: () => pickups.length,
  obs: () => obstacles, addObstacle, applyStage, get stageIdx() { return stageIdx; }, step: (n, d) => { for (let i = 0; i < n; i++) update(d || 1 / 60); }, addCart, addPower, activatePower, useBoard, supportAt, get MS() { return MS; }, get rank() { return rank; } };
})();
