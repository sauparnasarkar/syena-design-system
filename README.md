# Syena Design System

React components, design tokens and chart and table themes for Syena's climate and market
analysis products. Authored from [FOUNDATIONS.md](FOUNDATIONS.md), October 2026.

## What is here

| Path | Contents |
|---|---|
| `FOUNDATIONS.md` | Principles, scale rules, colour system, shell, component, chart and table specifications |
| `tokens/` | Design tokens as DTCG JSON, the generators that compute them, and the token vocabulary |
| `src/` | Components, charts, grid theme, hooks and the stylesheet entry; generated output goes to `src/generated/` (not committed) |
| `scripts/` | Repository checks and helpers |
| `tests/` | Unit and visual tests |

## Use

The package is named `@syena/ds` and declares its `exports`, so a consuming app can alias it to
this folder's `src/` today and install it from a registry later without code changes.

```ts
import '@syena/ds/styles.css';
import { SynThemeProvider } from '@syena/ds';
```

Themes are scoped with the `data-syn-theme` attribute: `night` and `tidewater`.

## Develop

```sh
npm ci
npm run tokens          # generate tokens, tables in FOUNDATIONS.md, and src/generated/
npm run storybook       # http://localhost:6006
npm test                # stories (interaction and axe) and unit tests
npm run lint
npm run check:allowlist
```

`npm run tokens` runs in two stages: the generators compute and validate the token JSON (fails if a required contrast, hue-zone or colour-vision check does not hold), then Style Dictionary writes `src/generated/tokens.css` and `tokens.ts`, plus `reports/contrast-matrix.json` and `reports/token-count.json` (fails outside 150 to 300 custom properties).
`npm run check:allowlist` fails if the source uses a colour literal, a custom property the token
build does not define, a class that is not a CSS Module class or a declared utility, a `data-*`
attribute other than `data-syn-*`, or a token word that is not in `tokens/vocabulary.json`.

### Visual tests

```sh
npm run build-storybook
npm run test:visual:update   # create or refresh baselines
npm run test:visual          # compare against baselines
```

Baselines are platform specific; create them on the platform that runs the comparison.

## Contributing

Pull requests name the section of `FOUNDATIONS.md` they implement. Scales are changed by
changing the formulas and inputs, never by editing generated values.

## Third-party material

| Material | Licence | Use |
|---|---|---|
| [Lucide](https://lucide.dev) (`lucide-react`) | ISC. Icons derived from Feather are also under the MIT licence (Cole Bemis, 2013-present). The licence notices ship with the package. | Icon glyphs, wrapped by the `Icon` component and imported one at a time so unused icons are dropped from bundles |
| Poppins (`@fontsource/poppins`) | SIL Open Font License 1.1 | Interface typeface |
| Inter (`@fontsource-variable/inter`) | SIL Open Font License 1.1 | Figure typeface |

Components wrap third-party icons; consumers import `Icon`, not the icon package.
