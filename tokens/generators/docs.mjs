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

// ---- colour blocks ----

const swatch = (hexValue) => `\`${hexValue}\``;

function flatten(obj, path = []) {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && '$value' in v) out.push({ path: [...path, k], value: v.$value });
    else if (v && typeof v === 'object') out.push(...flatten(v, [...path, k]));
  }
  return out;
}

export function colourBlocks(themes) {
  const [night, tide] = themes;
  const flat = (t) => new Map(flatten(t.tokens.color).map((e) => [e.path.join('-'), e.value]));
  const n = flat(night);
  const w = flat(tide);
  const roleRows = [...n.keys()].map((k) => [`\`color-${k}\``, swatch(n.get(k)), swatch(w.get(k))]);

  const group = (id) => id.replace(/ on (surface-\w+|signal-\w+-tint|accent-\w+|data-surface|accent-tint|surface-inverse)$/, '').replace(/^(data-(cat|seq|div))-.+$/, '$1-*');
  const summarise = (theme) => {
    const map = new Map();
    for (const c of theme.checks.filter((x) => x.kind === 'required')) {
      const g = group(c.id);
      const cur = map.get(g);
      if (!cur || c.ratio < cur.ratio) map.set(g, { ratio: c.ratio, target: c.target, pass: c.pass });
      else if (!c.pass) cur.pass = false;
    }
    return map;
  };
  const sn = summarise(night);
  const sw = summarise(tide);
  const contrastRows = [...sn.keys()].map((g) => {
    const a = sn.get(g); const b = sw.get(g);
    return [`${g}`, `${a.target}:1`, `${a.ratio.toFixed(2)}`, `${b.ratio.toFixed(2)}`, a.pass && b.pass ? 'pass' : 'FAIL'];
  });
  const checkCount = (t) => `${t.checks.filter((c) => c.kind === 'required').length} required pairs`;

  const info = [...night.checks, ...tide.checks].filter((c) => c.kind === 'informational')
    .map((c) => [c.theme, c.id, c.target, c.ratio.toFixed(2)]);

  const rampRows = night.ramps.neutral.map((s, i) => [
    i, lchL(night, i), swatch(hexOf(night.ramps.neutral[i].color)), swatch(hexOf(night.ramps.brand[i].color)),
    swatch(hexOf(tide.ramps.neutral[i].color)), swatch(hexOf(tide.ramps.brand[i].color)),
  ]);

  const grounds = [night, tide].map((t) => t.tokens.data.surface.$value);
  const catRows = Object.keys(night.tokens.data.cat).map((k) => [
    `\`data-cat-${k}\``, `${Math.round(night.palette.hues[k - 1])}°`,
    swatch(night.tokens.data.cat[k].$value), night.checks.find((c) => c.id === `data-cat-${k} on data-surface`).ratio.toFixed(2),
    swatch(tide.tokens.data.cat[k].$value), tide.checks.find((c) => c.id === `data-cat-${k} on data-surface`).ratio.toFixed(2),
  ]);

  const views = ['normal', 'protanopia', 'deuteranopia', 'tritanopia'];
  const closest = (t, v) => {
    const p = t.palette.pairs.reduce((a, b) => (b[v] < a[v] ? b : a));
    return `${p.a}–${p.b}`;
  };
  const cvdRows = views.map((v) => [
    v, night.palette.thresholds[v].toFixed(2),
    night.palette.minByView[v].toFixed(3), closest(night, v), tide.palette.minByView[v].toFixed(3), closest(tide, v),
    night.palette.minByView[v] >= night.palette.thresholds[v] && tide.palette.minByView[v] >= tide.palette.thresholds[v] ? 'pass' : 'FAIL',
  ]);
  const changeRows = views.map((v) => [
    v, night.palette.change.byView[v].toFixed(3), tide.palette.change.byView[v].toFixed(3),
  ]);
  const seqDivRows = [
    ['Sequential, smallest step between neighbours', Math.min(...night.palette.seqSteps).toFixed(3), Math.min(...tide.palette.seqSteps).toFixed(3), (2 * night.palette.jnd).toFixed(2)],
    ['Diverging, smallest step between neighbours', Math.min(...night.palette.divSteps).toFixed(3), Math.min(...tide.palette.divSteps).toFixed(3), (2 * night.palette.jnd).toFixed(2)],
    ['Diverging, outer cool vs outer warm, worst view', Math.min(...Object.values(night.palette.divAcross)).toFixed(3), Math.min(...Object.values(tide.palette.divAcross)).toFixed(3), (4 * night.palette.jnd).toFixed(2)],
  ];
  const zoneRows = night.zoneRows.map((r, i) => [
    r.name, `${r.hue.toFixed(1)}° / ${tide.zoneRows[i].hue.toFixed(1)}°`,
    `${r.distancePositive}° / ${tide.zoneRows[i].distancePositive}°`, `${r.distanceNegative}° / ${tide.zoneRows[i].distanceNegative}°`,
  ]);

  return {
    'role-table': table(['Token', 'night', 'tidewater'], roleRows),
    'contrast-table': table(['Pair (worst surface)', 'Target', 'night', 'tidewater', 'Result'], contrastRows),
    'contrast-count': `night: ${checkCount(night)}; tidewater: ${checkCount(tide)}.`,
    'contrast-info': table(['Theme', 'Pair (reported only)', 'Guide ratio', 'Measured'], info),
    'ramp-table': table(['Step i', 'L(i)', 'night neutral', 'night brand', 'tidewater neutral', 'tidewater brand'], rampRows),
    'cat-table': table(['Token', 'Hue (both themes)', 'night', 'vs ground', 'tidewater', 'vs ground'], catRows),
    'cat-line-table': table(['View', 'Required', 'night min', 'tidewater min', 'Result'], views.map((v) => [
      v, night.palette.thresholds[v].toFixed(2), night.palette.lineMinByView[v].toFixed(3), tide.palette.lineMinByView[v].toFixed(3),
      night.palette.lineMinByView[v] >= night.palette.thresholds[v] && tide.palette.lineMinByView[v] >= tide.palette.thresholds[v] ? 'pass' : 'FAIL',
    ])),
    'cat-hue-separation': `${Math.round(Math.min(night.palette.hueSeparation, tide.palette.hueSeparation))}°`,
    'cvd-table': table(['View', 'Required', 'night min', 'closest pair', 'tidewater min', 'closest pair', 'Result'], cvdRows),
    'change-table': table(['View', 'night', 'tidewater'], changeRows),
    'seqdiv-table': table(['Measure', 'night', 'tidewater', 'Required'], seqDivRows),
    'zone-table': table(['Hue', 'night / tidewater', 'Distance to positive', 'Distance to negative'], zoneRows),
    'ground-values': `night \`${grounds[0]}\`, tidewater \`${grounds[1]}\``,
  };
}
import { formatHex, converter } from 'culori';
const hexOf = (c) => formatHex(c);
const lchL = (t, i) => converter('oklch')(t.ramps.neutral[i].color).l.toFixed(3);
