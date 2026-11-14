import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Compila apenas módulos puros, sem navegador ou dependências adicionais de teste.
const temp = mkdtempSync(join(tmpdir(), 'imob-tests-'));
writeFileSync(join(temp, 'package.json'), '{"type":"commonjs"}');
for (const file of ['data/imoveis', 'lib/catalogo', 'lib/retorno', 'hero3d/trilho', 'hero3d/cicloCeleste']) {
  const dest = join(temp, file + '.js');
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, ts.transpileModule(readFileSync(new URL('../src/' + file + '.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText);
}
after(() => rmSync(temp, { recursive: true, force: true }));
const require = createRequire(import.meta.url);
const { IMOVEIS } = require(join(temp, 'data/imoveis.js'));
const { filtrar, tipoValido } = require(join(temp, 'lib/catalogo.js'));
const { lerRetorno } = require(join(temp, 'lib/retorno.js'));
const { criarTrilho } = require(join(temp, 'hero3d/trilho.js'));
const { cicloCeleste } = require(join(temp, 'hero3d/cicloCeleste.js'));

test('busca aceita código sem diferenciar caixa e espaços', () => {
  assert.deepEqual(filtrar({ tipo: 'todos', codigo: ' cas001 ' }).map(i => i.codigo), ['CAS001']);
});
test('busca combina tipo e termo e ignora acentos', () => {
  const item = IMOVEIS.find(i => /[áéíóúãõâêôç]/i.test(i.titulo));
  assert.ok(item);
  const termo = item.titulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  assert.ok(filtrar({ tipo: item.tipo, codigo: termo }).some(i => i.codigo === item.codigo));
  const outroTipo = IMOVEIS.find(i => i.tipo !== item.tipo).tipo;
  assert.equal(filtrar({ tipo: outroTipo, codigo: item.codigo }).length, 0);
});
test('parâmetros desconhecidos não eliminam o catálogo', () => {
  assert.equal(tipoValido('invalido'), 'todos');
  assert.equal(tipoValido(null), 'todos');
  assert.equal(filtrar({ tipo: 'todos', codigo: '' }).length, IMOVEIS.length);
});
test('a demonstração 360 é a primeira e os códigos são únicos', () => {
  assert.equal(IMOVEIS[0].codigo, 'DEM360');
  assert.equal(IMOVEIS[0].tour360, true);
  assert.ok(IMOVEIS[0].fotos[0].startsWith('panorama:'));
  assert.equal(new Set(IMOVEIS.map(i => i.codigo)).size, IMOVEIS.length);
});
test('retorno do tour rejeita registros corrompidos ou fora das rotas', () => {
  for (const value of [null, 'quebrado', '1', '{}', '{"caminho":"/tour360","y":10}', '{"caminho":"/","y":-1}', '{"caminho":"/","y":"40"}']) assert.equal(lerRetorno(value), null);
  assert.deepEqual(lerRetorno('{"caminho":"/imoveis","y":450}'), { caminho: '/imoveis', y: 450 });
});
test('câmera tem valores finitos e percorre a porta nos dois formatos', () => {
  for (const layout of ['wide', 'tall']) {
    const trilho = criarTrilho(layout);
    const q = { pos: [0,0,0], alvo: [0,0,0], fov: 0, sx: 0, sy: 0, exp: 0 };
    for (let step = 0; step <= 1000; step++) {
      trilho(step / 1000, q);
      assert.ok([...q.pos, ...q.alvo, q.fov, q.sx, q.sy, q.exp].every(Number.isFinite));
      assert.ok(q.fov > 0 && q.fov < 180);
      assert.ok(Math.hypot(...q.pos.map((v, i) => v - q.alvo[i])) > 0.1);
    }
    trilho(0.85, q);
    assert.ok(q.pos[0] > -0.345 && q.pos[0] < 0.945);
    assert.ok(q.pos[2] < 1.27);
    trilho(0, q); const start = structuredClone(q);
    trilho(-1, q); assert.deepEqual(q, start);
    trilho(1, q); const end = structuredClone(q);
    trilho(2, q); assert.deepEqual(q, end);
  }
});

test('ciclo celeste mantém direções normalizadas e alterna os astros em sequência', () => {
  const q = { sol: [0,0,0], lua: [0,0,0], luzSol: 0, luzLua: 0, estrelas: 0, crepusculo: 0 };
  cicloCeleste(0, q);
  assert.ok(q.sol[1] > 0 && q.lua[1] < 0);
  assert.equal(q.luzSol, 1);
  assert.equal(q.luzLua, 0);
  let anterior = structuredClone(q);
  for (let step = 1; step <= 1000; step++) {
    cicloCeleste(step / 1000, q);
    for (const vetor of [q.sol, q.lua]) assert.ok(Math.abs(Math.hypot(...vetor) - 1) < 1e-12);
    assert.ok(q.sol[1] <= anterior.sol[1]);
    assert.ok(q.lua[1] >= anterior.lua[1]);
    assert.ok(q.luzSol <= anterior.luzSol && q.luzLua >= anterior.luzLua);
    anterior = structuredClone(q);
  }
  assert.ok(q.sol[1] < 0 && q.lua[1] > 0);
  assert.equal(q.luzSol, 0);
  assert.equal(q.luzLua, 1);
  assert.equal(q.estrelas, 1);
  const noite = structuredClone(q);
  cicloCeleste(0, q);
  cicloCeleste(1, q);
  assert.deepEqual(q, noite);
  cicloCeleste(1, q, true);
  assert.ok(q.lua[1] > 0 && q.lua[1] < noite.lua[1]);
  assert.ok(Math.abs(Math.hypot(...q.lua) - 1) < 1e-12);
});
