import type { Meta, StoryObj } from '@storybook/react-vite';

const roles = [
  ['display', 'Display'], ['title-lg', 'Title large'], ['title-md', 'Title medium'], ['title-sm', 'Title small'],
  ['text-lg', 'Text large: long-form prose and lead paragraphs'], ['text-md', 'Text medium: default interface text'],
  ['text-sm', 'Text small: dense tables and secondary notes'], ['caption', 'Caption: sources and fine print'],
  ['overline', 'Overline'], ['figure-lg', '1,234.56'], ['figure-md', '1,234.56'], ['figure-sm', '1,234.56'],
] as const;
const tones = ['primary', 'secondary', 'muted', 'link', 'positive', 'negative', 'caution'] as const;
const surfaces = ['base', 'raised', 'sunken', 'overlay'] as const;

function Base() {
  return (
    <main style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', overflowWrap: 'anywhere', gap: 'var(--syn-space-6)', padding: 'var(--syn-space-6)', maxWidth: 'var(--syn-layout-content-max)' }}>
      <h1>Base layer</h1>
      <section aria-labelledby="roles">
        <h2 id="roles">Type roles</h2>
        {roles.map(([role, text]) => (
          <p key={role} className={`syn-${role}`}>{text} <span className="syn-caption syn-tone-muted">syn-{role}</span></p>
        ))}
      </section>
      <section aria-labelledby="tones">
        <h2 id="tones">Tones, on each surface</h2>
        {surfaces.map((s) => (
          <p key={s} className={`syn-surface-${s} syn-text-md`} style={{ padding: 'var(--syn-space-3)' }}>
            {tones.map((t) => (
              <span key={t} className={`syn-tone-${t}`} style={{ marginInlineEnd: 'var(--syn-space-4)' }}>{t}</span>
            ))}
            <span className="syn-caption">on syn-surface-{s}</span>
          </p>
        ))}
        <p className="syn-surface-inverse syn-text-md" style={{ padding: 'var(--syn-space-3)' }}>Inverse surface with its own text colour</p>
      </section>
      <section aria-labelledby="focus">
        <h2 id="focus">Elements and focus</h2>
        <p>
          A <a href="#focus">link</a>, a <button type="button">button</button> and an <input aria-label="Example field" defaultValue="field" /> all show one focus ring on keyboard focus.
        </p>
      </section>
    </main>
  );
}

const meta: Meta<typeof Base> = { title: 'Base/Typography and utilities', component: Base };
export default meta;
export const Night: StoryObj<typeof Base> = { globals: { theme: 'night' } };
export const Tidewater: StoryObj<typeof Base> = { globals: { theme: 'tidewater' } };
