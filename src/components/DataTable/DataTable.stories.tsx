import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { DataTable, type DataTableColumn } from './DataTable';

type Row = { indicator: string; y1990: number; y2000: number; y2010: number; y2024: number; change: number };
const rows: Row[] = [
  { indicator: 'Total CO₂ emissions (MtCO₂)', y1990: 412, y2000: 468, y2010: 521, y2024: 449, change: 9.0 },
  { indicator: 'Emissions per person (tCO₂)', y1990: 7.7, y2000: 7.9, y2010: 8.1, y2024: 6.4, change: -16.9 },
  { indicator: 'Emissions per unit of output', y1990: 0.62, y2000: 0.51, y2010: 0.41, y2024: 0.27, change: -56.5 },
  { indicator: 'Renewable share of electricity', y1990: 18.2, y2000: 20.5, y2010: 26.9, y2024: 43.7, change: 140.1 },
  { indicator: 'Forest cover (% of land)', y1990: 31.4, y2000: 30.2, y2010: 29.8, y2024: 29.1, change: -7.3 },
];
const signed = (v: unknown) => `${(v as number) > 0 ? '+' : '−'}${Math.abs(v as number).toFixed(1)}%`;
const columns: DataTableColumn<Row>[] = [
  { key: 'indicator', header: 'Indicator' },
  { key: 'y1990', header: '1990', numeric: true },
  { key: 'y2000', header: '2000', numeric: true },
  { key: 'y2010', header: '2010', numeric: true },
  { key: 'y2024', header: '2024', numeric: true },
  { key: 'change', header: 'Change since 1990', unit: 'per cent', numeric: true, format: signed },
];

const frame = (width = 'min(100%, 62rem)') => (Story: () => ReactElement) => <div style={{ padding: 'var(--syn-space-4)', width }}><Story /></div>;
const CAPTION = 'Indicators for the example country, 1990 to 2024. Illustrative values.';

const meta: Meta<typeof DataTable<Row>> = { title: 'Data/DataTable', component: DataTable, args: { columns, rows, caption: CAPTION }, decorators: [frame()] };
export default meta;
type Story = StoryObj<typeof DataTable<Row>>;

/** Nothing is cut off: each label's text sits inside its cell, and the last row ends inside the grid body. */
const expectNothingClipped = async (el: HTMLElement) => {
  const check = () => {
    const root = (el.querySelector('.ag-root') as HTMLElement).getBoundingClientRect();
    const rowsEls = [...el.querySelectorAll('.ag-grid-scrolling-rows .ag-row')];
    expect(rowsEls.length).toBeGreaterThan(0);
    const last = Math.max(...rowsEls.map((r) => r.getBoundingClientRect().bottom));
    expect(last).toBeLessThanOrEqual(root.bottom + 1);
    // A horizontal scrollbar with height sits below the rows and never covers the last one.
    const bar = el.querySelector('.ag-body-horizontal-scroll') as HTMLElement | null;
    if (bar && bar.offsetHeight > 0) expect(last).toBeLessThanOrEqual(bar.getBoundingClientRect().top + 1);
    for (const cell of el.querySelectorAll('.ag-grid-pinned-left-cells .ag-cell')) {
      const text = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT).nextNode()!;
      const range = document.createRange(); range.selectNodeContents(text);
      const box = range.getBoundingClientRect(); const own = cell.getBoundingClientRect();
      expect(box.top).toBeGreaterThanOrEqual(own.top - 1);
      expect(box.bottom).toBeLessThanOrEqual(own.bottom + 1);
      expect(cell.scrollHeight).toBeLessThanOrEqual(cell.clientHeight + 1);
    }
  };
  await waitFor(check, { timeout: 4000 });
  // It stays that way once the rows have settled.
  await new Promise((r) => setTimeout(r, 1500));
  check();
};

const ready = (el: HTMLElement) => waitFor(() => expect(el.querySelector('.ag-row')).not.toBeNull(), { timeout: 10000 });
const textRight = (el: Element) => { const r = document.createRange(); r.selectNodeContents(el); return Math.round(r.getBoundingClientRect().right); };

export const Structure: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ready(canvasElement);
    // The visible caption sits outside the grid and names it.
    const region = canvas.getByRole('region', { name: CAPTION });
    await expect(region.contains(canvas.getByText(CAPTION))).toBe(false);
    await expect(canvasElement.querySelector('[role="grid"]')).not.toBeNull();
  },
};

export const ColumnsFillTheWidth: Story = {
  // Few enough columns to fit at every width, so the last one is always drawn.
  args: { columns: [columns[0], columns[4], columns[5]] },
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    // No empty band to the right of the last column: rows reach the edge of the header and the container.
    await waitFor(() => {
      const root = canvasElement.querySelector('.ag-root') as HTMLElement;
      const lastHeader = [...canvasElement.querySelectorAll('.ag-header-cell')].pop() as HTMLElement;
      expect(Math.abs(lastHeader.getBoundingClientRect().right - root.getBoundingClientRect().right)).toBeLessThanOrEqual(2);
    }, { timeout: 10000 });
    const root = canvasElement.querySelector('.ag-root') as HTMLElement;
    await waitFor(() => {
      const lastCell = canvasElement.querySelector('.ag-grid-scrolling-rows .ag-row [col-id="change"]') as HTMLElement;
      expect(lastCell).not.toBeNull();
      expect(Math.abs(lastCell.getBoundingClientRect().right - root.getBoundingClientRect().right)).toBeLessThanOrEqual(2);
    }, { timeout: 10000 });
  },
};

export const LabelColumnIsNotTruncatedWhileNumbersHaveSlack: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const first = [...canvasElement.querySelectorAll('.ag-grid-pinned-left-cells .ag-cell')];
    await expect(first.length).toBeGreaterThan(0);
    for (const cell of first) await expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1);
    // Number columns take their content plus padding; the spare width is shared, not left to the label.
    const header = within(canvasElement).getByText('Indicator').closest('.ag-header-cell') as HTMLElement;
    const number = within(canvasElement).getByText('2024').closest('.ag-header-cell') as HTMLElement;
    await expect(header.getBoundingClientRect().width).toBeLessThan(number.getBoundingClientRect().width * 3);
  },
};

export const GridIsAsTallAsItsRows: Story = {
  tags: ['both-scrollbar-modes'],
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const rowsEls = [...canvasElement.querySelectorAll('.ag-grid-scrolling-rows .ag-row')];
    await expect(rowsEls).toHaveLength(rows.length);
    const root = canvasElement.querySelector('.ag-root-wrapper') as HTMLElement;
    const bar = canvasElement.querySelector('.ag-body-horizontal-scroll') as HTMLElement | null;
    const reserved = bar && bar.offsetHeight > 0 ? bar.offsetHeight : 0;
    // No empty strip under the last row beyond the scrollbar's own height (and the frame's border). The grid
    // measures its rows after the first paint, so give it a moment to settle.
    await waitFor(() => {
      const last = rowsEls.reduce((m, r) => Math.max(m, r.getBoundingClientRect().bottom), 0);
      expect(root.getBoundingClientRect().bottom - last).toBeLessThanOrEqual(reserved + 3);
    }, { timeout: 10000 });
  },
};

export const ANumberColumnIsRightAlignedWithoutBeingToldSo: Story = {
  args: { columns: columns.map(({ numeric: _numeric, ...rest }) => rest) },
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const header = within(canvasElement).getByText('2024').closest('.ag-header-cell') as HTMLElement;
    const cell = canvasElement.querySelector(`.ag-grid-scrolling-rows .ag-row [col-id="${header.getAttribute('col-id')}"]`) as HTMLElement;
    await expect(getComputedStyle(cell).textAlign).toBe('right');
    // The label column, whose values are text, is not.
    const label = canvasElement.querySelector('.ag-grid-pinned-left-cells .ag-cell') as HTMLElement;
    await expect(getComputedStyle(label).textAlign).not.toBe('right');
  },
};

export const NumbersAndHeadersAreRightAligned: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    for (const year of ['1990', '2000', '2010', '2024']) {
      const header = within(canvasElement).getByText(year).closest('.ag-header-cell') as HTMLElement;
      const cell = canvasElement.querySelector(`.ag-grid-scrolling-rows .ag-row [col-id="${header.getAttribute('col-id')}"]`) as HTMLElement;
      await expect(getComputedStyle(cell).textAlign).toBe('right');
      await expect(Math.abs(textRight(within(header).getByText(year)) - textRight(cell))).toBeLessThanOrEqual(1);
    }
  },
};

export const SortsThreeStates: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const header = within(canvasElement).getByText('2024').closest('.ag-header-cell') as HTMLElement;
    const label = within(header).getByText('2024');
    await userEvent.click(label);
    await waitFor(() => expect(header).toHaveAttribute('aria-sort', 'ascending'));
    await userEvent.click(label);
    await waitFor(() => expect(header).toHaveAttribute('aria-sort', 'descending'));
    await userEvent.click(label);
    await waitFor(() => expect(['none', null]).toContain(header.getAttribute('aria-sort')));
  },
};

/** Words whose letters are laid out on more than one line, in the text of every cell and header. */
const splitWords = (root: Element) => {
  const split: string[] = [];
  for (const el of root.querySelectorAll('.ag-cell, .ag-header-cell')) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? '';
      for (const match of text.matchAll(/\S+/g)) {
        const range = document.createRange();
        range.setStart(node, match.index!); range.setEnd(node, match.index! + match[0].length);
        if (new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size > 1) split.push(match[0]);
      }
    }
  }
  return split;
};

export const NoWordIsEverSplit: Story = {
  tags: ['both-scrollbar-modes'],
  decorators: [frame('min(100%, 320px)')],
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    await waitFor(() => expect(canvasElement.querySelectorAll('.ag-header-cell').length).toBeGreaterThan(1));
    // At 320px: no word is broken across lines in a label or a header, and the label column is at least as wide as its longest word.
    await waitFor(() => expect(splitWords(canvasElement)).toEqual([]), { timeout: 6000 });
    const pinned = canvasElement.querySelector('.ag-header-cell') as HTMLElement;
    const longest = Math.max(...rows.flatMap((r) => r.indicator.split(/\s+/)).map((w) => { const probe = document.createElement('span'); probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap'; probe.textContent = w; pinned.appendChild(probe); const width = probe.getBoundingClientRect().width; probe.remove(); return width; }));
    await expect(pinned.getBoundingClientRect().width).toBeGreaterThanOrEqual(longest);
    // When two number columns cannot fit beside the label, one shows and the rest scroll: the page itself does not.
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    // Nothing is covered by the scrollbar or cut off, at 320 as at 390.
    await expectNothingClipped(canvasElement);
  },
};

export const HeaderUnitSitsOnItsOwnLine: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const header = within(canvasElement).getByText('Change since 1990').closest('.ag-header-cell') as HTMLElement;
    const name = within(header).getByText('Change since 1990');
    const unit = within(header).getByText('per cent');
    await expect(unit.getBoundingClientRect().top).toBeGreaterThanOrEqual(name.getBoundingClientRect().bottom - 1);
    // Quieter than the name: a lighter weight (the sizes meet at the 12px floor).
    await expect(Number(getComputedStyle(unit).fontWeight)).toBeLessThan(Number(getComputedStyle(name).fontWeight));
  },
};

export const NoStripWhenNothingScrolls: Story = {
  tags: ['both-scrollbar-modes'],
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    // Columns that fit have no horizontal scrollbar, so no height is kept for one below the rows.
    await waitFor(() => {
      const root = canvasElement.querySelector('.ag-root-wrapper') as HTMLElement;
      const last = Math.max(...[...canvasElement.querySelectorAll('.ag-grid-scrolling-rows .ag-row')].map((r) => r.getBoundingClientRect().bottom));
      expect(root.getBoundingClientRect().bottom - last).toBeLessThanOrEqual(3);
    }, { timeout: 6000 });
  },
};

export const FirstColumnIsPinned: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    await expect(canvasElement.querySelector('.ag-cell-last-left-pinned')).not.toBeNull();
  },
};

export const SelectingARowReportsIt: Story = {
  args: { onRowSelected: fn() },
  play: async ({ canvasElement, args }) => {
    await ready(canvasElement);
    await userEvent.click(canvasElement.querySelector('.ag-grid-scrolling-rows .ag-row .ag-cell') as HTMLElement);
    await waitFor(() => expect(args.onRowSelected).toHaveBeenCalledOnce());
    await expect(canvasElement.querySelector('.ag-row-selected')).not.toBeNull();
  },
};

export const EmptyStateSaysWhyAndOffersTheWayOut: Story = {
  args: { rows: [], emptyMessage: 'No indicators match these filters.', emptyAction: { label: 'Clear filters', onClick: fn() } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('No indicators match these filters.')).toBeInTheDocument());
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }));
    await expect(args.emptyAction!.onClick).toHaveBeenCalledOnce();
  },
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.ag-overlay-loading-wrapper, .ag-overlay')).not.toBeNull());
  },
};

export const PhoneWidthFillsAndKeepsTwoNumberColumnsBesideTheLabel: Story = {
  tags: ['both-scrollbar-modes'],
  decorators: [frame('min(100%, 390px)')],
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const wrapEl = canvasElement.querySelector('.ag-root-wrapper') as HTMLElement;
    const holder = (wrapEl.closest('[role="region"]') as HTMLElement).getBoundingClientRect();
    // The grid fills its container's width.
    await expect(Math.abs(wrapEl.getBoundingClientRect().right - holder.right)).toBeLessThanOrEqual(2);
    // The label is capped and wraps; at least two number columns are fully visible beside it.
    const view = (canvasElement.querySelector('.ag-grid-viewport') as HTMLElement).getBoundingClientRect();
    const seen = [...canvasElement.querySelectorAll('.ag-header-cell:not(.ag-column-first)')].filter((h) => { const r = h.getBoundingClientRect(); return r.left >= view.left - 1 && r.right <= view.right + 1; });
    await expect(seen.length).toBeGreaterThanOrEqual(2);
    // Wrapped labels use the text step's line height, and nothing overflows its row.
    const lineHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--syn-type-text-sm-line')) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    let wrapped = 0;
    for (const cell of canvasElement.querySelectorAll('.ag-grid-pinned-left-cells .ag-cell')) {
      const text = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT).nextNode()!;
      const range = document.createRange(); range.selectNodeContents(text);
      const tops = [...new Set([...range.getClientRects()].map((r) => Math.round(r.top)))].sort((a, b) => a - b);
      if (tops.length > 1) { wrapped += 1; await expect(Math.abs(tops[1] - tops[0] - lineHeight)).toBeLessThanOrEqual(1); }
    }
    await expect(wrapped).toBeGreaterThan(0);
    await expectNothingClipped(canvasElement);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  },
};

export const NarrowScrollsInsideItsRegionAndKeepsTheFirstColumn: Story = {
  tags: ['both-scrollbar-modes'],
  decorators: [frame('min(100%, 390px)')],
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    const viewport = canvasElement.querySelector('.ag-body-horizontal-scroll-viewport') as HTMLElement;
    await waitFor(() => expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth));
    await expect(canvasElement.querySelector('.ag-cell-last-left-pinned')).not.toBeNull();
    // The check above only means something where scrollbars take space, so the test browser must show them.
    await waitFor(() => expect((canvasElement.querySelector('.ag-body-horizontal-scroll') as HTMLElement).offsetHeight).toBeGreaterThan(0), { timeout: 4000 });
    await expectNothingClipped(canvasElement);
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };
export const Night: Story = { globals: { theme: 'night' } };

export const ATableThatScrollsSaysSoBesideItsCaption: Story = {
  tags: ['both-scrollbar-modes'],
  decorators: [frame('min(100%, 390px)')],
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const viewport = canvasElement.querySelector('.ag-body-horizontal-scroll-viewport') as HTMLElement;
    await waitFor(() => expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth));
    const hint = await within(canvasElement).findByText(/scroll sideways/i);
    // Between the caption and the grid, outside the scrolling area, so it stays in view as the columns move.
    const grid = canvasElement.querySelector('.ag-root-wrapper') as HTMLElement;
    await expect(hint.getBoundingClientRect().bottom).toBeLessThanOrEqual(grid.getBoundingClientRect().top + 1);
    await expect(grid.contains(hint)).toBe(false);
  },
};

export const ATableThatFitsDoesNotMentionScrolling: Story = {
  decorators: [frame('min(100%, 62rem)')],
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    await waitFor(() => expect(canvasElement.querySelector('.ag-root-wrapper')).not.toBeNull());
    await expect(within(canvasElement).queryByText(/scroll sideways/i)).toBeNull();
  },
};

type Profile = { year: number; co2: number; perCapita: number; yoy: number; intensity: number };
const profile: Profile[] = [1990, 1991, 1992, 1993].map((year, i) => ({ year, co2: 2483.53 + i * 135, perCapita: 2.15 + i * 0.09, yoy: 3.1 - i, intensity: 1.24 - i * 0.02 }));

export const AHeaderThatWrapsIsNotCutOff: Story = {
  tags: ['both-scrollbar-modes'],
  args: {
    rows: profile as unknown as Row[],
    columns: [
      { key: 'year', header: 'Year', numeric: false, format: (v: unknown) => String(v) },
      { key: 'co2', header: 'CO₂ (MtCO₂)' },
      { key: 'perCapita', header: 'CO₂ per Capita (t/person)' },
      { key: 'yoy', header: 'YoY % Change' },
      { key: 'intensity', header: 'GHG Intensity (kg CO₂e/$ GDP)' },
    ] as unknown as DataTableColumn<Row>[],
  },
  decorators: [frame('min(100%, 390px)')],
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    // However many lines a header takes, its text stays inside its cell, so the header grows to fit.
    await waitFor(() => {
      const cells = [...canvasElement.querySelectorAll<HTMLElement>('.ag-header-cell')];
      expect(cells.length).toBeGreaterThan(3);
      for (const cell of cells) {
        const text = cell.querySelector('span') as HTMLElement;
        const box = text.getBoundingClientRect();
        const own = cell.getBoundingClientRect();
        expect(box.top).toBeGreaterThanOrEqual(own.top - 1);
        expect(box.bottom).toBeLessThanOrEqual(own.bottom + 1);
      }
    }, { timeout: 4000 });
  },
};

type Reading = { name: string; total: number; change: number; share: number };
const readings: Reading[] = [
  { name: 'First', total: 2483.53, change: -4.47, share: 6.7 },
  { name: 'Second', total: 3351.2, change: 1.5, share: 12 },
  { name: 'Third', total: 700, change: -0.25, share: 2.17 },
];
const cellTexts = (el: HTMLElement, col: string) => [...el.querySelectorAll(`.ag-cell[col-id="${col}"]`)].map((c) => c.textContent);

export const NumbersShareOneNumberOfDecimalsDownAColumn: Story = {
  args: {
    rows: readings as unknown as Row[],
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'total', header: 'Total' },
      { key: 'change', header: 'Change' },
      { key: 'share', header: 'Share', decimals: 1 },
    ] as unknown as DataTableColumn<Row>[],
  },
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    await waitFor(() => {
      // The most decimals any value in the column has, kept for every value in it.
      expect(cellTexts(canvasElement, 'total')).toEqual(['2,483.53', '3,351.20', '700.00']);
      // A column that says how many decimals it has is written to that many.
      expect(cellTexts(canvasElement, 'share')).toEqual(['6.7', '12.0', '2.2']);
    });
  },
};

export const ANegativeNumberUsesTheTrueMinus: Story = {
  args: {
    rows: readings as unknown as Row[],
    columns: [{ key: 'name', header: 'Name' }, { key: 'change', header: 'Change' }] as unknown as DataTableColumn<Row>[],
  },
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    await waitFor(() => expect(cellTexts(canvasElement, 'change')).toEqual(['−4.47', '1.50', '−0.25']));
  },
};
