import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Select } from '../Select/Select';
import { AnalysisBar } from './AnalysisBar';

const field = (label: string, value: string) => (
  <div style={{ display: 'grid', gap: 'var(--syn-space-1)' }}>
    <span style={{ color: 'var(--syn-color-text-muted)', font: 'var(--syn-type-caption-weight) var(--syn-type-caption-size) / var(--syn-type-caption-line) var(--syn-type-caption-family)' }}>{label}</span>
    <input aria-label={label} defaultValue={value} />
  </div>
);

const meta: Meta<typeof AnalysisBar> = {
  title: 'Shell/AnalysisBar',
  component: AnalysisBar,
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Country profile',
    purpose: "How one country's emissions have changed and where current policy leads.",
    children: <>{field('Geography', 'Example country')}{field('Period', '1990 to 2024')}{field('Metric', 'Annual CO₂')}</>,
  },
};
export default meta;
type Story = StoryObj<typeof AnalysisBar>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('region', { name: 'Analysis controls' })).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { level: 1, name: 'Country profile' })).toBeInTheDocument();
    await expect(canvas.getByLabelText('Period')).toBeInTheDocument();
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };

const years = Array.from({ length: 12 }, (_, i) => ({ value: String(2013 + i), label: String(2013 + i) }));

/** A page's row of jump links, pinned under the bar on the sticky layer, as the products place one. */
const PinnedRow = () => (
  <div data-syn-sticky="top" style={{ position: 'sticky', top: '8rem', zIndex: 'var(--syn-layer-sticky)', padding: 'var(--syn-space-2) var(--syn-space-6)', background: 'var(--syn-color-surface-base)' }}>
    <a href="#a" style={{ marginRight: 'var(--syn-space-4)' }}>Climate signal</a><a href="#b" style={{ marginRight: 'var(--syn-space-4)' }}>Relationship</a><a href="#c">Top emitters</a>
  </div>
);

function BarWithMenu() {
  const [year, setYear] = useState('2024');
  return (
    <>
      <AnalysisBar title="Overview" purpose="Where emissions are.">
        <Select ariaLabel="Page year" options={years} value={year} onChange={setYear} size="small" suppressSearch />
      </AnalysisBar>
      <PinnedRow />
      <div style={{ height: '40rem', padding: 'var(--syn-space-6)' }}>Page content</div>
    </>
  );
}

export const AMenuOpenedInTheBarIsNotCoveredByARowPinnedBelowIt: Story = {
  render: () => <BarWithMenu />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Page year' }));
    const list = await canvas.findByRole('listbox');
    await waitFor(() => expect(list.getBoundingClientRect().height).toBeGreaterThan(0));
    const row = canvasElement.querySelector('[data-syn-sticky="top"]:not(section)') as HTMLElement;
    const rowBox = row.getBoundingClientRect();
    const listBox = list.getBoundingClientRect();
    // The menu reaches down over the pinned row...
    await expect(listBox.bottom).toBeGreaterThan(rowBox.bottom);
    // ...and every option over it can be seen and pressed: nothing the row owns is on top.
    for (const option of within(list).getAllByRole('option')) {
      const r = option.getBoundingClientRect();
      if (r.bottom < rowBox.top || r.top > rowBox.bottom) continue;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      await expect(list.contains(hit)).toBe(true);
    }
  },
};
