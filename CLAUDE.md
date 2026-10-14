# CLAUDE.md

Syena Design System: a React 19 + TypeScript component library with DTCG design tokens,
CSS Modules and Storybook 10.

## Principles
- FOUNDATIONS.md is the source of truth for scales, colour roles, type roles and
  component anatomy. Read the relevant section before changing tokens or components.
- Scales (type, space, radius, colour ramps) are generated from the formulas in
  FOUNDATIONS.md §2. Don't hand-pick values; change the formula.
- Only semantic tokens are emitted as CSS variables (prefix --syn-). Primitives stay in
  tokens/primitives (JSON) and src/generated/tokens.ts.
- Token names use only the vocabulary in tokens/vocabulary.json.
- Component styles live in a co-located Name.module.css and consume semantic tokens only.
  No colour literals in src/ outside generated files.
- Themes are scoped with [data-syn-theme] and override semantic tokens only.
- Every component has stories with play tests for interactive behaviour; every story
  passes axe (a11y.test: 'error').

## Commands
npm run tokens           # build tokens.css / tokens.ts and the contrast matrix
npm run storybook        # http://localhost:6006
npm test                 # Vitest: storybook project (interaction + axe) and unit project
npm run lint             # oxlint
npm run check:allowlist  # prefix, vocabulary, class, colour-literal and data-attribute checks

## Conventions
- One component per folder: Name.tsx, Name.module.css, Name.stories.tsx; export from src/index.ts.
- PR descriptions name the FOUNDATIONS.md section they implement.
