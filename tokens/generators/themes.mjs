// Builds one theme: semantic colour roles, data palettes and the validation checks.
import {
  asThinLine, ok, hex, hex8, lch, contrast, hueDistance, distance, minViewDistance, viewNames,
  solveLightness, atContrast, ramp,
} from './colour.mjs';

const GEN = (value, description) => ({ $type: 'color', $value: value, ...(description ? { $description: description } : {}) });

/** Hues for the categorical slots, shared by all themes: outside every theme's reserved zones,
 *  the first slot at the accent hue, each next slot as far as possible from those chosen. */
export function planCategoricalHues({ themes, D, count, step = 3 }) {
  const zones = themes.flatMap((t) => [t.hp, t.hn]);
  const allowed = [];
  for (let h = 0; h < 360; h += step) if (zones.every((z) => hueDistance(h, z) >= D)) allowed.push(h);
  const accent = themes.reduce((a, t) => a + t.hb, 0) / themes.length;
  const chosen = [allowed.reduce((best, h) => (hueDistance(h, accent) < hueDistance(best, accent) ? h : best))];
  while (chosen.length < count) {
    chosen.push(allowed.reduce((best, h) => (Math.min(...chosen.map((c) => hueDistance(h, c))) > Math.min(...chosen.map((c) => hueDistance(best, c))) ? h : best)));
  }
  return chosen;
}

export function buildTheme({ name, polarity, seeds, rho, top, colourInputs, hues }) {
  const seed = (role) => (seeds[role] ? seeds[role].$value : undefined);
  const L0 = top;
  const dir = polarity === 'dark' ? 'lighter' : 'darker';
  const toward = polarity === 'dark' ? 1 : -1; // direction of "more emphasis" in lightness
  const checks = [];
  const note = {};
  const check = (id, foreground, background, target, kind = 'required') => {
    const ratio = contrast(foreground, background);
    checks.push({ theme: name, id, foreground: hex(foreground), background: hex(background), target, ratio: Number(ratio.toFixed(2)), pass: ratio >= target, kind });
  };

  // Neutral hue and chroma come from the base surface.
  const base = lch(seed('surface-base'));
  const nh = base.h;
  const nc = base.c;
  const surfaceBase = ok(base.l, base.c, base.h);

  const raised = seed('surface-raised')
    ? lch(seed('surface-raised'))
    : { l: Math.min(L0, base.l * rho ** 0.5), c: nc / rho, h: nh };
  const surfaceRaised = ok(raised.l, raised.c, raised.h);
  const overlayL = polarity === 'dark' ? Math.min(L0, raised.l * rho ** 0.5) : raised.l;
  const surfaceOverlay = ok(overlayL, raised.c, raised.h);

  // Text. Highest-emphasis text sits half a type step beyond secondary text, capped at L0.
  const secondary = lch(seed('text-secondary'));
  const textSecondary = ok(secondary.l, secondary.c, secondary.h);
  const textMuted = ok(...Object.values(lch(seed('text-muted'))));
  const primary = seed('text-primary')
    ? lch(seed('text-primary'))
    : { l: Math.min(L0, secondary.l * rho ** 0.5), c: secondary.c, h: secondary.h };
  const textPrimary = ok(primary.l, primary.c, primary.h);

  // Sunken surface: the deepest of a half, quarter or eighth lightness step on which all
  // body-level text still reaches 4.5:1.
  let surfaceSunken;
  for (const exponent of [1 / 2, 1 / 4, 1 / 8]) {
    const candidate = ok(base.l * rho ** -exponent, nc, nh);
    const all = [textPrimary, textSecondary, textMuted].every((t) => contrast(t, candidate) >= 4.5);
    if (all) { surfaceSunken = candidate; note.sunkenExponent = exponent; break; }
  }
  if (!surfaceSunken) throw new Error(`${name}: no sunken depth keeps text legible`);
  const surfaces = [surfaceBase, surfaceRaised, surfaceSunken, surfaceOverlay];

  const inverseBase = polarity === 'dark' ? textSecondary : textPrimary;
  const surfaceInverse = inverseBase;
  const textInverse = polarity === 'dark' ? surfaceBase : surfaceRaised;

  // Accent
  const accent = lch(seed('accent-fill'));
  const accentFill = ok(accent.l, accent.c, accent.h);
  const accentHover = ok(accent.l * rho ** (toward * 0.25), accent.c, accent.h);
  const accentActive = ok(accent.l * rho ** (toward * 0.5), accent.c, accent.h);
  const tintL = (base.l + raised.l) / 2;
  const tint = (fill) => { const f = lch(fill); return ok(tintL, f.c / rho ** 4, f.h); };
  const accentTint = tint(accentFill);
  const accentText = solveLightness({ from: accentFill, direction: toward, backgrounds: [...surfaces, accentTint], target: 4.5 });
  const lightInk = ok(L0, nc / rho ** 2, nh);
  const darkInk = ok(L0 * rho ** -11, nc, nh);
  const textOnAccent = [lightInk, darkInk].sort((a, b) => contrast(b, accentFill) - contrast(a, accentFill))[0];
  const accentSecondary = ok(accent.l, accent.c, accent.h + 360 / 6);

  // Borders
  const bd = lch(seed('border-default'));
  const borderDefault = ok(bd.l, bd.c, bd.h);
  const borderSubtle = ok((base.l + bd.l) / 2, bd.c, bd.h);
  const borderEmphasis = solveLightness({ from: borderDefault, direction: toward, backgrounds: surfaces, target: 3 });

  // Signals
  const signalSeeds = {
    positive: seed('signal-positive-fill'),
    negative: seed('signal-negative-fill'),
    caution: seed('signal-caution-fill'),
  };
  const signals = {};
  for (const [kind, value] of Object.entries(signalSeeds)) {
    const f = lch(value);
    const fill = ok(f.l, f.c, f.h);
    const t = tint(fill);
    signals[kind] = {
      fill, tint: t,
      text: solveLightness({ from: fill, direction: toward, backgrounds: [...surfaces, t], target: 4.5 }),
    };
  }
  signals.info = { fill: accentFill, tint: accentTint, text: accentText };

  const focusRing = solveLightness({ from: accentFill, direction: toward, backgrounds: surfaces, target: 3 });
  const shadow = polarity === 'dark' ? ok(base.l * rho ** -3, nc, nh) : ok(primary.l, primary.c, primary.h);
  const textDisabled = atContrast({ hue: nh, chroma: nc, background: surfaceBase, target: Math.sqrt(4.5), direction: dir });

  // Data ground and neutrals
  const groundSeed = seed('data-surface');
  const ground = groundSeed
    ? (() => { const g = lch(groundSeed); return ok(g.l, g.c, g.h); })()
    : ok(base.l * rho ** -1, nc, nh);
  const gc = lch(hex(ground));
  const dataText = atContrast({ hue: gc.h, chroma: gc.c, background: ground, target: 7, direction: 'lighter' });
  const dataTextMuted = atContrast({ hue: gc.h, chroma: gc.c, background: ground, target: 4.5, direction: 'lighter' });
  const gridline = atContrast({ hue: gc.h, chroma: gc.c, background: ground, target: Math.sqrt(3), direction: 'lighter' });
  // Missing data is quieter than data: between the gridline (√3) and the 3:1 floor, tinted toward the ground's hue by a fraction of its chroma (never a
  // hue of its own). Its legend swatch is outlined.
  const noData = atContrast({ hue: gc.h, chroma: gc.c / rho ** 2, background: ground, target: Math.sqrt(Math.sqrt(3) * 3), direction: 'lighter' });
  const other = atContrast({ hue: gc.h, chroma: gc.c / 2, background: ground, target: 4.5, direction: 'lighter' });
  const unc = atContrast({ hue: gc.h, chroma: gc.c, background: ground, target: 7, direction: 'lighter' });
  // Annotations are neutral, never a hue a series can have: the contrast midway (geometric mean) between data text and the maximum.
  const annotation = atContrast({ hue: gc.h, chroma: gc.c, background: ground, target: Math.sqrt(7 * 21), direction: 'lighter' });
  const dataInkDark = ok(L0 * rho ** -11, gc.c, gc.h);
  const dataInkLight = ok(L0, gc.c / rho, gc.h);
  const uncertaintyAlpha = rho ** -8;

  // Reserved hue zones
  const D = 360 / colourInputs.zoneDivisions;
  const hp = lch(signalSeeds.positive).h;
  const hn = lch(signalSeeds.negative).h;
  const hb = accent.h;
  const inZone = (h) => hueDistance(h, hp) < D || hueDistance(h, hn) < D;
  const Ccap = Math.max(...Object.values(signalSeeds).map((v) => lch(v).c));
  const zoneRows = [
    { name: 'positive signal', hue: hp }, { name: 'negative signal', hue: hn },
    { name: 'accent', hue: hb }, { name: 'secondary accent', hue: accent.h + 60 },
  ].map((r) => ({
    ...r,
    distancePositive: Math.round(hueDistance(r.hue, hp) * 10) / 10,
    distanceNegative: Math.round(hueDistance(r.hue, hn) * 10) / 10,
    clear: r.name.includes('signal') ? true : !inZone(r.hue),
  }));

  // Categorical palette. Slot hues are shared by every theme (planCategoricalHues); each theme
  // chooses lightness and chroma per slot, farthest first, for fills and for thin dashed lines.
  const levels = [];
  for (let j = colourInputs.lightestSeriesStep; j <= 3.0001; j += 0.5) levels.push(L0 * rho ** -j);
  const duty = colourInputs.dashOn / (colourInputs.dashOn + colourInputs.dashOff);
  const line = (c) => asThinLine(c, ground, duty);
  const pairScore = (c, m, thin) => (thin ? Math.min(minViewDistance(c, m), minViewDistance(line(c), line(m))) : minViewDistance(c, m));
  const categorical = [];
  hues.forEach((h, slot) => {
    const pool = [];
    for (const L of levels) for (const C of [Ccap, Ccap / rho]) {
      const c = ok(L, C, h);
      if (contrast(c, ground) >= 3 && (slot >= colourInputs.lineSlots || contrast(line(c), ground) >= 3)) pool.push(c);
    }
    if (!pool.length) throw new Error(`${name}: no candidate for slot ${slot + 1}`);
    let best = pool[0];
    if (slot === 0) best = pool.reduce((x, c) => (distance(c, accentFill) < distance(x, accentFill) ? c : x));
    else {
      let bestScore = -1;
      for (const c of pool) {
        const score = Math.min(...categorical.map((m) => pairScore(c, m, slot < colourInputs.lineSlots)));
        if (score > bestScore) { best = c; bestScore = score; }
      }
    }
    categorical.push(best);
  });

  // Sequential ramp: brand hue rotating by one sixth of the circle toward higher hue angles.
  const n = colourInputs.sequentialSteps;
  const lowest = atContrast({ hue: hb, chroma: Ccap / rho, background: ground, target: 3, direction: 'lighter' });
  const lLow = lch(lowest).l;
  const lHigh = L0 * rho ** -0.5;
  // A step whose label would fall below 4.5:1 with both inks is moved along lightness by the
  // smallest amount that clears it.
  const labelled = (L, C, h) => {
    const best = (c) => Math.max(contrast(dataInkLight, c), contrast(dataInkDark, c));
    for (let k = 0; k < 200; k += 1) {
      for (const sign of [1, -1]) {
        const c = ok(L + sign * k * 0.002, C, h);
        if (best(c) >= 4.5) return c;
      }
    }
    throw new Error('no labelled step found');
  };
  const sequential = Array.from({ length: n }, (_, t) => labelled(lLow + ((lHigh - lLow) * t) / (n - 1), Ccap / rho, hb + (60 * t) / (n - 1)));

  // Heat ramp, for magnitudes drawn as heat (maps): pale yellow for low through deep red for high. It is
  // the one place a signal-adjacent hue carries no good or bad meaning, since the scale only orders magnitude.
  // Lightness falls linearly from the lightest sequential step to the lightest red that is still clearly apart
  // from the ground (the geometric mean of the 3:1 graphics floor and the 4.5:1 text floor); chroma rises as it
  // deepens; hue turns from the start hue to the end hue.
  const heatN = colourInputs.heatSteps;
  let heatTop = atContrast({ hue: colourInputs.heatHueTo, chroma: Ccap, background: ground, target: Math.sqrt(3 * 4.5), direction: 'lighter' });
  // Under protanopia a deep red darkens toward the no-data grey, so the deepest step is moved lighter, a little at a time,
  // until it is at least 2 JND from the no-data colour in every colour-vision view.
  for (let k = 0; k < 200 && minViewDistance(heatTop, noData) < 2.1 * colourInputs.jnd; k += 1) {
    heatTop = ok(lch(heatTop).l + 0.002, Ccap, colourInputs.heatHueTo);
  }
  const heatL0 = L0 * rho ** -0.5;
  const heatL1 = lch(heatTop).l;
  const heat = Array.from({ length: heatN }, (_, t) => ok(
    heatL0 + ((heatL1 - heatL0) * t) / (heatN - 1),
    Ccap * rho ** (-(heatN - 1 - t) / 2),
    colourInputs.heatHueFrom + ((colourInputs.heatHueTo - colourInputs.heatHueFrom) * t) / (heatN - 1),
  ));

  // Diverging ramp: cool side from the brand hue, warm side from the nearest hue outside the
  // reserved zone of the negative signal.
  const hw = (hn + D) % 360;
  const mid = atContrast({ hue: gc.h, chroma: gc.c, background: ground, target: 4.5, direction: 'lighter' });
  const lMid = lch(mid).l;
  const m = colourInputs.divergingSteps;
  const diverging = {};
  for (let i = -m; i <= m; i += 1) {
    const a = Math.abs(i);
    const L = lMid + ((lHigh - lMid) * a) / m;
    const C = (Ccap / rho) * (a / m);
    diverging[i] = i === 0 ? ok(lMid, gc.c, gc.h) : ok(L, C, i < 0 ? hb : hw);
  }

  // Change colours: the calmest (lowest combined lightness) pair that is at least
  // changeSeparation JNDs apart under every colour-vision view and 3:1 against the ground.
  let change;
  let changeCost = Infinity;
  const changeFloor = colourInputs.changeSeparation * colourInputs.jnd;
  for (const Ld of levels) {
    for (const Li of levels) {
      const dec = ok(Ld, Ccap, hp);
      const inc = ok(Li, Ccap, hn);
      if (contrast(dec, ground) < 3 || contrast(inc, ground) < 3) continue;
      if (minViewDistance(dec, inc) < changeFloor) continue;
      if (Ld + Li < changeCost) { changeCost = Ld + Li; change = { decrease: dec, increase: inc }; }
    }
  }
  if (!change) throw new Error(`${name}: no change pair clears ${changeFloor}`);
  const changeScore = minViewDistance(change.decrease, change.increase);

  // Tokens
  const t = {
    color: {
      surface: {
        base: GEN(hex(surfaceBase)), raised: GEN(hex(surfaceRaised)), sunken: GEN(hex(surfaceSunken)),
        overlay: GEN(hex(surfaceOverlay)), inverse: GEN(hex(surfaceInverse)),
      },
      text: {
        primary: GEN(hex(textPrimary)), secondary: GEN(hex(textSecondary)), muted: GEN(hex(textMuted)),
        disabled: GEN(hex(textDisabled)), 'on-accent': GEN(hex(textOnAccent)), inverse: GEN(hex(textInverse)),
        link: GEN(hex(accentText)),
      },
      border: { subtle: GEN(hex(borderSubtle)), default: GEN(hex(borderDefault)), emphasis: GEN(hex(borderEmphasis)) },
      accent: {
        fill: GEN(hex(accentFill)), hover: GEN(hex(accentHover)), active: GEN(hex(accentActive)),
        text: GEN(hex(accentText)), tint: GEN(hex(accentTint)), secondary: GEN(hex(accentSecondary)),
      },
      signal: Object.fromEntries(Object.entries(signals).map(([k, v]) => [k, {
        fill: GEN(hex(v.fill)), text: GEN(hex(v.text)), tint: GEN(hex(v.tint)),
      }])),
      'focus-ring': GEN(hex(focusRing)),
      shadow: GEN(hex(shadow)),
    },
    data: {
      surface: GEN(hex(ground)),
      text: GEN(hex(dataText)),
      'text-muted': GEN(hex(dataTextMuted)),
      gridline: GEN(hex(gridline)),
      'ink-dark': GEN(hex(dataInkDark)),
      'ink-light': GEN(hex(dataInkLight)),
      annotation: GEN(hex(annotation)),
      uncertainty: GEN(hex8(unc, Number(uncertaintyAlpha.toFixed(3)))),
      'no-data': GEN(hex(noData)),
      other: GEN(hex(other)),
      cat: Object.fromEntries(categorical.map((c, i) => [String(i + 1), GEN(hex(c))])),
      seq: Object.fromEntries(sequential.map((c, i) => [String(i + 1), GEN(hex(c))])),
      heat: Object.fromEntries(heat.map((c, i) => [String(i + 1), GEN(hex(c))])),
      div: Object.fromEntries(Object.entries(diverging).map(([i, c]) => [i < 0 ? `neg-${-i}` : i > 0 ? `pos-${i}` : 'mid', GEN(hex(c))])),
      change: { decrease: GEN(hex(change.decrease)), increase: GEN(hex(change.increase)) },
    },
  };

  // Checks
  const textRoles = { 'text-primary': [textPrimary, 7], 'text-secondary': [textSecondary, 4.5], 'text-muted': [textMuted, 4.5] };
  const surfaceNames = ['base', 'raised', 'sunken', 'overlay'];
  for (const [id, [foreground, target]] of Object.entries(textRoles)) surfaces.forEach((s, i) => check(`${id} on surface-${surfaceNames[i]}`, foreground, s, target));
  surfaces.forEach((s, i) => check(`text-link on surface-${surfaceNames[i]}`, accentText, s, 4.5));
  check('text-link on accent-tint', accentText, accentTint, 4.5);
  [accentFill, accentHover, accentActive].forEach((background, i) => check(`text-on-accent on accent-${['fill', 'hover', 'active'][i]}`, textOnAccent, background, 4.5));
  check('text-inverse on surface-inverse', textInverse, surfaceInverse, 4.5);
  for (const [k, v] of Object.entries(signals)) {
    surfaces.forEach((s, i) => check(`signal-${k}-text on surface-${surfaceNames[i]}`, v.text, s, 4.5));
    check(`signal-${k}-text on signal-${k}-tint`, v.text, v.tint, 4.5);
  }
  surfaces.forEach((s, i) => { check(`border-emphasis on surface-${surfaceNames[i]}`, borderEmphasis, s, 3); check(`focus-ring on surface-${surfaceNames[i]}`, focusRing, s, 3); });
  check('data-text on data-surface', dataText, ground, 7);
  check('data-text-muted on data-surface', dataTextMuted, ground, 4.5);
  check('data-annotation on data-surface', annotation, ground, 4.5);
  check('data-no-data on data-surface', noData, ground, Math.sqrt(Math.sqrt(3) * 3));
  check('text on data-no-data (data-ink-light)', dataInkLight, noData, 4.5);
  const bestInk = (mark) => (contrast(dataInkLight, mark) >= contrast(dataInkDark, mark) ? dataInkLight : dataInkDark);
  sequential.forEach((c, i) => check(`text on data-seq-${i + 1} (data-ink-light or data-ink-dark)`, bestInk(c), c, 4.5));
  Object.entries(diverging).forEach(([i, c]) => check(`text on data-div-${i} (data-ink-light or data-ink-dark)`, bestInk(c), c, 4.5));
  check('data-other on data-surface', other, ground, 3);
  check('data-gridline on data-surface', gridline, ground, 1.7, 'informational');
  categorical.forEach((c, i) => check(`data-cat-${i + 1} on data-surface`, c, ground, 3));
  sequential.forEach((c, i) => check(`data-seq-${i + 1} on data-surface`, c, ground, 3));
  // Country borders are drawn in the ground colour, so they stay visible exactly when the step reaches 3:1 against it.
  heat.forEach((c, i) => check(`data-heat-${i + 1} on data-surface (and the borders drawn in it)`, c, ground, 3));
  check('the deepest heat step on data-surface', heat[heatN - 1], ground, Math.sqrt(3 * 4.5));
  Object.entries(diverging).forEach(([i, c]) => check(`data-div-${i} on data-surface`, c, ground, 3));
  check('data-change-decrease on data-surface', change.decrease, ground, 3);
  check('data-change-increase on data-surface', change.increase, ground, 3);
  for (const [k, v] of Object.entries(signals)) check(`signal-${k}-fill on surface-base`, v.fill, surfaceBase, 3, 'informational');

  // Hue-zone checks
  const hueChecks = [
    { id: 'accent hue clear of reserved zones', pass: !inZone(hb) },
    { id: 'secondary accent hue clear of reserved zones', pass: !inZone(accent.h + 60) },
    ...categorical.map((c, i) => ({ id: `data-cat-${i + 1} hue clear of reserved zones`, pass: !inZone(lch(c).h) })),
    ...categorical.map((c, i) => ({ id: `data-cat-${i + 1} keeps its shared hue`, pass: hueDistance(lch(c).h, hues[i]) <= 6 })),
  ];
  const firstSlots = hues.slice(0, colourInputs.lineSlots);
  const hueSeparation = Math.min(...firstSlots.flatMap((a, i) => firstSlots.slice(i + 1).map((b) => hueDistance(a, b))));
  hueChecks.push({ id: `first ${firstSlots.length} slots differ in hue by at least ${D}°`, pass: hueSeparation >= D });

  // Palette validation (distances in OKLab; JND = colourInputs.jnd)
  const jnd = colourInputs.jnd;
  const pairs = [];
  for (let a = 0; a < categorical.length; a += 1) for (let b = a + 1; b < categorical.length; b += 1) {
    pairs.push({ a: a + 1, b: b + 1, ...Object.fromEntries(viewNames.map((v) => [v, distance(categorical[a], categorical[b], v)])) });
  }
  const minByView = Object.fromEntries(viewNames.map((v) => [v, Math.min(...pairs.map((p) => p[v]))]));
  const linePairs = [];
  const lineSet = categorical.slice(0, colourInputs.lineSlots);
  for (let a = 0; a < lineSet.length; a += 1) for (let b = a + 1; b < lineSet.length; b += 1) {
    linePairs.push({ a: a + 1, b: b + 1, ...Object.fromEntries(viewNames.map((v) => [v, distance(line(lineSet[a]), line(lineSet[b]), v)])) });
  }
  const lineMinByView = Object.fromEntries(viewNames.map((v) => [v, Math.min(...linePairs.map((p) => p[v]))]));
  lineSet.forEach((c, i) => check(`data-cat-${i + 1} as a thin dashed line on data-surface`, line(c), ground, 3));
  const thresholds = { normal: 3 * jnd, protanopia: 2 * jnd, deuteranopia: 2 * jnd, tritanopia: 2 * jnd };
  const changeByView = Object.fromEntries(viewNames.map((v) => [v, distance(change.decrease, change.increase, v)]));
  const heatSteps = heat.slice(1).map((c, i) => minViewDistance(c, heat[i]));
  const heatVsNoData = Math.min(...heat.map((c) => minViewDistance(c, noData)));
  const heatMonotone = heat.every((c, i) => i === 0 || lch(c).l < lch(heat[i - 1]).l);
  const seqSteps = sequential.slice(1).map((c, i) => minViewDistance(c, sequential[i]));
  const divSteps = Object.keys(diverging).map(Number).sort((a, b) => a - b).slice(1).map((k) => minViewDistance(diverging[k], diverging[k - 1]));
  const divAcross = {};
  viewNames.forEach((v) => { divAcross[v] = distance(diverging[-m], diverging[m], v); });

  const rampsOut = {
    neutral: ramp({ hue: nh, peak: nc, ratio: rho, top, steps: colourInputs.rampSteps }),
    brand: ramp({ hue: hb, peak: Math.max(accent.c, nc), ratio: rho, top, steps: colourInputs.rampSteps }),
  };

  return {
    tokens: t, checks, hueChecks, zoneRows, ramps: rampsOut,
    meta: {
      name, polarity, zoneHalfWidth: D, hp, hn, hb, hw, Ccap, sunkenExponent: note.sunkenExponent,
      uncertaintyAlpha, changeScore,
    },
    palette: {
      categorical: categorical.map((c) => hex(c)), pairs, minByView, thresholds, linePairs, lineMinByView, hues, hueSeparation, duty,
      change: { decrease: hex(change.decrease), increase: hex(change.increase), byView: changeByView },
      seqSteps, heatSteps, heatVsNoData, heatMonotone, divSteps, divAcross, jnd,
    },
  };
}
