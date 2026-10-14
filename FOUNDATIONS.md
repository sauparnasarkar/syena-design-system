# Syena Design System: Foundations

Authored October 2026. This document is the source of truth for the system's principles,
scales, colour roles, shell, component anatomy and chart and table behaviour. Tokens in
`tokens/` and components in `src/` implement it; when they disagree, this document is
corrected first and the code follows.

Contents

1. Design principles
2. Scale rules
3. Colour system
4. Application shell
5. Component specifications
6. Chart and table specifications

---

## 1. Design principles

Syena products present climate and market evidence to analysts who compare, filter and
check numbers for a living. The system exists to make that work faster and more honest.
Six principles follow, in priority order. When two conflict, the earlier one wins.

### 1.1 Evidence stays legible

A reader must always be able to tell what a number is, where it came from and when. Every
figure, chart and table carries its unit, its period and its source. The source and
methodology strip of the shell (§4) is never hidden by scrolling or by a collapsed panel.
Truncation is allowed for labels, never for units or sources.

### 1.2 Honest uncertainty

Observed values and modelled values never share a visual treatment.

- Observations are solid: filled marks, continuous lines.
- Projections are marked by at least two redundant cues: a dashed stroke or hatched fill,
  and a text label ("Projection", "Scenario").
- Ranges are drawn as bands whose opacity encodes confidence; the band is always
  accompanied by a legend entry that names the interval ("66% range", "5th to 95th
  percentile").
- Missing data is its own state. It is rendered with the no-data treatment (§3.6), never
  as zero and never as an interpolated line across a gap.
- A figure that is estimated, revised or provisional says so next to the value.

### 1.3 Analytical density

Analysts work with many series on one screen. The system is compact by default.

- The base text size and the spacing unit are inputs to the scale formulas (§2), so density
  can be changed in one place by moving the inputs rather than by editing components.
- Controls have a single compact height and a larger touch height used below the tablet
  breakpoint; there is no third size.
- Tables and chart annotations are designed for scanning: tabular numerals, right-aligned
  figures, restrained row separators (§6).
- Density never reduces contrast, hit-target size on touch devices, or focus visibility.

### 1.4 Colour belongs to the data

The interface chrome is quiet so that colour can carry meaning.

- Chrome surfaces, borders and text use low-chroma neutrals tinted toward the brand hue.
- Saturated colour is spent in three places only: data marks, status signals and the single
  primary action on a view.
- A colour is never the only carrier of a distinction. Series are also distinguished by
  position, label, dash pattern or marker; changes are also distinguished by a sign or
  arrow glyph; status is also distinguished by an icon and text.
- Palettes for data are generated and validated, not hand-tuned: categorical sets are
  checked against three kinds of colour-vision deficiency, and every mark colour is
  checked for contrast against the surface it sits on (§3.7).

### 1.5 Climate semantics are reserved

Some colours already mean something to a climate reader, and the system protects them.

- Green and red encode direction of emissions, decreasing and increasing. No brand,
  accent, series or decorative colour is a green or a red; the brand and accent hues are
  kept at least a fixed hue distance from both signal hues (§3.3).
- Warm and cool hues encode above-baseline and below-baseline in diverging scales, such as
  temperature anomaly. Diverging scales are centred on a stated baseline and the baseline
  is printed on the chart.
- Direction is not a verdict. A rising value is shown as rising; whether that is good or
  bad is expressed by the signal tone only where the metric defines it (for example,
  emissions rising is negative; renewable share rising is positive).
- Units are written in full with their scale ("GtCO₂ a year", "tCO₂ per person") and
  baselines are stated ("relative to 1850–1900").

### 1.6 Accessible by construction

Accessibility is a build-time constraint, not a review step.

- Text and UI contrast is computed for every foreground and surface pair in every theme
  at token-build time, and the build fails below 4.5:1 for body text and 3:1 for large
  text, icons, borders that identify a control, and chart marks.
- Every interactive element is reachable by keyboard, shows a focus ring that meets 3:1
  against both adjacent colours, and has an accessible name.
- Motion is functional and short, and is removed when the reader prefers reduced motion.
- Every chart has a text alternative and, where the data is tabular, a way to view it as a
  table.

### 1.7 Applying the principles

Each later section names the principle it serves. A proposal that cannot be traced to one
of these principles, or that weakens an earlier one to satisfy a later one, is changed
before it is built.
