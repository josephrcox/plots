// Browser globals the game code touches at import time, plus a seedable
// Math.random. Loaded before anything else (esbuild --inject).
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
globalThis.window = globalThis;
globalThis.innerWidth = 1400;
globalThis.location = { search: "", href: "http://localhost/", reload() {} };
globalThis.history = { replaceState() {} };
globalThis.addEventListener = () => {};
globalThis.document = { visibilityState: "visible", addEventListener() {} };

// Deferred callbacks (tutorial step advance); the harness flushes them.
globalThis.__timers = [];
globalThis.setTimeout = (fn) => {
  if (fn && fn.name !== "flushSave") globalThis.__timers.push(fn);
  return 0;
};
globalThis.clearTimeout = () => {};

let s = 1;
export function seed(n) {
  s = n >>> 0 || 1;
}
Math.random = function () {
  // mulberry32
  s = (s + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
globalThis.__seed = seed;
