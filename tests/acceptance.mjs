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
    style: {},
    listeners: {},
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name)
    },
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
  "game", "canvas", "status", "restart", "tether", "deposit", "thrust",
  "start-screen", "start", "game-over", "play-again", "death", "detail",
  "bank", "lost", "summary", "start-high-score", "game-over-high-score"
];
ids.forEach((id) => elements.set(id, makeElement(id)));
elements.get("canvas").getContext = () => drawingContext;

const storage = new Map();
const sandbox = {
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
    start, end, update, fireTether, collide, thrustEffectiveness,
    get state() { return { running, haul, bank, mass, integrity, tether, junk, player, station, depositing, cargo }; },
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
vm.runInNewContext(source, sandbox, { filename: "src/game.js" });

const qa = sandbox.__qa;
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

console.log("Orbital Cleanup v0.6 acceptance checks passed.");
