import './input.mjs';
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const elements = new Map();

function makeElement(id) {
  const classes = new Set(id === "start-screen" ? ["overlay--visible"] : []);
  return {
    id,
    textContent: "",
    disabled: false,
    hidden: false,
    style: { setProperty() {} },
    listeners: {},
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name)
    },
    focus() {},
    setAttribute() {},
    addEventListener(name, callback) { this.listeners[name] = callback; },
    setPointerCapture() {},
    hasPointerCapture() { return false; },
    releasePointerCapture() {}
  };
}

const drawingContext = new Proxy({
  createLinearGradient() { return { addColorStop() {} }; },
  measureText() { return { width: 0 }; }
}, {
  get(target, property) {
    if (property in target) return target[property];
    return () => {};
  },
  set(target, property, value) {
    target[property] = value;
    return true;
  }
});

const ids = [
  "flight-controls", "over-menu", "result-menu", "mode-menu", "campaign-picker", "choose-campaign", "back-modes", "flight-title", "goal-progress", "star-goals", "star-1", "star-2", "star-3", "hud-bank", "hud-haul", "hud-integrity", "hud-mass", "integrity-progress", "station-status", "endless-menu-best", "exit-title", "endless", "result-endless", "start-score-label", "over-score-label", "exit-confirm", "keep-playing", "leave-run", "mission", "level-result", "result-title", "result-stats", "finish-level", "continue-level", "next-level", "replay-level", "campaign", "level-1", "level-2", "level-3", "level-description", "game", "canvas", "status", "restart", "tether", "deposit", "thrust",
  "start-screen", "start", "game-over", "play-again", "death", "detail",
  "bank", "lost", "summary", "start-high-score", "game-over-high-score"
];
ids.forEach((id) => elements.set(id, makeElement(id)));
elements.get("canvas").getContext = () => drawingContext;

const storage = new Map();
const sandbox = {
  GameArt: { sprite: () => false, backdrop: () => false },
  console,
  Math,
  Number,
  String,
  performance: { now: () => 1000 },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame() {},
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  },
  document: {
    hidden: false,
    getElementById: (id) => elements.get(id),
    addEventListener() {}
  },
  navigator: {},
  window: { isSecureContext: false, addEventListener() {} }
};
sandbox.globalThis = sandbox;

let source = fs.readFileSync(new URL("../src/game.js", import.meta.url), "utf8");
source = source.replace(/\}\)\(\);\s*$/, `
  globalThis.__qa = {
    draw, stationMessage, start, end, finishLevel, resumeLevel, update, fireTether, collide, thrustEffectiveness,
    get state() { return { level, progress, pendingResult, running, haul, bank, mass, integrity, tether, junk, player, station, depositing, cargo }; },
    set scenario(value) {
      if (value.running !== undefined) running = value.running;
      if (value.haul !== undefined) haul = value.haul;
      if (value.bank !== undefined) bank = value.bank;
      if (value.mass !== undefined) mass = value.mass;
      if (value.integrity !== undefined) integrity = value.integrity;
      if (value.player !== undefined) player = value.player;
      if (value.station !== undefined) station = value.station;
      if (value.junk !== undefined) junk = value.junk;
      if (value.depositing !== undefined) depositing = value.depositing;
      if (value.cargo !== undefined) cargo = value.cargo;
    }
  };
})();`);
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../src/levels.js', import.meta.url), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(new URL('../src/input.js', import.meta.url), 'utf8'), sandbox);
vm.runInContext(source, sandbox, { filename: "src/game.js" });

const qa = sandbox.__qa;
assert.equal(elements.get('endless').disabled, false, 'endless is available on a fresh save');
assert.equal(elements.get('level-2').disabled, true, 'campaign unlocks remain separate');
const pointerEvent = { preventDefault() {}, pointerId: 1 };

assert.equal(qa.thrustEffectiveness(0), 1, "empty thrust is 100%");
assert.equal(qa.thrustEffectiveness(100), 0.75, "full mass curve reaches 75%");
assert.equal(qa.thrustEffectiveness(1000), 0.75, "thrust never falls below 75%");

qa.start();
qa.scenario = {
  player: { y: 225, velocityY: 0, flash: 0 },
  junk: [{ x: 200, y: 225, speed: 40, value: 30, mass: 5, size: 10, type: "PANEL", wobble: 0, hit: false }]
};
qa.fireTether();
assert.ok(qa.state.tether, "tether acquires nearby debris");
qa.fireTether();
assert.equal(qa.state.tether, null, "second tether press cancels");
qa.fireTether();
qa.update(1);
assert.equal(qa.state.haul, 30, "completed tether adds debris value to haul");
assert.equal(qa.state.mass, 5, "completed tether adds debris mass");

qa.scenario = {
  running: true,
  player: { y: 225, velocityY: 0, flash: 0 },
  station: { x: 180, y: 225, speed: 25 },
  haul: 30,
  bank: 0,
  mass: 5,
  integrity: 50,
  depositing: true,
  cargo: [{ angle: 0, radius: 16, size: 4 }],
  junk: []
};
qa.update(1.3);
assert.equal(qa.state.bank, 30, "deposit banks the current haul");
assert.equal(qa.state.haul, 0, "deposit clears current haul");
assert.equal(qa.state.mass, 0, "deposit clears cargo mass");
assert.equal(qa.state.integrity, 62, "deposit repairs exactly 12% integrity");

qa.start();
qa.scenario = { running: true, player: { y: 74, velocityY: 0, flash: 0 } };
qa.update(0);
assert.equal(elements.get("death").textContent, "LOST IN SPACE", "upper boundary ends in LOST IN SPACE");

qa.start();
qa.scenario = { running: true, player: { y: 361, velocityY: 0, flash: 0 } };
qa.update(0);
assert.equal(elements.get("death").textContent, "REENTRY", "lower boundary ends in REENTRY");

qa.start();
qa.scenario = { running: true, integrity: 1, player: { y: 225, velocityY: 0, flash: 0 } };
qa.collide({ x: 180, y: 225, speed: 40, value: 70, mass: 10, size: 14, type: "SAT", wobble: 0, hit: false });
assert.equal(elements.get("death").textContent, "SUIT FAILURE", "zero integrity ends in SUIT FAILURE");

qa.start();
qa.scenario = { running: true, bank: 90, haul: 70 };
qa.end("REENTRY");
assert.equal(elements.get("bank").textContent, "90", "game over displays Banked Score");
assert.equal(elements.get("lost").textContent, "70", "game over displays Haul Lost");
assert.equal(storage.get("orbital-cleanup-high-score"), "90", "banked high score persists locally");

elements.get("play-again").listeners.pointerdown(pointerEvent);
assert.equal(qa.state.running, true, "Play Again starts a new run");
assert.equal(qa.state.bank, 0, "new run resets banked score");
assert.equal(qa.state.haul, 0, "new run resets haul");
assert.equal(qa.state.integrity, 100, "new run resets integrity");

const manifest = JSON.parse(fs.readFileSync(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "./", "manifest starts inside the Pages project path");
assert.equal(manifest.scope, "./", "manifest scope stays inside the Pages project path");
assert.equal(manifest.icons.some((icon) => icon.sizes === "192x192"), true);
assert.equal(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"), true);
for (const icon of manifest.icons) assert.ok(fs.existsSync(new URL(`../${icon.src}`, import.meta.url)), `${icon.src} exists`);

const indexHtml = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const browserAssetPaths = [...indexHtml.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
for (const assetPath of browserAssetPaths) {
  const deployedUrl = new URL(assetPath, "https://houseandrade.github.io/orbital-cleanup/");
  assert.ok(deployedUrl.pathname.startsWith("/orbital-cleanup/"), `${assetPath} remains under the Pages project path`);
}

const serviceWorkerSource = fs.readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
const cachedPaths = [...serviceWorkerSource.matchAll(/^\s+"(\.\/.+?)",?$/gm)].map((match) => match[1]);
assert.ok(cachedPaths.includes("./index.html"), "offline cache includes the root entry point");
assert.ok(cachedPaths.every((assetPath) => assetPath.startsWith("./")), "offline assets resolve inside the Pages project path");
const gameSource = fs.readFileSync(new URL("../src/game.js", import.meta.url), "utf8");
assert.match(gameSource, /serviceWorker\.register\("\.\/service-worker\.js"\)/, "service worker registration is project-relative");

// Qualifying carried value cannot complete a mission; only a safe deposit can.
qa.start();
qa.scenario = { haul: 600, mass: 25, junk: [] };
qa.update(0);
assert.equal(qa.state.pendingResult, false);
function deposit(value) {
  qa.scenario = { haul: value, mass: 5, junk: [], depositing: true,
    player: { y: 225, velocityY: 0, flash: 0 }, station: { x: 180, y: 225, speed: 0 } };
  qa.update(0.3);
}
deposit(60);
assert.equal(qa.state.pendingResult, true);
assert.equal(qa.state.running, false, 'star choice pauses simulation');
assert.equal(qa.state.progress.best[1], undefined, 'choice does not commit completion');
qa.resumeLevel();
assert.equal(qa.state.running, true);
deposit(60);
qa.finishLevel();
assert.equal(qa.state.progress.best[1], 2);
assert.equal(elements.get('result-title').textContent, 'LEVEL COMPLETE');
assert.equal(elements.get('next-level').hidden, false);
qa.start();
deposit(60);
qa.finishLevel();
assert.equal(qa.state.progress.best[1], 2, 'lower replay preserves best');
assert.match(elements.get('result-stats').textContent, /Previous best: 2/);
elements.get('next-level').listeners.click();
assert.equal(qa.state.level.id, 2);
assert.equal(qa.state.junk.length, 8);
deposit(150);
qa.finishLevel();
assert.equal(qa.state.progress.best[2], 1, 'one star unlocks next level');
elements.get('next-level').listeners.click();
assert.equal(qa.state.level.id, 3);
const special = qa.state.junk.find(object => object.special);
assert.equal(special.value, 300);
assert.equal(special.y, 112);
special.x = -50;
qa.update(0);
assert.equal(qa.state.junk.filter(object => object.special).length, 1, 'missed satellite returns once');
deposit(150);
qa.finishLevel();
assert.equal(qa.state.progress.best[3], 1, 'High Roller completes without satellite');
assert.equal(elements.get('next-level').hidden, true);
qa.start();
deposit(600);
qa.finishLevel();
assert.equal(qa.state.progress.best[3], 3);
const loaded = vm.runInContext('LevelSystem.readProgress()', sandbox);
assert.equal(loaded.best[3], 3, 'progress survives reload');
assert.equal(loaded.currentLevel, 3);
qa.start();
qa.scenario = { haul: 600, mass: 5, depositing: true, junk: [], player: { y: 361, velocityY: 0, flash: 0 }, station: { x: 180, y: 300, speed: 0 } };
qa.update(0.3);
assert.equal(qa.state.pendingResult, false, 'boundary death wins over deposit');
assert.equal(qa.state.bank, 0);
qa.start();
qa.scenario = { haul: 600, mass: 5, integrity: 1, depositing: true, player: { y: 225, velocityY: 0, flash: 0 }, station: { x: 180, y: 225, speed: 0 }, junk: [{ x: 180, y: 225, speed: 40, size: 14, type: 'SAT', wobble: 0 }] };
qa.update(0);
assert.equal(qa.state.bank, 0, 'suit failure cannot bank later in same frame');
assert.equal(qa.state.pendingResult, false);
for (const invalid of ['{broken', 'null', '{"currentLevel":99,"best":{"1":9,"3":3}}']) {
  storage.set('orbital-cleanup-progress-v1', invalid);
  assert.equal(vm.runInContext('LevelSystem.readProgress().currentLevel', sandbox), 1);
}
const originalGet = sandbox.localStorage.getItem;
sandbox.localStorage.getItem = () => { throw new Error('unavailable'); };
assert.equal(vm.runInContext('LevelSystem.readProgress().currentLevel', sandbox), 1);
sandbox.localStorage.getItem = originalGet;
assert.ok(cachedPaths.includes('./src/levels.js'), 'levels available offline');
qa.start();
qa.scenario = { bank: 30, haul: 40, mass: 5 };
elements.get('campaign').listeners.click();
assert.equal(qa.state.running, false, 'menu pauses instead of abandoning');
qa.update(1);
assert.equal(qa.state.bank, 30);
assert.equal(qa.state.haul, 40);
qa.start();
assert.equal(qa.state.haul, 40, 'restart cannot bypass exit dialog');
elements.get('keep-playing').listeners.click();
assert.equal(qa.state.running, true);
assert.equal(qa.state.haul, 40, 'cancel preserves cargo');
elements.get('campaign').listeners.click();
elements.get('leave-run').listeners.click();
assert.equal(qa.state.running, false);
assert.equal(qa.state.haul, 0, 'explicit leave discards run');
assert.equal(elements.get('start-screen').classList.contains('overlay--visible'), true);
qa.start();
deposit(600);
elements.get('campaign').listeners.click();
elements.get('keep-playing').listeners.click();
assert.equal(qa.state.pendingResult, true, 'cancel returns to objective choice');
assert.equal(qa.state.running, false);
qa.finishLevel();
assert.equal(elements.get('result-title').textContent, 'LEVEL COMPLETE');
const previousProgress = JSON.stringify(qa.state.progress);
const campaignBest = storage.get('orbital-cleanup-high-score');
elements.get('campaign').listeners.click();
elements.get('endless').listeners.click();
qa.start();
assert.equal(qa.state.level.id, 'endless');
assert.equal(qa.state.junk.length, 8);
assert.equal(elements.get('start-score-label').textContent, 'ENDLESS BEST');
assert.equal(elements.get('start-high-score').textContent, '0', 'campaign score is not imported');
deposit(900);
assert.equal(qa.state.running, true, 'endless deposits never complete a level');
assert.equal(qa.state.pendingResult, false);
assert.equal(storage.get('orbital-cleanup-endless-best-v1'), '900');
assert.equal(storage.get('orbital-cleanup-high-score'), campaignBest);
assert.equal(JSON.stringify(qa.state.progress), previousProgress);
qa.scenario = { haul: 70 };
qa.end('SUIT');
assert.equal(elements.get('lost').textContent, '70');
assert.equal(elements.get('game-over-high-score').textContent, '900');
qa.start();
assert.equal(qa.state.level.id, 'endless', 'replay stays in endless');
assert.equal(qa.state.bank, 0);
assert.equal(elements.get('start-high-score').textContent, '900');
elements.get('campaign').listeners.click();
elements.get('keep-playing').listeners.click();
assert.equal(qa.state.running, true, 'safe exit works in endless');
qa.start();
qa.scenario = { player: { y: 225, velocityY: 0, flash: 0 }, station: { x: 660, y: 225, speed: 25 } };
assert.equal(qa.stationMessage(), '', 'offscreen station has no label');
qa.scenario = { station: { x: 390, y: 225, speed: 25 } };
assert.equal(qa.stationMessage(), 'STATION APPROACHING', 'visible approaching wing counts');
qa.scenario = { station: { x: 180, y: 225, speed: 25 } };
assert.equal(qa.stationMessage(), 'STATION IN RANGE');
qa.scenario = { station: { x: 40, y: 225, speed: 25 } };
assert.equal(qa.stationMessage(), '', 'departed station is not approaching');
qa.scenario = { station: { x: -47, y: 225, speed: 25 } };
assert.equal(qa.stationMessage(), '');
elements.get('campaign').listeners.click();
elements.get('restart').listeners.click();
assert.equal(elements.get('leave-run').textContent, 'CONFIRM RESTART');
assert.equal(qa.state.running, false, 'restart asks while paused');
elements.get('keep-playing').listeners.click();
assert.equal(qa.state.running, true, 'restart can be canceled');
elements.get('campaign').listeners.click();
elements.get('restart').listeners.click();
elements.get('leave-run').listeners.click();
assert.equal(qa.state.running, true, 'confirmed restart resumes a fresh run');
elements.get('campaign').listeners.click();
elements.get('leave-run').listeners.click();
elements.get('choose-campaign').listeners.click();
elements.get('level-1').listeners.click();
qa.start();
qa.scenario = { bank: 60, haul: 200 };
qa.draw();
assert.equal(elements.get('hud-bank').textContent, '$60');
assert.equal(elements.get('hud-haul').textContent, '$200');
assert.equal(elements.get('star-1').classList.contains('earned'), true);
assert.equal(elements.get('star-2').classList.contains('earned'), false, 'carried value does not earn stars');
assert.equal(elements.get('star-2').textContent, '★★ $120');
assert.equal(elements.get('star-3').textContent, '★★★ $200');
for (const asset of ['./src/art.js', './src/art/earth.png', './src/art/sprites.png']) {
  assert.ok(cachedPaths.includes(asset), `${asset} cached offline`);
  assert.ok(fs.existsSync(new URL(`../${asset}`, import.meta.url)));
}
console.log("Orbital Cleanup v0.8.1 acceptance checks passed.");
