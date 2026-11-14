import assert from 'node:assert/strict';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const folders = new Set(['assets', 'brand', 'fonts', 'hero', 'imoveis', 'panorama', 'licenses']);
const rootFiles = new Set(['index.html', 'theme-init.js', 'robots.txt']);
const extensions = new Set(['.html', '.js', '.css', '.svg', '.webp', '.woff2', '.txt', '.md']);
const privateMaterial = /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]+|AKIA[A-Z0-9]{16}/;

export function validateStaticBuild(directory, requiredAssets = []) {
  const root = resolve(directory);
  const files = new Set();
  const walk = path => {
    const stat = lstatSync(path);
    const name = relative(root, path).split(sep).join('/');
    assert.ok(!stat.isSymbolicLink(), `Link simbólico no build: ${name || '.'}`);
    if (name) {
      assert.ok(!name.split('/').some(part => part.startsWith('.')), `Arquivo oculto no build: ${name}`);
      assert.ok(folders.has(name.split('/')[0]) || rootFiles.has(name), `Caminho não autorizado no build: ${name}`);
    }
    if (stat.isDirectory()) {
      for (const entry of readdirSync(path)) walk(join(path, entry));
      return;
    }
    assert.ok(stat.isFile() && extensions.has(extname(name)), `Tipo de arquivo não autorizado: ${name}`);
    files.add(name);
    if (['.js', '.css', '.html', '.svg', '.txt', '.md'].includes(extname(name))) {
      const text = readFileSync(path, 'utf8');
      assert.ok(!privateMaterial.test(text), `Possível credencial no build: ${name}`);
      assert.ok(!/sourceMappingURL\s*=/.test(text), `Source map embutido no build: ${name}`);
      if (name.endsWith('.svg')) {
        assert.ok(!/<(?:script|foreignObject)\b|\son\w+\s*=|\bhref\s*=\s*["'](?!#)/i.test(text), `SVG ativo ou com referência externa: ${name}`);
      }
    }
  };
  walk(root);
  assert.ok(files.has('index.html'), 'Build sem index.html');

  const requireFile = (url, from = root) => {
    const path = resolve(from, decodeURIComponent(url.split(/[?#]/, 1)[0]));
    const name = relative(root, path);
    assert.ok(name !== '..' && !name.startsWith('..' + sep) && !name.startsWith(sep), `Referência fora do build: ${url}`);
    assert.ok(files.has(name.split(sep).join('/')), `Referência ausente no build: ${url}`);
  };
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.ok(!/<style\b|\son\w+\s*=/i.test(html), 'HTML contém estilo ou evento inline incompatível com a CSP');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    assert.ok(/\bsrc\s*=/.test(match[1]) && !match[2].trim(), 'HTML contém script inline');
  }
  for (const [, url] of html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) {
    assert.ok(url.startsWith('/') && !url.startsWith('//'), `Recurso externo ou relativo no HTML: ${url}`);
    requireFile('.' + url);
  }
  for (const name of files) {
    if (name.endsWith('.css')) {
      const css = readFileSync(join(root, name), 'utf8');
      for (const [, url] of css.matchAll(/url\(\s*["']?([^"'()\s]+)["']?\s*\)/g)) {
        if (url.startsWith('#') || url.startsWith('data:image/')) continue;
        assert.ok(!/^(?:[a-z]+:)?\/\//i.test(url), `Recurso externo no CSS: ${url}`);
        requireFile(url.startsWith('/') ? '.' + url : url, url.startsWith('/') ? root : dirname(join(root, name)));
      }
    }
    if (!name.endsWith('.js')) continue;
    const text = readFileSync(join(root, name), 'utf8');
    for (const [, url] of text.matchAll(/(?:from\s*|import\s*\(\s*)["'](\.[^"']+\.js)["']/g)) {
      requireFile(url, dirname(join(root, name)));
    }
  }
  for (const asset of requiredAssets) requireFile(asset);
  return files.size;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const project = fileURLToPath(new URL('../', import.meta.url));
  const photos = JSON.parse(readFileSync(join(project, 'docs/FOTOS.json'), 'utf8'));
  const hero = JSON.parse(readFileSync(join(project, 'docs/HERO.json'), 'utf8'));
  const assets = photos.flatMap(photo => [640, 1200].map(width => `imoveis/${photo.arquivo}-${width}.webp`));
  for (const shape of ['wide', 'medium', 'tall']) {
    for (const theme of ['dia', 'noite']) assets.push(`hero/abertura-${shape}-${theme}-v${hero.versao}.webp`);
  }
  assets.push('panorama/interior-360.webp', 'fonts/OFL.txt', 'licenses/react-LICENSE.txt', 'licenses/react-dom-LICENSE.txt', 'licenses/scheduler-LICENSE.txt', 'licenses/three-LICENSE.txt');
  const total = validateStaticBuild(process.argv[2] ?? join(project, 'dist'), assets);
  console.log(`Build estático verificado: ${total} arquivos, referências locais presentes e nenhum arquivo privado detectado.`);
}
