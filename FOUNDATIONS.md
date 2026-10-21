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
- Missing data is its own state. It is rendered with the no-data treatment (§3.6: one flat, quiet grey
  on maps, grids and bars, named in words in tables), never as zero and never as an interpolated
  line across a gap.
- A figure that is estimated, revised or provisional says so next to the value.

### 1.3 Analytical density

Analysts work with many series on one screen. The system is compact by default.

- The base text size and the spacing unit are inputs to the scale formulas (§2), so density
  can be changed in one place by moving the inputs rather than by editing components.
- Controls have two heights: the default, and a small height for controls that sit inside
  tables and toolbars. Below the compact breakpoint both are replaced by one touch height;
  there is no other size.
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
  kept at least a fixed hue distance from both signal hues (§3.5).
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
  table. A map's table lists every country, because "no data" is part of what the map says: the
  countries with a value first, largest first, rounded to three significant figures (whole numbers
  from a hundred up), then every other country by name, marked "No data".

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
| `text-lg` | 0 | ui | 400 | 16 px | 1 | 26 px | 1.625 | 0 |
| `title-sm` | 1 | ui | 600 | 19 px | 1.1875 | 28 px | 1.450 | -0.0125 |
| `title-md` | 2 | ui | 600 | 23 px | 1.4375 | 32 px | 1.408 | -0.025 |
| `title-lg` | 3 | ui | 600 | 28 px | 1.75 | 38 px | 1.374 | -0.0375 |
| `display` | 5 | ui | 600 | 40 px | 2.5 | 52 px | 1.321 | -0.0625 |
| `figure-sm` | 1 | figure | 500 | 19 px | 1.1875 | 28 px | 1.450 | -0.0125 |
| `figure-md` | 3 | figure | 500 | 28 px | 1.75 | 38 px | 1.374 | -0.0375 |
| `figure-lg` | 5 | figure | 500 | 40 px | 2.5 | 52 px | 1.321 | -0.0625 |
| `figure-unit-sm` | 0 | figure | 400 | 16 px | 1 | 24 px | 1.500 | 0 |
| `figure-unit-md` | 2 | figure | 400 | 23 px | 1.4375 | 32 px | 1.408 | 0 |
| `figure-unit-lg` | 4 | figure | 400 | 33 px | 2.0625 | 44 px | 1.345 | 0 |
<!-- /generated:type-table -->

At the floor, `caption`, `overline` and `text-sm` share a size and differ in weight, case
and tracking. Role usage:

- `display`: page title on landing and report covers only.
- `title-lg`, `title-md`, `title-sm`: section, card and sub-section headings.
- `text-lg`: long-form prose and lead paragraphs. It fixes its own leading at 1.625 (26 px at
  16 px), looser than the scale gives, because lines of prose are long and need the air.
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
page-gutter            = round(W / 20)                      the page's side margin on a phone
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
| `page-gutter` | 16 px | 1 |
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
bp(e) = round(W · σᵉ)          compact: e = 5,  regular: e = 7,  wide: e = 9
```

Below `compact` the navigation rail becomes a drawer; between `compact` and `regular` the
rail is collapsed to icons; from `regular` it is expanded; `wide` allows a third column.
The layout must reflow without horizontal scrolling down to `W` (320 px), and every control
stays reachable there. A window of 768 px, a common tablet width held upright, is laid out compact; that is why `compact` sits at e = 5, not e = 4.

<!-- generated:breakpoint-table -->
| Token | Value | rem |
|---|---|---|
| `bp-compact` | 796 px | 49.75 |
| `bp-regular` | 1147 px | 71.6875 |
| `bp-wide` | 1651 px | 103.1875 |
<!-- /generated:breakpoint-table -->

---

## 3. Colour system

Colour is specified in OKLCH (lightness `L`, chroma `C`, hue `h`) because equal steps in `L`
are close to equal steps in perceived lightness, which makes contrast predictable. Every
colour in a theme is either a **seed**, a value authored for the theme and stored in
`tokens/primitives/seeds.json`, or **derived** from the seeds by a rule in this section.
`npm run tokens:generate` applies the rules, writes `tokens/themes/*.json`, runs every
check below and fails if any required check fails. The tables in this section are filled in
from that run.

Serves principles 1.4 (colour belongs to the data), 1.5 (climate semantics are reserved)
and 1.6 (accessible by construction).

### 3.1 Themes

| Theme | Polarity | Intent |
|---|---|---|
| `night` | dark | The default analytical theme: deep blue-grey surfaces, bright marks. |
| `tidewater` | light | Daylight reading: cool light-grey canvas and white raised surfaces. Chart panels stay dark (see 3.6), so marks are validated on one kind of ground in every theme. |

Polarity decides the direction of two operations used throughout: *toward emphasis* (lighter
in a dark theme, darker in a light theme) and *elevation* (raised surfaces are lighter than
the canvas in a dark theme; in a light theme they are the lightest surface and rely on
shadow). A third theme is added by supplying seeds and a polarity; nothing else is chosen
by hand.

### 3.2 Seeds

Seeds are the colours a theme's designer chooses: the canvas, the border, the body and muted
text, the brand accent, the three status signals, and, where a theme has one, the chart
ground, the raised surface and the highest-emphasis text. A role with no seed in a theme is
derived. Seed values are in `tokens/primitives/seeds.json`.

Brand direction: the accent of both themes is a blue-cyan (hue about 222° to 226°). Neither
theme has a green or red brand colour (principle 1.5, rule in 3.5).

### 3.3 Ramps

A ramp is twelve colours at one hue, used where a theme needs a colour at a stated lightness
(surfaces, borders, hover states) and published for product authors who need a tint. Lightness
falls geometrically and chroma follows a bell, so ramps have the same shape in every hue:

```
L(i) = L₀ · τ⁻ⁱ                       i = 0 … 11     (L₀ at i = 0, 0.133 at i = 11)
C(i) = C_peak · 4t(1 − t)            t = i / 11     (clamped to the sRGB gamut at L(i), h)
```

Contrast between steps is not constant, so the generator never assumes it: every pair a
component depends on is measured directly (3.7).
Primitives are not emitted as CSS variables (they exist as JSON and as TypeScript constants).

<!-- generated:ramp-table -->
| Step i | L(i) | night neutral | night brand | tidewater neutral | tidewater brand |
|---|---|---|---|---|---|
| 0 | 0.988 | `#fbfbfb` | `#fbfbfb` | `#fbfbfb` | `#fbfbfb` |
| 1 | 0.823 | `#c0c5d0` | `#adcbd6` | `#c2c6c7` | `#b1cad4` |
| 2 | 0.685 | `#919aac` | `#6da3b7` | `#959b9e` | `#75a2b4` |
| 3 | 0.571 | `#6c788f` | `#34839c` | `#71797d` | `#438199` |
| 4 | 0.476 | `#4f5d76` | `#006780` | `#555e62` | `#0f6681` |
| 5 | 0.397 | `#394761` | `#004f63` | `#3f494d` | `#004f66` |
| 6 | 0.329 | `#28354e` | `#003c4c` | `#2e373b` | `#003c4e` |
| 7 | 0.277 | `#1c283e` | `#002d3a` | `#21292d` | `#002d3b` |
| 8 | 0.231 | `#131d2f` | `#00212b` | `#171e21` | `#00212c` |
| 9 | 0.191 | `#0d1421` | `#001720` | `#101517` | `#001720` |
| 10 | 0.159 | `#0a0d14` | `#001016` | `#0b0e0f` | `#001017` |
| 11 | 0.134 | `#080808` | `#080808` | `#080808` | `#080808` |
<!-- /generated:ramp-table -->

### 3.4 Semantic roles

Semantic tokens are what components consume. Names follow
`--syn-color-{group}-{role}[-{variant}]`.

**Surfaces**

- `surface-base`: the canvas. Seed.
- `surface-raised`: cards and panels. Seed where given; otherwise one half-step of lightness
  beyond the canvas, capped at `L(0)`, with chroma divided by τ.
- `surface-sunken`: wells, table headers, inset regions. The deepest of a half, quarter or
  eighth lightness step below the canvas (`L_base · τ^−e`, `e` = ½, ¼, ⅛) at which every body
  text role still meets 4.5:1.
- `surface-overlay`: menus, popovers, dialogs. Dark themes: raised surface plus half a step.
  Light themes: the raised surface, separated by elevation 2 or 3.
- `surface-inverse`: a surface of opposite polarity for toasts and tooltips, with
  `text-inverse` on it.

**Text**

- `text-primary`: titles and figures. Seed where given; otherwise secondary text plus half a
  step of lightness toward emphasis, capped at `L(0)`.
- `text-secondary`: body text. Seed.
- `text-muted`: captions, axis labels, helper text. Seed.
- `text-disabled`: disabled labels. Lightness at which contrast against the canvas is
  `√4.5` (the geometric mean of no contrast and the minimum for text). Exempt from the 4.5:1
  rule by definition and never used for information that is not available elsewhere.
- `text-on-accent`: label on a filled accent control. The lighter or darker of two neutral
  inks, whichever has more contrast against `accent-fill`. A white label does not
  reach 4.5:1 on night's accent, so night uses the dark ink and tidewater the light ink.
- `text-inverse`: text on `surface-inverse`.
- `text-link`: link text; the same colour as `accent-text`. Links are also underlined.

**Borders**

- `border-default`: card and field outlines that are decorative. Seed.
- `border-subtle`: hairlines and row dividers; halfway in lightness between canvas and
  `border-default`.
- `border-emphasis`: outlines that identify a control or an active region. The nearest
  lightness toward emphasis from `border-default` that reaches 3:1 against every surface.

**Accent**

- `accent-fill`: primary control fill, selection. Seed.
- `accent-hover`, `accent-active`: a quarter and a half lightness step toward emphasis
  (`L · τ^(±¼)`, `L · τ^(±½)`).
- `accent-text`: accent-coloured text and icons. The nearest lightness toward emphasis from
  `accent-fill` at which the colour reaches 4.5:1 on every surface and on `accent-tint`.
- `accent-tint`: tinted background for chips, highlights and selected rows. Lightness is the
  midpoint of canvas and raised surface; chroma is the accent's divided by τ⁴; hue is the
  accent's.
- `accent-secondary`: a second brand colour for non-data emphasis. Hue is the accent's plus
  60°; lightness and chroma are the accent's.

**Signals**

`signal-{positive|negative|caution|info}-{fill|text|tint}`.

- `fill`: the solid colour for dots, bars and badges. Seed for positive, negative and
  caution; info uses the accent. A fill never carries a status alone: it always sits with
  an icon and text, so it is not required to reach 3:1 and the contrast is reported
  rather than enforced.
- `text`: status text and icons. The nearest lightness toward emphasis from `fill` that
  reaches 4.5:1 on every surface and on its own tint.
- `tint`: alert and row backgrounds, built like `accent-tint`.

**Other**

- `focus-ring`: the nearest lightness toward emphasis from the accent that reaches 3:1
  against every surface. The ring is drawn with a gap equal to the ring width, so the colours
  it touches are surfaces.
- `shadow`: the ink of elevation shadows (§2.6).

<!-- generated:role-table -->
| Token | night | tidewater |
|---|---|---|
| `color-surface-base` | `#121e35` | `#dce8ed` |
| `color-surface-raised` | `#1e2f52` | `#f6fcff` |
| `color-surface-sunken` | `#0d1930` | `#cfdadf` |
| `color-surface-overlay` | `#25375a` | `#f6fcff` |
| `color-surface-inverse` | `#d7e0f0` | `#071c24` |
| `color-text-primary` | `#f9fbff` | `#071c24` |
| `color-text-secondary` | `#d7e0f0` | `#3c5460` |
| `color-text-muted` | `#b4c3df` | `#4a6270` |
| `color-text-disabled` | `#44536d` | `#95a1a5` |
| `color-text-on-accent` | `#01061b` | `#f6fcff` |
| `color-text-inverse` | `#121e35` | `#f6fcff` |
| `color-text-link` | `#41accd` | `#006784` |
| `color-border-subtle` | `#1c2d50` | `#cfe1e8` |
| `color-border-default` | `#2c3e63` | `#c7d9e0` |
| `color-border-emphasis` | `#6c81ab` | `#6c7d83` |
| `color-accent-fill` | `#2d9cbd` | `#0a6e8c` |
| `color-accent-hover` | `#39a5c7` | `#006784` |
| `color-accent-active` | `#45afd1` | `#00617c` |
| `color-accent-text` | `#41accd` | `#006784` |
| `color-accent-tint` | `#002c39` | `#ddf5ff` |
| `color-accent-secondary` | `#8485cd` | `#5f5b96` |
| `color-signal-positive-fill` | `#3bbd8e` | `#129455` |
| `color-signal-positive-text` | `#3bbd8e` | `#006d3c` |
| `color-signal-positive-tint` | `#003020` | `#cdffdc` |
| `color-signal-negative-fill` | `#e4677d` | `#d0392f` |
| `color-signal-negative-text` | `#f7788d` | `#b91f1a` |
| `color-signal-negative-tint` | `#45141e` | `#ffebe8` |
| `color-signal-caution-fill` | `#d9a83c` | `#e8a317` |
| `color-signal-caution-text` | `#d9a83c` | `#7f5700` |
| `color-signal-caution-tint` | `#342400` | `#ffeed5` |
| `color-signal-info-fill` | `#2d9cbd` | `#0a6e8c` |
| `color-signal-info-text` | `#41accd` | `#006784` |
| `color-signal-info-tint` | `#002c39` | `#ddf5ff` |
| `color-focus-ring` | `#2d9cbd` | `#0a6e8c` |
| `color-shadow` | `#01071c` | `#071c24` |
<!-- /generated:role-table -->

### 3.5 Hue discipline

Principle 1.5 is enforced by a rule, not by taste. Let `h₊` be the hue of the positive
signal seed and `h₋` the hue of the negative signal seed. Each reserves a zone of half-width

```
D = 360° / 8 = 45°
```

No accent, secondary accent or categorical series colour may have a hue within `D` of `h₊`
or `h₋`. The generator rejects candidates inside a zone and fails if a seed-derived colour
lands in one.

<!-- generated:zone-table -->
| Hue | night / tidewater | Distance to positive | Distance to negative |
|---|---|---|---|
| positive signal | 164.7° / 154.7° | 0° / 0° | 153.3° / 126.3° |
| negative signal | 11.4° / 28.4° | 153.3° / 126.3° | 0° / 0° |
| accent | 222.5° / 225.8° | 57.8° / 71° | 148.9° / 162.7° |
| secondary accent | 282.5° / 285.8° | 117.8° / 131° | 88.9° / 102.7° |
<!-- /generated:zone-table -->

The secondary accent is the accent hue plus 60°, which lies outside both zones in each
theme. A hue inside a zone is available only through signal and change tokens.

### 3.6 Data colour

Data marks are drawn on `data-surface`, the chart ground. It is a dark surface in both
themes: <!-- generated:ground-values -->
night `#09152b`, tidewater `#061e28`
<!-- /generated:ground-values -->. In night it is one full lightness step below the
canvas (`L_base · τ⁻¹`); in tidewater it is a seed, so charts remain a dark panel on the
light page. All data colours are validated against it.

**Design decision: dark data panels in the light theme.** In tidewater the chart and globe
panels stay dark on purpose. A dark panel on a light page marks the data as its own surface,
matches the dark feature banners the products place on the same pages, and lets one set of data
colours, validated once against one ground, serve both themes. The decision applies to every
chart, chart card and globe, not only to banners, so there is no per-component surface option.

**Colour roles on a dark panel.** Text, links, signals, borders and controls placed on a dark panel
must not take the page's light-theme colours: they would be dark on dark. Each theme therefore
carries a panel value for every colour role (`data-panel-*`, one per `color-*` role), and the
`syn-data-panel` class draws the ground and rebinds every `color-*` role to its panel value for
everything inside it, so a button, a link or a signal reads on the panel with no change to the
component. In a dark theme the panel value is the theme's own role, so nothing moves. In a light
theme each role is solved again against the ground and the surfaces a panel can raise from it:
text at the same contrast steps as the page (primary 7:1 and above, secondary 7:1, muted and
links 4.5:1), fills, lines and focus rings at 3:1, tints between the ground and its first raise.
Chart cards put it on their panel; any other dark panel does the same.

**Neutrals on the ground.** Each is the lightness that gives an exact contrast ratio against
the ground, at the ground's hue:

| Token | Contrast with ground | Use |
|---|---|---|
| `data-text` | 7:1 | Chart titles, tick labels that carry values |
| `data-text-muted` | 4.5:1 | Axis titles, legends, source lines |
| `data-annotation` | `√(7 · 21)` : 1, a neutral at the ground's hue | Reference lines, callout leaders and labels. Never a hue a series can have |
| `data-other` | 4.5:1 | The remainder bucket of a part-to-whole chart |
| `data-no-data` | `√(√3 · 3)` : 1, about 2.3:1; a grey tinted slightly toward the ground's hue, never a hue of its own | Missing values: a flat, quiet grey on every map and grid, with the words "No data" in the table view and the hover read-out. Its legend swatch is outlined, so the swatch keeps 3:1 against the ground |
| `data-gridline` | √3 : 1 | Gridlines; informational contrast only |
| `data-uncertainty` | 7:1 colour at α = τ⁻⁸ | Fill of uncertainty bands when a band is not tied to a series; series bands use the series colour at the same α |

**Categorical** (`data-cat-1` … `data-cat-8`). Eight slots. A slot has the same hue family in
every theme; each theme chooses its lightness and chroma.

1. *Hues, shared by all themes.* Candidates are every hue in 3° steps outside the reserved
   zones of every theme (so a hue is allowed only if it is allowed everywhere). Slot 1 is the
   candidate nearest the mean accent hue, so the first series is the brand colour. Each next
   slot takes the candidate whose smallest hue distance to the slots already chosen is
   largest. The first four slots must differ in hue by at least `D` (45°), the same half-width
   that protects the signals, so the four slots most used are separable by hue and not only by
   lightness.
2. *Lightness and chroma, per theme.* For each slot, candidates are the lightness levels
   `L(j)` for `j = 1, 1½, …, 3` (a mark is never lighter than `L(1)`, so it keeps its hue) at
   chroma `C_cap` and `C_cap / τ`. `C_cap` is the largest chroma among the three signal seeds,
   so a series is never more saturated than a status. Candidates below 3:1 against the ground
   are discarded. Slot 1 is the candidate closest in OKLab to the accent; each further slot is
   the candidate whose smallest distance to the slots already chosen is largest, where the
   distance for a pair is the smaller of its OKLab distance as seen normally and as simulated
   for protanopia, deuteranopia and tritanopia (Machado et al., full severity, as implemented
   in culori).
3. *Thin dashed lines.* A 2-pixel dashed line presents less of its colour than a fill: with
   the dash pattern of §6.1 it covers `3 / (3 + 2)` of its length. For the first four slots
   (the slots that may be drawn as dashed lines) every candidate must also reach 3:1 against
   the ground *as a line* (the colour mixed into the ground by that coverage, in linear
   light), and the distance between slots is the smaller of the fill distance and the line
   distance. Slots 5 to 8 are fills, bars and areas, or solid lines with markers and direct
   labels, never dashed lines.

Series are used in order. Beyond eight series, group the rest into `data-other`. The first
four slots differ in hue by at least <!-- generated:cat-hue-separation -->
48°
<!-- /generated:cat-hue-separation --> (required: 45°).

<!-- generated:cat-table -->
| Token | Hue (both themes) | night | vs ground | tidewater | vs ground |
|---|---|---|---|---|---|
| `data-cat-1` | 225° | `#0096bd` | 5.28 | `#0096bd` | 4.98 |
| `data-cat-2` | 75° | `#ffb53b` | 10.34 | `#ffb53b` | 9.74 |
| `data-cat-3` | 324° | `#efa7f5` | 9.98 | `#f7a0ff` | 9.34 |
| `data-cat-4` | 273° | `#8093ea` | 6.31 | `#6579f8` | 4.61 |
| `data-cat-5` | 108° | `#7f7c00` | 4.15 | `#908d00` | 4.90 |
| `data-cat-6` | 249° | `#057bcf` | 4.11 | `#007bcf` | 3.87 |
| `data-cat-7` | 297° | `#b999ff` | 7.86 | `#a582ef` | 5.75 |
| `data-cat-8` | 90° | `#bc9500` | 6.45 | `#937400` | 3.87 |
<!-- /generated:cat-table -->

**Sequential** (`data-seq-1` … `data-seq-7`). For magnitude (maps, heat views). Lightness rises
linearly from the lightest step that still meets 3:1 on the ground (`data-seq-1`) to
`L(½)` (`data-seq-7`); the hue rotates from the accent hue through 60° as lightness rises;
chroma is `C_cap / τ`, clamped to the gamut. Lightness is monotonic, so order survives any
colour-vision deficiency and greyscale printing.

**Heat** (`data-heat-1` … `data-heat-7`). For magnitudes drawn as heat on maps: pale yellow for low
through deep red for high, laid over a log scale whose ticks are the powers of ten (0.01 … 10,000
for annual emissions in MtCO₂), so each tick is one step and the colour between ticks is
interpolated. Lightness falls linearly from the lightest sequential step to the lightest red that
stays clearly apart from the ground (the geometric mean of the 3:1 graphics floor and the 4.5:1
text floor, then moved lighter only as far as needed to stay 2 JND from the no-data grey under every
colour-vision view); chroma rises as the colour deepens, and the hue turns from yellow (100°)
to red (27°). **This ramp is the one place the climate-semantics rule (§1.5) is not applied:** it
passes through the amber and red zones because it orders magnitude and carries no good or bad
meaning, and no other token may use those hues. Country borders are drawn in the ground
colour, so they stay visible exactly when a step reaches 3:1 against the ground, which every step
does (checked below). Lightness is monotonic, so order survives any colour-vision deficiency and
greyscale printing.

**Diverging** (`data-div-neg-3` … `data-div-pos-3`, with `data-div-mid`). For signed values
around a stated baseline. The cool side (below baseline) uses the accent hue. The warm side
(above baseline) uses the hue at distance `D` from the negative signal: the warmest hue the
reserved zone allows. The midpoint is a neutral at 4.5:1 on the ground, lighter than `data-no-data` so that a
baseline value and a missing value are never the same colour; lightness rises
linearly to `L(½)` at both ends and chroma rises linearly from zero, so the baseline is the
quietest colour and magnitude is the brightest.

**Change** (`data-change-decrease`, `data-change-increase`). Emissions falling and rising use
the positive and negative signal hues. Green and red are the classic failure pair for
deuteranopia, so these two differ in lightness as well as hue: the generator picks the calmest
pair (lowest combined lightness) that is at least ten just-noticeable differences apart under
every colour-vision view. Change marks are always paired with a sign or arrow glyph.

<!-- generated:change-table -->
| View | night | tidewater |
|---|---|---|
| normal | 0.393 | 0.422 |
| protanopia | 0.388 | 0.438 |
| deuteranopia | 0.241 | 0.262 |
| tritanopia | 0.406 | 0.427 |
<!-- /generated:change-table -->

### 3.7 Validation

**Contrast ladder.** Targets are the WCAG 2.2 minimums: 4.5:1 for text, 3:1 for large text,
UI boundaries, icons and chart marks. Primary text and chart text aim higher (7:1).

<!-- generated:contrast-count -->
night: 128 required pairs; tidewater: 173 required pairs.
<!-- /generated:contrast-count -->

The table shows each pair family at its worst surface in each theme:

<!-- generated:contrast-table -->
| Pair (worst surface) | Target | night | tidewater | Result |
|---|---|---|---|---|
| text-primary | 7:1 | 11.43 | 12.28 | pass |
| text-secondary | 4.5:1 | 8.92 | 5.61 | pass |
| text-muted | 4.5:1 | 6.66 | 4.51 | pass |
| text-link | 4.5:1 | 4.52 | 4.51 | pass |
| text-on-accent | 4.5:1 | 6.33 | 5.60 | pass |
| text-inverse | 4.5:1 | 12.52 | 16.90 | pass |
| signal-positive-text | 4.5:1 | 5.00 | 4.53 | pass |
| signal-negative-text | 4.5:1 | 4.53 | 4.50 | pass |
| signal-caution-text | 4.5:1 | 5.42 | 4.52 | pass |
| signal-info-text | 4.5:1 | 4.52 | 4.51 | pass |
| border-emphasis | 3:1 | 3.03 | 3.01 | pass |
| focus-ring | 3:1 | 3.72 | 4.07 | pass |
| data-text | 7:1 | 7.03 | 7.01 | pass |
| data-text-muted | 4.5:1 | 4.54 | 4.51 | pass |
| data-annotation | 4.5:1 | 12.14 | 12.19 | pass |
| data-no-data | 2.2795070569547775:1 | 2.30 | 2.28 | pass |
| text on data-no-data (data-ink-light) | 4.5:1 | 7.62 | 7.25 | pass |
| text on data-seq-1 (data-ink-light or data-ink-dark) | 4.5:1 | 5.81 | 5.46 | pass |
| text on data-seq-2 (data-ink-light or data-ink-dark) | 4.5:1 | 4.50 | 4.65 | pass |
| text on data-seq-3 (data-ink-light or data-ink-dark) | 4.5:1 | 5.78 | 6.00 | pass |
| text on data-seq-4 (data-ink-light or data-ink-dark) | 4.5:1 | 7.46 | 7.60 | pass |
| text on data-seq-5 (data-ink-light or data-ink-dark) | 4.5:1 | 9.47 | 9.57 | pass |
| text on data-seq-6 (data-ink-light or data-ink-dark) | 4.5:1 | 11.99 | 11.96 | pass |
| text on data-seq-7 (data-ink-light or data-ink-dark) | 4.5:1 | 14.88 | 14.80 | pass |
| text on data-div-0 (data-ink-light or data-ink-dark) | 4.5:1 | 5.03 | 5.29 | pass |
| text on data-div-1 (data-ink-light or data-ink-dark) | 4.5:1 | 7.38 | 7.57 | pass |
| text on data-div-2 (data-ink-light or data-ink-dark) | 4.5:1 | 10.57 | 10.69 | pass |
| text on data-div-3 (data-ink-light or data-ink-dark) | 4.5:1 | 14.82 | 14.82 | pass |
| text on data-div--3 (data-ink-light or data-ink-dark) | 4.5:1 | 15.24 | 15.17 | pass |
| text on data-div--2 (data-ink-light or data-ink-dark) | 4.5:1 | 11.06 | 11.13 | pass |
| text on data-div--1 (data-ink-light or data-ink-dark) | 4.5:1 | 7.56 | 7.74 | pass |
| data-other | 3:1 | 4.51 | 4.51 | pass |
| data-cat-* | 3:1 | 3.55 | 3.16 | pass |
| data-seq-* | 3:1 | 3.02 | 3.03 | pass |
| data-heat-1 on data-surface (and the borders drawn in it) | 3:1 | 13.70 | 12.91 | pass |
| data-heat-2 on data-surface (and the borders drawn in it) | 3:1 | 11.32 | 10.79 | pass |
| data-heat-3 on data-surface (and the borders drawn in it) | 3:1 | 9.22 | 8.86 | pass |
| data-heat-4 on data-surface (and the borders drawn in it) | 3:1 | 7.48 | 7.24 | pass |
| data-heat-5 on data-surface (and the borders drawn in it) | 3:1 | 5.98 | 5.85 | pass |
| data-heat-6 on data-surface (and the borders drawn in it) | 3:1 | 4.70 | 4.67 | pass |
| data-heat-7 on data-surface (and the borders drawn in it) | 3:1 | 3.68 | 3.68 | pass |
| the deepest heat step | 3.6742346141747673:1 | 3.68 | 3.68 | pass |
| data-div-* | 3:1 | 4.54 | 4.52 | pass |
| data-change-decrease | 3:1 | 11.19 | 10.69 | pass |
| data-change-increase | 3:1 | 3.78 | 3.52 | pass |
| data-panel-text-primary | 7:1 | 17.57 | 13.78 | pass |
| data-panel-text-secondary | 4.5:1 | 13.70 | 7.96 | pass |
| data-panel-text-muted | 4.5:1 | 10.24 | 5.15 | pass |
| data-panel-text-link | 4.5:1 | 6.94 | 5.12 | pass |
| data-panel-accent-text | 4.5:1 | 6.94 | 5.12 | pass |
| data-panel-signal-positive-text | 4.5:1 | 7.68 | 5.14 | pass |
| data-panel-signal-negative-text | 4.5:1 | 6.96 | 5.12 | pass |
| data-panel-signal-caution-text | 4.5:1 | 8.34 | 7.91 | pass |
| data-panel-signal-info-text | 4.5:1 | 6.94 | 5.12 | pass |
| data-panel-signal-positive-text on data-panel-signal-positive-tint | 4.5:1 | 6.13 | 4.94 | pass |
| data-panel-signal-negative-text on data-panel-signal-negative-tint | 4.5:1 | 5.85 | 5.16 | pass |
| data-panel-signal-caution-text on data-panel-signal-caution-tint | 4.5:1 | 6.88 | 7.77 | pass |
| data-panel-signal-info-text on data-panel-signal-info-tint | 4.5:1 | 5.64 | 4.99 | pass |
| data-panel-text-link on data-panel-accent-tint | 4.5:1 | 5.64 | 4.99 | pass |
| data-panel-text-on-accent on data-panel-accent-fill | 4.5:1 | 6.33 | 4.52 | pass |
| data-panel-text-on-accent on data-panel-accent-hover | 4.5:1 | 7.08 | 5.03 | pass |
| data-panel-text-on-accent on data-panel-accent-active | 4.5:1 | 7.96 | 5.60 | pass |
| data-panel-border-emphasis | 3:1 | 4.65 | 3.41 | pass |
| data-panel-focus-ring | 3:1 | 5.72 | 3.41 | pass |
| data-panel-accent-fill | 3:1 | 5.72 | 3.87 | pass |
| data-panel-signal-positive-fill | 3:1 | 7.68 | 4.41 | pass |
| data-panel-signal-negative-fill | 3:1 | 5.66 | 3.52 | pass |
| data-panel-signal-caution-fill | 3:1 | 8.34 | 7.91 | pass |
<!-- /generated:contrast-table -->

Pairs measured and reported but not required (decorative, or never used alone):

<!-- generated:contrast-info -->
| Theme | Pair (reported only) | Guide ratio | Measured |
|---|---|---|---|
| night | data-gridline on data-surface | 1.7 | 1.74 |
| night | signal-positive-fill on surface-base | 3 | 7.01 |
| night | signal-negative-fill on surface-base | 3 | 5.17 |
| night | signal-caution-fill on surface-base | 3 | 7.62 |
| night | signal-info-fill on surface-base | 3 | 5.23 |
| tidewater | data-gridline on data-surface | 1.7 | 1.75 |
| tidewater | signal-positive-fill on surface-base | 3 | 3.12 |
| tidewater | signal-negative-fill on surface-base | 3 | 3.90 |
| tidewater | signal-caution-fill on surface-base | 3 | 1.74 |
| tidewater | signal-info-fill on surface-base | 3 | 4.64 |
<!-- /generated:contrast-info -->

**Colour-vision deficiency.** Distances are Euclidean in OKLab. One just-noticeable
difference is `J = 0.02`. The categorical palette must be at least `3J` apart for every pair
under normal vision and `2J` under each simulated deficiency:

<!-- generated:cvd-table -->
| View | Required | night min | closest pair | tidewater min | closest pair | Result |
|---|---|---|---|---|---|---|
| normal | 0.06 | 0.088 | 1–6 | 0.068 | 5–8 | pass |
| protanopia | 0.04 | 0.046 | 4–7 | 0.049 | 4–7 | pass |
| deuteranopia | 0.04 | 0.062 | 1–6 | 0.057 | 5–8 | pass |
| tritanopia | 0.04 | 0.067 | 1–6 | 0.056 | 4–6 | pass |
<!-- /generated:cvd-table -->

The same distances, measured on the colours a thin dashed line presents (first four slots, which are the slots that may be dashed):

<!-- generated:cat-line-table -->
| View | Required | night min | tidewater min | Result |
|---|---|---|---|---|
| normal | 0.06 | 0.099 | 0.117 | pass |
| protanopia | 0.04 | 0.063 | 0.086 | pass |
| deuteranopia | 0.04 | 0.096 | 0.070 | pass |
| tritanopia | 0.04 | 0.063 | 0.067 | pass |
<!-- /generated:cat-line-table -->

Ramps are validated by the smallest step between neighbours and, for diverging ramps, by the
distance between the two outer colours:

<!-- generated:seqdiv-table -->
| Measure | night | tidewater | Required |
|---|---|---|---|
| Sequential, smallest step between neighbours | 0.057 | 0.049 | 0.04 |
| Heat, smallest step between neighbours | 0.051 | 0.046 | 0.04 |
| Heat, closest step to the no-data colour | 0.067 | 0.062 | 0.04 |
| Diverging, smallest step between neighbours | 0.091 | 0.094 | 0.04 |
| Diverging, outer cool vs outer warm, worst view | 0.094 | 0.119 | 0.08 |
<!-- /generated:seqdiv-table -->

At build time the same checks run on the emitted tokens, and the build fails if any required
pair falls below its target.

---

## 4. Application shell

Every Syena analysis product shares one shell. It has four regions: a **navigation rail**
on the left, a **contextual analysis bar** at the top of the content column, a **canvas** of
modules, and a sticky **source and methodology strip** at the bottom of the content column.
Wireframes of every layout in this section are in Storybook under *Shell / Wireframes*.

Serves principles 1.1 (evidence stays legible) and 1.3 (analytical density).

### 4.1 Regions

```
┌──────┬──────────────────────────────────────────────────────┐
│      │  Analysis bar    title · purpose                     │
│      │                  geography · period · metric · scenario
│ Rail ├──────────────────────────────────────────────────────┤
│      │                                                      │
│      │  Canvas          modules in an auto-fit grid         │
│      │                                                      │
│      ├──────────────────────────────────────────────────────┤
│      │  Source and methodology strip                        │
└──────┴──────────────────────────────────────────────────────┘
```

**Navigation rail.** Primary navigation only.

- Contents, top to bottom: an optional product-switcher slot (empty by default; a product that
  belongs to a family fills it); the product mark, **supplied by the consuming app**; destination groups (an `overline` group label
  and a list of destinations, each an icon and a label); a collapse control at the foot.
- Widths: `rail-width-expanded` and `rail-width-collapsed` (§2.5). The collapsed rail shows
  icons only; each icon has an accessible name and shows its label in a tooltip on hover and
  on keyboard focus.
- The current destination is marked with `aria-current="page"`, an `accent-tint`
  background and `accent-text` colour. The mark is not colour alone: the label is also
  semibold.
- Surface: `surface-sunken`, separated from the content column by a `border-default`
  hairline.
- The destinations are fixed per product; the rail never carries filters.

**Analysis bar.** The one place where the analytical context is set.

- Row 1: the view title (`title-sm`) and a one-sentence purpose line (`text-sm`, `text-muted`)
  that says what question the view answers.
- Row 2: the controls that set context for every module on the canvas. A view declares which
  of four slots it uses, in this order: **geography**, **period**, **metric**,
  **scenario**. Unused slots are absent, not disabled. A control that applies to one module
  only belongs in that module's header, not in the bar.
- Each control is a labelled field at `control-height`. Labels sit above fields in
  `caption`. Fields use `border-emphasis` so their boundary reaches 3:1.
- Surface: `surface-raised`, separated by a hairline. The bar does not scroll with the
  canvas; it stays at the top of the content column.
- Changing a control updates every module together. A module that cannot honour the
  selection says why in place (§5, inline alert), and never silently shows other data.

**Canvas.** The scrolling region.

- A single auto-fit grid: columns are as many as fit at `module-min`, up to `content-max`,
  with `gutter` between modules. A module may span the full row.
- Modules sit on `surface-raised` with a `border-default` hairline and `radius-card`;
  padding is `space(4)`.
- Chart modules use the dark `data-surface` panel inside the module (§6).

**Source and methodology strip.** Principle 1.1 made structural.

- Always visible at the bottom of the content column. One line at `caption` size, on
  `surface-sunken`: source names, the period shown and the as-of date, then a *Methodology*
  disclosure button.
- The strip's text is generated from the data of the modules currently on the canvas; it
  lists every source once.
- The disclosure opens a panel above the line, in the strip, with three columns: sources
  (name, publisher, licence, release date, link), definitions (metric, unit, baseline,
  adjustments) and method notes (projection method, range definition). The panel pushes the
  canvas up rather than covering it, and closes with `Escape` or its button.
- The strip never collapses to nothing. Below the compact breakpoint the line shortens to
  *Sources* plus the disclosure button.

### 4.2 Responsive behaviour

| Width | Rail | Analysis bar | Strip |
|---|---|---|---|
| from `bp-regular` | Expanded; user may collapse; the choice is remembered | Single row of controls | Full line |
| `bp-compact` to `bp-regular` | Collapsed to icons; user may expand it as an overlay | Controls wrap to two rows if needed | Full line |
| below `bp-compact` | Hidden. A top bar of `bar-height` carries a navigation button, the view title and an analysis-controls button | Opens as a sheet from the top bar's controls button; shows a one-line summary of the current selection in the top bar | *Sources* and the disclosure button |

Below `bp-compact`, the navigation opens as a drawer over a scrim at `layer-overlay`. It
traps focus, closes on `Escape`, on selecting a destination and on scrim click, and returns
focus to the navigation button. Touch controls use `control-height-touch`.

The shell reflows without horizontal scrolling at every width from the reflow floor (320 px)
upward. Wide content (tables, charts) scrolls or resizes inside its own module; charts are
drawn at the width of their module, so their text is never scaled.

### 4.3 Landmarks, order and keyboard

| Region | Element and name |
|---|---|
| Rail | `nav` named *Primary* |
| Analysis bar | `section` (a `group`) named *Analysis controls*; the view title is the page's `h1` (below `bp-compact` the top bar's title is) |
| Canvas | `main` |
| Strip | `aside` named *Sources and methodology* |

- Reading and tab order: skip link ("Skip to content"), rail, analysis bar, canvas, strip.
- The skip link is the first focusable element and becomes visible on focus.
- Within the rail, destinations are a list of links; the collapse control is the last
  element. Arrow keys are not required; the standard tab order is used.
- The disclosure button exposes `aria-expanded` and `aria-controls`.
- Focus is never lost when the rail collapses or expands: the control that was activated
  keeps focus.

### 4.4 Tokens consumed

Surfaces `base`, `raised`, `sunken`, `overlay`; text `primary`, `secondary`, `muted`;
borders `default`, `emphasis`; accent `tint` and `text`; layout `rail-width-*`, `bar-height`,
`control-height`, `control-height-touch`, `gutter`, `module-min`, `content-max`,
`border-hairline`; layers `sticky`, `rail`, `overlay`; elevation 3 for the drawer; motion
`base` for rail width and drawer transitions.

### 4.5 Wireframes

| Story | Shows |
|---|---|
| Desktop | Expanded rail, analysis bar with four controls, canvas, closed strip |
| Desktop sources open | The strip's methodology panel open |
| Tablet | Collapsed rail |
| Phone | Top bar, canvas, short strip |
| Phone navigation open | Drawer over scrim |
| Phone analysis controls open | Analysis bar as a sheet |
| Desktop tidewater | The desktop layout in the light theme |

---

## 5. Component specifications

This section specifies the 29 components of the first product, the hooks and helper that go
with them, and four new building blocks (`AppShell`, `Text`, `Figure` and the theme
provider). For each: purpose and public props, anatomy, states, tokens consumed, and
accessibility. Anatomy is written from the design, not from any existing markup; builders
choose elements to meet the accessibility notes.

Serves principles 1.3 (analytical density) and 1.6 (accessible by construction).

### 5.1 Conventions that apply to every component

**Tokens only.** Components consume semantic tokens (`--syn-*`). They contain no colour
literals and no pixel values that are not tokens.

**No brand assets.** The design system ships no logos, product marks or brand artwork. Every
place that shows a mark (the rail's product mark, the top bar's logo, each product-switcher
item) takes it from the consuming app through required props: either `src` (an image URL) or
`node` (an SVG element), together with an accessible name. There is no default mark; omitting
one is a type error. Stories and specimens use a neutral placeholder mark. Favicons and
install icons stay in each app. Functional icons (§5.4) are separate and come from the icon
set.

**Control anatomy.** Every field-like control (button, select, field, segmented control)
shares one box:

- Height `control-height`, or `control-height-sm` when `size="small"`; both become
  `control-height-touch` on touch devices (a coarse primary pointer), which is also what phones
  and tablets below `bp-compact` are.
- Horizontal padding `space(3)` (`space(2)` when small); gap between icon and label
  `space(2)`.
- Corner `radius-control`; boundary a `border-hairline` line in `border-emphasis`.
- Label in `text-md` (`text-sm` when small).
- A field that takes typing (a list's search field, the prompt bar's text area, the theme switch's
  select) is in the `text-lg` step on touch devices, which is not under sixteen pixels: a touch
  browser zooms the page when a smaller field takes focus and does not zoom back out. The page
  viewport is never set to forbid zooming.

**State vocabulary.** Applied the same way everywhere:

| State | Treatment |
|---|---|
| Hover | Fill moves one step toward emphasis: an `accent-hover` fill, or a `surface-sunken` wash on neutral controls |
| Pressed | `accent-active`, or a `border-emphasis` outline on neutral controls |
| Focus (keyboard) | `focus-ring` outline, `focus-ring-width` wide, offset by the same width; never removed |
| Selected | `accent-tint` fill with `accent-text` label and a visible mark that is not colour alone (check, bar or weight) |
| Disabled | `text-disabled` label, `border-subtle` boundary, no hover; remains in the tab order only if it explains itself |
| Loading | `aria-busy="true"`; a spinner replaces the leading icon; width does not change |
| Error | `signal-negative-text` message with an icon, field boundary in `signal-negative-fill`; the message is associated with the field |

**Motion.** State changes use `motion-fast` with `easing-balanced`; panels that move (drawer,
accordion) use `motion-base` with `easing-emphasis`. All are zero under reduced motion.

**Naming.** Components are named for what they are. Variants that a product needs are props
with named values; there are no colour-named variants.

---

### 5.2 Shell and navigation

#### AppShell *(new)*

- **Purpose and props.** Lays out the shell (§4). Props: `rail`, `topBar`, `analysisBar`,
  `strip`, `footer`, `children` (the canvas), `navigationOpen` and `controlsOpen` (each with an
  `on…Change`; uncontrolled by default), `skipLabel`, and `compact`, which forces the compact or
  wide layout instead of following the viewport, for previews and tests. Components inside the
  shell read its state: the top bar's buttons open the drawer and the sheet without wiring, and
  the rail knows it is in a drawer.
- **Anatomy.** A two-column layout: rail, then a column of analysis bar, scrolling canvas
  and strip. The strip holds no room in the page: it floats over the bottom edge of the view and, at the end of the page, rests in the canvas's own bottom space above the footer, covering no content; the canvas ends with one step of space. Below `bp-compact` the rail is replaced by `TopBar` and a drawer; in the drawer only the list of destinations scrolls, so the utilities at the foot stay in view at any height.
  The shell is at least the height of the visible viewport (dynamic viewport units, with the plain viewport as the fallback, so a phone's collapsing address bar cannot leave a stale gap) and keeps
  clear of the device's safe areas when installed to a home screen.
- **States.** Rail expanded or collapsed; drawer open or closed; strip panel open or closed.
- **Tokens.** Layout `rail-width-*`, `bar-height`, `content-max`; layers `sticky`, `rail`,
  `overlay`; surfaces `base`, `sunken`.
- **Accessibility.** Landmarks and order as in §4.3. Provides the skip link, which moves focus
  to the canvas. The drawer and the sheet are modal dialogs: focus moves in on opening, Tab
  stays inside, Escape or the scrim closes them, and focus returns to the control that opened
  them. Bars pinned to the top carry `data-syn-sticky="top"` so jump links land below them.

#### AnalysisBar and SourceStrip *(shell parts)*

- **AnalysisBar.** Props: `title`, `purpose`, and the controls as children. Sticky at the top of
  the content column; at compact widths it appears in the sheet, where the page title is not
  repeated: the sheet's own heading is `sheetTitle` (*Filters* by default, level two), because
  the top bar holds the page heading. In the sheet each control fills the width. The bar sits on
  `layer-rail`, one layer above `layer-sticky`, so a menu opened in it reaches down over a row
  pinned beneath it (jump links, a year row) instead of opening behind it. In the sheet a select's
  list opens inline, in the flow under its field, so the sheet makes room and the controls after it
  move down (a floated list was cut off by the scrolling sheet). Which selects those are is decided by
  where they sit in the page, not by where they were written: the bar marks its controls area, and a
  page that portals its controls into the bar gets the same behaviour; Escape then closes the list only,
  and a second Escape closes the sheet. The
  navigation drawer and the sheet each have a visible close control at the top; Escape and a
  tap on the dimmed area close them too, and focus returns to the button that opened them.
- **SourceStrip.** Props: `summary`, `compactSummary` (*Sources* by default), `sources`,
  `definitions`, `methodNotes`, and `open` / `defaultOpen` / `onOpenChange`. Sticky at the
  bottom; the disclosure button exposes `aria-expanded` and `aria-controls`, and Escape closes
  the panel. In the compact shell (a phone) the strip tucks into a small tab at the start edge once the page has been scrolled on by a few dozen pixels from where it was last shown, so the page has the whole view; it is back in full at the very end of the page, where it rests above the footer, or when the tab is pressed, and it never tucks while its panel is open. The tab keeps the strip's place at the bottom, so *BackToTop* still clears it. Wide screens are unchanged.

#### ProductMark

- **Purpose and props.** Shows the app's mark. Props: `mark`, which is either `{ src, name }` or
  `{ node, name }`. There is no default and no bundled artwork (§5.1).

#### Rail

- **Purpose and props.** Primary navigation. Props: `logo` (required: the app's mark as `src`
  or `node`, plus a `name`; no default), `productName` (written beside the mark when
  expanded), `brandHref` and `onBrandClick` (the mark and name become a link to the start page; collapsed, the mark's name, in full, is the link's accessible name and shows as a tooltip on hover and focus, so the written `productName` may be shorter), `productSwitcher` (an optional slot above the mark,
  empty by default; its items each take their own required mark and name), `ariaLabel`, `groups`, `footerItems`, `collapsed`,
  `onCollapsedChange`, `onItemClick`, `current`, `actions` (a persistent action under the mark, for example the entry to an assistant) and `utilities`
  (at the foot, above the collapse control, for example a theme switch). Each slot is a node, or a function told whether the rail is collapsed so it can show an
  icon only. Both are in the drawer at compact widths. Whatever a utility draws stays inside the rail. A collapsed rail shows a small mark on an item that has a badge, and the badge stays in its name.
- **Anatomy.** Optional product-switcher slot, the app-supplied mark, the actions slot, grouped destinations (`SidebarNav`), foot
  with the utilities slot and the collapse control. Search, notifications and a user menu are not part of the shell.
- **States.** Expanded, collapsed; per destination: default, hover, current, focus.
- **Tokens.** `surface-sunken`, `border-default`, `accent-tint`, `accent-text`,
  `text-secondary`, `type-overline-*` for group labels, `layout-rail-width-*`.
- **Accessibility.** `nav` named *Primary*; destinations are links; collapsed items carry
  `aria-label` and a tooltip on hover and focus; `aria-current="page"` on the current item.

#### TopBar *(compact widths only)*

- **Purpose and props.** The bar shown below `bp-compact`. Props: `logo` (required, as for
  `Rail`), `title`, `productName` (the short name, beside the mark), `summary`,
  `onOpenNavigation`, `onOpenControls`, `showControls` (on by default; off for a view with no controls, which removes the button), `actions`.
- **Anatomy.** Navigation button, view title, analysis-controls button; optional actions. With `productName`, the mark is followed by the short name on one line (caption size, muted, semibold) and the title on the line under it, the summary sharing the title's line so the bar keeps its height; the whole group carries the mark's full name as a tooltip, the short text is hidden from assistive technology because the mark already carries the full name, and the page title is still the `h1`. Without it the title is beside the mark with the summary under it.
  Height `bar-height`; buttons are `control-height-touch` square.
- **States.** Navigation open; controls open.
- **Tokens.** `surface-raised`, `border-default`, `text-primary`.
- **Accessibility.** Buttons have names and `aria-expanded`. At these widths the top bar's
  title is the page's `h1`; at wider widths the analysis bar's title is.

#### SidebarNav

- **Purpose and props.** A grouped list of destinations. Props: `groups` (each with an id, a
  label and items; an item has an id, a label, an optional `href`, `icon`, `count` and `badge`, a short word such as NEW that is part of the item's name; a group with an empty
  label has no heading and is not labelled by one),
  `footerItems`, `current`, `collapsed`, `onItemClick`, `className`. The compact drawer is the
  shell's, so the older open and toggle props are gone.
- **Anatomy.** Group label, then a list of items: icon, label, optional count badge.
- **States.** Default, hover, current, focus, collapsed (icon only).
- **Tokens.** As `Rail`; item height `control-height`.
- **Accessibility.** One `ul` per group, group label associated by `aria-labelledby`.

#### JumpLinks and scrollToJumpTarget

- **Purpose and props.** In-page navigation between sections of a long view. Props:
  `items` (id, label, and optionally `onBeforeJump` and `topSection`), `activeId`, `onSelect`.
  `scrollToJumpTarget(id)` scrolls a section into view below the sticky analysis bar; with
  `skipIfVisible` a target already fully in view is left where it is. `onBeforeJump` runs first
  (for example to open the panel the target is in) and the jump waits for it and for the page to
  settle. The first item, and any item marked `topSection`, does not scroll when its section is
  already fully in view (focus still moves).
- **Anatomy.** A horizontal list of links in `text-sm`; the active link has an underline of
  `accent-fill` two focus-ring widths thick and `text-primary` colour.
- **States.** Default, hover, active section, focus.
- **Tokens.** `text-muted`, `text-primary`, `accent-fill`, `border-subtle`, `space(3)`.
- **Accessibility.** `nav` named *On this page*; the active link has `aria-current="location"`.
  Scrolling uses smooth behaviour only when motion is not reduced, and moves focus to the
  target's heading so keyboard and screen-reader users arrive there too.

#### BackToTop

- **Purpose and props.** Returns to the top of the canvas after long scrolling. Props:
  `targetId`, `avoidSelector` (an element it must not overlap, such as the prompt bar).
- **Anatomy.** A `radius-pill` icon button at the lower right of the canvas; appears after one
  viewport of scrolling. It rises by the measured distance of anything pinned to the bottom (the
  strip, a pinned prompt bar) from the bottom of the view, wherever that is just now, so it never
  sits on it, at the end of the page included.
- **States.** Hidden, visible, hover, focus.
- **Tokens.** `surface-overlay`, `border-emphasis`, `elevation-2`, `layer-sticky`.
- **Accessibility.** A button named *Back to top*; moves focus to `targetId`.

#### Footer

- **Purpose and props.** Page-end information. Props: `copyright`, `links`.
- **Anatomy.** One line: copyright text and a list of links, in `caption`.
- **States.** Link default, hover, focus.
- **Tokens.** `text-muted`, `text-link`, `border-subtle`.
- **Accessibility.** `footer` landmark; links are real links with visible underlines.

---

### 5.3 Controls

#### Button

- **Purpose and props.** Triggers an action. Props: `variant` (`primary`, `secondary`,
  `ghost`), `size` (`default`, `small`), `disabled`, `isLoading`, `icon`, `trailingIcon`,
  `onClick`, `aria-pressed` for toggle buttons, and the usual button attributes. The type
  requires either children or an `aria-label`.
- **Anatomy.** Optional leading icon, label, optional trailing icon. Icon-only buttons
  require an accessible name.
- **Variants.** *Primary*: `accent-fill` with `text-on-accent`. *Secondary*: transparent
  with a `border-emphasis` boundary and `text-primary` label. *Ghost*: no boundary,
  `accent-text` label, `accent-tint` on hover. One primary button per view region.
- **States.** The common states (§5.1). Pressed toggle buttons show the selected state.
- **Tokens.** `accent-*`, `text-on-accent`, `border-emphasis`, `focus-ring`,
  `control-height*`, `radius-control`.
- **Loading.** The label stays and the width does not change: a bar runs along the bottom
  edge, and a ring replaces the leading icon if there is one.
- **Accessibility.** A `button` element. While loading, the label remains and the button is
  `aria-busy`; activation is ignored.

#### Link

- **Purpose and props.** Navigation to another location. Props: `href`, `target`, `rel`.
  External targets add the external-link icon and `rel="noopener noreferrer"`.
- **Anatomy.** Text, underlined, in `text-link`; the underline offset is `space(1) / 2`.
- **States.** Hover thickens the underline; visited is not distinguished; focus ring.
- **Tokens.** `text-link`, `focus-ring`.
- **Accessibility.** A real anchor. A link that opens a new tab says so in its name.

#### Select

- **Purpose and props.** Choose one option from a list. Props: `label`, `options`, `value`,
  `onChange` (called with the chosen value), `size`, `suppressSearch`, `ariaLabel`, `disabled`,
  `placeholder`, `error`. An option is `{ value, label, disabled? }`.
- **Anatomy.** Field with the label above, current value and a chevron; a listbox popover
  with an optional search field above the options (hidden when `suppressSearch` or when
  there are fewer options than the search threshold of `space(3)` options, that is ten).
- **States.** Closed, open, option hover, option selected (check mark), disabled, error.
- **Tokens.** Control anatomy; popover `surface-overlay`, `elevation-2`, `layer-overlay`,
  `radius-card`; option rows at `control-height`.
- **Accessibility.** Combobox pattern: `aria-expanded`, `aria-controls`,
  `aria-activedescendant`; type-ahead; `Escape` closes and returns focus; the label is
  associated, or `ariaLabel` is required.

#### MultiSelect

- **Purpose and props.** Choose several options. Props: `label`, `options`, `value`,
  `onChange` (called with the list of chosen values), `maxSelected`, and the rest as for `Select`.
- **Anatomy.** As `Select`; the field shows the first selections as tags and a count for the
  rest; options have checkboxes; a footer shows *n selected, up to max* (or *limit reached*) and a *Clear* action. The
  live region announces the same text, so the limit is never read as a position in the list.
- **States.** As `Select`, plus limit reached: remaining options are disabled and the
  footer says why.
- **Tokens.** As `Select`; tags use `accent-tint`.
- **Accessibility.** Listbox with `aria-multiselectable`; the selection count is announced
  politely when it changes.

#### SegmentedControl

- **Purpose and props.** Switch between mutually exclusive views of the same data. Props:
  `items` (each `{ value, label, disabled?, reason? }`; `reason` says why an option is
  unavailable: on hover, as the option's description and as visible text under the group, since touch has no hover), `value`, `onChange`, `name`, `label` or
  `ariaLabel`, `size`.
- **Anatomy.** A joined row of options in one boundary; the selected option has an
  `accent-tint` fill, `accent-text` label and an inset `accent-fill` bar along its
  bottom edge.
- **States.** Each option: default, hover, selected, focus, disabled.
- **Tokens.** Control anatomy, `accent-tint`, `accent-text`, `accent-fill`.
- **Accessibility.** Radio group semantics: one tab stop, arrow keys move and select; the
  group has a name.

#### Radio

- **Purpose and props.** Choose one option from a short, visible set. `Radio` takes `name`,
  `label`, `checked`, `onChange`. `RadioGroup` takes `legend`, `options`, `value`, `onChange`,
  `error` and renders the fieldset.
- **Anatomy.** A circular mark of `space(4)` diameter and a label; the checked mark has a
  centre dot of half the diameter.
- **States.** Unchecked, checked, hover, focus, disabled, error.
- **Tokens.** `border-emphasis`, `accent-fill`, `focus-ring`.
- **Accessibility.** Native radio input; the label is clickable; groups are in a `fieldset`
  with a legend.

#### Slider

- **Purpose and props.** Choose one number in a range. Props: `label`, `min`, `max`, `step`,
  `value`, `onChange`, `showValue`, `showRangeLabels`, `labelHidden` (the label is not drawn but stays the name), `showThumbValue`, `unit`, `disabled`.
- **Anatomy.** Label and value above (no row at all when the label is hidden and no value is shown); room above the track only when the value bubble is shown; a track of `space(1)` thickness with the filled part
  in `accent-fill`; a thumb of `space(5)` diameter; optional min and max labels below and a
  value bubble above the thumb.
- **States.** Default, hover, dragging, focus, disabled.
- **Tokens.** `border-default` (track), `accent-fill`, `surface-raised` (thumb face),
  `border-emphasis`, `focus-ring`, `type-figure-sm` for the value.
- **Accessibility.** `input type="range"` semantics: arrow keys step, Page keys jump by ten
  steps, Home and End go to the ends; value text includes the unit.

#### RangeSlider

- **Purpose and props.** Choose a span. Props: `label`, `min`, `max`, `value` (a pair),
  `thumbLabels`, `onChange`, `unit`, `disabled`.
- **Anatomy.** As `Slider` with two thumbs; the span between them is filled. Thumbs cannot
  cross.
- **States.** As `Slider`, per thumb.
- **Tokens.** As `Slider`.
- **Accessibility.** Two range inputs sharing a group named by `label`; `thumbLabels` name
  them (for example *From year*, *To year*).

#### PromptBar

- **Purpose and props.** Free-text question entry for the assistant view. Props: `value`,
  `onChange`, `onSubmit`, `onStop`, `variant` (`default` is a raised card, `plain` drops the
  card), `pinned`, `loading`, `disabled`, `ariaLabel`, `placeholder`, `hint`, `aboveContent`,
  `belowContent`, and `ref` for the textarea.
- **Anatomy.** A multi-line field that grows to a maximum of six lines, a submit button, and
  slots above (suggestions) and below (hint text). *Pinned* sticks it to the bottom of the
  canvas above the strip.
- **States.** Empty, filled, focused, loading (submit replaced by a stop control), disabled.
- **Tokens.** `surface-raised`, `border-emphasis`, `radius-card`, `elevation-2` when
  pinned, `text-md`.
- **Accessibility.** A labelled textarea; `Enter` submits and `Shift+Enter` inserts a newline;
  the hint is associated with `aria-describedby`; loading is announced.

---

### 5.4 Surfaces and feedback

#### Card

- **Purpose and props.** A container for a module. Props: `header`, `withBorder`, `padding`
  (`none`, `compact`, `default`, `roomy`: spacing steps 3, 4 and 5, or none), `as` (`div`,
  `section` or `article`).
- **Anatomy.** Surface with optional header (`CardHeader`) and body.
- **States.** Static. Not interactive; use `Tile` for interactive surfaces.
- **Tokens.** `surface-raised`, `border-default`, `radius-card`, padding `space(4)` by
  default.
- **Accessibility.** No role by default; a card that labels a region is a `section` with a
  heading.

#### CardHeader

- **Purpose and props.** Title block for a card. Props: `title`, `supportText`, `headingLevel`
  (3 by default), `actions`, `divider`.
- **Anatomy.** Title in `title-sm`, support text in `text-sm` and `text-muted` beneath, an
  actions slot at the end.
- **Tokens.** `text-primary`, `text-muted`, `border-subtle` (optional divider).
- **Accessibility.** The title is a real heading at the level given.

#### Tile

- **Purpose and props.** An interactive card, such as a suggested question. Props:
  `interactive` with either `href` (a link) or `onClick` (a button). An interactive tile is
  always a real link or button, so `role`, `tabIndex` and `onKeyDown` are not needed.
- **Anatomy.** As `Card`; interactive tiles show a trailing arrow.
- **States.** Default, hover (`surface-sunken` wash and `border-emphasis`), focus,
  pressed.
- **Tokens.** As `Card`, plus the state tokens.
- **Accessibility.** An interactive tile is a button or link; Enter and Space activate a
  button tile.

#### Accordion

- **Purpose and props.** Reveal supporting detail. Props: `items` (each `{ id, title, content,
  disabled? }`), `openIds` (or `defaultOpenIds`), `onOpenChange`, `multiple`, `headingLevel`.
- **Anatomy.** A stack of rows; each has a header button with a rotating chevron and a
  panel. Rows are separated by `border-subtle`.
- **States.** Closed, open, hover, focus.
- **Tokens.** `text-primary`, `border-subtle`, motion `base` for height.
- **Accessibility.** Header buttons with `aria-expanded` and `aria-controls`; panels are
  regions labelled by their header; arrow keys optionally move between headers.

#### Tag

- **Purpose and props.** A short label for a category or status. Props: `color`
  (`neutral`, `accent`, `positive`, `negative`, `caution`), `size`.
- **Anatomy.** Text in `caption`, padded `space(1)` by `space(2)`, `radius-control`.
- **Tokens.** Neutral: `surface-sunken`, `text-secondary`. Coloured: the matching `tint`
  with the matching `text`.
- **Accessibility.** Colour is never the only carrier: a tag has text, and signal tags also
  carry an icon.

#### InlineAlert

- **Purpose and props.** A message inside the flow. Props: `variant` (`default`, `warning`,
  `error`), `title`, `onDismiss` (adds a close button) and content.
- **Anatomy.** Icon, optional title in semibold, message in `text-md`; tinted background
  and a `space(1)` bar at the start edge in the signal fill.
- **States.** Static; dismissible alerts add a close button.
- **Tokens.** `signal-info|caution|negative` `tint`, `text` and `fill`; `radius-control`.
- **Accessibility.** `role="status"` for default and warning, `role="alert"` for errors;
  icon and text carry the meaning, not colour.

#### Spinner

- **Purpose and props.** Indeterminate loading. Props: `label`, `showLabel`.
- **Anatomy.** A ring of `space(5)` diameter with a quarter-arc in `accent-fill` over a
  `border-default` track; rotates once per `motion-slow` times four.
- **States.** Spinning; under reduced motion a static partial ring with the label shown.
- **Tokens.** `accent-fill`, `border-default`, `text-muted`.
- **Accessibility.** `role="status"` with the label as its text (default *Loading*).

#### Progress

- **Purpose and props.** Determinate progress. Props: `value` (from 0 to `max`), `max` (100 by
  default, so `value` reads as a percentage), `label`, `showValue`.
- **Anatomy.** Label, a track of `space(2)` thickness and a fill in `accent-fill`;
  the value is printed as a figure.
- **Tokens.** `border-default`, `accent-fill`, `type-figure-sm`.
- **Accessibility.** `role="progressbar"` with `aria-valuenow`, `aria-valuemin`,
  `aria-valuemax` and a name.

#### Icon

- **Purpose and props.** A glyph. Props: `name`, `size`, `style`. Sizes `small`, `medium` and
  `large` are the icon sizes of §2.2.
- **Anatomy.** An SVG on a square grid drawn with a stroke of `focus-ring-width` in rendered
  pixels; colour is `currentColor`. Size comes from the icon tokens. Glyphs come from an
  open-licensed set and are imported one at a time; consumers use `Icon` by name and never the
  set directly. Names include `sparkle`, for an assistant, `home`, `correlation`, `sun` and `moon`, for the two colour themes, and `previous` and `next`, for stepping
  through a set.
- **Accessibility.** Decorative by default (`aria-hidden`); an icon that carries meaning
  takes a `title`, which becomes its accessible name.

---

### 5.5 Data components

#### KpiStat

- **Purpose and props.** One headline figure with context. Props: `label`, `value` (a number,
  text, or an element that writes the number itself), `delta`, `deltaDirection`, `tone`, `note`
  (a plain line that is not a change, such as "of 192 countries"), `card`.
- **Anatomy.** Label (`caption`, `text-muted`); value (`figure-md`, `text-primary`) with its
  unit in `figure-unit-md`; delta line: a direction glyph, the signed change, and the comparison
  period in `text-sm`. `card` wraps it in a card.
- **Zero change.** A change that shows as zero (after rounding to `deltaDecimals`) has no
  direction: it is written without a sign, with a flat glyph, in the neutral tone and spoken as
  "no change", whatever direction or tone were passed.
- **Delta tone.** `tone` is `positive` or `negative`. When it is omitted it is derived from
  `deltaDirection` and the metric: emissions rising is negative, falling is positive. The delta is always shown with a sign or arrow glyph.
- **States.** Static; loading shows placeholder bars with `aria-busy`.
- **Tokens.** `type-figure-*`, `signal-positive|negative-text`, `text-muted`.
- **Accessibility.** A group named by the label; the delta is written in words for screen
  readers ("down 2.1 percent from 2022").

#### Table

- **Purpose and props.** A simple, static table for short lists. Props: `columns` (each
  `{ key, header, unit?, numeric?, wrap?, render? }`; `header` may be inline content, and a `wrap`
  column wraps running text), `rows`, `size`, `striped`, `rowBorders`, `withBorder`, `caption`.
- **Anatomy and states.** As the table specification in §6.2; `Table` is the lightweight
  variant without sorting or virtualisation. The caption is shown above the table, outside
  its scrolling region, and names both. `groups` adds a group header row.
- **Accessibility.** Native `table` with `caption`, `th scope`; numeric columns right-aligned
  and set in the figure face.

#### DataTable

- **Purpose and props.** A sortable, scrollable data grid built on the grid library. Props:
  `columns`, `rows`. A column whose values are all numbers is right-aligned without being told.
- **Anatomy and states.** As §6.2, including the grid theme derived from tokens. The first
  column is pinned and the others share the remaining width, so the last column meets the
  right edge of the header and of the container. Props also include `caption`, `loading`,
  `emptyMessage`, `emptyAction` and `onRowSelected`.
- **Density.** `density` is `comfortable` (the default: header and rows are the control height of
  section 2.5) or `compact` (the text's line height plus one step of space), for a long list read
  down. A header whose name wraps, or carries a unit, is taller than one line in either density.
- **Accessibility.** Grid semantics supplied by the library; header and cell focus styled
  with `focus-ring`; a visible text alternative describes sorting.

#### Chart

- **Purpose and props.** A themed chart on the plotting library. Props: `series`, `xTitle`,
  `yTitle`, `y2Title`, `y2TickFormat`, `ariaLabel`, `showLegend`, `height`, `legendWithinHeight` (the height is the legend's and the plot's together),
  `stackedAreaMode`, `barmode`, `orientation`, `projectionFrom`, `referenceX`, `annotations`,
  `yRange`; `referenceX` is one reference line or a list. A series may be `dashed` (a dashed line that is not a projection, so two lines of one colour can be told apart; it is not marked as a projection). A series' values may be `null`, which
  leaves a gap (the line breaks and is never joined across it); a value with a gap on both sides gets a mark of its own, since a line cannot carry it. A series has a `kind` (`line`, `bar`, `area` or `marker`), and optionally `projected`,
  `band`, `axis`, `slot`, `signed` and `signLabels`, and `colorValues`, `colorDomain`, `colorLabel`
  and `formatColorValue`.
- **Series kinds.** `marker` draws points that are not joined, for a relationship between two
  measures. `barmode: 'percent'` stacks bars to the full height so each shows shares of its total
  (the axis title says so). Bars can be coloured by a second value (`colorValues`) on the
  sequential ramp, with the ramp and its two ends in the legend and the value in the tooltip and
  the table. Bars can be coloured by sign (`signed`): `change` uses the falling and rising colours
  (`data-change-decrease`, `data-change-increase`), `diverging` the cool and warm ends of the
  diverging ramp. A signed series is never carried by colour alone: the legend names the two signs
  with a down and an up glyph, the tooltip and the table write each value with its sign and the
  true minus.
- **Anatomy and states.** As §6.1: plot area on `data-surface`, axes, legend, tooltip,
  annotations, uncertainty and the source footer.
- **Accessibility.** `ariaLabel` is required; see §6.1 for the text alternative and the
  table view.

#### ChartCard

- **Purpose and props.** A `Card` that frames a chart. Props: `title`, `supportText`,
  `asOf`, `headingLevel`, `actions`, `id`, `expandable`, `className`, and the chart as
  children, or a function that returns the chart and is told whether the card is expanded (so
  an expanded chart can be given more height).
- **Anatomy.** `CardHeader` with title and support text; an actions slot (download, view as
  table, expand); the chart on a `data-surface` panel; a footer line with the as-of date and
  source.
- **States.** Collapsed and expanded (`expandable` opens it to the full canvas width and
  returns focus on close); loading; empty; error.
- **Tokens.** `surface-raised`, `data-surface`, `data-text-muted`, `radius-card`.
- **Accessibility.** The title is a heading at `headingLevel`; the expand control has
  `aria-expanded`; the footer is part of the figure's description.

#### Globe

- **Purpose and props.** A globe coloured by a country-level value on the heat scale (§3.6).
  Props: `values` (by alpha-3 code), `valueLabel` (what the value is and its unit), `ariaLabel`,
  `domain` (default 0.01 to 10,000, on a log axis), `unit`, `formatValue`, `autoRotate`, `center`,
  `size`, `caption`, `compact`, `labels`, `turnPeriod` (seconds for one full turn when it turns on its own; 60 by default). A year is the parent's: it passes the values for the year in view, and may
  pass a `caption` (the year and total, say) that is drawn directly under the globe. With `compact`, for a wide setting, the caption is drawn on the picture's top-left corner instead, the pointed-at country on its bottom-left corner (only while one is pointed at, so no row is held back), and the legend's name shares a row with its scale.
- **Anatomy.** The globe on `data-surface`, country borders in the same colour; a
  read-out (country, value and unit, or *No data*) for the country pointed at or tapped, the tapped one outlined in `data-text`;
  optional `labels` (a few `{ id, text }` entries, the id an alpha-3 code), each a short pill on the panel's colour at the middle of its country's largest part, drawn only while that country faces the viewer and never in the table view, and hidden from assistive technology because the table lists every value; the caption, if any; the heat legend: a bar
  with a tick at every power of ten and the outlined no-data swatch; then the controls (zoom in,
  zoom out, *Reset view*, *Table view*) and a one-line keyboard hint, so the legend is seen before
  the controls. The figure carries the data panel itself, so everything in it reads on a page of
  either theme. Missing values are one flat `data-no-data`.
- **States.** Turning (until the pointer or focus is on it, a control or key has been used, or
  motion is reduced), paused, zoomed, table view (the globe is replaced by the table of values).
- **Behaviour.** Arrow keys turn, `+` and `−` zoom, `0` or Home resets; dragging turns, once a press has travelled a few pixels. A press that does not travel is a tap: it chooses the country under it (or none, on the sea), and its read-out stays until another tap or Escape. A finger does not hover, so only a mouse or pen shows the pointed-at read-out, which gives way to the chosen country's when it leaves. Zoom
  stops at 1× and 6×, and the zoom buttons are disabled at the stops. The controls are compact
  (the small control height, not the touch height) and filled with the panel's colour and drawn
  in the panel's text colour, so they read as buttons on any background.
- **Tokens.** `data-heat-*`, `data-no-data`, `data-surface`, `data-gridline`, `data-text`,
  `data-text-muted`. The canvas takes every colour from these tokens, re-read when the theme
  changes.
- **Accessibility.** The canvas is an image with a name and a description pointing at the table of
  values (largest first), which is also the table view; rotation stops under reduced motion; the
  controls are buttons with names, reachable by keyboard; the hint is visible text, dropped where the primary pointer is coarse (a finger has no use for it); the four controls are there for every pointer.

#### Choropleth

- **Purpose and props.** A flat world map coloured by the same heat scale. Props: `values`,
  `valueLabel`, `ariaLabel`, `domain`, `unit`, `formatValue`, `outline` (countries to outline, for
  example the ones selected; changing it never resets the zoom).
- **Anatomy, states, behaviour and accessibility.** As the globe: a natural-earth projection
  fitted to the width, zoom to 8×, drag or arrow keys to pan within the map, the same controls,
  hint, legend, no-data treatment and table view, and the same optional `caption`. The legend
  comes before the controls. Unlike the globe, the map is drawn on the data panel of its
  card, not on a panel of its own.
- **Tokens.** As the globe, plus `data-text` for the outline.

#### YearControl

- **Purpose and props.** A year slider with a play and pause button, for the year shown by a map or a page.
  Props: `min`, `max`, `value`, `onChange`, `playing` or `defaultPlaying`, `onPlayingChange`,
  `intervalMs`, `label`, `step`.
- **Behaviour.** Playing steps forward one `step` every `intervalMs`, stops on the last year and
  never starts by itself; pressing play on the last year starts again from the first; choosing a
  year by hand stops it.
- **Accessibility.** The slider is a labelled range input; the button is a toggle that names the
  action and has `aria-pressed`.

#### Treemap

- **Purpose and props.** Tiles whose area is a value, for parts of a whole with many parts. Props:
  `items` (`id`, `label`, `value`, optional `group` and `colorValue`), `ariaLabel`, `valueLabel`,
  `unit`, `formatValue`, `colorBy` (`group` or `value`), `colorDomain`, `diverging`, `colorLabel`,
  `formatColorValue`, `height`, `onSelect`, `selectedId`, `compact`. `compact` reads the pointed-at tile out over the tiles' bottom corner (no row is held for it) and puts the colour key and the table switch on one row. `diverging` colours by value on the
  diverging ramp, symmetrical about zero, for a change. With `onSelect` every tile is a button
  (named by what it shows, or by its reading where it has no room for text) and the chosen one
  is outlined, for choosing a tile where hover is not available.
- **Anatomy.** Squarified layout: tiles are packed in rows along the shorter side of the space left,
  each row closed when another tile would make the worst aspect ratio worse; area is exactly
  proportional to value and the tiles fill the panel. Colour by group takes the categorical
  slots in order of the group's total, then `data-other`; colour by value blends the sequential
  ramp across `colorDomain`, with the two ends labelled. A tile shows its name and value when it
  is at least `space-9` wide and two text lines tall; smaller tiles show neither. A hover
  read-out gives any tile's name and value; the label colour is whichever ink reaches 4.5:1 on the fill.
- **Accessibility.** The tiles are a picture with a name and a description pointing at the table
  of values (largest first, with group and colour value), which is also the *Table view*; no
  information is carried by colour or size alone.
- **Tokens.** `data-cat-*`, `data-other`, `data-seq-*`, `data-ink-light`, `data-ink-dark`,
  `data-surface`, `data-text`, `data-text-muted`.

#### Sparkline

- **Purpose and props.** A line with no axes, for a trend inside a figure or a strip of key
  figures. Props: `values` (a `null` leaves a gap: the line breaks and is never joined across
  it), `ariaLabel` (required), `surface` (`card` or `panel`), `size` (`sm` is `space-6` tall,
  `md` is `space-7`), `showEnd`, `filled`.
- **Anatomy.** The line stretches to the width of its container with a constant stroke
  (`focus-ring-width`); a flat series sits in the middle; the last value is marked by a round dot
  (a zero-length round stroke, so it stays round at any width); `filled` shades under the line at
  the band opacity.
- **Tokens.** On a card, `accent-text` (reads at 3:1 or better on every surface); on the dark
  data panel, `data-cat-1`. `opacity-band` for the fill.
- **Accessibility.** An image with a name that says what is plotted, the period and the reading.
  A sparkline is never the only place a number appears.

### 5.6 Hooks and helpers

- **`useIsMobile`.** True below `bp-compact`. Updates on resize and orientation change;
  returns the server-safe default `false` before mount.
- **`useReducedMotion`.** True when the reader prefers reduced motion; updates when the
  preference changes. Every animated component consults it.
- **`scrollToJumpTarget`.** See *JumpLinks*.

### 5.7 New building blocks

#### Text

- **Purpose and props.** The way application code sets type without raw class names. Props:
  `as` (a text element, `span` by default), `type` (a type role: `display`, `title-*`, `text-*`,
  `caption`, `overline`; `text-md` by default), `tone` (`primary`, `secondary`, `muted`, `link`,
  `inverse`, `positive`, `negative`, `caution`; inherited when omitted). The prop is `type` and
  not `role` so that it never collides with the ARIA `role` attribute, which passes through.
- **Anatomy.** One element carrying the role's size, line height, tracking, weight and face
  and the tone's colour.
- **Accessibility.** Does not choose heading levels: `as` is explicit for headings.

#### Figure

- **Purpose and props.** A number set in the figure face. Props: `size` (`sm`, `md`, `lg`, for
  the `figure-*` roles), `value` (a number, text already formatted, or an element that writes
  the number itself), `unit`, `unitLabel` (the
  unit spelled for screen readers), `decimals`, `locale`, `tone`, `signed`. Negative values use
  the true minus character.
- **Anatomy.** The value in the figure face with tabular, lining numerals; the unit baseline-aligned
  after it, in the figure face, one type step smaller than the value: `figure-unit-sm`,
  `figure-unit-md` and `figure-unit-lg` sit at steps 0, 2 and 4, one below the steps 1, 3 and 5 of
  the `figure-*` roles. Units carry no tracking of their own, so their letters never touch. A
  sign is shown when `signed`.
- **Accessibility.** Renders text, not an image; units are spelled so that screen readers
  read them.

#### SynThemeProvider

- **Purpose and props.** Sets the active theme. Props: `theme` (forces `night` or `tidewater`
  and ignores any stored choice), `defaultChoice` (`system`, `night` or `tidewater`; `system`
  by default), `storageKey` (where the choice is remembered, `syn-theme` by default, `null` to
  turn remembering off), `syncDocument` (also set the attribute on the document element, so the
  page background and portals follow the theme; on by default), `onThemeChange`, and children.
- **Anatomy.** A wrapper that carries `data-syn-theme` and does not affect layout.
- **Hooks and helpers.** `useSynTheme()` returns the theme in force, the reader's choice, and
  `setChoice`. `useResolvedToken(name)` returns the resolved value of a token for code that
  cannot use CSS variables (chart and grid libraries), and re-reads it after the new theme is in
  the DOM, so a theme switch never paints the previous theme's value. `resolveToken(name,
  element)` is the same read for code outside React. Names may be given bare
  (`color-surface-base`), as a custom property or as `var(...)`.
- **States.** Choice `system` follows the system colour preference live: dark gives `night` and
  light gives `tidewater`. A stored choice wins over the system. Blocked storage is tolerated:
  the choice then lasts for the session.
- **Accessibility.** `ThemeSwitch` is the labelled control for the choice (System, Night,
  Tidewater); it is a native select with a visible label.

---

## 6. Chart and table specifications

Charts and tables are the product. Both are themed from tokens (§3) and specified here for
anatomy, states and behaviour. The chart library and the grid library are implementation
details; the specifications describe what the reader sees.

Serves principles 1.1 (evidence stays legible), 1.2 (honest uncertainty) and 1.4 (colour
belongs to the data).

### 6.1 Charts

#### Panel and text

- A chart sits on `data-surface`, inside a card (`ChartCard`, §5.5), with padding
  `space(3)` and `radius-card`. The title and support text belong to the card header, above
  the panel; the panel holds only the plot, legend and axis text.
- Tick labels and numbers in tooltips use the figure face (tabular, lining) at `caption`
  size in `data-text-muted`; axis titles use the UI face at `caption` in `data-text-muted`;
  direct series labels use `text-sm` in the series colour's text-safe variant (the series
  colour if it reaches 4.5:1, otherwise `data-text`).
- Every axis title states the unit written out, and where relevant the baseline
  ("°C above 1850 to 1900").
- Numbers use thousands separators and a fixed number of decimals per axis. Minus signs are
  the true minus character.
- A chart that cannot be loaded or drawn is never left as a blank panel: it is replaced by an error
  alert, "Chart failed to load", with a Reload button that reloads the page. A stale cached build
  that asks for a file the server no longer has is the usual cause, and a reload fetches the
  current one.
  The alert and the button are `space-3` apart. A chart given new data, layout or height tries again and
  the message goes; until then it stays folded away at its full width, so the next draw is the right size.

#### Marks

- Lines are `w` wide (table below). Observed series are solid; projected series are dashed
  with the pattern below and continue from the last observation without a gap.
- Bars have `radius-control / 2` top corners, no outline, and a `w` gap between neighbours.
  Bar and area charts start at zero; line charts may start elsewhere, and then the axis
  shows a break mark at the baseline.
- Projected (dashed) series use the colours of the first four slots, which are validated as
  thin dashed lines (§3.6). A chart with more than four projected series draws the rest as
  solid lines with markers and direct labels.
- Series colours are taken in order from `data-cat-1` onward. A series that means a
  particular thing (observed temperature, the world total) keeps its colour across a view.
- Markers appear on hover, on keyboard focus, and permanently when the spacing between
  points is large enough.
- Missing values leave a gap in lines and are drawn as flat `data-no-data` in bars, maps and
  grids; they are never zero and never interpolated.

<!-- generated:chart-table -->
| Quantity | Formula | Value |
|---|---|---|
| Stroke width `w` | `focus-ring-width` | 2 px |
| Dash pattern for projections | (3w, 2w) | 6 px on, 4 px off |
| Marker diameter | 3w | 6 px |
| Markers appear when point spacing is at least | 9w | 18 px |
| Hatch stripe spacing for missing data | 3w | 6 px |
| Band opacity `α` | τ⁻⁸ | 0.233 |
| Nested bands, innermost to outermost | α · τ⁻ᵏ, k = 0, 1, 2 | 0.233, 0.194, 0.162 |
| Opacity of series that are not hovered | τ⁻⁵ | 0.402 |
| Default chart height | `module-min` · σ⁻¹ | 314 px |
| Tooltip offset from the pointer | `space(3)` | 10 px |
<!-- /generated:chart-table -->

#### Legend

- Placed above the plot, left-aligned, in one row that wraps. Each entry is a key that shows
  the series' real mark (a short solid or dashed line, a bar swatch, a marker) and the name
  in `text-sm`.
- With four or fewer series, series are also labelled directly at the end of their line, so
  the legend is a fallback and not the only carrier of identity.
- Entries are toggle buttons (`aria-pressed`): activating one hides or shows the series; the
  last visible series cannot be hidden.
- Beyond eight series, the remainder are grouped as one *Other* entry in `data-other`.
- A legend entry exists for every uncertainty band and for the projection region.

#### Tooltip

- Unified across series at the hovered x position. Surface `surface-overlay`, boundary
  `border-default`, `elevation-2`, `radius-card`, padding `space(2)`.
- Header: the x value with its period (`text-sm`, `text-primary`). Rows: key, series name,
  value with unit in the figure face. Rows are ordered as the series are drawn.
- Projected values carry the word *projection*. A band adds a row *66% range: low to high*.
  A missing value reads *No data*.
- Follows the pointer at the offset below and flips to stay inside the panel. On keyboard
  focus it appears at the focused point.
- Dismisses on `Escape`, pointer leave or focus leave; never traps focus.

#### Label placement

Direct labels, annotation labels and axis labels share one collision rule, applied in this
order:

1. A label stays inside the chart. Series-end labels sit in a margin reserved on the right,
   sized to the longest label; annotation labels sit in a band above the plot.
2. Labels never overlap each other or tick labels. Annotation labels are placed in rows from
   the top of the band; a label that would overlap one already placed, with a margin of
   `space(2)`, moves down one row, and the plot starts below the last row used.
3. End labels are ordered by position and kept at least one line height apart.
4. A label never sits on the axis: the nearest distance to the tick row is one `text-sm`
   line.
5. When the chart is too narrow for the margin (under about 520 px), series-end labels are
   dropped and the legend carries identity.

#### Annotations

- Reference lines (a target year, a baseline) use `data-annotation`, one `w` wide, dotted;
  the label sits at the top in `text-sm` and must not overlap data: it moves along the line
  to the nearest clear spot.
- Callouts are a label with a leader line to a point; at most three annotations are shown by
  default, the rest appear on request.
- Diverging charts draw the baseline as a solid `data-annotation` line and print its value.
- An annotation is always text first: the same information is available in the chart's text
  alternative.

#### Uncertainty

- A projection region begins at the last observation: a vertical `data-uncertainty` wash
  at half the band opacity from that point to the right, with the label *Projection* at the
  top.
- A range is a filled band in the series colour at the band opacity, with its edges drawn
  as hairlines in the series colour. Nested ranges (for example 66% inside 90%) use the
  nested opacities, the widest range lightest.
- A band is never drawn without a legend entry that names its interval and its source.
- Scenario sets show scenarios as lines in series colours with the shared band behind them
  in `data-uncertainty`; the scenario name is a direct label.

#### Interaction

- Hovering a series or its legend entry reduces the other series to the dimmed opacity.
- Drag selection zooms on the x axis; a *Reset* button appears while zoomed. Zoom is also
  available with the keyboard (`+`, `-`, arrow keys) when the plot has focus.
- A year animation (`animationFrame`) steps with `motion-slow` and shows the year as text;
  under reduced motion it jumps and does not play.
- The first render fades in over `motion-base`; no other entrance animation.

#### States

| State | Treatment |
|---|---|
| Loading | Plot area filled with `data-gridline`-coloured placeholder bars; `aria-busy` |
| Empty | A message in `data-text` that says why there is nothing to show and what to change |
| Error | An inline alert on the panel with a retry action |
| Stale | The as-of date turns `signal-caution-text` with the word *stale* when the data is older than its stated update interval |

#### Text alternative and table view

- Every chart has an `ariaLabel` that states what is plotted, the unit, the period and the
  headline reading in one sentence. The plot is exposed as an image with that label and is
  described by the card footer.
- Every chart offers *View as table* in the card actions; it shows the plotted values in a
  `Table` with the units in the headers.
- With keyboard focus on the plot, left and right arrows move between points and the
  tooltip follows; up and down arrows move between series.

#### Footer

- Every chart card ends with a footer in `caption` and `text-muted`: source name, the
  period shown, the as-of date, and a link to the methodology strip (§4). A chart without a
  source is not valid.

#### Theme mapping for the plotting library

| Chart element | Token |
|---|---|
| Paper | transparent |
| Plot background | `data-surface` |
| Colour sequence | `data-cat-1` to `data-cat-8` |
| Sequential scale | `data-seq-1` to `data-seq-7` |
| Diverging scale | `data-div-neg-3` to `data-div-pos-3` |
| Font, ticks | figure face, `data-text-muted` |
| Font, titles | UI face, `data-text-muted` |
| Gridlines and axis lines | `data-gridline` |
| Hover label | `surface-overlay`, `text-primary`, `border-default` |
| Reference line | `data-annotation` |

Values are read from the resolved token values (§5.7), so that charts follow the theme
without a reload.

### 6.2 Tables

#### Density and type

- Row height is `control-height` by default and `control-height-sm` for `size="small"`;
  both become `control-height-touch` below `bp-compact`.
- Cell text is `text-sm`. Header text is `text-sm` at weight 600 in `text-muted`; the unit
  under a header is `caption` in `text-muted`.
- Numeric cells are set in the figure face, right-aligned, with the same number of decimals
  down a column: the column's `decimals` if it gives them, otherwise the most any value in it
  has (6.70 beside 2.15, never 6.7). Thousands are separated and a negative number uses the true
  minus, as in `Figure`. A column with its own `format` is written as that says. Text cells are
  left-aligned. Dates are left-aligned in the figure face.
- Units live in the header, not in every cell.

#### Header hierarchy

1. *Group header* (optional): `overline`, spans its columns, with a `border-default`
   underline across the span.
2. *Column header*: name in `text-sm` semibold, unit beneath in `caption`.
3. *Sort control*: the whole column header is a button; the current sort column shows a
   direction glyph and `text-primary`.

The header row is sticky at the top of the table's scroll region on `surface-sunken`, with a
`border-default` bottom edge. The first column is sticky horizontally and gets a
`border-subtle` right edge and, while content scrolls beneath it, `elevation-1`.

#### Rows and states

| State | Treatment |
|---|---|
| Default | `surface-raised`, `border-subtle` bottom edge when row borders are on |
| Striped (optional) | alternate rows `surface-sunken` |
| Hover | `surface-sunken` |
| Selected | `accent-tint` with an inset `accent-fill` bar, `focus-ring-width` wide, at the start edge |
| Focus | the cell shows the `focus-ring`; the ring is never clipped by the row |
| Subtotal or total | weight 600 and a `border-default` top edge |
| Expanded detail | detail row on `surface-sunken`, indented by `space(5)` |
| Loading | skeleton rows in `border-subtle` |
| Empty | a row-spanning message that says why and offers the way out ("Clear filters") |

- Change columns show a direction glyph and a signed value, in the signal text colour of the
  metric's tone; the glyph and sign carry the meaning as well as the colour.
- Heat cells use the sequential or diverging ramp for fill; the cell text is whichever of
  `data-text` and the dark ink reaches 4.5:1 on that fill.
- In-cell bars use `data-cat-1` at the band opacity with the value printed beside them.

#### Behaviour

- Sorting: three-state (ascending, descending, none), announced through `aria-sort`; sorting
  is stable and ties keep source order.
- Large tables are virtualised; the row count and the visible range are available to
  assistive technology.
- The table scrolls inside its own region (a labelled, focusable scroll container) so the
  page never scrolls in two directions; at 320 px width the first column stays visible.
  A header is as tall as its tallest name once it wraps (never shorter than a row), so a long name such as
  "CO₂ per Capita (t/person)" is not cut off at phone width.
  A table that scrolls sideways says so, in a line under its caption and outside the scrolling area:
  a scrollbar that is hidden until it is touched is no cue, and a cut-off column is easily missed.
- Copy: selecting cells and copying yields tab-separated values with headers and units.

#### Narrow widths

Below `bp-compact` a table does not shrink its columns or let the page scroll sideways. It follows
one of two forms, chosen by the number of columns:

1. *Scrolling region* (more than three columns of figures). The caption is outside the
   scrolling area, above it, so it never scrolls away or clips. The scrolling area is a
   labelled, focusable region named by the caption. The first column is fixed at the start
   edge. A scroll shadow built from `color-shadow` at the dim opacity shows on each edge that has
   more content beyond it, and goes once the edge is reached.
2. *Stacked rows* (three columns or fewer). Each row becomes a block: the first column as its
   heading, the rest as label and value pairs, with the label in `text-muted`.

In `DataTable` the label column is sized to its text, never narrower than its longest word and
capped so the first two number columns show beside it; when they cannot both fit, one shows and
the rest scroll. Labels and headers wrap at spaces only, never inside a word; a header's unit
sits on its own line under the name. A grid whose columns fit has no horizontal scrollbar, and
one that scrolls sideways keeps the scrollbar's height below the last row only where the browser
shows scrollbars that take space.

In both forms, columns are never narrower than `space-10`, and the grid and the static table
fill the width available so no empty band remains to the right of the last column.

#### Grid theme mapping

The data grid library is themed through its parameter API (`themeQuartz.withParams`), fed only
with resolved token values, converted to the units the grid takes. No grid class is restyled in
CSS. Numbers that look like sizes are not chosen: row and header height are the control height
of §2.5, cell padding is a spacing step, and the icon size is the small icon.

| Grid parameter | Token |
|---|---|
| `backgroundColor` | `color-surface-raised` |
| `foregroundColor` | `color-text-secondary` |
| `headerBackgroundColor`, `chromeBackgroundColor` | `color-surface-sunken` |
| `headerTextColor` | `color-text-muted` |
| `browserColorScheme` | `inherit`: the theme root sets `color-scheme`, so scrollbars and built-in controls follow the theme |
| `headerFontWeight` | `type-title-sm-weight` |
| `borderColor`, `rowBorder` | `color-border-subtle` |
| `headerRowBorder`, `pinnedColumnBorder` | `color-border-default` |
| `accentColor` | `color-accent-fill` |
| `rowHoverColor` | `color-surface-sunken` |
| `selectedRowBackgroundColor` | `color-accent-tint` |
| `focusShadow` | `color-focus-ring`, `layout-focus-ring-width` |
| `menuBackgroundColor` | `color-surface-overlay` |
| `fontFamily` | `family-ui` (figure columns set the figure face through the column's cell style) |
| `fontSize`, `headerFontSize` | `type-text-sm-size` |
| `rowHeight`, `headerHeight` | `layout-control-height` |
| `spacing` | `space-2` |
| `cellHorizontalPadding` | `space-4` |
| `wrapperBorderRadius` | `radius-card` |
| `borderRadius` | `radius-control` |
| `iconSize` | `icon-small` |
| `rowBorder`, `headerRowBorder`, `pinnedColumnBorder` width | `layout-border-hairline` |
| Popup, dropdown, card, dialog and drag shadows | `elevation-2`, `elevation-2`, `elevation-1`, `elevation-3`, `elevation-2` |
| Menu, picker list, tooltip and tab colours and borders | the overlay and inverse surfaces, `color-border-default`, `color-accent-*` |
| Input, button, checkbox and toggle colours | `color-surface-base`, `color-border-emphasis`, `color-accent-*`, `color-text-on-accent` |
| Loading and modal overlays, skeleton | `color-surface-raised` and `color-surface-sunken` mixed with transparency, `color-border-default` |
| Colours of grid features this system does not use (find, batch edit, formula, range charts, filter-builder pills, value-change) | drawn from tokens so no grid default can render |

No grid default colour or shadow may render. A story reads every custom property the grid declares
and fails if any colour in it is not a token value or built from token values, and a unit test lists
every parameter the theme sets.

#### Accessibility

- A table has a caption or an accessible name that says what it holds and the period.
- Header cells are `th` with `scope`; grouped headers use `colspan` with `scope="colgroup"`.
- Every interactive cell element has an accessible name that includes the row.
- At 200 percent zoom the content reflows into the scroll region without loss of the first
  column or the header.

### 6.3 Specimens

Three representative screens are built as static Storybook stories, each in both themes,
using the tokens and the specifications above. Their data is generated for layout review and
is labelled as such on the screen.

| Story | Exercises |
|---|---|
| Specimens / Overview | KPI row, trend with projection and range, ranking bars, heat grid with a no-data cell, diverging bars |
| Specimens / Country profile | Analysis bar with three controls, tags, indicator table with grouped header and selected row, stacked composition |
| Specimens / Forecasts | Scenario chart with three paths and ranges, warning alert, scenario summary table, diverging bars |
| Specimens / Figure pairing | Key figures at three sizes, tabular against proportional digits in a right-aligned column, a chart axis |
