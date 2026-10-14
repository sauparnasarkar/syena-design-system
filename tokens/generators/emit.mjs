// Writes the scale outputs as DTCG token files.
const dim = (rem, description) => ({ $type: 'dimension', $value: `${rem}rem`, ...(description ? { $description: description } : {}) });

export function scalesToDtcg({ type, icon, space, radius, layout, elevation, motion, easing, breakpoints, opacity }) {
  const typeGroup = {};
  for (const [role, t] of Object.entries(type)) {
    typeGroup[role] = {
      size: dim(t.sizeRem),
      line: dim(t.lineHeightRem),
      tracking: { $type: 'dimension', $value: `${t.trackingEm}em` },
      weight: { $type: 'fontWeight', $value: t.weight },
      family: { $type: 'fontFamily', $value: t.family === 'figure' ? '{family.figure}' : '{family.ui}' },
    };
  }
  const spaceGroup = Object.fromEntries(
    Object.entries(space).map(([k, v]) => [k.replace('space-', ''), dim(v.rem)]),
  );
  const radiusGroup = Object.fromEntries(
    Object.entries(radius).map(([k, v]) => [
      k.replace('radius-', ''),
      v.css ? { $type: 'dimension', $value: v.css } : dim(v.rem),
    ]),
  );
  const layoutGroup = Object.fromEntries(Object.entries(layout).map(([k, v]) => [k, dim(v.rem)]));
  const elevationGroup = Object.fromEntries(
    Object.entries(elevation).map(([k, e]) => [
      k.replace('elevation-', ''),
      {
        $type: 'shadow',
        $value: [
          { color: '{color.shadow}', offsetX: '0px', offsetY: `${e.yPx}px`, blur: `${e.blurPx}px`, spread: `${e.spreadPx}px`, alpha: e.alpha },
          { color: '{color.shadow}', offsetX: '0px', offsetY: `${e.yTightPx}px`, blur: `${e.blurTightPx}px`, spread: '0px', alpha: e.alphaTight },
        ],
      },
    ]),
  );
  const motionGroup = Object.fromEntries(
    Object.entries(motion).map(([k, ms]) => [k.replace('motion-', ''), { $type: 'duration', $value: `${ms}ms` }]),
  );
  const easingGroup = Object.fromEntries(
    Object.entries(easing).map(([k, v]) => [k.replace('easing-', ''), { $type: 'cubicBezier', $value: v }]),
  );
  const breakpointGroup = Object.fromEntries(
    Object.entries(breakpoints).map(([k, v]) => [k.replace('bp-', ''), dim(v.rem)]),
  );
  const layerGroup = Object.fromEntries(
    ['base', 'sticky', 'rail', 'overlay', 'modal'].map((k, i) => [k, { $type: 'number', $value: i }]),
  );
  const opacityGroup = Object.fromEntries(Object.entries(opacity).map(([k, v]) => [k, { $type: 'number', $value: v }]));
  const iconGroup = Object.fromEntries(Object.entries(icon).map(([k, v]) => [k.replace('icon-', ''), dim(v.rem)]));
  return {
    icon: iconGroup,
    opacity: opacityGroup,
    layer: layerGroup,
    type: typeGroup,
    space: spaceGroup,
    radius: radiusGroup,
    layout: layoutGroup,
    elevation: elevationGroup,
    motion: motionGroup,
    easing: easingGroup,
    breakpoint: breakpointGroup,
  };
}
