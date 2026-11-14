import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { validateStaticBuild } from '../scripts/check-static.mjs';

const temp = mkdtempSync(join(tmpdir(), 'imob-review-'));
writeFileSync(join(temp, 'package.json'), '{"type":"module"}');
for (const file of ['frames', 'reveal']) {
  const source = readFileSync(new URL('../src/lib/' + file + '.ts', import.meta.url), 'utf8');
  writeFileSync(join(temp, file + '.js'), ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText);
}
after(() => rmSync(temp, { recursive: true, force: true }));
const { createFrameScheduler } = await import(pathToFileURL(join(temp, 'frames.js')).href);
const { observeReveals } = await import(pathToFileURL(join(temp, 'reveal.js')).href);

function frameHost() {
  let next = 0;
  const pending = new Map();
  return {
    pending,
    request(callback) { const id = next++; pending.set(id, callback); return id; },
    cancel(id) { pending.delete(id); },
    flush() {
      const queued = [...pending.values()]; pending.clear();
      queued.forEach(callback => callback(100));
    },
  };
}
test('redimensionamento e animação não criam ciclos de renderização paralelos', () => {
  const host = frameHost();
  let draws = 0;
  const frames = createFrameScheduler(() => {
    draws++;
    frames.request(); // pedido do redimensionamento adaptativo
    frames.request(); // pedido da continuação da animação
  }, host);
  frames.request(); frames.request(); frames.request();
  assert.equal(host.pending.size, 1);
  host.flush();
  assert.equal(draws, 1);
  assert.equal(host.pending.size, 1);
  host.flush();
  assert.equal(draws, 2);
  assert.equal(host.pending.size, 1);
  frames.cancel();
});
test('cancelar o quadro impede desenho após pausa e permite retomada', () => {
  const host = frameHost();
  let draws = 0;
  const frames = createFrameScheduler(() => draws++, host);
  frames.request(); frames.cancel(); host.flush();
  assert.equal(draws, 0);
  frames.request(); host.flush();
  assert.equal(draws, 1);
});

function mockObservers(t, intersection) {
  const originals = new Map(['IntersectionObserver', 'MutationObserver'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const state = { observed: new Set(), removed: [], disconnected: 0, mutationsDisconnected: false };
  class Intersections {
    constructor(callback) { state.intersect = callback; }
    observe(target) { state.observed.add(target); }
    unobserve(target) { state.observed.delete(target); state.removed.push(target); }
    disconnect() { state.observed.clear(); state.disconnected++; }
  }
  class Mutations {
    constructor(callback) { state.mutate = callback; }
    observe() {}
    disconnect() { state.mutationsDisconnected = true; }
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', { configurable: true, value: intersection ? Intersections : undefined });
  Object.defineProperty(globalThis, 'MutationObserver', { configurable: true, value: Mutations });
  t.after(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  return state;
}
function target() {
  const classes = new Set();
  return { isConnected: true, classes, classList: { add(name) { classes.add(name); } } };
}
test('filtrar o catálogo libera os alvos removidos e evita observação duplicada', t => {
  const state = mockObservers(t, true);
  const first = target(), second = target();
  let nodes = [first];
  const stop = observeReveals({ querySelectorAll: () => nodes.filter(node => !node.classes.has('in')) });
  state.mutate();
  assert.equal(state.observed.size, 1);
  first.isConnected = false; nodes = [second]; state.mutate();
  assert.ok(state.removed.includes(first));
  assert.ok(!state.observed.has(first));
  assert.ok(state.observed.has(second));
  state.intersect([{ target: second, isIntersecting: true }]);
  assert.ok(second.classes.has('in'));
  assert.equal(state.observed.size, 0);
  stop();
  assert.equal(state.disconnected, 1);
  assert.equal(state.mutationsDisconnected, true);
});
test('sem IntersectionObserver, novos resultados continuam visíveis', t => {
  const state = mockObservers(t, false);
  const first = target(), second = target();
  const nodes = [first];
  const stop = observeReveals({ querySelectorAll: () => nodes.filter(node => !node.classes.has('in')) });
  assert.ok(first.classes.has('in'));
  nodes.push(second); state.mutate();
  assert.ok(second.classes.has('in'));
  stop();
  assert.equal(state.mutationsDisconnected, true);
});

function buildFixture(name) {
  const root = join(temp, name);
  mkdirSync(join(root, 'assets'), { recursive: true });
  writeFileSync(join(root, 'index.html'), '<script type="module" src="/assets/main.js"></script>');
  writeFileSync(join(root, 'assets/main.js'), 'import("./lazy.js")');
  writeFileSync(join(root, 'assets/lazy.js'), 'export const ok = true;');
  return root;
}
test('verificação estática aceita recursos locais e valida imports tardios', () => {
  const root = buildFixture('valid');
  assert.equal(validateStaticBuild(root), 3);
  rmSync(join(root, 'assets/lazy.js'));
  assert.throws(() => validateStaticBuild(root), /Referência ausente/);
});
test('verificação estática rejeita fontes, mapas e material privado', () => {
  for (const name of ['.env', 'debug.map', 'deploy.sh']) {
    const root = buildFixture(name.replace(/\W/g, '_'));
    writeFileSync(join(root, 'assets', name), 'não publicar');
    assert.throws(() => validateStaticBuild(root));
  }
  const root = buildFixture('source');
  mkdirSync(join(root, 'src')); writeFileSync(join(root, 'src/main.ts'), 'não publicar');
  assert.throws(() => validateStaticBuild(root), /Caminho não autorizado/);
});
test('verificação estática rejeita symlinks', { skip: process.platform === 'win32' }, () => {
  const root = buildFixture('symlink');
  symlinkSync(join(root, 'index.html'), join(root, 'assets/linked.html'));
  assert.throws(() => validateStaticBuild(root), /Link simbólico/);
});
test('verificação estática rejeita scripts inline e recursos externos', () => {
  for (const [name, html] of [['inline', '<script>alert(1)</script>'], ['external', '<script src="https://example.com/app.js"></script>']]) {
    const root = buildFixture(name);
    writeFileSync(join(root, 'index.html'), html);
    assert.throws(() => validateStaticBuild(root));
  }
});

test('verificação estática detecta fontes ausentes referenciadas pelo CSS', () => {
  const root = buildFixture('font');
  writeFileSync(join(root, 'assets/style.css'), '@font-face{src:url(/fonts/demo.woff2)}');
  assert.throws(() => validateStaticBuild(root), /Referência ausente/);
  mkdirSync(join(root, 'fonts')); writeFileSync(join(root, 'fonts/demo.woff2'), 'fixture');
  assert.equal(validateStaticBuild(root), 5);
});
