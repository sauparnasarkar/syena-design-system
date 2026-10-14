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

---

## 2. Scale rules

Every scale in the system is computed from the formulas in this section and the inputs in
`tokens/generators/inputs.json`. The tables below are filled in by `npm run tokens:generate`
from the same code that writes `tokens/`, so the prose, the tables and the tokens cannot
drift apart. To change a scale, change an input or a formula here, regenerate, and review
the diff. Do not edit a generated value by hand.

Serves principle 1.3 (analytical density) and 1.6 (accessibility by construction).

### 2.1 Inputs

Type, space, layout and colour each have their own inputs. No scale borrows another scale's
ratio or constant, so changing one (for example the type ratio) never moves the others. Two
quantities cross groups by measurement and not by reuse: control and rail dimensions are
built by adding type line heights to spacing steps, and the rail width uses the measured
average advance of the text face.

| Group | Symbol | Meaning | Value |
|---|---|---|---|
| Type | `r` | Root size. The user-agent default, so every length in rem follows the reader's own font-size setting. | 16 px |
| Type | `ρ` | Type ratio. | 1.2 |
| Type | `L` | Reading leading: the line-height ratio of body text at the root size. | 1.5 |
| Type | `m` | Floor: no text is set smaller than this. | 12 px |
| Type | `g` | Leading grid: all line heights are multiples of it. | 2 px |
| Space | `u` | Spacing unit. | 5 px |
| Space | `d` | Steps per doubling of the spacing scale. | 2 |
| Layout | `σ` | Layout ratio, for minimum widths and breakpoints. | 1.2 |
| Layout | `W` | Reflow floor: the narrowest viewport the layout must support without two-dimensional scrolling. | 320 px |
| Layout | `T` | Touch target: the minimum height of a touch control. | 44 px |
| Colour | `τ` | Colour step ratio, for ramp lightness and opacities. | 1.2 |
| Colour | `L₀` | Lightest ramp step. | 0.9875 |
| Motion | `f` | Frame time of a 60 Hz display. | 16.667 ms |

**Whole pixels and the grid.** Every emitted length is a whole number of CSS pixels, written
in rem as `px / r`. Formulas produce a real number and the generator rounds it once, at the
end. Line heights, spacing steps and icon sizes are rounded to the leading grid `g` (2 px),
so every vertical rhythm value is even; other lengths are rounded to the nearest pixel.

Derived once and reused:

```
b = max(m, round(r · ρ⁻¹))     base size: the size of text-md, the default for interface text
e = L − ρ                      leading excess
κ = (ρ − 1) / 16               tracking constant
```

<!-- generated:derived -->
| Quantity | Value |
|---|---|
| Base size `b` | 13 px |
| Spacing unit `u` | 5 px |
| Leading grid `g` | 2 px |
| Leading excess `e` | 0.3 |
| Tracking constant `κ` | 0.0125 em |
| Figure size adjustment `a` | 95.91 % |
<!-- /generated:derived -->

The base size sits one step below the root size because interface text in analytical views
is read in short runs and many at a time (principle 1.3). Long-form prose uses `text-lg`,
which is the root size.

### 2.2 Type

**Size.** Each role is assigned an integer or half-integer step `k` on the modular scale, and
sizes are rounded to whole pixels and held at or above the floor:

```
size(k) = max(m, round(r · ρᵏ))
```

Sizes are stored in rem.

**Line height.** The leading ratio shrinks toward the type ratio as size grows, so that
small text is open and display text is tight:

```
λ(k)       = ρ + e · ρ⁻ᵏ                       (equals L at k = 0, tends to ρ as k grows)
lineHeight = round(size(k) · λ(k) / g) · g      (snapped to the leading grid)
```

**Tracking.** Small text opens up, large text closes in, linearly in `k`:

```
tracking(k) = −κ · k            (em)
```

The `overline` role is set in capitals and adds `6κ`.

**Faces.** Two faces carry the whole system.

- *UI face.* Poppins, weights 400, 500 and 600. Used for every role except the figure
  roles.
- *Figure face.* Inter (variable), used only through the three `figure-*` roles, numeric
  table cells and chart axis and tick labels, always with
  `font-feature-settings: "tnum", "lnum"` so that digits are tabular and lining.

Poppins was tested first, because one face would be simpler. The bundled Poppins has no
glyph-substitution features at all, so it cannot produce tabular figures: its digits are
proportional (the digit 1 is half the width of the digit 0), and columns of numbers do
not align. Inter provides `tnum`, and every digit advances the same width.

**Aligning the two faces.** The figure face is exposed under a `@font-face` alias,
`Syn Figure`, with `size-adjust` set so that Inter's capitals have the same rendered height
as Poppins' capitals:

```
a = capHeight(Poppins) / capHeight(Inter)        size-adjust = a
```

Cap heights are measured from the font files by `tokens/generators/scales.mjs`
(the mean of the glyphs H, E, Z and I, as a fraction of the em, at the default instance;
cap height does not vary with weight in either face):

<!-- generated:metrics -->
| Measure | Poppins | Inter |
|---|---|---|
| Capital height, em fraction (mean of H, E, Z, I) | 0.6977 | 0.7275 |
| Figure height, em fraction (mean of 0 to 9) | 0.73 | 0.7334 |
| Tabular figures available | no (no substitution features) | yes (`tnum`) |
| Digit advance, em fraction | 0.320 to 0.635 (proportional) | 0.648 (fixed with `tnum`) |
| Mean lowercase advance, em fraction | 0.5613 | n/a |
<!-- /generated:metrics -->

The adjustment is below 100 %, so Inter figures are drawn about four percent smaller than
the nominal size; this makes a figure next to a Poppins label match it in capital height.
Poppins digits are taller than its capitals, so adjusted Inter digits sit slightly lower
than Poppins digits would. That residual is accepted: figures appear next to capital
labels and units far more often than next to Poppins digits.

**Roles.**

<!-- generated:type-table -->
| Role | Step k | Face | Weight | Size | Size (rem) | Line height | λ(k) | Tracking (em) |
|---|---|---|---|---|---|---|---|---|
| `overline` | -2 | ui | 600 | 12 px | 0.75 | 20 px | 1.632 | 0.1 |
| `caption` | -2 | ui | 400 | 12 px | 0.75 | 20 px | 1.632 | 0.025 |
| `text-sm` | -1.5 | ui | 400 | 12 px | 0.75 | 20 px | 1.594 | 0.0187 |
| `text-md` | -1 | ui | 400 | 13 px | 0.8125 | 20 px | 1.560 | 0.0125 |
| `text-lg` | 0 | ui | 400 | 16 px | 1 | 24 px | 1.500 | 0 |
| `title-sm` | 1 | ui | 600 | 19 px | 1.1875 | 28 px | 1.450 | -0.0125 |
| `title-md` | 2 | ui | 600 | 23 px | 1.4375 | 32 px | 1.408 | -0.025 |
| `title-lg` | 3 | ui | 600 | 28 px | 1.75 | 38 px | 1.374 | -0.0375 |
| `display` | 5 | ui | 600 | 40 px | 2.5 | 52 px | 1.321 | -0.0625 |
| `figure-sm` | 1 | figure | 500 | 19 px | 1.1875 | 28 px | 1.450 | -0.0125 |
| `figure-md` | 3 | figure | 500 | 28 px | 1.75 | 38 px | 1.374 | -0.0375 |
| `figure-lg` | 5 | figure | 500 | 40 px | 2.5 | 52 px | 1.321 | -0.0625 |
<!-- /generated:type-table -->

At the floor, `caption`, `overline` and `text-sm` share a size and differ in weight, case
and tracking. Role usage:

- `display`: page title on landing and report covers only.
- `title-lg`, `title-md`, `title-sm`: section, card and sub-section headings.
- `text-lg`: long-form prose and lead paragraphs.
- `text-md`: default interface text, control labels, table cells.
- `text-sm`: dense table cells, secondary notes, tooltips.
- `caption`: source lines, axis titles, fine print.
- `overline`: category labels above titles; capitals.
- `figure-lg`, `figure-md`, `figure-sm`: headline statistics, KPI values, inline figures.

**Icons.** Icon sizes are also steps on the type scale, so an icon sits comfortably beside
text of the same step:

```
icon(k) = round(r · ρᵏ / g) · g       small: k = 0,  medium: k = 1,  large: k = 3.8
```

<!-- generated:icon-table -->
| Token | Value | rem |
|---|---|---|
| `icon-small` | 16 px | 1 |
| `icon-medium` | 20 px | 1.25 |
| `icon-large` | 32 px | 2 |
<!-- /generated:icon-table -->

### 2.3 Space

Spacing is geometric and doubles every `d` steps:

```
space(n) = round(u · 2^((n − 1) / d) / g) · g        n = 1 … 10
```

<!-- generated:space-table -->
| Token | Value | rem |
|---|---|---|
| `space-1` | 6 px | 0.375 |
| `space-2` | 8 px | 0.5 |
| `space-3` | 10 px | 0.625 |
| `space-4` | 14 px | 0.875 |
| `space-5` | 20 px | 1.25 |
| `space-6` | 28 px | 1.75 |
| `space-7` | 40 px | 2.5 |
| `space-8` | 56 px | 3.5 |
| `space-9` | 80 px | 5 |
| `space-10` | 114 px | 7.125 |
<!-- /generated:space-table -->

Spacing between sibling elements uses steps 1 to 4; padding inside cards and panels uses
steps 3 to 5; page-level separation uses steps 6 to 10. These are guidance for authors,
not constraints on the generated values.

### 2.4 Shape

Corners are crisp, so that dense layouts keep a sharp, technical edge:

```
radius-control = space(1)
radius-card    = space(2)
radius-pill    = full rounding (100vmax)
```

Hairlines are one pixel. The focus ring is `⌈u / 3⌉` pixels wide.

<!-- generated:radius-table -->
| Token | Value | rem |
|---|---|---|
| `radius-control` | 6 px | 0.375 |
| `radius-card` | 8 px | 0.5 |
| `radius-pill` | 100vmax | — |
<!-- /generated:radius-table -->

### 2.5 Control and layout dimensions

```
control-height         = lineHeight(text-md) + 2 · space(2)
control-height-sm      = lineHeight(text-sm) + 2 · space(1)
control-height-touch   = max(control-height, T)
rail-width-collapsed   = control-height + 2 · space(2)
rail-width-expanded    = round(rail-width-collapsed + N · c · b + 2 · space(3))
                         N = 20 characters (the longest navigation label), c = mean
                         lowercase advance of the UI face (measured, above)
bar-height             = control-height + 2 · space(3)
gutter                 = space(4)
module-min             = round(rail-width-expanded · σ³)    narrowest a module is allowed to be
stat-min               = round(rail-width-expanded · σ)     narrowest a key-figure tile is allowed to be
field-min              = round(rail-width-expanded · σ^−½)  narrowest a labelled field is allowed to be
content-max            = bp-wide                            widest the content area grows
```

<!-- generated:layout-table -->
| Token | Value | rem |
|---|---|---|
| `control-height` | 36 px | 2.25 |
| `control-height-sm` | 32 px | 2 |
| `control-height-touch` | 44 px | 2.75 |
| `rail-width-collapsed` | 52 px | 3.25 |
| `rail-width-expanded` | 218 px | 13.625 |
| `bar-height` | 56 px | 3.5 |
| `gutter` | 14 px | 0.875 |
| `module-min` | 377 px | 23.5625 |
| `stat-min` | 262 px | 16.375 |
| `field-min` | 199 px | 12.4375 |
| `content-max` | 1651 px | 103.1875 |
| `border-hairline` | 1 px | 0.0625 |
| `focus-ring-width` | 2 px | 0.125 |
<!-- /generated:layout-table -->

### 2.6 Elevation

Three levels. Each level is two stacked shadows (a broad one and a tight one) so that
edges stay defined. Offsets grow by doubling from the spacing unit; opacity grows with the
colour step ratio:

```
y(n)      = round(u · 2ⁿ⁻¹)
broad     = 0  y  2y  −round(y/4)   alpha(n)
tight     = 0  round(y/4)  round(y/2)  0   alpha(n)/2
alpha(n)  = 0.1 · τⁿ                n = 1, 2, 3
```

The shadow colour is a theme role (§3), so dark themes can use a deeper ink and rely on
surface lightness, not shadow, to express height.

<!-- generated:elevation-table -->
| Token | Broad layer (y blur spread @ alpha) | Tight layer |
|---|---|---|
| `elevation-1` | 0 5 10 -1 @ 0.12 | 0 1 3 0 @ 0.06 |
| `elevation-2` | 0 10 20 -3 @ 0.144 | 0 3 5 0 @ 0.072 |
| `elevation-3` | 0 20 40 -5 @ 0.173 | 0 5 10 0 @ 0.086 |
<!-- /generated:elevation-table -->

### 2.7 Motion

Durations are whole numbers of display frames, taken from the Fibonacci sequence so that
each level is about one and a half times the last. Easing curves use the golden ratio
φ = (1 + √5) / 2:

```
motion-fast / base / slow = f · (5, 8, 13)         rounded to whole milliseconds
easing-balanced           = cubic-bezier(φ⁻², 0, φ⁻¹, 1)
easing-emphasis           = cubic-bezier(0, 0, φ⁻², 1)
```

Under `prefers-reduced-motion: reduce`, durations are set to zero and transitions that
carry information (a loading indicator, for example) switch to a non-moving alternative.

<!-- generated:motion-table -->
| Token | Value |
|---|---|
| `motion-fast` | 83 ms |
| `motion-base` | 133 ms |
| `motion-slow` | 217 ms |
| `easing-balanced` | cubic-bezier(0.382, 0, 0.618, 1) |
| `easing-emphasis` | cubic-bezier(0, 0, 0.382, 1) |
<!-- /generated:motion-table -->

### 2.8 Breakpoints

Breakpoints grow geometrically from the reflow floor, using the layout ratio:

```
bp(e) = round(W · σᵉ)          compact: e = 4,  regular: e = 7,  wide: e = 9
```

Below `compact` the navigation rail becomes a drawer; between `compact` and `regular` the
rail is collapsed to icons; from `regular` it is expanded; `wide` allows a third column.
The layout must reflow without horizontal scrolling down to `W` (320 px), and every control
stays reachable there.

<!-- generated:breakpoint-table -->
| Token | Value | rem |
|---|---|---|
| `bp-compact` | 664 px | 41.5 |
| `bp-regular` | 1147 px | 71.6875 |
| `bp-wide` | 1651 px | 103.1875 |
<!-- /generated:breakpoint-table -->
