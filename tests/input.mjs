import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function target() {
  const listeners = new Map();
  return {
    disabled: false, captured: null,
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); },
    emit(name, data = {}) {
      const event = { pointerId: 1, button: 0, cancelable: true, prevented: false, preventDefault() { this.prevented = true; }, ...data };
      for (const fn of listeners.get(name) || []) fn(event);
      return event;
    },
    setPointerCapture(id) { this.captured = id; },
    hasPointerCapture(id) { return this.captured === id; },
    releasePointerCapture() { this.captured = null; }
  };
}
const window = target(), document = target();
const sandbox = { window, document };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../src/input.js', import.meta.url), 'utf8') + '\nglobalThis.input = GameInput;', sandbox);
const thrust = target(), deposit = target();
let thrusting = false, depositing = false, running = true;
const release = sandbox.input.hold(thrust, () => running, () => { thrusting = true; }, () => { thrusting = false; });
sandbox.input.hold(deposit, () => running, () => { depositing = true; }, () => { depositing = false; });
thrust.emit('pointerdown');
assert.equal(thrusting, true);
deposit.emit('pointerdown', { pointerId: 2 });
window.emit('pointerup', { pointerId: 2 });
assert.equal(depositing, false);
assert.equal(thrusting, true, 'releasing deposit finger does not release thrust');
thrust.emit('pointerdown', { pointerId: 3 });
window.emit('pointerup', { pointerId: 3 });
assert.equal(thrusting, true, 'extra finger does not replace hold owner');
window.emit('pointerup');
assert.equal(thrusting, false, 'owner release outside button stops thrust');
for (const [surface, event, data] of [
  [thrust, 'lostpointercapture', {}], [window, 'pointercancel', {}],
  [window, 'blur', {}], [window, 'pagehide', {}],
  [window, 'touchcancel', {}], [window, 'touchend', { touches: [] }],
  [window, 'pointermove', { pointerType: 'mouse', buttons: 0 }]
]) {
  thrust.emit('pointerdown');
  assert.equal(thrusting, true);
  surface.emit(event, data);
  assert.equal(thrusting, false, `${event} releases thrust`);
  assert.equal(thrust.captured, null);
}
thrust.emit('pointerdown');
document.hidden = true;
document.emit('visibilitychange');
assert.equal(thrusting, false);
document.hidden = false;
thrust.setPointerCapture = () => { throw new Error('capture unavailable'); };
thrust.emit('pointerdown');
thrust.emit('pointerleave');
assert.equal(thrusting, false, 'failed capture cannot strand thrust after leaving button');
thrust.emit('pointerdown');
release();
assert.equal(thrusting, false, 'state transition clears pointer ownership');
thrust.emit('pointerdown', { pointerId: 9 });
assert.equal(thrusting, true, 'fresh press works after interruption');
release();
running = false;
thrust.emit('pointerdown');
assert.equal(thrusting, false, 'paused controls cannot engage');
running = true;
thrust.disabled = true;
thrust.emit('pointerdown');
assert.equal(thrusting, false);
const surface = target();
sandbox.input.protect(surface);
for (const event of ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange', 'dblclick', 'selectstart', 'contextmenu']) {
  assert.equal(surface.emit(event).prevented, true, `${event} cannot take over flight surface`);
}
console.log('Touch input interruption and multi-pointer checks passed.');
