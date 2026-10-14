import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { formatHex } from 'culori';
import { computeScales, measureFonts } from './scales.mjs';
import { scalesToDtcg } from './emit.mjs';
import { fillBlocks, scaleBlocks, colourBlocks } from './docs.mjs';
import { buildTheme, planCategoricalHues } from './themes.mjs';
import { lch } from './colour.mjs';
import { writeCss } from './css.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const inputs = JSON.parse(readFileSync(join(here, 'inputs.json'), 'utf8'));
const metrics = measureFonts();
const scales = computeScales(inputs, metrics);

const write = (rel, data) => {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
};

write('tokens/semantic/scales.json', scalesToDtcg(scales));
write('tokens/primitives/figure-face.json', {
  family: {
    ui: { $type: 'fontFamily', $value: ['Poppins', 'system-ui', 'sans-serif'] },
    figure: { $type: 'fontFamily', $value: ['Syn Figure', 'Inter Variable', 'system-ui', 'sans-serif'] },
  },
  figure: {
    'size-adjust': { $type: 'number', $value: scales.figureFace.sizeAdjustPercent / 100 },
    'feature-settings': { $type: 'string', $value: scales.figureFace.featureSettings },
  },
});

const seeds = JSON.parse(readFileSync(join(root, 'tokens', 'primitives', 'seeds.json'), 'utf8'));
const polarity = { night: 'dark', tidewater: 'light' };
const zoneOf = (name) => {
  const s = seeds[name];
  return { hp: lch(s['signal-positive-fill'].$value).h, hn: lch(s['signal-negative-fill'].$value).h, hb: lch(s['accent-fill'].$value).h };
};
const hues = planCategoricalHues({ themes: Object.keys(polarity).map(zoneOf), D: 360 / inputs.colour.zoneDivisions, count: inputs.colour.categories });
const themes = Object.keys(polarity).map((name) => buildTheme({
  name, polarity: polarity[name], seeds: seeds[name], rho: inputs.colour.stepRatio, top: inputs.colour.topLightness,
  colourInputs: inputs.colour, hues,
}));
for (const t of themes) write(`tokens/themes/${t.meta.name}.json`, t.tokens);
write('tokens/primitives/ramps.json', Object.fromEntries(themes.map((t) => [t.meta.name, Object.fromEntries(
  Object.entries(t.ramps).map(([k, steps]) => [k, Object.fromEntries(steps.map((x) => [String(x.index), { $type: 'color', $value: formatHex(x.color) }]))]),
)])));

// Vocabulary: every token path element must be declared in tokens/vocabulary.json.
const vocabulary = JSON.parse(readFileSync(join(root, 'tokens', 'vocabulary.json'), 'utf8'));
const walk = (node, path, visit) => {
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object' && '$value' in v) visit([...path, k]);
    else if (v && typeof v === 'object' && !k.startsWith('$')) walk(v, [...path, k], visit);
  }
};
const vocabularyFailures = [];
const checkVocabulary = (file, tree, defaultCategory) => walk(tree, defaultCategory ? [defaultCategory] : [], (path) => {
  const [category, ...elements] = path;
  const rule = vocabulary.categories[category];
  if (!rule) { vocabularyFailures.push(`${file}: unknown category ${category}`); return; }
  for (const el of elements) {
    const bare = el.replace(/-\d+$/, '');
    const numeric = /^\d+$/.test(el) && rule.numbers;
    if (!(rule.elements.includes(el) || numeric || (rule.numbers && rule.elements.includes(bare)))) vocabularyFailures.push(`${file}: ${path.join('.')} uses undeclared element "${el}"`);
  }
});
for (const rel of ['tokens/semantic/scales.json', ...themes.map((t) => `tokens/themes/${t.meta.name}.json`), 'tokens/primitives/figure-face.json']) {
  checkVocabulary(rel, JSON.parse(readFileSync(join(root, rel), 'utf8')));
}

// Validation: every required contrast pair, palette distance and hue-zone rule must hold.
const failures = [...vocabularyFailures];
for (const t of themes) {
  for (const c of t.checks) if (c.kind === 'required' && !c.pass) failures.push(`${t.meta.name}: ${c.id} ${c.ratio} < ${c.target}`);
  for (const h of t.hueChecks) if (!h.pass) failures.push(`${t.meta.name}: ${h.id}`);
  for (const [v, min] of Object.entries(t.palette.minByView)) {
    if (min < t.palette.thresholds[v]) failures.push(`${t.meta.name}: categorical palette ${v} distance ${min.toFixed(3)} < ${t.palette.thresholds[v]}`);
  }
  for (const [v, min] of Object.entries(t.palette.lineMinByView)) {
    if (min < t.palette.thresholds[v]) failures.push(`${t.meta.name}: categorical palette as thin dashed lines, ${v} distance ${min.toFixed(3)} < ${t.palette.thresholds[v]}`);
  }
  const J = t.palette.jnd;
  if (Math.min(...t.palette.seqSteps) < 2 * J) failures.push(`${t.meta.name}: sequential ramp has neighbours closer than 2 JND`);
  if (Math.min(...t.palette.divSteps) < 2 * J) failures.push(`${t.meta.name}: diverging ramp has neighbours closer than 2 JND`);
  for (const [v, d] of Object.entries(t.palette.divAcross)) if (d < 4 * J) failures.push(`${t.meta.name}: diverging ends ${v} distance ${d.toFixed(3)} < 4 JND`);
}

fillBlocks(join(root, 'FOUNDATIONS.md'), {
  ...scaleBlocks(scales, inputs),
  ...colourBlocks(themes),
  'metrics': [
    `| Measure | Poppins | Inter |`,
    `|---|---|---|`,
    `| Capital height, em fraction (mean of H, E, Z, I) | ${metrics.poppinsCapHeight} | ${metrics.interCapHeight} |`,
    `| Figure height, em fraction (mean of 0 to 9) | ${metrics.poppinsDigitTop} | ${metrics.interDigitTop} |`,
    `| Tabular figures available | no (no substitution features) | yes (\`tnum\`) |`,
    `| Digit advance, em fraction | ${metrics.poppinsDigitAdvance.min.toFixed(3)} to ${metrics.poppinsDigitAdvance.max.toFixed(3)} (proportional) | ${metrics.interTabularAdvance.min.toFixed(3)} (fixed with \`tnum\`) |`,
    `| Mean lowercase advance, em fraction | ${metrics.poppinsAverageAdvance} | n/a |`,
  ].join('\n'),
  'derived': [
    `| Quantity | Value |`,
    `|---|---|`,
    `| Base size \`b\` | ${scales.derived.baseSizePx} px |`,
    `| Spacing unit \`u\` | ${scales.derived.unitPx} px |`,
    `| Leading grid \`g\` | ${scales.derived.gridPx} px |`,
    `| Leading excess \`e\` | ${scales.derived.leadingExcess} |`,
    `| Tracking constant \`κ\` | ${scales.derived.trackingKappaEm} em |`,
    `| Figure size adjustment \`a\` | ${scales.figureFace.sizeAdjustPercent} % |`,
  ].join('\n'),
});
writeCss(root, themes.map((t) => ({ name: t.meta.name, polarity: t.meta.polarity })), scales);

if (failures.length) {
  console.error(`validation failed:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('generated; validation passed');
