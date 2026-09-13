import './updates.mjs';
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
    set innerHTML(value) {
      for (const match of value.matchAll(/id="([^"]+)"/g)) elements.set(match[1], makeElement(match[1]));
    },
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
  "result-mode", "phase-preview", "object-progress", "level-4", "level-5", "flight-controls", "over-menu", "result-menu", "mode-menu", "campaign-picker", "choose-campaign", "back-modes", "flight-title", "goal-progress", "star-goals", "star-1", "star-2", "star-3", "hud-bank", "hud-haul", "hud-integrity", "hud-mass", "integrity-progress", "station-status", "endless-menu-best", "exit-title", "endless", "result-endless", "start-score-label", "over-score-label", "exit-confirm", "keep-playing", "leave-run", "mission", "level-result", "result-title", "result-stats", "finish-level", "continue-level", "next-level", "replay-level", "campaign", "level-1", "level-2", "level-3", "level-description", "game", "canvas", "status", "restart", "tether", "deposit", "thrust",
  "start-screen", "start", "game-over", "play-again", "death", "detail",
  "bank", "lost", "summary", "start-high-score", "game-over-high-score"
];
ids.push(...Array.from(fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8').matchAll(/id="([^"]+)"/g), match => match[1]));
ids.forEach((id) => elements.set(id, makeElement(id)));
elements.get("canvas").getContext = () => drawingContext;

const storage = new Map();
const sandbox = {
  GameArt: { sprite: () => false, backdrop: () => false },
  console,
  structuredClone,
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
    ContractSystem, refreshCareer,
    get careerState() { return { carriedTypes, bankedTypes, contractBonus, contractCompleted, runEffects }; },
    depositDuration, makeJunk, fillDebris, scheduleEncounter, collect, draw, stationMessage, start, end, finishLevel, resumeLevel, update, fireTether, collide, thrustEffectiveness,
    get state() { return { phase, queuedPhase, nextStation, elapsed, carriedObjects, bankedObjects, level, progress, pendingResult, running, haul, bank, mass, integrity, tether, junk, player, station, depositing, cargo }; },
    set scenario(value) {
      if (value.elapsed !== undefined) elapsed = value.elapsed;
      if (value.running !== undefined) running = value.running;
      if (value.carriedObjects !== undefined) carriedObjects = value.carriedObjects;
      if (value.bankedObjects !== undefined) bankedObjects = value.bankedObjects;
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
vm.runInContext(fs.readFileSync(new URL('../src/contracts.js', import.meta.url), 'utf8'), sandbox);
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
  cargo: [{ value: 30, mass: 5, type: "PANEL", angle: 0, radius: 16, size: 4 }],
  junk: []
};
qa.update(0.1);
qa.draw();
assert.equal(qa.state.bank, 0, 'unfinished transfer does not credit money');
assert.equal(qa.state.mass, 5, 'unfinished transfer keeps cargo mass');
assert.equal(qa.state.cargo.length, 1, 'unfinished transfer keeps visible cargo');
assert.match(elements.get('station-status').textContent, /TRANSFERRING SALVAGE.*45%/);
qa.scenario = { depositing: false };
qa.update(0);
assert.equal(qa.state.haul, 30, 'interrupting a transfer preserves its value');
qa.scenario = { depositing: true };
qa.update(0.2);
assert.equal(qa.state.bank, 0, 'a new hold starts transfer progress over');
qa.update(0.1);
assert.equal(qa.state.bank, 30, "deposit banks the current haul");
assert.equal(elements.get('hud-bank').textContent, '$30', 'first deposit immediately refreshes the banked display');
assert.equal(elements.get('hud-haul').textContent, '$0');
assert.equal(elements.get('station-status').textContent, 'BANKED +$30 · TOTAL $30');
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
assert.match(gameSource, /serviceWorker\.register\("\.\/service-worker\.js"/, "service worker registration is project-relative");

// Qualifying carried value cannot complete a mission; only a safe deposit can.
qa.start();
qa.scenario = { haul: 600, mass: 25, junk: [] };
qa.update(0);
assert.equal(qa.state.pendingResult, false);
function deposit(value) {
  // Populate real cargo when a scenario supplies only an aggregate haul.
  if (!qa.state.cargo.length || qa.state.cargo.reduce((sum, item) => sum + item.value, 0) !== value) {
    const types = Object.entries(qa.careerState.carriedTypes).flatMap(([type, count]) => Array(count).fill(type));
    if (!types.length) types.push(...Array(qa.state.carriedObjects || 1).fill('SCRAP'));
    qa.scenario = { haul: 0, mass: 0, cargo: [], carriedObjects: 0 };
    qa.careerState.carriedTypes && Object.keys(qa.careerState.carriedTypes).forEach(type => delete qa.careerState.carriedTypes[type]);
    types.forEach(type => qa.collect({ type, value: value / types.length, mass: 5, size: 7 }));
  }
  const frames = qa.state.cargo.length * 10;
  for (let i = 0; i < frames && qa.state.cargo.length && qa.state.running; i++) {
    qa.scenario = { junk: [], depositing: true,
      player: { y: 225, velocityY: 0, flash: 0 }, station: { x: 180, y: 225, speed: 0 } };
    qa.update(0.034);
  }
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
assert.equal(elements.get('next-level').hidden, false, 'Level 3 now unlocks Recovery Detail');
qa.start();
deposit(600);
qa.finishLevel();
assert.equal(qa.state.progress.best[3], 3);
const loaded = vm.runInContext('LevelSystem.readProgress()', sandbox);
assert.equal(loaded.best[3], 3, 'progress survives reload');
assert.equal(loaded.currentLevel, 4);
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
assert.equal(qa.state.running, false, 'endless deposits pause for a safe finish choice');
assert.equal(qa.state.pendingResult, true);
qa.resumeLevel();
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
assert.equal(qa.stationMessage(), 'STATION PASS IN 16s');
qa.scenario = { station: { x: 390, y: 225, speed: 25 } };
assert.equal(qa.stationMessage(), 'STATION PASS IN 5s');
qa.scenario = { station: { x: 180, y: 225, speed: 25 } };
assert.equal(qa.stationMessage(), 'STATION IN RANGE');
qa.scenario = { station: { x: 40, y: 225, speed: 25 } };
assert.match(qa.stationMessage(), /^NEXT STATION PASS IN/);
qa.scenario = { station: { x: -47, y: 225, speed: 25 } };
assert.match(qa.stationMessage(), /^NEXT STATION PASS IN/);
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
// New campaign content works with existing completed-three-level saves.
storage.set('orbital-cleanup-progress-v1', JSON.stringify({currentLevel:3,best:{1:3,2:1,3:2}}));
const legacy = vm.runInContext('LevelSystem.readProgress()', sandbox);
assert.equal(legacy.best[3], 2);
assert.equal(legacy.best[4], undefined);
qa.end('REENTRY');
elements.get('over-menu').listeners.click();
elements.get('choose-campaign').listeners.click();
elements.get('level-4').listeners.click();
qa.start();
assert.equal(qa.state.level.id, 4);
assert.equal(qa.state.bankedObjects, 0);
// Count is separate from orbiting cargo visuals and only commits at a deposit.
qa.scenario = { junk: [] };
for (let i=0; i<10; i++) qa.collect({value:20, mass:2, size:7});
qa.draw();
assert.equal(qa.state.carriedObjects, 10);
assert.equal(qa.state.bankedObjects, 0);
assert.equal(qa.state.pendingResult, false);
assert.match(elements.get('object-progress').textContent, /Return to bank/);
assert.equal(elements.get('star-1').textContent, '★ 10 objects');
qa.scenario = { bank: 650 };
qa.draw();
assert.equal(elements.get('star-1').classList.contains('earned'), false, 'value alone cannot complete object quota');
qa.start();
qa.scenario = { carriedObjects: 4 };
deposit(80);
assert.equal(qa.state.bankedObjects, 4);
assert.equal(qa.state.carriedObjects, 0);
assert.equal(qa.state.pendingResult, false);
qa.scenario = { carriedObjects: 6 };
deposit(120);
assert.equal(qa.state.bankedObjects, 10);
assert.equal(qa.state.pendingResult, true);
qa.finishLevel();
assert.equal(qa.state.progress.best[4], 1, 'ten objects unlock next level with one star');
assert.match(elements.get('result-stats').textContent, /10 objects banked/);
qa.start();
assert.equal(qa.state.bankedObjects, 0);
qa.scenario = { carriedObjects:10 };
deposit(400);
qa.finishLevel();
assert.equal(qa.state.progress.best[4], 2);
qa.start();
qa.scenario = { carriedObjects:10 };
deposit(650);
qa.finishLevel();
assert.equal(qa.state.progress.best[4], 3);
qa.start();
qa.scenario = { carriedObjects:10, haul:650, mass:20, player:{y:361,velocityY:0,flash:0} };
qa.update(0);
assert.equal(qa.state.bankedObjects, 0, 'lost cargo never counts as banked objects');
qa.start();
qa.scenario = { carriedObjects:10, haul:650, mass:20 };
elements.get('campaign').listeners.click();
elements.get('keep-playing').listeners.click();
assert.equal(qa.state.carriedObjects, 10, 'canceling Menu preserves object cargo');
qa.scenario = { carriedObjects:10 };
deposit(200);
qa.finishLevel();
assert.equal(qa.state.progress.best[4], 3, 'replay cannot reduce best');
elements.get('next-level').listeners.click();
assert.equal(qa.state.level.id, 5);
assert.equal(qa.state.level.debris.special, undefined, 'valuable targets replenish normally');
const bands = qa.state.level.debris.bands;
assert.equal(bands[0].value[0], 40);
assert.equal(bands[0].value[1], 60);
assert.equal(bands[1].value[0], 150);
assert.equal(bands[1].value[1], 200);
qa.draw();
assert.equal(elements.get('object-progress').hidden, true);
assert.equal(elements.get('star-3').textContent, '★★★ $1000');
deposit(350);
qa.finishLevel();
assert.equal(qa.state.progress.best[5], 1);
assert.equal(elements.get('next-level').hidden, false);
assert.equal(elements.get('result-endless').hidden, true);
qa.start();
deposit(650);
qa.finishLevel();
assert.equal(qa.state.progress.best[5], 2);
qa.start();
deposit(1000);
qa.finishLevel();
assert.equal(qa.state.progress.best[5], 3);
assert.equal(vm.runInContext('LevelSystem.readProgress().best[5]', sandbox), 3);

// Countdown uses the actual queued return and freezes with the simulation.
qa.start();
const queuedStation = { ...qa.state.nextStation };
qa.scenario = { station: { x: -71, y: 225, speed: 25 }, player: { y:225, velocityY:0, flash:0 } };
qa.update(0);
assert.equal(qa.state.station.x, queuedStation.x);
assert.equal(qa.state.station.y, queuedStation.y);
assert.equal(qa.stationMessage(), `STATION PASS IN ${Math.ceil((queuedStation.x - 270) / 25)}s`);
elements.get('campaign').listeners.click();
const pausedTime = qa.state.elapsed;
const pausedCountdown = qa.stationMessage();
qa.update(10);
assert.equal(qa.state.elapsed, pausedTime);
assert.equal(qa.stationMessage(), pausedCountdown);
elements.get('keep-playing').listeners.click();
qa.scenario = { station: { x:180, y:190, speed:25 }, player:{y:300,velocityY:0,flash:0} };
assert.equal(qa.stationMessage(), 'STATION PASS NOW • ALIGN ALTITUDE');

// Recovery pockets stay compact at a shared speed and replenish as a group.
elements.get('campaign').listeners.click();
elements.get('leave-run').listeners.click();
elements.get('level-4').listeners.click();
qa.start();
const pocket = qa.state.junk.filter(object => object.pocket);
assert.equal(pocket.length, 3);
assert.equal(qa.state.junk.length, 8);
assert.ok(pocket.every(object => object.mass === 2 && object.type === 'SCRAP' && object.speed === pocket[0].speed));
assert.equal(pocket[1].x - pocket[0].x, 32);
assert.ok(Math.max(...pocket.map(o=>o.y)) - Math.min(...pocket.map(o=>o.y)) <= 24);
qa.collect(pocket[0]);
qa.fillDebris();
assert.equal(qa.state.junk.filter(o=>o.pocket).length, 2, 'do not replace a group with scattered single scraps');
qa.collect(pocket[1]); qa.collect(pocket[2]); qa.fillDebris();
assert.equal(qa.state.junk.filter(o=>o.pocket).length, 3);
assert.equal(qa.state.junk.length, 8);

// Each valuable encounter reaches the player four seconds before station range.
elements.get('campaign').listeners.click();
elements.get('leave-run').listeners.click();
elements.get('level-5').listeners.click();
qa.start();
function checkEncounter() {
  const targets = qa.state.junk.filter(o=>o.encounter);
  assert.equal(targets.length, 1);
  const target = targets[0];
  assert.ok(Math.abs((target.x - 180) / target.speed - ((qa.state.station.x - 270) / 25 - 4)) < 1e-8);
  assert.ok(target.value >= 150 && target.value <= 200);
  assert.ok(target.y >= 108 && target.y <= 135);
}
checkEncounter();
assert.equal(qa.state.junk.length, 8);
assert.equal(qa.state.junk.filter(o=>o.type === 'SAT').length, 1);
qa.scenario = {station:{x:-71,y:225,speed:25}};
qa.update(0);
checkEncounter();
qa.collect(qa.state.junk.find(o=>o.encounter));
qa.fillDebris();
assert.equal(qa.state.junk.filter(o=>o.encounter).length, 0, 'valuable target returns on the next pass, not instantly');

// Banking previews phases; only choosing to continue commits the transition.
elements.get('campaign').listeners.click();
elements.get('leave-run').listeners.click();
elements.get('endless').listeners.click();
qa.start();
const campaignSave = storage.get('orbital-cleanup-progress-v1');
assert.equal(qa.state.phase.name, 'Open field');
qa.scenario = {haul:500}; qa.draw();
assert.equal(qa.state.phase.name, 'Open field', 'carried value never changes phases');
assert.match(elements.get('mission').textContent, /NEXT \$150/);
deposit(100);
assert.equal(qa.state.pendingResult, true, 'finish is offered even before the first milestone');
assert.equal(qa.state.queuedPhase.name, 'Open field');
qa.resumeLevel();
deposit(50);
assert.equal(elements.get('result-title').textContent, 'MILESTONE REACHED');
assert.equal(qa.state.phase.name, 'Open field');
assert.equal(qa.state.queuedPhase.name, 'Scrap pockets');
assert.match(elements.get('phase-preview').textContent, /Next phase: Scrap pockets/);
const debrisBefore = [...qa.state.junk];
elements.get('campaign').listeners.click();
elements.get('keep-playing').listeners.click();
assert.equal(qa.state.pendingResult, true);
qa.resumeLevel();
assert.equal(qa.state.phase.name, 'Scrap pockets');
assert.deepEqual(qa.state.junk, debrisBefore, 'phase changes preserve objects already in flight');
deposit(150); qa.resumeLevel();
assert.equal(qa.state.phase.name, 'High-value passes');
deposit(200); qa.resumeLevel();
assert.equal(qa.state.phase.name, 'Recovery stretch');
qa.scenario = {junk:[]}; qa.fillDebris();
assert.equal(qa.state.junk.length, 5);
assert.ok(qa.state.junk.every(o=>o.mass === 2 && o.y >= 195 && o.y <= 260));
deposit(250); qa.resumeLevel();
assert.equal(qa.state.phase.name, 'Open field', 'phases repeat by banked value');
deposit(550);
assert.equal(qa.state.queuedPhase.name, 'Recovery stretch', 'a large deposit selects the phase at the resulting bank total');
qa.draw();
assert.match(elements.get('mission').textContent, /NEXT \$1500/);
qa.finishLevel();
assert.equal(elements.get('result-title').textContent, 'RUN COMPLETE');
assert.equal(qa.state.running, false);
assert.equal(qa.state.pendingResult, false);
assert.equal(elements.get('next-level').hidden, true);
assert.equal(elements.get('continue-level').hidden, true);
assert.equal(storage.get('orbital-cleanup-endless-best-v1'), '1300');
assert.equal(storage.get('orbital-cleanup-progress-v1'), campaignSave);
qa.start();
assert.equal(qa.state.phase.name, 'Open field');
assert.equal(qa.state.queuedPhase, null);
assert.equal(qa.state.bank, 0);
qa.scenario = { haul:200, mass:5, player:{y:361,velocityY:0,flash:0}, station:{x:180,y:225,speed:25}, depositing:true };
qa.update(1.3);
assert.equal(qa.state.pendingResult, false, 'failure cannot become a successful Endless finish');
assert.equal(qa.state.bank, 0);

// Existing timing, movement setup, and all campaign targets are retained.
for (const config of vm.runInContext('LevelSystem.campaign', sandbox)) {
  assert.equal(config.station.startX, config.id === 1 ? 450 : 660);
  assert.equal(config.station.speed, 25);
  assert.equal(config.player.startY, 225);
  assert.equal(config.player.suitIntegrity, 100);
  assert.deepEqual(Array.from(config.station.returnOffset), config.id === 1 ? [120,180] : [420,620]);
}
assert.deepEqual(Array.from(vm.runInContext('LevelSystem.campaign.slice(0,7).map(c=>c.objective.target)', sandbox)), [60,150,150,10,350,5,3]);
console.log('Orbital Cleanup v0.11 acceptance checks passed.');

// Contract deposits, type tracking, once-per-run bonuses, and career purchases.
const careerSystem = qa.ContractSystem;
const campaignBeforeContracts = storage.get('orbital-cleanup-progress-v1');
const endlessBeforeContracts = storage.get('orbital-cleanup-endless-best-v1');
const launchContract = id => elements.get(`contract-${id}`).listeners.click();
launchContract('satellite-sweep');
assert.equal(careerSystem.career.wallet, 0, 'old scores are not imported as money');
for (let i = 0; i < 5; i++) qa.collect({ type:'PANEL', value:30, mass:5, size:10 });
deposit(150);
assert.equal(qa.state.pendingResult, false, 'panels cannot satisfy a satellite job');
assert.equal(careerSystem.career.wallet, 150);
for (let i = 0; i < 3; i++) qa.collect({ type:'SAT', value:70, mass:10, size:14 });
deposit(210);
assert.equal(qa.careerState.bankedTypes.SAT, 3);
assert.equal(qa.state.pendingResult, false);
for (let i = 0; i < 2; i++) qa.collect({ type:'SAT', value:70, mass:10, size:14 });
assert.equal(careerSystem.career.wallet, 360, 'carried salvage is not paid');
deposit(140);
assert.equal(qa.state.pendingResult, true);
assert.equal(careerSystem.career.wallet, 1250, '500 salvage plus 750 bonus');
assert.equal(qa.careerState.contractBonus, 750);
assert.ok(elements.get('contract-payout').textContent.includes('$1250'));
qa.resumeLevel();
deposit(50);
assert.equal(careerSystem.career.wallet, 1300, 'later deposits cannot repeat the bonus');
qa.finishLevel(); qa.finishLevel();
assert.equal(careerSystem.career.wallet, 1300, 'finish cannot repeat payment');
assert.equal(careerSystem.career.completed.length, 1);
assert.equal(storage.get('orbital-cleanup-progress-v1'), campaignBeforeContracts);
assert.equal(storage.get('orbital-cleanup-endless-best-v1'), endlessBeforeContracts);
launchContract('satellite-sweep');
assert.equal(qa.careerState.bankedTypes.SAT, undefined, 'new runs reset type counts');
qa.collect({ type:'SAT', value:70, mass:10, size:14 });
qa.end('SUIT');
assert.equal(careerSystem.career.wallet, 1300, 'lost cargo is unpaid');
launchContract('first-shift');
deposit(90);
qa.end('SUIT');
assert.equal(careerSystem.career.wallet, 1390, 'deposits survive a failed contract');
elements.get('over-menu').listeners.click();
elements.get('choose-upgrades').listeners.click();
elements.get('buy-reel').listeners.click();
assert.equal(careerSystem.career.wallet, 490);
assert.equal(careerSystem.career.upgrades.reel, 1);
assert.equal(careerSystem.purchase('reel'), false, 'later tiers require distinct jobs');
assert.equal(careerSystem.purchase('thrust'), false, 'insufficient balance cannot buy');
assert.equal(careerSystem.purchase('invalid'), false);
careerSystem.credit(1000);
elements.get('buy-thrust').listeners.click();
assert.equal(careerSystem.career.upgrades.thrust, 1);
// Every mode snapshots the same owned equipment, including campaign and Endless.
for (const launch of [() => launchContract('panel-patrol'), () => elements.get('endless').listeners.click(), () => { elements.get('level-1').listeners.click(); qa.start(); }]) {
  launch();
  assert.equal(qa.careerState.runEffects.reel, 0.9);
  assert.equal(qa.careerState.runEffects.thrust, 1.06);
  qa.scenario = { junk:[{x:200,y:225,wobble:0,mass:10}], player:{y:225,velocityY:0,flash:0} };
  qa.fireTether();
  assert.ok(Math.abs(qa.state.tether.duration - 0.72) < 1e-10, 'reel effect reaches the live tether');
}
for (const c of careerSystem.contracts.slice(0, 6)) careerSystem.complete(c.id);
careerSystem.credit(50000);
for (const id of ['reel','thrust']) {
  assert.equal(careerSystem.purchase(id), true);
  assert.equal(careerSystem.purchase(id), true);
  assert.equal(careerSystem.purchase(id), false, 'maximum tier cannot be exceeded');
}
assert.equal(careerSystem.career.completed.length, 6, 'replays do not unlock tiers twice');
const careerSource = fs.readFileSync(new URL('../src/contracts.js', import.meta.url), 'utf8');
function reloadCareer(localStorage) {
  const fresh = vm.createContext({ structuredClone, localStorage });
  vm.runInContext(fs.readFileSync(new URL('../src/levels.js', import.meta.url), 'utf8'), fresh);
  vm.runInContext(careerSource, fresh);
  return vm.runInContext('ContractSystem', fresh);
}
const reloaded = reloadCareer(sandbox.localStorage).career;
const expectedCareer = careerSystem.career;
reloaded.completed.sort(); expectedCareer.completed.sort();
assert.deepEqual(reloaded, expectedCareer, 'wallet, gear and completions survive reload');
const blockedCareer = reloadCareer({ getItem(){throw Error('blocked');}, setItem(){throw Error('blocked');} });
assert.equal(blockedCareer.credit(1000), true);
assert.equal(blockedCareer.purchase('reel'), true);
assert.equal(blockedCareer.career.wallet, 100);
assert.equal(blockedCareer.persistent, false);
const corruptCareer = reloadCareer({ getItem: () => '{"wallet":-40,"upgrades":{"reel":99},"completed":["fake"]}', setItem(){} });
assert.equal(corruptCareer.career.wallet, 0);
assert.equal(corruptCareer.career.upgrades.reel, 0);
assert.equal(corruptCareer.career.completed.length, 0);
assert.ok(cachedPaths.includes('./src/contracts.js'), 'career logic is available offline');
console.log('Contracts, saved economy, bonus isolation, purchases and upgrades across all modes passed.');
for (const contract of careerSystem.contracts) {
  launchContract(contract.id);
  const balance = careerSystem.career.wallet;
  const count = contract.objective.type === 'bank_value' ? 1 : contract.objective.target;
  for (let i = 0; i < count; i++) qa.collect({ type:contract.objective.salvageType || 'SCRAP', value:contract.objective.type === 'bank_value' ? contract.objective.target : 30, mass:2, size:7 });
  const salvage = qa.state.haul;
  qa.draw();
  assert.equal(qa.state.pendingResult, false, 'carried objective does not complete a contract');
  deposit(salvage);
  assert.equal(qa.state.pendingResult, true, `${contract.name} can be completed`);
  assert.equal(elements.get('result-contracts').hidden, true, 'finish the contract before choosing another job');
  assert.equal(careerSystem.career.wallet, balance + salvage + contract.bonus);
  qa.finishLevel();
  assert.equal(elements.get('next-level').hidden, true);
  assert.equal(elements.get('result-endless').hidden, true);
  assert.equal(elements.get('result-contracts').hidden, false);
  elements.get('result-contracts').listeners.click();
  assert.equal(elements.get('level-result').classList.contains('overlay--visible'), false);
  assert.equal(elements.get('start-screen').classList.contains('overlay--visible'), true);
  assert.equal(elements.get('contracts-picker').hidden, false);
  assert.equal(elements.get('mode-menu').hidden, true);
  assert.equal(elements.get(`contract-${contract.id}`).textContent, 'REPLAY CONTRACT');
  assert.equal(qa.state.running, false);
  assert.equal(qa.state.pendingResult, false);
  assert.equal(careerSystem.career.wallet, balance + salvage + contract.bonus, 'returning to the board preserves earnings');
}
elements.get('endless').listeners.click();
deposit(100);
assert.equal(elements.get('result-contracts').hidden, true, 'contract action does not carry into endless results');
console.log('All eleven contract objectives and payouts passed.');

launchContract('first-shift');
const partialWallet = careerSystem.career.wallet;
for (const item of [{ type: 'PANEL', value: 30 }, { type: 'SAT', value: 70 }, { type: 'SCRAP', value: 20 }]) {
  qa.collect({ ...item, mass: 5, size: 7 });
}
const transferFrame = () => {
  qa.scenario = { junk: [], depositing: true, player: { y: 225, velocityY: 0, flash: 0 }, station: { x: 180, y: 225, speed: 0 } };
  qa.update(0.034);
};
for (let i = 0; i < 9; i++) transferFrame();
assert.equal(qa.state.cargo.length, 2, 'one dot disappears for the first received item');
assert.equal(elements.get('hud-bank').textContent, '$30');
assert.equal(elements.get('hud-haul').textContent, '$90');
assert.equal(qa.state.bankedObjects, 1);
assert.equal(qa.careerState.bankedTypes.PANEL, 1);
assert.equal(careerSystem.career.wallet, partialWallet + 30);
qa.scenario = { depositing: false };
qa.update(0);
assert.equal(qa.state.cargo.length, 2, 'releasing leaves unreceived items aboard');
for (let i = 0; i < 9; i++) transferFrame();
assert.equal(qa.state.cargo.length, 1);
assert.equal(elements.get('hud-bank').textContent, '$100', 'second dot credits its own value');
assert.equal(elements.get('hud-haul').textContent, '$20');
assert.equal(careerSystem.career.wallet, partialWallet + 100);
qa.end('SUIT');
assert.equal(careerSystem.career.wallet, partialWallet + 100, 'failure retains received items only');
console.log('Per-item deposit display, interruption, and retained earnings checks passed.');

// New targeted campaign missions use deposited type counts for all star tiers.
elements.get('result-menu').listeners.click();
assert.equal(elements.get('level-6').disabled, false, 'existing Level 5 completion unlocks Level 6');
assert.equal(elements.get('level-7').disabled, true);
for (const id of [6, 7]) {
  elements.get(`level-${id}`).listeners.click();
  qa.start();
  const config = qa.state.level;
  const type = config.objective.salvageType;
  const wallet = careerSystem.career.wallet;
  assert.equal(config.debris.limited.band.type, type);
  assert.match(elements.get('level-description').textContent, id === 6 ? /tool crates/ : /rocket fragments/);
  for (let i = 0; i < config.objective.target; i++) qa.collect({ type, value: 70, mass: id === 6 ? 8 : 18, size: 12 });
  qa.draw();
  assert.equal(qa.state.pendingResult, false);
  assert.equal(elements.get('goal-progress').value, 0);
  assert.match(elements.get('object-progress').textContent, /Return to bank/);
  assert.ok(!elements.get('object-progress').textContent.includes('Bonus'));
  deposit(qa.state.haul);
  assert.equal(qa.state.pendingResult, true);
  assert.equal(elements.get('goal-progress').value, config.objective.target);
  assert.ok(elements.get('star-1').classList.contains('earned'));
  qa.finishLevel();
  assert.equal(qa.state.progress.best[id], 1);
  assert.equal(careerSystem.career.wallet, wallet, 'campaign does not pay contract wallet');
  qa.start();
  deposit(config.stars[2].target);
  assert.equal(qa.state.pendingResult, false, 'money without target items cannot complete a targeted mission');
  for (let i = 0; i < config.objective.target; i++) qa.collect({ type, value: 70, mass: 8, size: 12 });
  deposit(qa.state.haul);
  qa.finishLevel();
  assert.equal(qa.state.progress.best[id], 3);
  assert.equal(vm.runInContext(`LevelSystem.readProgress().best[${id}]`, sandbox), 3);
}
assert.equal(elements.get('next-level').hidden, false);
assert.equal(elements.get('result-endless').hidden, true);
for (const [at, type] of [[150, 'TOOL'], [300, 'ROCKET']]) {
  const config = vm.runInContext(`LevelSystem.phaseFor(LevelSystem.endless, ${at})`, sandbox);
  assert.equal(config.debris.arrival.band.type, type);
  assert.ok(config.debris.bands.every(b => b.type !== type));
}
for (const name of ['tool-crate', 'rocket-fragment']) {
  assert.ok(cachedPaths.includes(`./src/art/${name}.png`));
  assert.ok(fs.existsSync(new URL(`../src/art/${name}.png`, import.meta.url)));
}
console.log('Levels 6–7, targeted stars, save compatibility, new Endless salvage, and offline assets passed.');

// Limited campaign pools circulate without multiplying or replenishing collected targets.
for (const id of [6, 7]) {
  elements.get(`level-${id}`).listeners.click();
  qa.start();
  const config = qa.state.level;
  const pool = config.debris.limited;
  const targets = qa.state.junk.filter(o => o.limited);
  assert.equal(targets.length, config.objective.target + 2);
  assert.equal(qa.state.junk.filter(o => !o.limited).length, config.debris.count);
  assert.ok(config.debris.bands.every(b => !['TOOL', 'ROCKET'].includes(b.type)), 'new types cannot randomly replenish');
  for (let i = 1; i < targets.length; i++) {
    assert.equal(targets[i].x - targets[i - 1].x, pool.spacing);
    assert.equal(targets[i].speed, targets[0].speed, 'equal speeds prevent clustering');
  }
  const firstPassEnds = (config.station.startX - (180 - 90)) / config.station.speed;
  assert.ok(targets.filter(o => (o.x - 180) / o.speed <= firstPassEnds).length < config.objective.target, 'first station pass cannot receive the whole quota');
  const missed = targets[0];
  missed.x = -41;
  qa.scenario = { player: { y: 225, velocityY: 0, flash: 0 } };
  qa.update(0);
  assert.ok(qa.state.junk.includes(missed));
  assert.equal(missed.x, -41 + pool.count * pool.spacing);
  qa.collect(missed);
  qa.fillDebris();
  assert.equal(qa.state.junk.filter(o => o.limited).length, pool.count - 1);
  for (const item of targets.slice(1)) qa.collect(item);
  qa.fillDebris();
  assert.equal(qa.state.junk.filter(o => o.limited).length, 0, 'collected targets never respawn');
  qa.start();
  assert.equal(qa.state.junk.filter(o => o.limited).length, pool.count, 'replay restores the finite pool');
}
console.log('Finite campaign salvage pools, spacing, missed-item orbits, and replay checks passed.');

function verifyRareArrivals(type, interval) {
  assert.equal(qa.state.junk.filter(o => o.scheduledSalvage).length, 0);
  qa.scenario = { elapsed: 7 };
  qa.fillDebris();
  assert.equal(qa.state.junk.filter(o => o.scheduledSalvage).length, 0, 'no opening cluster');
  qa.scenario = { elapsed: 20 };
  qa.fillDebris();
  const first = qa.state.junk.find(o => o.scheduledSalvage);
  assert.equal(first.type, type);
  qa.collect(first);
  qa.scenario = { elapsed: 20 + interval - 0.01 };
  qa.fillDebris();
  assert.equal(qa.state.junk.filter(o => o.scheduledSalvage).length, 0, 'collecting does not bypass cooldown');
  qa.scenario = { elapsed: 20 + interval };
  qa.fillDebris();
  const second = qa.state.junk.find(o => o.scheduledSalvage);
  assert.equal(second.type, type);
  qa.scenario = { elapsed: 20 + interval * 4 };
  qa.fillDebris();
  assert.equal(qa.state.junk.filter(o => o.scheduledSalvage).length, 1, 'late updates never create catch-up clusters');
  assert.equal(qa.state.junk.find(o => o.scheduledSalvage), second);
}
for (const [id, type, interval] of [['equipment-return', 'TOOL', 12], ['engine-recovery', 'ROCKET', 16]]) {
  launchContract(id);
  assert.ok(qa.state.level.debris.bands.every(b => !['TOOL', 'ROCKET'].includes(b.type)));
  verifyRareArrivals(type, interval);
  qa.start();
  assert.equal(qa.state.junk.filter(o => o.scheduledSalvage).length, 0, 'replay resets arrival timing');
}
for (const [bank, type, interval] of [[150, 'TOOL', 18], [300, 'ROCKET', 24]]) {
  elements.get('endless').listeners.click();
  deposit(bank);
  qa.resumeLevel();
  verifyRareArrivals(type, interval);
}
// An item already in flight survives a phase change and blocks another rare item.
elements.get('endless').listeners.click();
deposit(150); qa.resumeLevel();
qa.scenario = { elapsed: 20 }; qa.fillDebris();
const inFlightCrate = qa.state.junk.find(o => o.scheduledSalvage);
deposit(150);
qa.scenario = { junk: [inFlightCrate] };
qa.resumeLevel();
qa.scenario = { elapsed: 100 }; qa.fillDebris();
assert.equal(qa.state.junk.filter(o => o.scheduledSalvage).length, 1);
assert.ok(qa.state.junk.includes(inFlightCrate));
qa.collect(inFlightCrate);
qa.fillDebris();
assert.equal(qa.state.junk.filter(o => o.scheduledSalvage).length, 1);
assert.equal(qa.state.junk.find(o => o.scheduledSalvage).type, 'ROCKET');
console.log('Contract and Endless rare-item intervals, single-item caps, and phase transitions passed.');

// Force each weighted altitude zone to verify risk, reward, and safe boundaries.
const originalRandom = sandbox.Math.random;
try {
  for (const id of [6, 7]) {
    elements.get(`level-${id}`).listeners.click(); qa.start();
    const band = qa.state.level.debris.limited.band;
    for (const [roll, zoneIndex] of [[0.1, 0], [0.5, 1], [0.9, 2]]) {
      sandbox.Math.random = () => roll;
      qa.makeJunk(0, band);
      const object = qa.state.junk.at(-1);
      const zone = band.zones[zoneIndex];
      assert.ok(object.y >= zone.y[0] && object.y <= zone.y[1]);
      assert.ok(object.value >= zone.value[0] && object.value <= zone.value[1]);
      assert.equal(object.valuable, Boolean(zone.risky));
      assert.ok(object.y - object.size - 4 > qa.state.level.field.escapeY);
      assert.ok(object.y + object.size + 4 < qa.state.level.field.reentryY);
    }
    assert.ok(band.zones[0].value[0] > band.zones[1].value[1]);
    assert.ok(band.zones[2].value[0] > band.zones[1].value[1]);
  }
} finally { sandbox.Math.random = originalRandom; }
for (const id of ['equipment-return', 'engine-recovery']) {
  launchContract(id);
  assert.equal(qa.state.level.debris.arrival.band.zones.length, 3);
}
for (const at of [150, 300]) {
  assert.equal(vm.runInContext(`LevelSystem.phaseFor(LevelSystem.endless, ${at}).debris.arrival.band.zones.length`, sandbox), 3);
}
console.log('Randomized salvage altitude zones, edge rewards, safe bounds, and shared-mode configuration passed.');

// Mixed missions require every deposited component, and unlock the finale.
const collectItems = (type, count, value = 70) => {
  for (let i = 0; i < count; i++) qa.collect({ type, value, mass: 8, size: 12 });
};
elements.get('level-8').listeners.click(); qa.start();
collectItems('TOOL', 3); deposit(qa.state.haul);
assert.equal(qa.state.pendingResult, false);
collectItems('ROCKET', 2); deposit(qa.state.haul);
assert.equal(qa.state.pendingResult, true); qa.finishLevel();
assert.equal(qa.state.progress.best[8], 1);
elements.get('next-level').listeners.click();
assert.equal(qa.state.level.id, 9);
collectItems('ROCKET', 4, 130); deposit(qa.state.haul);
assert.equal(qa.state.pendingResult, false, 'rocket quota alone cannot satisfy $900');
collectItems('PANEL', 1, 380); deposit(qa.state.haul); qa.finishLevel();
assert.equal(qa.state.progress.best[9], 1);
elements.get('next-level').listeners.click();
assert.equal(qa.state.level.id, 10);
assert.match(qa.state.level.name, /1\/3/);
collectItems('TOOL', 6); deposit(qa.state.haul);
assert.equal(qa.state.pendingResult, false, 'equipment does not count as ordinary salvage');
collectItems('SCRAP', 6, 30); deposit(qa.state.haul);
assert.equal(qa.state.progress.finale.stage, 1);
assert.equal(vm.runInContext('LevelSystem.readProgress().finale.stage', sandbox), 1);
assert.equal(qa.state.progress.best[10], undefined);
const checkpointBank = qa.state.bank;
qa.finishLevel();
assert.match(qa.state.level.name, /2\/3/);
assert.equal(qa.state.bank, checkpointBank);
assert.equal(qa.state.bankedObjects, 0);
collectItems('TOOL', 1); deposit(qa.state.haul);
qa.end('SUIT'); qa.start();
assert.equal(qa.state.bank, checkpointBank, 'failed assignment earnings roll back to checkpoint');
assert.equal(qa.careerState.bankedTypes.TOOL, undefined);
assert.match(qa.state.level.name, /2\/3/);
collectItems('TOOL', 3); collectItems('ROCKET', 2); deposit(qa.state.haul);
assert.equal(qa.state.progress.finale.stage, 2);
qa.finishLevel();
assert.match(qa.state.level.name, /3\/3/);
assert.equal(qa.state.junk.filter(o => o.type === 'CAPSULE').length, 1);
const finalCheckpointBank = qa.state.bank;
qa.collect(qa.state.junk.find(o => o.type === 'CAPSULE'));
qa.end('REENTRY');
assert.match(elements.get('play-again').textContent, /RETRY ASSIGNMENT 3/);
qa.start();
assert.equal(qa.state.bank, finalCheckpointBank);
assert.equal(qa.state.junk.filter(o => o.type === 'CAPSULE').length, 1);
qa.collect(qa.state.junk.find(o => o.type === 'CAPSULE')); deposit(qa.state.haul);
const preReward = careerSystem.career.wallet;
qa.finishLevel(); qa.finishLevel();
assert.equal(elements.get('result-title').textContent, 'WORLD ONE COMPLETE');
assert.equal(careerSystem.career.wallet, preReward + 2000);
assert.equal(careerSystem.rewardWorldOne(), false);
assert.equal(qa.state.progress.finale, undefined);
assert.equal(elements.get('world-one-badge').hidden, false);
assert.equal(vm.runInContext('LevelSystem.readProgress().finale', sandbox), undefined);
assert.ok(qa.state.progress.best[10] >= 1);
qa.start(); assert.match(qa.state.level.name, /1\/3/);
// A persisted claim prevents another completion payout after reload.
const savedCareer = storage.get('orbital-cleanup-career-v1');
const reloadedReward = reloadCareer({getItem: () => savedCareer, setItem() {}});
assert.equal(reloadedReward.rewardWorldOne(), false);
assert.equal(reloadCareer({getItem: () => JSON.stringify({wallet: 100, upgrades:{reel:1,thrust:1}}), setItem(){}}).career.upgrades.deposit, 0);
// Upgrade purchases apply on launch; banking remains item-by-item at the fastest tier.
elements.get('level-1').listeners.click(); qa.start();
const priorDuration = qa.depositDuration(18);
careerSystem.credit(20000);
for (let i = 0; i < 3; i++) assert.equal(careerSystem.purchase('deposit'), true);
assert.equal(careerSystem.purchase('deposit'), false);
assert.equal(qa.depositDuration(18), priorDuration);
qa.start();
assert.equal(qa.careerState.runEffects.deposit, 0.55);
assert.ok(Math.abs(qa.depositDuration(18) - 0.132) < 0.0001);
qa.collect({type:'PANEL',value:30,mass:18,size:10});
qa.scenario = { junk: [], depositing: true, player:{y:225,velocityY:0,flash:0}, station:{x:180,y:225,speed:0} };
qa.update(0.12); assert.equal(qa.state.bank, 0);
qa.update(0.02); assert.equal(qa.state.bank, 30);
assert.equal(elements.get('hud-bank').textContent, '$30');
assert.ok(cachedPaths.includes('./src/art/survey-capsule.png'));
console.log('v0.13 mixed objectives, finale checkpoints/retries, one-time reward, badge, replay, and deposit upgrade passed.');
for (const launch of [() => launchContract('first-shift'), () => elements.get('endless').listeners.click()]) {
  launch();
  assert.equal(qa.careerState.runEffects.deposit, 0.55, 'Deposit Speed applies across game modes');
}
for (const [id, types, target] of [[8, {TOOL:3,ROCKET:2}, 1200], [9, {ROCKET:4}, 1800]]) {
  assert.equal(vm.runInContext(`LevelSystem.rating(LevelSystem.campaign[${id - 1}], {bank:${target},bankedTypes:${JSON.stringify(types)}})`, sandbox), 3);
  assert.equal(vm.runInContext(`LevelSystem.rating(LevelSystem.campaign[${id - 1}], {bank:${target},bankedTypes:{}})`, sandbox), 0);
}
