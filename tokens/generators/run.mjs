import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { computeScales, measureFonts } from './scales.mjs';
import { scalesToDtcg } from './emit.mjs';
import { fillBlocks, scaleBlocks } from './docs.mjs';

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

fillBlocks(join(root, 'FOUNDATIONS.md'), {
  ...scaleBlocks(scales, inputs),
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
console.log('generated');
