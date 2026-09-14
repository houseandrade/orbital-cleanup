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
    get innerHTML() { return this.html || ""; },
    set innerHTML(value) {
      this.html = value;
      for (const match of value.matchAll(/id="([^"]+)"/g)) elements.set(match[1], makeElement(match[1]));
    },
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
      toggle: (name, force) => force ? classes.add(name) : classes.delete(name)
    },
    focus() {},
    setAttribute() {},
    removeAttribute() {},
    insertAdjacentElement() {},
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
    ContractSystem, refreshCareer, scannerNeeded, momentumWarning,
    get careerState() { return { carriedTypes, bankedTypes, contractBonus, contractCompleted, runEffects }; },
    hudObjectiveRows, updateHud, depositDuration, makeJunk, fillDebris, scheduleEncounter, collect, draw, stationMessage, start, end, finishLevel, resumeLevel, update, fireTether, collide, thrustEffectiveness,
    get state() { return { phase, queuedPhase, nextStation, elapsed, carriedObjects, bankedObjects, level, progress, pendingResult, running, haul, bank, mass, integrity, tether, junk, player, station, depositing, cargo }; },
    set scenario(value) {
      if (value.thrusting !== undefined) thrusting = value.thrusting;
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
assert.equal(elements.get('completed-contract-first-shift').hidden, true, 'unfinished jobs have no completion badge');
assert.equal(elements.get('select-contract-first-shift').classList.contains('contract-completed'), false);
function leaveRun() {
  const confirming = elements.get('exit-title').textContent === 'Run paused';
  elements.get('leave-run').listeners.click();
  if (confirming) elements.get('leave-run').listeners.click();
}

assert.equal(elements.get('title-screen').hidden,false,'fresh launch offers the title screen');
elements.get('choose-world').listeners.click();
assert.equal(elements.get('title-screen').hidden,true,'Choose World dismisses the title');
assert.equal(elements.get('mode-menu').hidden,false);

assert.equal(elements.get('endless').disabled, false, 'endless is available on a fresh save');
assert.equal(elements.get('level-2').disabled, true, 'campaign unlocks remain separate');
elements.get('choose-contracts').listeners.click();
elements.get('next-contract-world').listeners.click();
assert.equal(elements.get('select-contract-moon-tank-return').disabled,true);
const freshLevelId=qa.state.level.id;
elements.get('contract-moon-tank-return').listeners.click();
assert.equal(qa.state.level.id,freshLevelId,'locked Moon contract cannot launch');
elements.get('previous-contract-world').listeners.click();
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
advanceThroughBriefing();
assert.equal(qa.state.level.id, 2);
assert.equal(qa.state.junk.length, 8);
deposit(150);
qa.finishLevel();
assert.equal(qa.state.progress.best[2], 1, 'one star unlocks next level');
advanceThroughBriefing();
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
leaveRun();
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
assert.equal(qa.stationMessage(), 'STATION WINDOW IN 16s');
qa.scenario = { station: { x: 390, y: 225, speed: 25 } };
assert.equal(qa.stationMessage(), 'STATION WINDOW IN 5s');
qa.scenario = { station: { x: 180, y: 225, speed: 25 } };
assert.equal(qa.stationMessage(), 'IN RANGE · HOLD DEPOSIT');
qa.scenario = { station: { x: 40, y: 225, speed: 25 } };
assert.match(qa.stationMessage(), /^STATION RETURNS IN/);
qa.scenario = { station: { x: -47, y: 225, speed: 25 } };
assert.match(qa.stationMessage(), /^STATION RETURNS IN/);
elements.get('campaign').listeners.click();
elements.get('restart').listeners.click();
assert.equal(elements.get('leave-run').textContent, 'CONFIRM RESTART');
assert.equal(qa.state.running, false, 'restart asks while paused');
elements.get('keep-playing').listeners.click();
assert.equal(qa.state.running, true, 'restart can be canceled');
elements.get('campaign').listeners.click();
elements.get('restart').listeners.click();
leaveRun();
assert.equal(qa.state.running, true, 'confirmed restart resumes a fresh run');
elements.get('campaign').listeners.click();
leaveRun();
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
advanceThroughBriefing();
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
assert.equal(qa.stationMessage(), `STATION WINDOW IN ${Math.ceil((queuedStation.x - 270) / 25)}s`);
elements.get('campaign').listeners.click();
const pausedTime = qa.state.elapsed;
const pausedCountdown = qa.stationMessage();
qa.update(10);
assert.equal(qa.state.elapsed, pausedTime);
assert.equal(qa.stationMessage(), pausedCountdown);
elements.get('keep-playing').listeners.click();
qa.scenario = { station: { x:180, y:190, speed:25 }, player:{y:300,velocityY:0,flash:0} };
assert.equal(qa.stationMessage(), 'STATION IN RANGE · ALIGN ALTITUDE');

// Recovery pockets stay compact at a shared speed and replenish as a group.
elements.get('campaign').listeners.click();
leaveRun();
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
leaveRun();
elements.get('level-5').listeners.click();
qa.start();
function checkEncounter() {
  const targets = qa.state.junk.filter(o=>o.encounter);
  assert.equal(targets.length, 1);
  const target = targets[0];
  assert.ok(Math.abs((target.x - 180) / target.speed - ((qa.state.station.x - 270) / 25 - 4)) < 1e-8);
  assert.ok(target.value >= 150 && target.value <= 200);
  assert.ok((target.y >= 105 && target.y <= 120) || (target.y >= 322 && target.y <= 334));
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
leaveRun();
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
assert.ok(qa.state.junk.every(o=>o.mass === 2));
assert.ok(qa.state.junk.some(o=>o.y<=120) && qa.state.junk.some(o=>o.y>=322));
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
for (const config of vm.runInContext('LevelSystem.campaign.filter(c => c.world === 1)', sandbox)) {
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
for (const contract of careerSystem.contracts.filter(c => c.world === 1)) {
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
  assert.equal(elements.get(`completed-contract-${contract.id}`).hidden, false);
  assert.equal(elements.get(`select-contract-${contract.id}`).classList.contains('contract-completed'), true);
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
advanceThroughBriefing();
assert.equal(qa.state.level.id, 9);
collectItems('ROCKET', 4, 130); deposit(qa.state.haul);
assert.equal(qa.state.pendingResult, false, 'rocket quota alone cannot satisfy $900');
collectItems('PANEL', 1, 380); deposit(qa.state.haul); qa.finishLevel();
assert.equal(qa.state.progress.best[9], 1);
advanceThroughBriefing();
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
const finalCapsule = qa.state.junk.find(o => o.type === 'CAPSULE');
assert.equal(finalCapsule.x, 1200);
assert.equal((finalCapsule.x - 360) / finalCapsule.speed, 28, 'capsule enters view after 28 seconds');
assert.ok((finalCapsule.x - 180 - 82) / finalCapsule.speed > (qa.state.station.x - 90) / qa.state.station.speed, 'capsule cannot be tethered during first station pass');
assert.ok(finalCapsule.y <= 110 || finalCapsule.y >= 325, 'capsule stays near an orbit boundary');
assert.equal(finalCapsule.valuable, true);
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

const capsuleBand = vm.runInContext('LevelSystem.campaign[9].assignments[2].debris.limited.band', sandbox);
const capsuleRandom = sandbox.Math.random;
try {
  for (const value of [0.1, 0.9]) {
    sandbox.Math.random = () => value;
    qa.makeJunk(840, capsuleBand);
    const item = qa.state.junk.at(-1);
    assert.ok(value < 0.5 ? item.y >= 98 && item.y <= 110 : item.y >= 325 && item.y <= 336);
    assert.ok(item.y - item.size - 4 > 75 && item.y + item.size + 4 < 360, 'boundary approach is risky but reachable');
  }
} finally { sandbox.Math.random = capsuleRandom; }
console.log('Delayed capsule arrival and upper/lower boundary placement passed.');
for (const config of vm.runInContext('LevelSystem.campaign.slice(5, 10)', sandbox)) {
  for (const debris of [config.debris, ...(config.assignments || []).map(a => a.debris)]) {
    const satellite = debris.bands.find(b => b.type === 'SAT');
    assert.equal(satellite.maxActive, 2);
    assert.equal(satellite.zones.length, 3);
  }
}
elements.get('level-6').listeners.click(); qa.start();
qa.scenario = {junk: []};
const savedSatelliteRandom = sandbox.Math.random;
try {
  sandbox.Math.random = () => 0.99;
  for (let i = 0; i < 5; i++) qa.makeJunk(i * 110);
  assert.equal(qa.state.junk.filter(o => o.type === 'SAT').length, 2, 'satellite variety cannot form a large cluster');
  qa.collect(qa.state.junk.find(o => o.type === 'SAT'));
  assert.equal(qa.state.junk.filter(o => o.type === 'SAT').length, 2, 'satellites remain available after collection');
} finally { sandbox.Math.random = savedSatelliteRandom; }
console.log('Late-campaign satellite altitude variety and active-count cap passed.');

// Moon access requires World One, while both world pages remain browsable.
qa.scenario = {running: false};
elements.get('over-menu').listeners.click();
const earthStars = qa.state.progress.best[10];
delete qa.state.progress.best[10];
elements.get('choose-campaign').listeners.click();
elements.get('next-world').listeners.click();
assert.match(elements.get('world-name').textContent, /MOON/);
assert.equal(elements.get('level-1').hidden, true);
assert.equal(elements.get('level-11').hidden, false);
assert.equal(elements.get('level-11').disabled, true);
assert.equal(elements.get('mission-briefing').hidden, true);
const beforeLockedClick = qa.state.level.id;
elements.get('level-11').listeners.click();
assert.equal(qa.state.level.id, beforeLockedClick);
qa.state.progress.best[10] = earthStars;
elements.get('previous-world').listeners.click();
elements.get('next-world').listeners.click();
assert.equal(elements.get('level-11').disabled, false);
assert.equal(elements.get('mission-briefing').hidden, false);
assert.equal(vm.runInContext('LevelSystem.readProgress().selectedWorld', sandbox), 2);
const walletBeforeMoon = careerSystem.career.wallet;
elements.get('level-11').listeners.click(); qa.start();
assert.equal(qa.state.level.world, 2);
assert.equal(qa.careerState.runEffects.deposit, 0.55);
qa.collect({type:'PANEL',value:200,mass:5,size:10}); deposit(200);
assert.equal(qa.state.pendingResult, true);
qa.finishLevel();
assert.equal(qa.state.progress.best[11], 1);
assert.equal(elements.get('level-12').disabled, false);
advanceThroughBriefing();
assert.equal(qa.state.level.id, 12);
const wheels = qa.state.junk.filter(item => item.type === 'WHEEL');
assert.equal(wheels.length, 7);
assert.equal(wheels[1].x - wheels[0].x, 420);
assert.ok(wheels.every(item => item.y - item.size - 4 > 75 && item.y + item.size + 4 < 360));
for (let i = 0; i < 5; i++) qa.collect({type:'PANEL',value:70,mass:5,size:10});
deposit(350);
assert.equal(qa.state.pendingResult, false, 'ordinary salvage cannot satisfy the wheel quota');
qa.scenario = {junk: wheels};
for (const wheel of wheels.slice(0,5)) qa.collect(wheel);
assert.equal(qa.state.junk.filter(item => item.type === 'WHEEL').length, 2, 'collected wheels do not replenish');
deposit(350);
assert.equal(qa.state.pendingResult, true);
qa.finishLevel();
assert.ok(qa.state.progress.best[12] >= 1);
advanceThroughBriefing();
assert.equal(qa.state.level.id, 13);
assert.equal(qa.state.junk.filter(item => item.type === 'TANK').length, 2);
for (const item of qa.state.junk.filter(item => item.type === 'TANK')) qa.collect(item);
assert.equal(qa.state.junk.filter(item => item.type === 'TANK').length, 2, 'a cleared tank pocket replenishes');
qa.start();
for (let trip = 0; trip < 2; trip++) {
  for (let i = 0; i < 4; i++) qa.collect({type:'TANK',value:40,mass:4,size:10});
  deposit(160);
  assert.equal(qa.state.pendingResult, trip === 1, 'tank quota accumulates across deposits');
}
qa.finishLevel();
assert.equal(elements.get('next-level').hidden, false);
assert.equal(elements.get('level-14').disabled, false);
assert.equal(elements.get('result-title').textContent, 'LEVEL COMPLETE');
assert.equal(careerSystem.career.wallet, walletBeforeMoon, 'Moon prototype gives no extra World One reward or contract pay');
qa.start();
qa.scenario = {player:{y:361,velocityY:0,flash:0}, junk:[]}; qa.update(0.01);
assert.equal(elements.get('death').textContent, 'SURFACE IMPACT');
elements.get('over-menu').listeners.click();
elements.get('choose-campaign').listeners.click();
elements.get('previous-world').listeners.click();
assert.equal(elements.get('level-1').hidden, false);
assert.equal(elements.get('level-11').hidden, true);
const moonSave = storage.get('orbital-cleanup-progress-v1');
storage.set('orbital-cleanup-progress-v1', JSON.stringify({currentLevel: 11, best:{1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1,10:1}}));
assert.equal(vm.runInContext('LevelSystem.readProgress().selectedWorld', sandbox), 2, 'older saves infer world from current mission');
storage.set('orbital-cleanup-progress-v1', moonSave);
for (const asset of ['moon-background', 'rover-wheel', 'oxygen-tank']) assert.ok(cachedPaths.includes(`./src/art/lunar/${asset}.png`));
console.log('Moon world navigation, unlocks, saves, objectives, finite wheels, recurring tank pockets, upgrades, rewards, and surface failure passed.');

// Lunar recovery missions preserve sparse World One-style mission target pacing.
elements.get('next-world').listeners.click();
const newMoonWallet = careerSystem.career.wallet;
for (const [id, type, gap, expectedMass] of [[14, 'INSTRUMENT', 420, 6], [15, 'LEG', 480, 18]]) {
  assert.equal(elements.get(`level-${id}`).disabled, false);
  elements.get(`level-${id}`).listeners.click(); qa.start();
  const config = qa.state.level;
  const targets = qa.state.junk.filter(item => item.type === type);
  assert.equal(config.debris.count, 5);
  assert.equal(config.debris.bands.find(b => b.type === 'SAT').maxActive, 2);
  assert.equal(targets.length, 5, 'quota plus two spare targets');
  assert.equal(targets[1].x - targets[0].x, gap);
  assert.equal(targets[0].speed, 30);
  assert.equal(targets[0].mass, expectedMass);
  assert.ok(targets.some(item => item.y <= 120) && targets.some(item => item.y >= 322));
  assert.ok(targets.every(item => item.y - item.size - 4 > 75 && item.y + item.size + 4 < 360));
  assert.equal(config.debris.bands.some(b => b.type === type), false, 'no random target clusters');
  qa.scenario = {junk: [targets[0]], player:{y:225,velocityY:0,flash:0}};
  targets[0].x = -41;
  qa.update(0);
  assert.equal(qa.state.junk.filter(item => item.type === type).length, 1);
  assert.equal(targets[0].x, -41 + 5 * gap, 'missed target loops at its original spacing');
  qa.start();
  for (let i = 0; i < 3; i++) qa.collect({type:'PANEL',value:100,mass:5,size:10});
  deposit(300);
  assert.equal(qa.state.pendingResult, false, 'value alone cannot satisfy targeted recovery');
  qa.start();
  const target = qa.state.junk.find(item => item.type === type);
  qa.collect(target);
  assert.equal(qa.state.junk.filter(item => item.type === type).length, 4);
  qa.end('SUIT');
  assert.equal(qa.state.progress.best[id], undefined, 'lost cargo grants no completion');
  qa.start();
  assert.equal(qa.state.junk.filter(item => item.type === type).length, 5, 'retry restores finite target pool');
  for (let i = 0; i < 3; i++) {
    qa.collect({type,value:150,mass:expectedMass,size:12});
    deposit(150);
    assert.equal(qa.state.pendingResult, i === 2, 'target quota accumulates across trips');
  }
  qa.finishLevel();
  assert.equal(qa.state.progress.best[id], 1);
  assert.equal(elements.get(`level-${id+1}`).disabled, false);
  assert.equal(vm.runInContext(`LevelSystem.readProgress().best[${id}]`, sandbox), 1);
  assert.equal(vm.runInContext(`LevelSystem.rating(LevelSystem.campaign[${id-1}],{bank:9999,bankedTypes:{}})`, sandbox), 0);
  assert.equal(vm.runInContext(`LevelSystem.rating(LevelSystem.campaign[${id-1}],{bank:9999,bankedTypes:{${type}:3}})`, sandbox), 3);
}
elements.get('level-16').listeners.click(); qa.start();
assert.equal(qa.state.level.debris.count, 5);
const deliveryWheels = qa.state.junk.filter(item => item.type === 'WHEEL');
const deliveryCrates = qa.state.junk.filter(item => item.type === 'TOOL');
assert.equal(deliveryWheels.length, 5);
assert.equal(deliveryCrates.length, 4);
assert.equal(deliveryCrates[0].x - deliveryWheels[0].x, 240, 'mixed targets stagger by eight seconds');
assert.equal(deliveryWheels[1].x - deliveryWheels[0].x, 480);
assert.equal(deliveryCrates[1].x - deliveryCrates[0].x, 480);
for (let i = 0; i < 3; i++) qa.collect({type:'WHEEL',value:75,mass:7,size:12});
deposit(225);
assert.equal(qa.state.pendingResult, false, 'wheels alone do not complete the workshop order');
for (let i = 0; i < 2; i++) qa.collect({type:'TOOL',value:75,mass:8,size:12});
deposit(150);
assert.equal(qa.state.pendingResult, true);
qa.finishLevel();
assert.equal(qa.state.progress.best[16], 1);
assert.equal(elements.get('next-level').hidden, false);
assert.equal(elements.get('level-17').disabled, false);
assert.equal(elements.get('result-title').textContent, 'LEVEL COMPLETE');
assert.equal(careerSystem.career.wallet, newMoonWallet, 'no premature world reward');
assert.match(elements.get('world-note').textContent, /Ten Moon missions available/);
assert.doesNotMatch(elements.get('world-note').textContent, /coming later/);
for (const type of ['instrument-package','lander-leg']) assert.ok(cachedPaths.includes(`./src/art/lunar/${type}.png`));
console.log('Moon 4–6 density, spaced finite pools, missed targets, failure/retry, multi-trip quotas, mixed delivery, save progression, and star gating passed.');

// Off Course: gentle bounded motion, with the same target position in the tether.
advanceThroughBriefing();
assert.equal(qa.state.level.id, 17);
assert.equal(qa.state.junk.filter(item => item.drift).length, 5);
assert.equal(qa.state.level.debris.count, 5);
assert.equal(qa.state.level.debris.bands.some(b => b.drift), false);
const drifting = qa.state.junk.find(item => item.drift);
Object.assign(drifting, {x:340,y:225,speed:0,driftDirection:1});
qa.scenario = {junk:[drifting],player:{y:225,velocityY:0,flash:0}};
qa.update(0.1);
assert.ok(Math.abs(drifting.y - 225.7) < 0.001);
for (let i = 0; i < 600; i++) {
  qa.scenario = {player:{y:225,velocityY:0,flash:0}};
  qa.update(0.1);
  assert.ok(drifting.y >= 140 && drifting.y <= 300);
  assert.ok(drifting.y - drifting.size > 75 && drifting.y + drifting.size < 360);
}
Object.assign(drifting, {x:261,y:237,wobble:Math.PI/2});
qa.scenario = {junk:[drifting],player:{y:225,velocityY:0,flash:0}};
qa.fireTether();
assert.equal(qa.state.tether.object, drifting, 'acquisition uses actual drift altitude, not decorative wobble');
assert.equal(qa.state.tether.startY, 237);
qa.update(0.1);
const releasedY = drifting.y;
qa.fireTether();
qa.update(0.01);
assert.ok(Math.abs(drifting.y - releasedY) <= 0.071, 'cancel resumes drift without snapping');
Object.assign(drifting, {x:340,y:320,speed:0});
qa.scenario = {junk:[drifting],player:{y:225,velocityY:0,flash:0}};
qa.update(0.1);
assert.ok(Math.abs(drifting.y - 319.3) < 0.001, 'a target pulled outside its band drifts inward smoothly');
qa.start();
for (let i = 0; i < 3; i++) qa.collect({type:'INSTRUMENT',value:120,mass:6,size:12});
deposit(360); qa.finishLevel();
assert.equal(qa.state.progress.best[17], 1);
assert.equal(elements.get('level-18').disabled, false);

// Catch the Window: one recurring pass-aligned target, six recoveries maximum.
advanceThroughBriefing();
assert.equal(qa.state.level.id, 18);
assert.equal(qa.state.junk.filter(item => item.encounter).length, 1);
assert.equal(qa.state.junk.filter(item => !item.encounter).length, 5);
let timed = qa.state.junk.find(item => item.encounter);
const secondsToStation = (qa.state.station.x - 270) / qa.state.station.speed;
assert.ok(Math.abs(secondsToStation - (timed.x - 180)/timed.speed - 4) < 0.0001);
assert.equal(timed.drift, undefined, 'timing challenge does not also introduce drift');
qa.scenario = {junk:[timed],player:{y:225,velocityY:0,flash:0},station:{x:-71,y:225,speed:25}};
qa.update(0);
timed = qa.state.junk.find(item => item.encounter);
assert.equal(qa.state.junk.filter(item => item.encounter).length, 1, 'missed target returns without stacking');
assert.ok(Math.abs((qa.state.station.x - 270)/25 - (timed.x - 180)/timed.speed - 4) < 0.0001);
for (let i = 0; i < 6; i++) {
  qa.collect(qa.state.junk.find(item => item.encounter));
  qa.scenario = {player:{y:225,velocityY:0,flash:0},station:{x:-71,y:225,speed:25}};
  qa.update(0);
  assert.equal(qa.state.junk.filter(item => item.encounter).length, i < 5 ? 1 : 0);
}
qa.start();
assert.equal(qa.state.junk.filter(item => item.encounter).length, 1, 'replay restores the scheduled pool');
for (let trip = 0; trip < 2; trip++) {
  for (let i=0;i<2;i++) qa.collect({type:'INSTRUMENT',value:120,mass:6,size:12});
  deposit(240);
  assert.equal(qa.state.pendingResult, trip === 1);
}
qa.finishLevel();
assert.equal(qa.state.progress.best[18], 1);
assert.equal(elements.get('level-19').disabled, false);

// Heavy Recovery keeps staggered finite pools and both quotas behind completion.
advanceThroughBriefing();
assert.equal(qa.state.level.id, 19);
const heavyLegs = qa.state.junk.filter(item => item.type === 'LEG');
const heavyRockets = qa.state.junk.filter(item => item.type === 'ROCKET');
assert.equal(heavyLegs.length, 5); assert.equal(heavyRockets.length, 4);
assert.equal(heavyRockets[0].x-heavyLegs[0].x,240);
assert.equal(heavyLegs[1].x-heavyLegs[0].x,480);
assert.equal(heavyRockets[1].x-heavyRockets[0].x,480);
assert.ok([...heavyLegs,...heavyRockets].every(item=>item.mass===18));
assert.equal(qa.state.level.debris.count, 5);
for(let i=0;i<3;i++) qa.collect({type:'LEG',value:170,mass:18,size:15});
deposit(510); assert.equal(qa.state.pendingResult,false);
for(let i=0;i<2;i++) qa.collect({type:'ROCKET',value:150,mass:18,size:16});
deposit(300); assert.equal(qa.state.pendingResult,true);
qa.finishLevel();
assert.equal(qa.state.progress.best[19],1);
assert.equal(elements.get('next-level').hidden,false);
assert.equal(elements.get('level-20').disabled,false);
assert.equal(elements.get('result-title').textContent,'LEVEL COMPLETE');
assert.equal(careerSystem.career.wallet,newMoonWallet,'no world reward before the finale');
assert.match(elements.get('world-note').textContent,/Ten Moon missions available/);
for(const [id,type,count] of [[17,'INSTRUMENT',3],[18,'INSTRUMENT',4]]) {
  assert.equal(vm.runInContext(`LevelSystem.rating(LevelSystem.campaign[${id-1}],{bank:9999,bankedTypes:{${type}:${count-1}}})`,sandbox),0);
  assert.equal(vm.runInContext(`LevelSystem.rating(LevelSystem.campaign[${id-1}],{bank:9999,bankedTypes:{${type}:${count}}})`,sandbox),3);
}
assert.equal(vm.runInContext('LevelSystem.rating(LevelSystem.campaign[18],{bank:9999,bankedTypes:{LEG:3}})',sandbox),0);
assert.equal(vm.runInContext('LevelSystem.rating(LevelSystem.campaign[18],{bank:9999,bankedTypes:{LEG:3,ROCKET:2}})',sandbox),3);
console.log('Moon 7–9 bounded drift, tether alignment/cancel, station timing, recovery cap, mixed heavy quotas, progression, and final-mission boundary passed.');

// Moon finale preserves independent Earth checkpoints, finite density, and completion rewards.
qa.state.progress.finale = { stage: 1, bank: 420 };
elements.get('level-20').listeners.click(); qa.start();
assert.equal(qa.state.level.world, 2);
assert.match(qa.state.level.name, /Last Rover · 1\/3/);
assert.equal(qa.state.bank, 0, 'Earth checkpoint must not seed the Moon');
assert.equal(qa.state.level.debris.count, 5);
assert.equal(qa.state.junk.filter(o => o.type === 'TANK').length, 8);
assert.equal(qa.state.junk.filter(o => o.type === 'WHEEL').length, 5);
const finaleTanks = qa.state.junk.filter(o => o.type === 'TANK');
const finaleWheels = qa.state.junk.filter(o => o.type === 'WHEEL');
assert.equal(finaleTanks[1].x - finaleTanks[0].x, 360);
assert.equal(finaleWheels[1].x - finaleWheels[0].x, 720);
assert.equal(finaleWheels[0].x - finaleTanks[0].x, 180);
assert.ok(qa.state.junk.filter(o => o.type === 'SAT').length <= 2);
collectItems('TANK', 6, 40); deposit(qa.state.haul);
assert.equal(qa.state.pendingResult, false);
collectItems('WHEEL', 3, 75); deposit(qa.state.haul);
assert.equal(qa.state.progress.moonFinale.stage, 1);
assert.equal(vm.runInContext('LevelSystem.readProgress().moonFinale.stage', sandbox), 1);
assert.equal(vm.runInContext('LevelSystem.readProgress().finale.bank', sandbox), 420);
const moonCheckpoint = qa.state.bank;
qa.finishLevel();
assert.match(qa.state.level.name, /Last Rover · 2\/3/);
assert.equal(qa.state.junk.filter(o => o.type === 'LEG').length, 4);
assert.equal(qa.state.junk.filter(o => o.type === 'INSTRUMENT').length, 4);
collectItems('LEG', 1, 170); deposit(qa.state.haul);
qa.end('SUIT'); qa.start();
assert.equal(qa.state.bank, moonCheckpoint);
assert.equal(qa.state.bankedObjects, 0);
// Switching worlds must resume the appropriate assignment, without erasing either checkpoint.
elements.get('level-10').listeners.click(); qa.start();
assert.match(qa.state.level.name, /Final Sweep · 2\/3/);
assert.equal(qa.state.bank, 420);
elements.get('level-20').listeners.click(); qa.start();
assert.match(qa.state.level.name, /Last Rover · 2\/3/);
assert.equal(qa.state.bank, moonCheckpoint);
collectItems('LEG', 2, 170); deposit(qa.state.haul);
assert.equal(qa.state.pendingResult, false);
collectItems('INSTRUMENT', 2, 125); deposit(qa.state.haul);
assert.equal(qa.state.progress.moonFinale.stage, 2);
qa.finishLevel();
assert.match(qa.state.level.name, /Last Rover · 3\/3/);
const roverCheckpoint = qa.state.bank;
let rover = qa.state.junk.find(o => o.type === 'ROVER');
assert.ok(rover); assert.equal(rover.mass, 22);
assert.equal(qa.state.junk.filter(o => o.type === 'ROVER').length, 1);
assert.ok((rover.x - 180 - 82) / rover.speed > (qa.state.station.x - 90) / qa.state.station.speed);
rover.x = -50; qa.update(.01);
assert.ok(rover.x > 360, 'missed rover returns');
// Standard gear can reel in the rover with the normal tether.
Object.assign(qa.careerState.runEffects, {reel:1,thrust:1,deposit:1});
rover.x = 220; rover.y = 225;
qa.scenario = {player: {y:225,velocityY:0,flash:0}, junk:[rover]};
qa.fireTether(); assert.ok(qa.state.tether);
assert.equal(qa.state.tether.duration, 1.1);
qa.update(3);
assert.equal(qa.state.haul, 450);
qa.end('REENTRY'); qa.start();
assert.equal(qa.state.bank, roverCheckpoint);
assert.equal(qa.state.junk.filter(o => o.type === 'ROVER').length, 1, 'retry restores lost rover');
qa.collect(qa.state.junk.find(o => o.type === 'ROVER'));
deposit(qa.state.haul);
const beforeMoonReward = careerSystem.career.wallet;
qa.finishLevel(); qa.finishLevel();
assert.equal(elements.get('result-title').textContent, 'WORLD TWO COMPLETE');
assert.match(elements.get('result-stats').textContent, /Lunar rover secured/);
assert.equal(careerSystem.career.wallet, beforeMoonReward + 2000);
assert.equal(careerSystem.career.worldTwoReward, true);
assert.equal(careerSystem.career.worldOneReward, true);
assert.equal(qa.state.progress.moonFinale, undefined);
assert.equal(qa.state.progress.finale.bank, 420, 'Moon completion preserves Earth replay checkpoint');
assert.equal(elements.get('world-two-badge').hidden, false);
assert.equal(elements.get('next-level').hidden, false);
assert.equal(elements.get('next-level').textContent, 'CONTINUE TO MARS');
assert.ok(qa.state.progress.best[20] >= 1);
qa.start(); assert.match(qa.state.level.name, /Last Rover · 1\/3/);
const moonRewardReload = reloadCareer({getItem: () => storage.get('orbital-cleanup-career-v1'), setItem(){}});
assert.equal(moonRewardReload.rewardWorld(2), false);
assert.equal(moonRewardReload.rewardWorld(4), false);
assert.equal(careerSystem.rewardWorld(2), false);
assert.equal(vm.runInContext("LevelSystem.criterionLabel({type:'bank_type',salvageType:'ROVER',target:1})", sandbox), '1 rover chassis');
assert.ok(fs.readFileSync(new URL('../service-worker.js', import.meta.url),'utf8').includes('./src/art/lunar/rover-chassis.png'));
console.log('Moon finale mixed quotas, density, world-isolated checkpoints, rover tether/retry, badge, and one-time reward passed.');

// Moon contract board retains sorted difficulty, world filtering, and isolated campaign progress.
qa.state.progress.activeWorld=1; delete qa.state.progress.destinationWorld;
const lunarJobs = careerSystem.contracts.filter(c => c.world === 2);
assert.equal(lunarJobs.length, 6);
const earthScoresBeforeModes = JSON.stringify(qa.state.progress.best);
elements.get('choose-contracts').listeners.click();
elements.get('next-contract-world').listeners.click();
assert.equal(elements.get('contract-world-name').textContent, 'MOON CONTRACTS');
assert.equal(elements.get('contract-card-first-shift').hidden, true);
assert.equal(elements.get(`contract-card-${lunarJobs[0].id}`).hidden, false);
const boardOrder = [...elements.keys()].filter(id => id.startsWith('select-contract-moon-'));
assert.deepEqual(boardOrder.map(id => lunarJobs.find(c => `select-contract-${c.id}`===id).difficulty), ['Easy','Easy','Medium','Medium','Hard','Hard']);
for (const contract of lunarJobs) {
  elements.get(`select-contract-${contract.id}`).listeners.click();
  assert.equal(elements.get(`contract-briefing-${contract.id}`).hidden, false);
  for (const other of lunarJobs.filter(c=>c!==contract)) assert.equal(elements.get(`contract-briefing-${other.id}`).hidden,true);
  launchContract(contract.id);
  assert.equal(qa.state.level.world,2);
  assert.equal(qa.state.level.debris.count,5);
  assert.ok(qa.state.junk.filter(o=>o.type==='SAT').length<=2);
  if(contract.debris.limited) {
    const targets=qa.state.junk.filter(o=>o.type===contract.objective.salvageType);
    assert.equal(targets.length,contract.objective.target+2);
    assert.equal(targets[1].x-targets[0].x,contract.debris.limited.spacing);
    targets[0].x=-50; qa.update(.01); assert.ok(targets[0].x>360);
  }
  const priorWallet=careerSystem.career.wallet;
  const type=contract.objective.salvageType||'WHEEL';
  collectItems(type,contract.objective.type==='bank_value'?1:contract.objective.target,contract.objective.type==='bank_value'?1800:40);
  const haul=qa.state.haul;
  assert.equal(qa.state.pendingResult,false);
  deposit(haul); assert.equal(qa.state.pendingResult,true);
  assert.equal(careerSystem.career.wallet,priorWallet+haul+contract.bonus);
  qa.resumeLevel(); collectItems('SCRAP',1,20); deposit(20);
  assert.equal(careerSystem.career.wallet,priorWallet+haul+contract.bonus+20,'bonus only once per run');
  qa.end('REENTRY');
  assert.equal(elements.get('death').textContent,'SURFACE IMPACT');
  assert.equal(careerSystem.career.completed.includes(contract.id),true);
}
assert.equal(JSON.stringify(qa.state.progress.best),earthScoresBeforeModes);
assert.equal(qa.state.progress.activeWorld,1,'Moon contract browsing and play do not advance the active campaign world');
assert.equal(reloadCareer(sandbox.localStorage).career.completed.filter(id=>id.startsWith('moon-')).length,6);

// Migration infers established lunar progression, but explicit active world is independent of browsing.
const modeSave = storage.get('orbital-cleanup-progress-v1');
function migratedWorld(value) {
  storage.set('orbital-cleanup-progress-v1', JSON.stringify(value));
  return vm.runInContext('LevelSystem.readProgress().activeWorld', sandbox);
}
const earthComplete = Object.fromEntries(Array.from({length:10},(_,i)=>[i+1,1]));
assert.equal(migratedWorld({currentLevel:1,best:{}}),1);
assert.equal(migratedWorld({currentLevel:11,best:earthComplete}),2,'old Moon save migrates');
assert.equal(migratedWorld({currentLevel:11,best:earthComplete,activeWorld:1}),1,'browsing a Moon mission does not change explicit active world');
assert.equal(migratedWorld({currentLevel:1,best:{...earthComplete,11:1}}),2,'legacy Earth replay keeps established Moon progression');
assert.equal(migratedWorld({currentLevel:1,best:{},activeWorld:2}),1,'locked world cannot become active');
storage.set('orbital-cleanup-progress-v1', modeSave);
qa.state.progress.activeWorld=1; delete qa.state.progress.destinationWorld;
elements.get('level-11').listeners.click();
assert.equal(qa.state.progress.activeWorld,1);
qa.start(); assert.equal(qa.state.progress.activeWorld,2);
elements.get('level-1').listeners.click(); qa.start();
assert.equal(qa.state.progress.activeWorld,2,'Earth replay does not reset active world');
assert.equal(elements.get('endless-destination').textContent,'MOON');
const earthEndlessBefore=storage.get('orbital-cleanup-endless-best-v1');
const walletBeforeEndless=careerSystem.career.wallet;
elements.get('endless').listeners.click();
assert.equal(qa.state.level.world,2);
assert.equal(qa.state.level.id,'endless');
assert.equal(qa.state.phase.name,'Lunar salvage');
assert.ok(qa.state.junk.every(o=>o.type!=='ROVER'));
collectItems('SCRAP',5,30); deposit(150);
assert.equal(qa.state.queuedPhase.name,'Workshop spares');
qa.resumeLevel();
qa.scenario={elapsed:100,junk:[]}; qa.fillDebris();
assert.ok(qa.state.junk.some(o=>o.type==='WHEEL'));
assert.ok(qa.state.junk.some(o=>o.type==='TANK'));
assert.ok(qa.state.junk.length<=5);
collectItems('SCRAP',5,30); deposit(150); qa.resumeLevel();
assert.equal(qa.state.phase.name,'Research recovery');
qa.scenario={elapsed:200,junk:[]};qa.fillDebris();
assert.equal(qa.state.junk.filter(o=>o.type==='INSTRUMENT').length,1);
qa.fillDebris();assert.equal(qa.state.junk.filter(o=>o.scheduledSalvage).length,1);
collectItems('SCRAP',5,40);deposit(200);qa.resumeLevel();
assert.equal(qa.state.phase.name,'Lander salvage');
qa.scenario={elapsed:300,junk:[]};qa.fillDebris();
assert.equal(qa.state.junk.filter(o=>o.type==='LEG').length,1);
assert.ok(qa.state.junk.length<=5);
collectItems('SCRAP',5,50);deposit(250);
assert.equal(qa.state.queuedPhase.name,'Lunar salvage');
qa.finishLevel();
assert.equal(storage.get('orbital-cleanup-endless-best-v1'),earthEndlessBefore);
assert.equal(Number(storage.get('orbital-cleanup-moon-endless-best-v1')),750);
assert.equal(careerSystem.career.wallet,walletBeforeEndless,'Endless does not award spendable contract earnings');
elements.get('result-menu').listeners.click();
assert.equal(elements.get('endless-menu-best').textContent,'$750');
console.log('Moon contracts, world navigation, finite target density, payouts, migration, active world, Endless phases and separate scores passed.');

// Mars introduction, finite quotas, progression and honest deferred mode navigation.
const moonBest = qa.state.progress.best[20];
delete qa.state.progress.best[20];
const beforeLockedMars = qa.state.level.id;
elements.get('level-21').listeners.click();
assert.equal(qa.state.level.id, beforeLockedMars);
qa.state.progress.best[20] = moonBest;
elements.get('level-21').listeners.click(); qa.start();
assert.equal(qa.state.level.world, 3);
assert.equal(qa.state.progress.activeWorld, 3);
assert.ok(qa.state.junk.every(o => ['PANEL', 'TOOL'].includes(o.type)));
assert.ok(qa.state.junk.filter(o => o.type === 'TOOL').length <= 2);
collectItems('PANEL', 5, 50); deposit(250); qa.finishLevel();
assert.equal(qa.state.progress.best[21], 1);
advanceThroughBriefing();
assert.equal(qa.state.level.id, 22);
for (const [id,type,count] of [[22,'SAMPLE',5],[23,'DRONE',3]]) {
  elements.get(`level-${id}`).listeners.click(); qa.start();
  const targets = qa.state.junk.filter(o => o.type === type).sort((a,b)=>a.x-b.x);
  assert.equal(targets.length, count+2);
  assert.ok(targets.every(o => o.speed === 30 && !o.drift));
  assert.ok(targets.slice(1).every((o,i)=>o.x-targets[i].x >= 400));
  const missed = targets.at(-1); missed.x=-100;
  qa.scenario = {player:{y:225,velocityY:0,flash:0}}; qa.update(0.01);
  assert.ok(qa.state.junk.includes(missed) && missed.x>360, 'missed finite target returns');
  collectItems('PANEL', 1, 900); deposit(900);
  assert.equal(qa.state.pendingResult,false,'value alone cannot satisfy Mars typed quota');
  qa.collect(targets[0]); deposit(qa.state.haul);
  assert.equal(qa.state.pendingResult,false,'partial quota remains unfinished');
  // The deposit helper clears debris to isolate transfers; restore uncollected pool members.
  qa.scenario = {junk:targets.slice(1)};
  for(const object of targets.slice(1,count)) qa.collect(object);
  qa.fillDebris();
  assert.equal(qa.state.junk.filter(o=>o.type===type).length,2,'collected finite targets do not replenish');
  deposit(qa.state.haul); qa.finishLevel();
  assert.equal(qa.state.progress.best[id],3);
}
assert.equal(elements.get('next-level').hidden,false);
assert.match(elements.get('status').textContent,/Next level unlocked/);
assert.equal(careerSystem.career.worldTwoReward,true,'Mars batch does not disturb lunar reward');
const marsSave = storage.get('orbital-cleanup-progress-v1');
assert.equal(vm.runInContext('LevelSystem.readProgress().activeWorld',sandbox),3);
assert.equal(vm.runInContext('LevelSystem.readProgress().selectedWorld',sandbox),3);
elements.get('level-11').listeners.click(); qa.start();
assert.equal(qa.state.progress.activeWorld,3,'Moon replay does not reset active Mars world');
elements.get('endless').listeners.click();
assert.equal(qa.state.level.world,3,'Mars Endless follows the active campaign world');
assert.equal(elements.get('endless-destination').textContent,'MARS');
assert.equal(qa.scannerNeeded({type:'PANEL'}),false,'no objectives in Endless');
for(const name of ['mars-background','sample-canister','survey-drone','solar-array-section','habitat-support-frame','ascent-engine']) {
  assert.ok(fs.existsSync(new URL(`../src/art/mars/${name}.png`,import.meta.url)));
  assert.ok(fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8').includes(`./src/art/mars/${name}.png`));
}

// One-time scanner purchase, safe older saves and validation against invalid tiers.
const oldGear=reloadCareer({getItem:()=>JSON.stringify({wallet:100,upgrades:{reel:1}}),setItem(){}});
assert.equal(oldGear.effect('reach'),82);
assert.equal(oldGear.effect('stabilizer'),1);
assert.equal(oldGear.effect('scanner'),0);
assert.equal(oldGear.purchase('scanner'),true);
assert.equal(oldGear.career.wallet,0);
assert.equal(oldGear.effect('scanner'),1);
assert.equal(oldGear.purchase('scanner'),false);
const invalidScanner=reloadCareer({getItem:()=>JSON.stringify({wallet:100,upgrades:{scanner:2}}),setItem(){}});
assert.equal(invalidScanner.effect('scanner'),0);
const poorScanner=reloadCareer({getItem:()=>JSON.stringify({wallet:99}),setItem(){}});
assert.equal(poorScanner.purchase('scanner'),false);
assert.equal(poorScanner.career.wallet,99);
careerSystem.credit(10000);
assert.equal(careerSystem.purchase('scanner'),true);
qa.refreshCareer();
assert.equal(elements.get('tier-scanner').textContent,'Unlocked');
assert.equal(elements.get('buy-scanner').disabled,true);
assert.doesNotMatch(elements.get('tier-scanner').textContent,/Tier/);

// Reach expands interception only on the next launch, retaining tether duration.
elements.get('level-22').listeners.click(); qa.start();
const setReachTarget=()=>{qa.scenario={junk:[{x:266,y:225,wobble:0,mass:9,type:'DRONE'}],player:{y:225,velocityY:0,flash:0}};};
setReachTarget();qa.fireTether();assert.equal(qa.state.tether,null);
assert.equal(careerSystem.purchase('reach'),true);
qa.fireTether();assert.equal(qa.state.tether,null,'purchases wait until launch');
qa.start();setReachTarget();qa.fireTether();
assert.ok(qa.state.tether,'upgraded reach acquires a target beyond standard range');
assert.equal(qa.state.tether.duration,(0.55+9*0.025)*qa.careerState.runEffects.reel);
qa.fireTether();
qa.scenario={junk:[{x:271,y:225,wobble:0,mass:9}],player:{y:225,velocityY:0,flash:0}};
qa.fireTether();assert.equal(qa.state.tether,null,'tier one range remains bounded');

// Stabilization changes only loaded handling, not mass or unloaded motion.
assert.equal(careerSystem.purchase('stabilizer'),true);qa.start();
const velocity=(load,factor)=>{qa.careerState.runEffects.stabilizer=factor;qa.scenario={mass:load,junk:[],player:{y:225,velocityY:0,flash:0}};qa.update(0.1);return qa.state.player.velocityY;};
assert.equal(velocity(0,1),velocity(0,0.55));
assert.ok(velocity(100,0.55)<velocity(100,1));
assert.equal(qa.state.mass,100);

// Scanner follows required types, banked + carried quotas, and current finale assignment.
qa.start();
assert.equal(qa.scannerNeeded({type:'SAMPLE'}),true);
assert.equal(qa.scannerNeeded({type:'DRONE'}),false);
collectItems('SAMPLE',5,55);
assert.equal(qa.scannerNeeded({type:'SAMPLE'}),false,'full carried quota removes extra target highlighting');
qa.end('SUIT');qa.start();
assert.equal(qa.scannerNeeded({type:'SAMPLE'}),true,'failed carried quota needs recovery again');
collectItems('SAMPLE',5,55);deposit(275);
assert.equal(qa.scannerNeeded({type:'SAMPLE'}),false,'banked quota remains satisfied');
elements.get('level-8').listeners.click();qa.start();
assert.equal(qa.scannerNeeded({type:'TOOL'}),true);
assert.equal(qa.scannerNeeded({type:'ROCKET'}),true);
collectItems('TOOL',3);
assert.equal(qa.scannerNeeded({type:'TOOL'}),false);
assert.equal(qa.scannerNeeded({type:'ROCKET'}),true);
delete qa.state.progress.finale;
elements.get('level-10').listeners.click();qa.start();
assert.equal(qa.scannerNeeded({type:'PANEL'}),true);
assert.equal(qa.scannerNeeded({type:'CAPSULE'}),false);
collectItems('PANEL',6);deposit(qa.state.haul);qa.finishLevel();
assert.equal(qa.scannerNeeded({type:'PANEL'}),false);
assert.equal(qa.scannerNeeded({type:'TOOL'}),true,'scanner changes with finale assignment');
console.log('Mars 1–3, finite targets, saves, deferred modes, scanner unlock/objectives, tether reach and cargo stabilization passed.');

// Mars 4–9: finite pools, both altitude extremes, partial quotas and standard-gear completion.
const standardMars = () => Object.assign(qa.careerState.runEffects,{reel:1,thrust:1,deposit:1,reach:82,stabilizer:1,scanner:0});
const startMars = id => {elements.get(`level-${id}`).listeners.click();qa.start();standardMars();};
const typedQuotas = objective => objective.type === 'all' ? objective.criteria.flatMap(typedQuotas) : objective.type === 'bank_type' ? [objective] : [];
const beforeMarsCampaignWallet=careerSystem.career.wallet;
for(const id of [24,25,26,27,28,29]) {
  startMars(id);
  const config=qa.state.level;
  assert.equal(config.id,id);
  const quotas=typedQuotas(config.objective);
  const pools=config.debris.pools || (config.debris.limited?[config.debris.limited]:[]);
  for(const pool of pools) {
    const objects=qa.state.junk.filter(o=>o.type===pool.band.type).sort((a,b)=>a.x-b.x);
    const quota=quotas.find(q=>q.salvageType===pool.band.type);
    assert.equal(objects.length,quota.target+2);
    assert.ok(objects.slice(1).every((o,i)=>o.x-objects[i].x===480));
    assert.ok(objects.every(o=>o.y>=105 && o.y<=338 && o.speed===30));
    const missed=objects.at(-1),oldY=missed.y;
    missed.x=-41;qa.update(0);
    assert.ok(missed.x>360);assert.equal(missed.y,oldY,'finite targets keep their altitude when returning');
  }
  assert.ok(qa.state.junk.filter(o=>o.type==='SAT').length<=2);
  assert.ok(!qa.state.junk.some(o=>o.type==='ENGINE'),'engine remains finale-only');
  if(id===26 || id===29) {
    const high=qa.state.junk.filter(o=>o.type===quotas[0].salvageType);
    const low=qa.state.junk.filter(o=>o.type===quotas[1].salvageType);
    assert.ok(high.every(o=>o.y<=120) && low.every(o=>o.y>=325));
    assert.ok(Math.min(...low.map(o=>o.y))-4-(Math.max(...high.map(o=>o.y))+4)>164,'one stationary standard tether position cannot serve both required types');
  }
  if(id===28) {
    const arrays=qa.state.junk.filter(o=>o.type==='ARRAY');
    assert.equal(arrays.filter(o=>o.y<=120).length,3);
    assert.equal(arrays.filter(o=>o.y>=325).length,3);
    assert.equal(config.objective.criteria[0].target,4,'quota requires targets from both outer bands');
  }
  if(id===27) {
    for(let i=0;i<6;i++) {
      const drone=qa.state.junk.find(o=>o.encounter);
      assert.ok(drone && drone.y<=120 && drone.y>=105);
      assert.ok(Math.abs((qa.state.station.x-270)/25-(drone.x-180)/30-4)<0.00001);
      qa.collect(drone);
      qa.scenario={player:{y:225,velocityY:0,flash:0},station:{x:-71,y:225,speed:25}};qa.update(0);
      assert.equal(qa.state.junk.filter(o=>o.encounter).length,i<5?1:0);
    }
    startMars(id);
  }
  const quotaStats={bank:99999,bankedTypes:{}};
  assert.equal(vm.runInContext(`LevelSystem.rating(LevelSystem.campaign[${id-1}],${JSON.stringify(quotaStats)})`,sandbox),0,'cash alone cannot replace typed cargo');
  // Deposit partial quotas over multiple trips, then finish every required component.
  for(const q of quotas){collectItems(q.salvageType,q.target-1,100);deposit(qa.state.haul);}
  assert.equal(qa.state.pendingResult,false);
  for(const q of quotas){collectItems(q.salvageType,1,100);deposit(qa.state.haul);}
  if(id===28) {
    assert.equal(qa.state.pendingResult,false,'four arrays alone do not meet the value quota');
    collectItems('PANEL',1,1000-qa.state.bank);deposit(qa.state.haul);
  }
  assert.equal(qa.state.pendingResult,true);
  qa.finishLevel();
  assert.ok(qa.state.progress.best[id]>=1);
  assert.equal(elements.get(`level-${id+1}`).disabled,false);
  assert.equal(careerSystem.career.wallet,beforeMarsCampaignWallet,'no premature campaign reward');
}

// Random extrema cannot collapse the introductory Mars finite pools into the center.
const savedMarsRandom=sandbox.Math.random;
try {
  for(const roll of [0,0.999]) {
    sandbox.Math.random=()=>roll;
    for(const id of [22,23,24,25]) {
      startMars(id);
      const targets=qa.state.junk.filter(o=>o.limited);
      assert.ok(targets.some(o=>o.y<=120) && targets.some(o=>o.y>=325));
      assert.ok(targets.filter(o=>Math.abs(o.y-225)<=86).length<qa.state.level.objective.target,'center-only recovery cannot finish the quota');
    }
  }
} finally {sandbox.Math.random=savedMarsRandom;}

// Independent Mars finale checkpoints, cross-world switching, retry and one-time reward.
qa.state.progress.finale={stage:1,bank:420};
qa.state.progress.moonFinale={stage:1,bank:777};
startMars(30);
assert.equal(qa.state.bank,0);
assert.match(qa.state.level.name,/Last Ascent · 1\/3/);
qa.careerState.runEffects.scanner=1;
assert.equal(qa.scannerNeeded({type:'SAMPLE'}),true);
assert.equal(qa.scannerNeeded({type:'ENGINE'}),false);
collectItems('SAMPLE',3,60);deposit(qa.state.haul);
assert.equal(qa.state.pendingResult,false);
collectItems('DRONE',2,125);deposit(qa.state.haul);
assert.equal(qa.state.progress.marsFinale.stage,1);
const marsFirstBank=qa.state.bank;
assert.equal(vm.runInContext('LevelSystem.readProgress().marsFinale.bank',sandbox),marsFirstBank);
qa.finishLevel();standardMars();
assert.match(qa.state.level.name,/Last Ascent · 2\/3/);
collectItems('ARRAY',1,155);qa.end('SUIT');qa.start();standardMars();
assert.equal(qa.state.bank,marsFirstBank);assert.equal(qa.state.haul,0);
assert.equal(qa.state.junk.filter(o=>o.type==='ARRAY').length,4);
elements.get('level-20').listeners.click();qa.start();
assert.equal(qa.state.bank,777);assert.equal(qa.state.progress.marsFinale.stage,1);
startMars(30);assert.equal(qa.state.bank,marsFirstBank);
collectItems('ARRAY',2,155);deposit(qa.state.haul);assert.equal(qa.state.pendingResult,false);
collectItems('FRAME',2,200);deposit(qa.state.haul);
assert.equal(qa.state.progress.marsFinale.stage,2);
qa.finishLevel();standardMars();
const marsEngineBank=qa.state.bank;
assert.equal(qa.state.junk.filter(o=>o.type==='ENGINE').length,1);
let ascentEngine=qa.state.junk.find(o=>o.type==='ENGINE');
assert.equal(ascentEngine.mass,24);
assert.ok((ascentEngine.x-262)/30>(qa.state.station.x-90)/25,'engine arrives after a station pass');
ascentEngine.x=-41;qa.update(0);assert.ok(ascentEngine.x>360);
ascentEngine.x=220;ascentEngine.y=225;
qa.scenario={junk:[ascentEngine],player:{y:225,velocityY:0,flash:0}};
qa.fireTether();assert.ok(Math.abs(qa.state.tether.duration-1.15)<1e-9);
qa.update(2);assert.equal(qa.state.haul,550);
qa.end('REENTRY');qa.start();standardMars();
assert.equal(qa.state.bank,marsEngineBank);
assert.equal(qa.state.junk.filter(o=>o.type==='ENGINE').length,1,'lost unique engine returns on retry');
qa.careerState.runEffects.scanner=1;
assert.equal(qa.scannerNeeded({type:'ENGINE'}),true);
qa.collect(qa.state.junk.find(o=>o.type==='ENGINE'));
assert.equal(qa.scannerNeeded({type:'ENGINE'}),false);
qa.fillDebris();assert.equal(qa.state.junk.filter(o=>o.type==='ENGINE').length,0);
deposit(qa.state.haul);
qa.finishLevel();qa.finishLevel();
assert.equal(elements.get('result-title').textContent,'WORLD THREE COMPLETE');
assert.equal(elements.get('world-three-badge').hidden,false);
assert.equal(elements.get('next-level').hidden,true);
assert.match(elements.get('status').textContent,/Ascent engine recovered/);
assert.equal(careerSystem.career.wallet,beforeMarsCampaignWallet+2000);
assert.equal(careerSystem.career.worldThreeReward,true);
assert.equal(careerSystem.career.worldOneReward,true);
assert.equal(careerSystem.career.worldTwoReward,true);
assert.equal(careerSystem.rewardWorld(3),false);
assert.equal(qa.state.progress.marsFinale,undefined);
assert.equal(qa.state.progress.finale.bank,420);
assert.equal(qa.state.progress.moonFinale.bank,777);
assert.equal(reloadCareer({getItem:()=>storage.get('orbital-cleanup-career-v1'),setItem(){}}).rewardWorld(3),false);
assert.equal(reloadCareer({getItem:()=>JSON.stringify({worldTwoReward:true}),setItem(){}}).career.worldThreeReward,false);

// Actual braking trajectories: cargo carries speed; early braking works, late braking can fail.
function brakeRun({load=60,y=220,velocity=65,stabilizer=1,dt=0.01}) {
  startMars(24);qa.careerState.runEffects.stabilizer=stabilizer;
  qa.scenario={mass:load,player:{y,velocityY:velocity,flash:0},junk:[],thrusting:velocity>0};
  let extreme=y;
  for(let i=0;i<10/dt && qa.state.running && Math.sign(qa.state.player.velocityY)===Math.sign(velocity);i++) {
    qa.scenario={junk:[]};qa.update(dt);
    extreme=velocity>0?Math.max(extreme,qa.state.player.y):Math.min(extreme,qa.state.player.y);
  }
  return {travel:Math.abs(extreme-y),alive:qa.state.running};
}
const emptyBrake=brakeRun({load:0}),heavyBrake=brakeRun({}),stabilizedBrake=brakeRun({stabilizer:0.55});
assert.ok(heavyBrake.travel>emptyBrake.travel*1.2,'heavy fast descent needs materially more braking distance');
assert.ok(stabilizedBrake.travel<heavyBrake.travel && stabilizedBrake.travel>emptyBrake.travel,'stabilizer helps without removing the tradeoff');
assert.equal(heavyBrake.alive,true,'standard gear can brake early');
assert.equal(brakeRun({y:345}).alive,false,'late braking at speed can hit the surface');
assert.equal(brakeRun({y:90,velocity:-65}).alive,false,'late release at speed can cross the upper boundary');
assert.equal(brakeRun({y:220,velocity:-65}).alive,true,'early release arrests a loaded climb');
assert.ok(Math.abs(brakeRun({dt:1/30}).travel-brakeRun({dt:1/120}).travel)<3,'braking remains consistent across frame rates');
startMars(24);
qa.scenario={mass:60,player:{y:310,velocityY:60,flash:0}};
assert.match(qa.momentumWarning().text,/THRUST · BRAKE/);
qa.scenario={player:{y:130,velocityY:-60,flash:0}};
assert.match(qa.momentumWarning().text,/RELEASE THRUST/);
qa.scenario={mass:0};assert.equal(qa.momentumWarning(),null);
qa.scenario={mass:60,player:{y:320,velocityY:10,flash:0}};assert.equal(qa.momentumWarning(),null);
console.log('Mars 4–10, outer-band coverage, station-timed quotas, independent finale/reward, and cargo momentum/braking checks passed.');

// Earth/Moon movement layouts: every campaign, contract and Endless phase has outer targets.
const boundaryModes=vm.runInContext('[...LevelSystem.campaign.filter(c=>c.world<=2),LevelSystem.endlessFor(1),LevelSystem.endlessFor(2),...ContractSystem.contracts]',sandbox);
for(const config of boundaryModes) {
  for(const field of [config.debris,...(config.assignments||[]).map(a=>a.debris),...(config.phases||[]).map(p=>p.debris)]) {
    assert.equal(field.altitudeBands.length,3);
    assert.ok(field.altitudeBands.some(y=>y[1]<=140));
    assert.ok(field.altitudeBands.some(y=>y[0]>=305));
    if(field.limited?.count>1) assert.ok(field.limited.altitudeBands.length>=3);
    if(field.pools?.length>1) {
      assert.ok(field.pools[0].altitudeBands[0][1]<=120);
      assert.ok(field.pools[1].altitudeBands[0][0]>=322);
    }
    for(const event of [field.arrival,field.encounter,field.pocket].filter(Boolean)) {
      assert.equal(event.altitudeBands.length,2,'recurring recoveries alternate both sides');
    }
  }
}
// Generate actual fields under worst-case random rolls, preserving count and spacing.
const preBoundaryRandom=sandbox.Math.random;
try {
  for(const roll of [0,0.999]) {
    sandbox.Math.random=()=>roll;
    for(let id=1;id<=20;id++) {
      if(id===10) delete qa.state.progress.finale;
      if(id===20) delete qa.state.progress.moonFinale;
      elements.get(`level-${id}`).listeners.click();qa.start();
      const ordinary=qa.state.junk.filter(o=>!o.limited&&!o.pocket&&!o.encounter&&!o.special);
      assert.ok(ordinary.some(o=>o.y<=140),`mission ${id} upper support`);
      assert.ok(ordinary.some(o=>o.y>=305),`mission ${id} lower support`);
      const finite=qa.state.junk.filter(o=>o.limited);
      if(finite.length>1) {
        assert.ok(finite.some(o=>o.y<=120));assert.ok(finite.some(o=>o.y>=322));
      }
      assert.ok(qa.state.junk.every(o=>o.y>75 && o.y<360));
    }
  }
} finally {sandbox.Math.random=preBoundaryRandom;}
// Drift stays gentle, but outer targets now remain in safe outer corridors.
elements.get('level-17').listeners.click();qa.start();
for(const object of qa.state.junk.filter(o=>o.drift)) {
  const originalY=object.y;
  qa.scenario={junk:[object],player:{y:225,velocityY:0,flash:0}};
  object.x=340;object.speed=0;
  for(let i=0;i<200;i++) {qa.scenario={player:{y:225,velocityY:0,flash:0}};qa.update(0.01);}
  assert.ok(object.y>=object.drift.minY && object.y<=object.drift.maxY);
  assert.ok(object.drift.minY-object.size>75 && object.drift.maxY+object.size<360);
  if(originalY<=120) assert.ok(object.y<=125);
  if(originalY>=322) assert.ok(object.y>=317);
}
// Pocket members stay together; the next group uses the opposite band.
elements.get('level-13').listeners.click();qa.start();
const upperPocket=qa.state.junk.filter(o=>o.pocket);
assert.ok(upperPocket.every(o=>o.y<145));
upperPocket.forEach(o=>qa.collect(o));qa.fillDebris();
assert.ok(qa.state.junk.filter(o=>o.pocket).every(o=>o.y>300));
// Recurring mission-critical ordinary targets alternate even if every roll chooses that type.
const savedContractRandom=sandbox.Math.random;
try {
  sandbox.Math.random=()=>0;
  launchContract('satellite-sweep');
  const satellites=qa.state.junk.filter(o=>o.type==='SAT');
  assert.ok(satellites.some(o=>o.y<=120) && satellites.some(o=>o.y>=322));
} finally {sandbox.Math.random=savedContractRandom;}
launchContract('equipment-return');
qa.scenario={elapsed:8,junk:[]};qa.fillDebris();
let crate=qa.state.junk.find(o=>o.scheduledSalvage);
assert.ok(crate.y<=120);qa.collect(crate);
qa.scenario={elapsed:20};qa.fillDebris();
crate=qa.state.junk.find(o=>o.scheduledSalvage);assert.ok(crate.y>=322);
// All Endless phases retain their density and produce both edges on refill.
for(const world of [1,2]) {
  qa.state.progress.activeWorld=world; delete qa.state.progress.destinationWorld;elements.get('endless').listeners.click();
  for(const at of [0,150,300,500]) {
    if(at){deposit(at-qa.state.bank);qa.resumeLevel();}
    qa.scenario={junk:[]};qa.fillDebris();
    assert.ok(qa.state.junk.some(o=>o.y<=120));
    assert.ok(qa.state.junk.some(o=>o.y>=322));
    assert.ok(!qa.state.junk.some(o=>['CAPSULE','ROVER','ENGINE'].includes(o.type)));
  }
}
// Shared momentum is identical for equal gear/load in campaign, Contracts and Endless.
function modeBrake(startMode) {
  startMode();standardMars();qa.scenario={mass:60,junk:[],player:{y:225,velocityY:60,flash:0},thrusting:true};
  qa.update(0.1);return qa.state.player.velocityY;
}
const earthMomentum=modeBrake(()=>{elements.get('level-7').listeners.click();qa.start();});
assert.equal(modeBrake(()=>{elements.get('level-15').listeners.click();qa.start();}),earthMomentum);
assert.equal(modeBrake(()=>launchContract('engine-recovery')),earthMomentum);
assert.equal(modeBrake(()=>{qa.state.progress.activeWorld=2; delete qa.state.progress.destinationWorld;elements.get('endless').listeners.click();}),earthMomentum);
console.log('Earth/Moon boundary coverage across campaigns, Contracts and all Endless phases, safe drift, alternating pockets/arrivals and shared momentum passed.');

// Mars modes: locked access, all payouts, repeatability, save isolation and phase safety.
const marsJobs=careerSystem.contracts.filter(c=>c.world===3);
assert.equal(marsJobs.length,6);
elements.get('choose-contracts').listeners.click();
elements.get('next-contract-world').listeners.click();
elements.get('next-contract-world').listeners.click();
assert.equal(elements.get('contract-world-name').textContent,'MARS CONTRACTS');
assert.equal(elements.get('next-contract-world').disabled,true);
const completedMoon=qa.state.progress.best[20];delete qa.state.progress.best[20];
elements.get('choose-contracts').listeners.click();
assert.equal(elements.get(`contract-${marsJobs[0].id}`).disabled,true);
const priorLevel=qa.state.level;
elements.get(`contract-${marsJobs[0].id}`).listeners.click();assert.equal(qa.state.level,priorLevel);
qa.state.progress.best[20]=completedMoon;
elements.get('choose-contracts').listeners.click();
const priorCampaign=JSON.stringify(qa.state.progress);
for(const job of marsJobs){
  assert.equal(elements.get(`contract-${job.id}`).disabled,false);
  launchContract(job.id);
  assert.equal(qa.state.level.world,3);
  assert.ok(qa.state.junk.every(o=>o.type!=='ENGINE'));
  if(job.debris.limited){
    const targets=qa.state.junk.filter(o=>o.type===job.objective.salvageType);
    assert.equal(targets.length,job.objective.target+2);
    assert.ok(targets.some(o=>o.y<=120)&&targets.some(o=>o.y>=322));
    assert.equal(targets[1].x-targets[0].x,job.debris.limited.spacing);
  }
  const wallet=careerSystem.career.wallet;
  collectItems(job.objective.salvageType||'SAMPLE',job.objective.type==='bank_value'?1:job.objective.target,job.objective.type==='bank_value'?job.objective.target:60);
  const haul=qa.state.haul;deposit(haul);
  assert.equal(careerSystem.career.wallet,wallet+haul+job.bonus);
  qa.resumeLevel();collectItems('PANEL',1,40);deposit(40);
  assert.equal(careerSystem.career.wallet,wallet+haul+job.bonus+40);
  if(qa.state.pendingResult) qa.resumeLevel();
  qa.end('REENTRY');assert.equal(elements.get('death').textContent,'SURFACE IMPACT');
}
assert.equal(JSON.stringify(qa.state.progress),priorCampaign);
assert.equal(reloadCareer(sandbox.localStorage).career.completed.filter(id=>id.startsWith('mars-')).length,6);
const earlierBests=[storage.get('orbital-cleanup-endless-best-v1'),storage.get('orbital-cleanup-moon-endless-best-v1')];
const endlessWallet=careerSystem.career.wallet;
qa.state.progress.activeWorld=3; delete qa.state.progress.destinationWorld;elements.get('endless').listeners.click();
assert.equal(qa.state.level.world,3);
for(const [at,type] of [[0,'SAMPLE'],[150,'DRONE'],[300,'ARRAY'],[500,'FRAME']]){
  if(at){deposit(at-qa.state.bank);qa.resumeLevel();}
  qa.scenario={junk:[],elapsed:100+at};qa.fillDebris();
  const rare=qa.state.junk.filter(o=>o.scheduledSalvage);
  assert.equal(rare.length,1);assert.equal(rare[0].type,type);
  qa.fillDebris();assert.equal(qa.state.junk.filter(o=>o.scheduledSalvage).length,1);
  assert.ok(qa.state.junk.length<=5);
  assert.ok(qa.state.junk.some(o=>o.y<=120)&&qa.state.junk.some(o=>o.y>=322));
  assert.ok(!qa.state.junk.some(o=>['ROVER','CAPSULE','ENGINE'].includes(o.type)));
  assert.equal(qa.scannerNeeded(rare[0]),false);
}
deposit(250);assert.equal(qa.state.queuedPhase.name,'Sample field');qa.finishLevel();
assert.equal(Number(storage.get('orbital-cleanup-mars-endless-best-v1')),750);
assert.deepEqual([storage.get('orbital-cleanup-endless-best-v1'),storage.get('orbital-cleanup-moon-endless-best-v1')],earlierBests);
assert.equal(careerSystem.career.wallet,endlessWallet);
console.log('Mars contracts, access locks, payouts, persistence, boundary targets, Endless phases and isolated scores passed.');

// Explicit world pages override campaign activity without changing progression.
elements.get('result-menu').listeners.click();
qa.state.progress.activeWorld=3;
elements.get('previous-destination').listeners.click();
elements.get('previous-destination').listeners.click();
assert.equal(qa.state.progress.destinationWorld,1);
assert.equal(elements.get('destination-name').textContent,'EARTH');
assert.equal(elements.get('endless').textContent,'PLAY EARTH ENDLESS');
assert.equal(qa.state.progress.activeWorld,3);
assert.equal(vm.runInContext('LevelSystem.readProgress().destinationWorld',sandbox),1);
elements.get('endless').listeners.click();assert.equal(qa.state.level.world,1);
elements.get('result-menu').listeners.click();
elements.get('next-destination').listeners.click();
elements.get('choose-contracts').listeners.click();
assert.equal(elements.get('contract-world-name').textContent,'MOON CONTRACTS');
elements.get('back-contracts').listeners.click();
elements.get('next-destination').listeners.click();
elements.get('choose-campaign').listeners.click();
assert.match(elements.get('world-name').textContent,/Mars/i);
elements.get('back-modes').listeners.click();
assert.equal(elements.get('destination-name').textContent,'MARS');
elements.get('home-menu').listeners.click();assert.equal(elements.get('home-menu-panel').hidden,false);
elements.get('menu-upgrades').listeners.click();
assert.equal(elements.get('home-menu-panel').hidden,true);assert.equal(elements.get('upgrades-picker').hidden,false);
elements.get('back-upgrades').listeners.click();
const priorBest20=qa.state.progress.best[20];delete qa.state.progress.best[20];
elements.get('result-menu').listeners.click();assert.equal(elements.get('endless').disabled,true);
const beforeLockedLaunch=qa.state.level;elements.get('endless').listeners.click();assert.equal(qa.state.level,beforeLockedLaunch);
assert.equal(elements.get('destination-lock').hidden,false);
qa.state.progress.best[20]=priorBest20;
elements.get('result-menu').listeners.click();assert.equal(elements.get('endless').disabled,false);
assert.match(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),/release-footer[^>]*>ORBITAL CLEANUP · v0.21.3/);
console.log('Explicit destination persistence, independent world launches, locked access, menu and footer passed.');
// Help stays inside the modal, closes with X or Escape, and resets on reopen.
elements.get('home-menu').listeners.click();
elements.get('menu-how-to').listeners.click();
assert.equal(elements.get('how-to-play').hidden,false);
assert.equal(elements.get('home-menu-options').hidden,true);
elements.get('how-to-back').listeners.click();assert.equal(elements.get('home-menu-options').hidden,false);
elements.get('close-home-menu').listeners.click();assert.equal(elements.get('home-menu-panel').hidden,true);
elements.get('home-menu').listeners.click();assert.equal(elements.get('how-to-play').hidden,true);
elements.get('home-menu-panel').listeners.cancel({preventDefault(){}});assert.equal(elements.get('home-menu-panel').hidden,true);

elements.get('result-menu').listeners.click();
assert.equal(elements.get('title-screen').hidden,true,'returning from a run does not reopen the title');

// Approved HUD: each mixed quota accounts for banked and aboard cargo independently.
elements.get('level-26').listeners.click();qa.start();
qa.scenario={bank:315,bankedTypes:{SAMPLE:3,DRONE:1},carriedTypes:{SAMPLE:1},haul:65,mass:4};
// Use the shared per-type counters exposed by the existing harness.
Object.assign(qa.careerState.bankedTypes,{SAMPLE:3,DRONE:1});
Object.assign(qa.careerState.carriedTypes,{SAMPLE:1,DRONE:0});
const mixedRows=qa.hudObjectiveRows();
assert.equal(mixedRows[0].banked,3);assert.equal(mixedRows[0].carried,1);assert.equal(mixedRows[0].ready,true);assert.equal(mixedRows[0].complete,false);
assert.equal(mixedRows[1].ready,false);
qa.updateHud();assert.equal(elements.get('hud-bank-note').textContent,'Run score · Not wallet earnings');
elements.get('campaign').listeners.click();
assert.equal(elements.get('keep-playing').textContent,'RESUME');
elements.get('leave-run').listeners.click();assert.equal(elements.get('exit-title').textContent,'Exit this run?');
assert.equal(qa.state.haul,65,'first exit action does not discard cargo');
elements.get('keep-playing').listeners.click();assert.equal(qa.state.running,true);
launchContract('mars-array-recovery');qa.updateHud();assert.equal(elements.get('hud-bank-note').textContent,'Added to your wallet');
qa.scenario={player:{y:225,velocityY:0,flash:0},station:{x:180,y:225,speed:25}};qa.updateHud();assert.equal(elements.get('hud-direction').textContent,'— STEADY');
assert.equal(elements.get('station-status').textContent,'IN RANGE · HOLD DEPOSIT');
console.log('Mixed HUD counts, banking readiness, earnings labels, motion, station strip and two-step exit passed.');

// Continuing a campaign always allows time to read before an explicit launch.
function advanceThroughBriefing() {
  const previous = qa.state.level.id;
  elements.get('next-level').listeners.click();
  assert.equal(qa.state.level.id, previous + 1);
  assert.equal(qa.state.running, false, 'next mission must wait for Start Mission');
  assert.equal(qa.state.pendingResult, false);
  assert.equal(elements.get('start-screen').classList.contains('overlay--visible'), false);
  assert.equal(elements.get('game').classList.contains('menu-open'), false);
  assert.equal(elements.get('next-mission-briefing').hidden, false);
  assert.equal(elements.get('next-briefing-description').textContent, elements.get('level-description').textContent);
  assert.equal(elements.get('next-briefing-objectives').innerHTML, elements.get('briefing-objectives').innerHTML);
  assert.ok(elements.get('next-briefing-objectives').innerHTML.includes('<li>'));
  assert.equal(qa.state.progress.destinationWorld, qa.state.level.world);
  assert.equal(qa.state.progress.currentLevel, previous + 1);
  const elapsed = qa.state.elapsed;
  qa.update(10);
  assert.equal(qa.state.elapsed, elapsed, 'reading the briefing does not run the mission clock');
  const loadedJunk = qa.state.junk;
  elements.get('next-briefing-start').listeners.click();
  assert.equal(elements.get('next-mission-briefing').hidden, true);
  assert.equal(qa.state.junk, loadedJunk, 'launch uses the already-loaded scene');
  assert.equal(qa.state.running, true, 'explicit start launches the upcoming mission');
}

// Both exit actions return to modes without launching or losing completion progress.
for (const action of ['button', 'escape']) {
  elements.get('level-1').listeners.click();
  qa.state.progress.best[1] = 3;
  elements.get('next-level').listeners.click();
  const savedBest = JSON.stringify(qa.state.progress.best);
  if (action === 'button') elements.get('next-briefing-exit').listeners.click();
  else elements.get('next-mission-briefing').listeners.cancel({preventDefault(){}});
  assert.equal(qa.state.running, false);
  assert.equal(elements.get('next-mission-briefing').hidden, true);
  assert.equal(elements.get('start-screen').classList.contains('overlay--visible'), true);
  assert.equal(elements.get('mode-menu').hidden, false);
  assert.equal(elements.get('campaign-picker').hidden, true);
  assert.equal(JSON.stringify(qa.state.progress.best), savedBest);
  elements.get('next-briefing-start').listeners.click();
  assert.equal(qa.state.running, false, 'a closed briefing cannot launch a mission');
}
console.log('Paused next-mission briefing, prepared-scene launch, and exits to modes passed.');

// Completion indicators agree with saved records across every world's board.
elements.get('result-menu').listeners.click();
for (const contract of careerSystem.contracts) {
  const completed = careerSystem.career.completed.includes(contract.id);
  assert.equal(elements.get(`completed-contract-${contract.id}`).hidden, !completed);
  assert.equal(elements.get(`select-contract-${contract.id}`).classList.contains('contract-completed'), completed);
}
console.log('Completed contract badges, first-time updates, and all-world records passed.');
