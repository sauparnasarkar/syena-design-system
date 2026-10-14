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

**Neutrals on the ground.** Each is the lightness that gives an exact contrast ratio against
the ground, at the ground's hue:

| Token | Contrast with ground | Use |
|---|---|---|
| `data-text` | 7:1 | Chart titles, tick labels that carry values |
| `data-text-muted` | 4.5:1 | Axis titles, legends, source lines |
| `data-annotation` | at least 4.5:1; the lightness of `data-text` at the accent hue and chroma `C_cap / τ²` | Reference lines, callout leaders and labels |
| `data-other` | 4.5:1 | The remainder bucket of a part-to-whole chart |
| `data-no-data` | 3:1 | Missing values; always drawn with a hatch, never as a solid |
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
night: 96 required pairs; tidewater: 96 required pairs.
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
| data-annotation | 4.5:1 | 7.27 | 7.17 | pass |
| data-no-data | 3:1 | 3.03 | 3.03 | pass |
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
| data-div-* | 3:1 | 4.54 | 4.52 | pass |
| data-change-decrease | 3:1 | 11.19 | 10.69 | pass |
| data-change-increase | 3:1 | 3.78 | 3.52 | pass |
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
  belongs to a family fills it); the product mark; destination groups (an `overline` group label
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
| Analysis bar | `section` (a `group`) named *Analysis controls*; the view title is the page's `h1` |
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
