import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const listeners = {}, requests = [], stored = [], removed = [];
let fail = false;
const sandbox = {
  URL, Promise,
  self: { registration: { scope: 'https://example.com/orbital-cleanup/' },
    addEventListener: (name, fn) => { listeners[name] = fn; }, skipWaiting() {}, clients: { claim() {} } },
  caches: { open: async () => ({ put: async (key) => { stored.push(key); } }),
    keys: async () => ['orbital-cleanup-v0.8.1', 'other-app-cache', 'orbital-cleanup-v0.12-salvage3'],
    delete: async key => { removed.push(key); } },
  fetch: async (url, options) => { requests.push({ url: String(url), options }); return { ok: !fail }; }
};
vm.runInNewContext(fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8'), sandbox);
let work;
listeners.install({ waitUntil(promise) { work = promise; } });
await work;
assert.ok(requests.every(({ url, options }) => url.includes('build=orbital-cleanup-v0.12-salvage3') && options.cache === 'reload'));
assert.ok(stored.includes('./src/input.js?v=0.12-salvage3'), 'fresh versioned controls cached offline');
assert.ok(stored.includes('./index.html'));
listeners.activate({ waitUntil(promise) { work = promise; } });
await work;
assert.deepEqual(removed, ['orbital-cleanup-v0.8.1'], 'only this app’s old caches are removed');
stored.length = 0;
fail = true;
listeners.install({ waitUntil(promise) { work = promise; } });
await assert.rejects(work);
assert.equal(stored.length, 0, 'failed download does not write a partial shell');
const recovery = fs.readFileSync(new URL('../update.html', import.meta.url), 'utf8');
const handler = {};
const messages = { disabled: false, textContent: '' };
let destination;
let unregistered = 0;
const recoveryRemoved = [];
vm.runInNewContext(recovery.match(/<script>([\s\S]*?)<\/script>/)[1], {
  URL, Date,
  document: { getElementById: () => ({ ...messages, addEventListener: (name, fn) => { handler[name] = fn; } }) },
  location: { href: 'https://example.com/orbital-cleanup/update.html', replace: url => { destination = url; } },
  navigator: { serviceWorker: { getRegistrations: async () => [
    { scope: 'https://example.com/orbital-cleanup/', unregister: async () => { unregistered++; } },
    { scope: 'https://example.com/other/', unregister: async () => { throw new Error('unrelated scope'); } }
  ] } },
  caches: { keys: async () => ['orbital-cleanup-old', 'other-app-cache'], delete: async key => { recoveryRemoved.push(key); } },
  fetch: async () => ({ ok: true }),
  localStorage: new Proxy({}, { get() { throw new Error('Recovery must not access player saves'); } })
});
await handler.click();
assert.equal(unregistered, 1);
assert.deepEqual(recoveryRemoved, ['orbital-cleanup-old']);
assert.match(destination, /orbital-cleanup\/index.html\?refresh=/);
console.log('PWA fresh-install, cache isolation, and save-preserving recovery checks passed.');
