// Scale generation. Every value here is computed from tokens/generators/inputs.json by
// the formulas written in FOUNDATIONS.md section 2. Nothing in this file is a literal
// scale value.
import { openSync } from 'fontkit';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const round = (x, places) => Number(x.toFixed(places));
const rem = (px, root) => round(px / root, 4);

export function measureFonts() {
  const poppins = openSync(require.resolve('@fontsource/poppins/files/poppins-latin-400-normal.woff2'));
  const poppinsSemi = openSync(require.resolve('@fontsource/poppins/files/poppins-latin-600-normal.woff2'));
  const inter = openSync(require.resolve('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'));

  const inkTop = (font, ch) => {
    // Measured on the default instance; cap height does not vary with weight in either face.
    return font.layout(ch).glyphs[0].bbox.maxY / font.unitsPerEm;
  };
  const capHeight = (font) => {
    const caps = ['H', 'E', 'Z', 'I'];
    return caps.reduce((s, c) => s + inkTop(font, c), 0) / caps.length;
  };
  const digitTop = (font) => {
    const ds = [...'0123456789'];
    return ds.reduce((s, c) => s + inkTop(font, c), 0) / ds.length;
  };
  const avgAdvance = (font) => {
    const text = 'abcdefghijklmnopqrstuvwxyz';
    const run = font.layout(text);
    return run.advanceWidth / font.unitsPerEm / text.length;
  };
  const tabularDigitAdvance = (font) => {
    const run = font.layout('0123456789', ['tnum']);
    const adv = run.glyphs.map((g) => g.advanceWidth / font.unitsPerEm);
    return { min: Math.min(...adv), max: Math.max(...adv) };
  };
  const proportionalSpread = (font) => {
    const run = font.layout('0123456789');
    const adv = run.glyphs.map((g) => g.advanceWidth / font.unitsPerEm);
    return { min: Math.min(...adv), max: Math.max(...adv) };
  };

  const pCap = (capHeight(poppins) + capHeight(poppinsSemi)) / 2;
  const iCap = capHeight(inter);
  return {
    poppinsCapHeight: round(pCap, 4),
    interCapHeight: round(iCap, 4),
    poppinsDigitTop: round(digitTop(poppins), 4),
    interDigitTop: round(digitTop(inter), 4),
    sizeAdjust: round(pCap / iCap, 4),
    poppinsAverageAdvance: round(avgAdvance(poppins), 4),
    poppinsFeatures: poppins.availableFeatures,
    interHasTabular: inter.availableFeatures.includes('tnum'),
    poppinsDigitAdvance: proportionalSpread(poppins),
    interTabularAdvance: tabularDigitAdvance(inter),
  };
}

export function computeScales(inputs, metrics) {
  const { rootPx: r, ratio: rho, readingLeading, floorPx, leadingGridPx: g } = inputs.type;
  const { unitPx: u, doublingSteps } = inputs.space;
  const { ratio: sigma } = inputs.layout;
  const tau = inputs.colour.stepRatio;
  const { frameMs, fibonacciFrames: frames } = inputs.motion;
  const phi = (1 + Math.sqrt(5)) / 2;

  // Every emitted length is a whole number of pixels, written in rem (px / r).
  const whole = Math.round;
  const snap = (px) => whole(px / g) * g;
  const sizePx = (k) => Math.max(floorPx, whole(r * rho ** k));
  const baseSizePx = sizePx(-1);
  const excess = readingLeading - rho;
  const leadingFactor = (k) => rho + excess * rho ** -k;
  const lineHeightPx = (k) => whole((sizePx(k) * leadingFactor(k)) / g) * g;
  const kappa = (rho - 1) / 16;
  const tracking = (k) => -kappa * k;

  const type = {};
  for (const [name, def] of Object.entries(inputs.type.roles)) {
    const k = def.step;
    // A role may fix its own leading, for reading text that needs more air than the scale gives.
    const lh = def.leading ? whole((sizePx(k) * def.leading) / g) * g : lineHeightPx(k);
    type[name] = {
      step: k,
      family: def.family,
      weight: def.weight,
      sizePx: sizePx(k),
      sizeRem: rem(sizePx(k), r),
      lineHeightPx: lh,
      lineHeightRem: rem(lh, r),
      leadingFactor: def.leading ?? round(leadingFactor(k), 4),
      trackingEm: round(tracking(k) + (name === 'overline' ? 6 * kappa : 0), 4),
    };
  }

  const icon = Object.fromEntries(
    Object.entries(inputs.type.iconSteps).map(([name, k]) => [`icon-${name}`, { px: snap(r * rho ** k), rem: rem(snap(r * rho ** k), r) }]),
  );

  const space = {};
  for (let n = 1; n <= inputs.space.steps; n += 1) {
    const px = snap(u * 2 ** ((n - 1) / doublingSteps));
    space[`space-${n}`] = { px, rem: rem(px, r) };
  }

  const radius = {
    'radius-control': { px: space['space-1'].px, rem: space['space-1'].rem },
    'radius-card': { px: space['space-2'].px, rem: space['space-2'].rem },
    'radius-pill': { css: '100vmax' },
  };

  const ringPx = Math.ceil(u / inputs.layout.ringDivisor);
  const hairlinePx = 1;
  const controlHeightPx = type['text-md'].lineHeightPx + 2 * space['space-2'].px;
  const controlHeightSmPx = type['text-sm'].lineHeightPx + 2 * space['space-1'].px;
  const touchHeightPx = Math.max(controlHeightPx, inputs.layout.touchTargetPx);
  const railCollapsedPx = controlHeightPx + 2 * space['space-2'].px;
  const railExpandedPx = whole(
    railCollapsedPx + inputs.layout.labelCharacters * metrics.poppinsAverageAdvance * baseSizePx + 2 * space['space-3'].px,
  );
  const barHeightPx = controlHeightPx + 2 * space['space-3'].px;
  const gutterPx = space['space-4'].px;
  const layout = {
    'control-height': controlHeightPx,
    'control-height-sm': controlHeightSmPx,
    'control-height-touch': touchHeightPx,
    'rail-width-collapsed': railCollapsedPx,
    'rail-width-expanded': railExpandedPx,
    'bar-height': barHeightPx,
    gutter: gutterPx,
    'module-min': whole(railExpandedPx * sigma ** inputs.layout.moduleExponent),
    'stat-min': whole(railExpandedPx * sigma ** inputs.layout.statExponent),
    'field-min': whole(railExpandedPx * sigma ** inputs.layout.fieldExponent),
    'content-max': whole(inputs.layout.reflowFloorPx * sigma ** inputs.layout.breakpointExponents.wide),
    'border-hairline': hairlinePx,
    'focus-ring-width': ringPx,
  };
  const layoutOut = Object.fromEntries(Object.entries(layout).map(([k, px]) => [k, { px, rem: rem(px, r) }]));

  const elevation = {};
  for (let n = 1; n <= inputs.elevation.levels; n += 1) {
    const y = whole(u * 2 ** (n - 1));
    const alpha = inputs.elevation.alphaBase * tau ** n;
    elevation[`elevation-${n}`] = {
      yPx: y,
      blurPx: 2 * y,
      spreadPx: -whole(y / 4),
      alpha: round(alpha, 3),
      yTightPx: whole(y / 4),
      blurTightPx: whole(y / 2),
      alphaTight: round(alpha / 2, 3),
    };
  }

  const motion = {
    'motion-fast': whole(frames[0] * frameMs),
    'motion-base': whole(frames[1] * frameMs),
    'motion-slow': whole(frames[2] * frameMs),
  };
  const easing = {
    'easing-balanced': [round(phi ** -2, 3), 0, round(phi ** -1, 3), 1],
    'easing-emphasis': [0, 0, round(phi ** -2, 3), 1],
  };

  const breakpoints = Object.fromEntries(
    Object.entries(inputs.layout.breakpointExponents).map(([name, e]) => {
      const px = whole(inputs.layout.reflowFloorPx * sigma ** e);
      return [`bp-${name}`, { px, rem: rem(px, r) }];
    }),
  );

  const opacity = { band: round(tau ** -8, 3), projection: round(tau ** -8 / 2, 3), dim: round(tau ** -5, 3) };

  const figureFace = {
    sizeAdjustPercent: round(metrics.sizeAdjust * 100, 2),
    featureSettings: '"tnum", "lnum"',
  };

  return {
    derived: {
      baseSizePx,
      unitPx: u,
      gridPx: g,
      leadingExcess: round(excess, 3),
      trackingKappaEm: round(kappa, 5),
    },
    type, icon, space, radius, layout: layoutOut, elevation, motion, easing, breakpoints, opacity, figureFace,
  };
}
