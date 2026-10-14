// Fills the generated blocks of FOUNDATIONS.md. A block is delimited by
// <!-- generated:NAME --> and <!-- /generated:NAME -->.
import { readFileSync, writeFileSync } from 'node:fs';

export function fillBlocks(path, blocks) {
  let text = readFileSync(path, 'utf8');
  for (const [name, body] of Object.entries(blocks)) {
    const re = new RegExp(`(<!-- generated:${name} -->\\n)[\\s\\S]*?(<!-- /generated:${name} -->)`);
    if (!re.test(text)) {
      console.warn(`skipped ${name}: no such block in ${path}`);
      continue;
    }
    text = text.replace(re, (_, open, close) => `${open}${body}\n${close}`);
  }
  writeFileSync(path, text);
}

export const table = (head, rows) =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

const px = (n, d = 0) => `${n.toFixed(d)} px`;

export function scaleBlocks(s, inputs) {
  const typeRows = Object.entries(s.type).map(([n, t]) => [
    `\`${n}\``, t.step, t.family === 'figure' ? 'figure' : 'ui', t.weight, px(t.sizePx), `${t.sizeRem}`,
    px(t.lineHeightPx), t.leadingFactor.toFixed(3), `${t.trackingEm}`,
  ]);
  const spaceRows = Object.entries(s.space).map(([n, v]) => [`\`${n}\``, px(v.px), `${v.rem}`]);
  const radiusRows = Object.entries(s.radius).map(([n, v]) => [`\`${n}\``, v.css ?? px(v.px), v.css ? '—' : `${v.rem}`]);
  const layoutRows = Object.entries(s.layout).map(([n, v]) => [`\`${n}\``, px(v.px), `${v.rem}`]);
  const elevRows = Object.entries(s.elevation).map(([n, e]) => [
    `\`${n}\``, `0 ${e.yPx} ${e.blurPx} ${e.spreadPx} @ ${e.alpha}`, `0 ${e.yTightPx} ${e.blurTightPx} 0 @ ${e.alphaTight}`,
  ]);
  const motionRows = [
    ...Object.entries(s.motion).map(([n, ms]) => [`\`${n}\``, `${ms} ms`]),
    ...Object.entries(s.easing).map(([n, v]) => [`\`${n}\``, `cubic-bezier(${v.join(', ')})`]),
  ];
  const bpRows = Object.entries(s.breakpoints).map(([n, v]) => [`\`${n}\``, px(v.px), `${v.rem}`]);
  const iconRows = Object.entries(s.icon).map(([n, v]) => [`\`${n}\``, px(v.px), `${v.rem}`]);
  const w = s.layout['focus-ring-width'].px;
  const tau = inputs.colour.stepRatio;
  const chartRows = [
    ['Stroke width `w`', '`focus-ring-width`', px(w)],
    ['Dash pattern for projections', '(3w, 2w)', `${3 * w} px on, ${2 * w} px off`],
    ['Marker diameter', '3w', px(3 * w)],
    ['Markers appear when point spacing is at least', '9w', px(9 * w)],
    ['Hatch stripe spacing for missing data', '3w', px(3 * w)],
    ['Band opacity `α`', 'τ⁻⁸', (tau ** -8).toFixed(3)],
    ['Nested bands, innermost to outermost', 'α · τ⁻ᵏ, k = 0, 1, 2', [0, 1, 2].map((k) => (tau ** -8 * tau ** -k).toFixed(3)).join(', ')],
    ['Opacity of series that are not hovered', 'τ⁻⁵', (tau ** -5).toFixed(3)],
    ['Default chart height', '`module-min` · σ⁻¹', px(Math.round(s.layout['module-min'].px / inputs.layout.ratio))],
    ['Tooltip offset from the pointer', '`space(3)`', px(s.space['space-3'].px)],
  ];
  return {
    'chart-table': table(['Quantity', 'Formula', 'Value'], chartRows),
    'type-table': table(['Role', 'Step k', 'Face', 'Weight', 'Size', 'Size (rem)', 'Line height', 'λ(k)', 'Tracking (em)'], typeRows),
    'space-table': table(['Token', 'Value', 'rem'], spaceRows),
    'radius-table': table(['Token', 'Value', 'rem'], radiusRows),
    'layout-table': table(['Token', 'Value', 'rem'], layoutRows),
    'elevation-table': table(['Token', 'Broad layer (y blur spread @ alpha)', 'Tight layer'], elevRows),
    'motion-table': table(['Token', 'Value'], motionRows),
    'icon-table': table(['Token', 'Value', 'rem'], iconRows),
    'breakpoint-table': table(['Token', 'Value', 'rem'], bpRows),
  };
}
