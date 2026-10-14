// Positive checks on what the repository may contain. Everything here compares against what is
// declared (the token build, tokens/vocabulary.json, src/base/utilities.json), never against a
// list of forbidden words.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PREFIX = '--syn-';
const HASHED_CLASS = /^_?[A-Za-z0-9_-]{8}$/;

export function walk(dir, accept, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, accept, out);
    else if (accept(path)) out.push(path);
  }
  return out;
}

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Colour literals: hex, and the colour functions. Keywords such as transparent and currentColor are not literals. */
export function checkColourLiterals(files) {
  const problems = [];
  const re = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g;
  for (const { path, text } of files) {
    const body = extname(path) === '.css' ? stripComments(text) : text.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const line of body.split('\n').entries()) {
      const [i, content] = line;
      const stripped = content.replace(/href="#[^"]*"/g, '').replace(/url\(#[^)]*\)/g, '');
      if (re.test(stripped)) problems.push(`${path}:${i + 1}: colour literal outside generated tokens`);
      re.lastIndex = 0;
    }
  }
  return problems;
}

/** Custom properties: declared only by the token build; used ones must be defined there, with the prefix. */
export function checkCustomProperties(cssFiles, definedByTokens) {
  const problems = [];
  for (const { path, text } of cssFiles) {
    const css = stripComments(text);
    for (const m of css.matchAll(/(^|[{;\s])(--[A-Za-z0-9_-]+)\s*:/g)) {
      problems.push(`${path}: declares ${m[2]}; custom properties come only from the token build`);
    }
    for (const m of css.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)) {
      const name = m[1];
      if (!name.startsWith(PREFIX)) problems.push(`${path}: uses ${name}, which is not prefixed ${PREFIX}`);
      else if (!definedByTokens.has(name)) problems.push(`${path}: uses ${name}, which the token build does not define`);
    }
  }
  return problems;
}

/** Custom properties inside TypeScript and TSX (inline styles). */
export function checkInlineCustomProperties(files, definedByTokens) {
  const problems = [];
  for (const { path, text } of files) {
    for (const m of text.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)(\$\{)?/g)) {
      const name = m[1];
      if (!name.startsWith(PREFIX)) problems.push(`${path}: uses ${name}, which is not prefixed ${PREFIX}`);
      // A name built from a template ends before the interpolation: some defined name must start with it.
      else if (m[2] ? ![...definedByTokens].some((d) => d.startsWith(name)) : !definedByTokens.has(name)) problems.push(`${path}: uses ${name}, which the token build does not define`);
    }
  }
  return problems;
}

/** Class selectors. Source: only CSS Module files may style classes, unless the class is a declared utility. Build output: hashed or declared. */
export function checkClasses(cssFiles, utilities, { built }) {
  const problems = [];
  const allowed = new Set(utilities);
  for (const { path, text } of cssFiles) {
    if (!built && path.endsWith('.module.css')) continue;
    const css = stripComments(text).replace(/@font-face\s*{[^}]*}/g, '').replace(/"[^"]*"|'[^']*'/g, '""');
    for (const m of css.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)) {
      const name = m[1];
      if (allowed.has(name)) continue;
      if (built ? HASHED_CLASS.test(name) : false) continue;
      if (/^\d/.test(name)) continue;
      problems.push(`${path}: class .${name} is neither a ${built ? 'hashed module class' : 'module class'} nor a declared utility`);
    }
  }
  return problems;
}

/** data-* attributes: only data-syn-*. Looks where an attribute can appear: JSX, selectors, setAttribute and dataset. */
export function checkDataAttributes(files, thirdParty = []) {
  const problems = [];
  const patterns = [
    /(?<=\s)(data-[a-z][a-z0-9-]*)(?=\s*=|\s|\/|>|\})/g,
    /\[(data-[a-z][a-z0-9-]*)/g,
    /(?:setAttribute|getAttribute|hasAttribute|removeAttribute)\(\s*['"](data-[a-z][a-z0-9-]*)/g,
  ];
  for (const { path, text } of files) {
    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        const name = m[1];
        if (name.startsWith('data-syn-') || thirdParty.includes(name)) continue;
        problems.push(`${path}: attribute ${name} is not data-syn-*`);
      }
    }
    for (const m of text.matchAll(/dataset\.([A-Za-z]+)/g)) {
      if (!m[1].startsWith('syn')) problems.push(`${path}: dataset.${m[1]} is not data-syn-*`);
    }
  }
  return problems;
}

/** Token names: every path element must be declared in the vocabulary. */
export function checkVocabulary(vocabulary, trees) {
  const problems = [];
  const visit = (file, node, path) => {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      if (v && typeof v === 'object' && '$value' in v) {
        const [category, ...elements] = [...path, k];
        const rule = vocabulary.categories[category];
        if (!rule) { problems.push(`${file}: unknown category ${category}`); continue; }
        for (const el of elements) {
          const bare = el.replace(/-\d+$/, '');
          const numeric = /^\d+$/.test(el) && rule.numbers;
          if (!(rule.elements.includes(el) || numeric || (rule.numbers && rule.elements.includes(bare)))) {
            problems.push(`${file}: ${[category, ...elements].join('.')} uses undeclared word "${el}"`);
          }
        }
      } else if (v && typeof v === 'object') visit(file, v, [...path, k]);
    }
  };
  for (const { path, json } of trees) visit(path, json, []);
  return problems;
}

const readAll = (paths) => paths.map((path) => ({ path, text: readFileSync(path, 'utf8') }));

export function run(root, { buildDir } = {}) {
  const rel = (p) => relative(root, p);
  const generated = join(root, 'src', 'generated');
  const tokensCss = join(generated, 'tokens.css');
  if (!existsSync(tokensCss)) throw new Error('src/generated/tokens.css is missing; run the token build first');
  const defined = new Set([...readFileSync(tokensCss, 'utf8').matchAll(/(--syn-[A-Za-z0-9-]+)\s*:/g)].map((m) => m[1]));

  const notGenerated = (p) => !p.startsWith(generated);
  const srcFiles = walk(join(root, 'src'), (p) => /\.(css|ts|tsx)$/.test(p) && notGenerated(p));
  const css = readAll(srcFiles.filter((p) => p.endsWith('.css'))).map((f) => ({ ...f, path: rel(f.path) }));
  const code = readAll(srcFiles.filter((p) => /\.tsx?$/.test(p))).map((f) => ({ ...f, path: rel(f.path) }));

  const utilitiesPath = join(root, 'src', 'base', 'utilities.json');
  const utilities = existsSync(utilitiesPath) ? JSON.parse(readFileSync(utilitiesPath, 'utf8')).classes ?? [] : [];

  const vocabulary = JSON.parse(readFileSync(join(root, 'tokens', 'vocabulary.json'), 'utf8'));
  const trees = walk(join(root, 'tokens'), (p) => /tokens[/\\](semantic|themes)[/\\].*\.json$/.test(p) || p.endsWith(join('primitives', 'figure-face.json')))
    .map((p) => ({ path: rel(p), json: JSON.parse(readFileSync(p, 'utf8')) }));

  const problems = [
    ...checkColourLiterals([...css, ...code]),
    ...checkCustomProperties(css, defined),
    ...checkInlineCustomProperties(code, defined),
    ...checkClasses(css, utilities, { built: false }),
    ...checkDataAttributes(code),
    ...checkVocabulary(vocabulary, trees),
  ];

  if (buildDir) {
    const built = readAll(walk(buildDir, (p) => p.endsWith('.css')).filter((p) => !p.includes('tokens'))).map((f) => ({ ...f, path: rel(f.path) }));
    problems.push(...checkClasses(built, utilities, { built: true }));
    problems.push(...checkCustomProperties(built, defined).filter((x) => !x.includes('declares')));
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const buildFlag = process.argv.indexOf('--build');
  const problems = run(root, { buildDir: buildFlag > -1 ? join(root, process.argv[buildFlag + 1]) : undefined });
  if (problems.length) {
    console.error(`${problems.length} allowlist problem(s):\n${problems.join('\n')}`);
    process.exit(1);
  }
  console.log('allowlist checks passed');
}
