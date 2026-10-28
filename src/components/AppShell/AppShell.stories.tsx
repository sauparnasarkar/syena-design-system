import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnalysisBar } from '../AnalysisBar/AnalysisBar';
import { MultiSelect } from '../MultiSelect/MultiSelect';
import { Select } from '../Select/Select';
import { BackToTop } from '../BackToTop/BackToTop';
import { Footer } from '../Footer/Footer';
import { Rail } from '../Rail/Rail';
import { SourceStrip } from '../SourceStrip/SourceStrip';
import { navFooter, navGroups, placeholderMark } from '../storyFixtures';
import { TopBar } from '../TopBar/TopBar';
import { AppShell } from './AppShell';

const control = (label: string, value: string) => (
  <label key={label} style={{ display: 'grid', gap: 'var(--syn-space-1)', color: 'var(--syn-color-text-muted)', font: 'var(--syn-type-caption-weight) var(--syn-type-caption-size) / var(--syn-type-caption-line) var(--syn-type-caption-family)' }}>
    {label}
    <input defaultValue={value} />
  </label>
);

const modulesOf = (suffix: string) => ['Key figures', 'Trend', 'Composition', 'Comparison'].map((base) => base + suffix).map((name) => (
  <section key={name} aria-label={name} style={{ minHeight: '40vh', padding: 'var(--syn-space-4)', border: 'var(--syn-layout-border-hairline) solid var(--syn-color-border-default)', borderRadius: 'var(--syn-radius-card)', background: 'var(--syn-color-surface-raised)' }}>
    <h2 style={{ font: 'var(--syn-type-title-sm-weight) var(--syn-type-title-sm-size) / var(--syn-type-title-sm-line) var(--syn-type-title-sm-family)' }}>{name}</h2>
  </section>
));
const modules = modulesOf('');

function Example({ compact, slots, tall, groups = navGroups, controls }: { compact?: boolean; slots?: boolean; tall?: boolean; groups?: typeof navGroups; controls?: boolean }) {
  return (
    <AppShell
      compact={compact}
      rail={<Rail logo={placeholderMark} productName="Climate analysis" groups={groups} footerItems={navFooter} current="country" onItemClick={(_item, event) => event.preventDefault()} actions={slots ? <button type="button">Ask the agent</button> : undefined} utilities={slots ? <button type="button">Theme</button> : undefined} />}
      topBar={<TopBar logo={placeholderMark} title="Country profile" summary="Example country · 1990 to 2024" />}
      analysisBar={
        <AnalysisBar title="Country profile" purpose="How one country's emissions have changed and where current policy leads.">
          {control('Geography', 'Example country')}{control('Period', '1990 to 2024')}
        </AnalysisBar>
      }
      strip={<SourceStrip summary="Source: example dataset · Period 1990 to 2024 · As of October 2026" methodNotes={<p>Method notes.</p>} />}
      footer={<Footer copyright="© 2026 Example organisation" links={[{ label: 'Privacy', href: '#privacy' }]} />}
    >
      {tall ? [' one', ' two', ' three'].map((n) => <div key={n} style={{ display: 'contents' }}>{modulesOf(n)}</div>) : modules}
      {controls ? <div style={{ display: 'grid', gap: 'var(--syn-space-6)' }}>{Array.from({ length: 14 }, (_, i) => <button key={i} type="button">{`Control ${i + 1}`}</button>)}</div> : null}
      <BackToTop targetId="content" />
    </AppShell>
  );
}

const meta: Meta<typeof AppShell> = { title: 'Shell/AppShell', component: AppShell, parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj<typeof AppShell>;

export const Wide: Story = {
  tags: ['desktop-only'],
  render: () => <Example compact={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Landmarks, in reading order.
    await expect(canvas.getByRole('navigation', { name: 'Skip links' })).toBeInTheDocument();
    await expect(canvas.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    await expect(canvas.getByRole('region', { name: 'Analysis controls' })).toBeInTheDocument();
    await expect(canvas.getByRole('main')).toBeInTheDocument();
    await expect(canvas.getByRole('complementary', { name: 'Sources and methodology' })).toBeInTheDocument();
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    // The skip link is the first stop, and it lands on the canvas.
    window.scrollTo(0, 400);
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Skip to content' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByRole('main')).toHaveFocus());
    // The canvas lands below the sticky analysis bar: its first heading is not covered (WCAG 2.4.11).
    const heading = canvas.getAllByRole('heading', { level: 2 })[0];
    await waitFor(() => {
      const box = heading.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      expect(hit === heading || heading.contains(hit)).toBe(true);
    });
    window.scrollTo(0, 0);
  },
};

export const WideTidewater: Story = { tags: ['desktop-only'], render: () => <Example compact={false} />, globals: { theme: 'tidewater' } };

// More destinations than a short phone can show: the destinations scroll, and the utilities stay inside the drawer.
const manyGroups = [{ id: 'many', label: 'Many', items: Array.from({ length: 30 }, (_, i) => ({ id: `d${i}`, label: `Destination ${i + 1}`, href: `#d${i}`, icon: 'overview' as const })) }];

export const CompactDrawerKeepsUtilitiesInView: Story = {
  render: () => <Example compact slots groups={manyGroups} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open navigation' }));
    const drawer = await canvas.findByRole('dialog', { name: 'Navigation' });
    const theme = within(drawer).getByRole('button', { name: 'Theme' });
    const box = drawer.getBoundingClientRect();
    const r = theme.getBoundingClientRect();
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight + 1);
    await expect(r.bottom).toBeLessThanOrEqual(box.bottom + 1);
    await expect(r.top).toBeGreaterThanOrEqual(box.top);
    // The drawer itself does not scroll; its list of destinations does.
    await expect(drawer.scrollHeight).toBeLessThanOrEqual(drawer.clientHeight + 1);
    const list = within(drawer).getByRole('link', { name: 'Destination 1' }).closest('nav')!.querySelector('[class*="destinations"]')!;
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
  },
};

export const CompactDrawerShowsRailSlots: Story = {
  render: () => <Example compact slots />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open navigation' }));
    const drawer = await canvas.findByRole('dialog', { name: 'Navigation' });
    await expect(within(drawer).getByRole('button', { name: 'Ask the agent' })).toBeInTheDocument();
    await expect(within(drawer).getByRole('button', { name: 'Theme' })).toBeInTheDocument();
  },
};

export const CompactDrawerAndSheet: Story = {
  render: () => <Example compact />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // At compact widths the top bar carries the page heading and the rail is not in the page.
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expect(canvas.queryByRole('navigation', { name: 'Primary' })).toBeNull();

    const open = canvas.getByRole('button', { name: 'Open navigation' });
    await userEvent.click(open);
    const drawer = await canvas.findByRole('dialog', { name: 'Navigation' });
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await expect(within(drawer).getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    // Focus moves inside and stays there.
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));
    await userEvent.tab({ shift: true });
    await expect(drawer.contains(document.activeElement)).toBe(true);
    // Escape closes the drawer and returns focus to the control that opened it.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    await expect(open).toHaveFocus();

    // A visible close control closes the drawer and gives focus back to the menu button.
    await userEvent.click(open);
    await userEvent.click(within(await canvas.findByRole('dialog', { name: 'Navigation' })).getByRole('button', { name: 'Close navigation' }));
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    await expect(open).toHaveFocus();
    // So does a tap on the dimmed area.
    await userEvent.click(open);
    await canvas.findByRole('dialog', { name: 'Navigation' });
    const scrim = document.querySelector('[aria-hidden="true"][class*="scrim"]') as HTMLElement;
    await userEvent.click(scrim);
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    await expect(open).toHaveFocus();

    // Choosing a destination closes it too.
    await userEvent.click(open);
    await userEvent.click(within(await canvas.findByRole('dialog', { name: 'Navigation' })).getByRole('link', { name: 'Forecasts' }));
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());

    // The analysis controls open as a sheet.
    const controls = canvas.getByRole('button', { name: 'Open analysis controls' });
    await userEvent.click(controls);
    const sheet = await canvas.findByRole('dialog', { name: 'Analysis controls' });
    await expect(within(sheet).getByLabelText('Period')).toBeInTheDocument();
    // The page title is in the top bar only: the sheet has its own heading and does not repeat it.
    await expect(within(sheet).getByRole('heading', { level: 2, name: 'Filters' })).toBeInTheDocument();
    await expect(canvas.getAllByRole('heading', { name: 'Country profile' })).toHaveLength(1);
    // Each control fills the sheet's width.
    const field = within(sheet).getByLabelText('Period').closest('label') as HTMLElement;
    const inner = sheet.querySelector('section')!.getBoundingClientRect();
    await expect(Math.abs(field.getBoundingClientRect().width - (inner.width - 2 * parseFloat(getComputedStyle(sheet.querySelector('section')!).paddingLeft)))).toBeLessThanOrEqual(2);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    await expect(controls).toHaveFocus();
  },
};

// A finger drag, as the browser would deliver it: the page behind an open overlay must not scroll, but a list inside the overlay must.
function drag(target: Element, fromY: number, toY: number) {
  const at = (y: number) => new Touch({ identifier: 1, target, clientX: 20, clientY: y });
  const send = (type: string, y: number, live: boolean) => {
    const event = new TouchEvent(type, { bubbles: true, cancelable: true, touches: live ? [at(y)] : [], targetTouches: live ? [at(y)] : [], changedTouches: [at(y)] });
    target.dispatchEvent(event);
    return event;
  };
  send('touchstart', fromY, true);
  const move = send('touchmove', toY, true);
  send('touchend', toY, false);
  return move.defaultPrevented;
}

export const CompactOverlaysLockThePageBehindThem: Story = {
  render: () => <Example compact slots tall groups={manyGroups} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const main = canvas.getByRole('main');
    window.scrollTo(0, 300);
    await waitFor(() => expect(window.scrollY).toBe(300));
    const before = main.getBoundingClientRect();
    const open = canvas.getByRole('button', { name: 'Open navigation' });
    await userEvent.click(open);
    const drawer = await canvas.findByRole('dialog', { name: 'Navigation' });
    // The page can no longer scroll by wheel, keys or touch ...
    await expect(getComputedStyle(document.documentElement).overflow).toBe('hidden');
    await expect(getComputedStyle(document.body).overflow).toBe('hidden');
    // ... a drag on the dimmed page is stopped (iOS Safari scrolls the page under a touch whatever the overflow says) ...
    await expect(drag(main, 400, 300)).toBe(true);
    await expect(drag(main, 300, 400)).toBe(true);
    // ... but the overlay's own list still scrolls, until it reaches an end, where the drag is held rather than handed to the page.
    const list = drawer.querySelector('[class*="destinations"]') as HTMLElement;
    list.scrollTop = 40;
    await expect(drag(list, 300, 260)).toBe(false);
    await expect(drag(list, 260, 300)).toBe(false);
    list.scrollTop = 0;
    await expect(drag(list, 260, 300)).toBe(true);
    list.scrollTop = list.scrollHeight;
    await expect(drag(list, 300, 260)).toBe(true);
    // Nothing moves: no jump in position and no shift from a scrollbar disappearing.
    const during = main.getBoundingClientRect();
    await expect(Math.abs(during.top - before.top)).toBeLessThanOrEqual(1);
    await expect(Math.abs(during.width - before.width)).toBeLessThanOrEqual(1);
    await expect(window.scrollY).toBe(300);

    // Closing gives the page back: scrolling is allowed again and the width is as it was.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    await expect(document.documentElement.style.overflow).toBe('');
    await expect(document.body.style.overflow).toBe('');
    await expect(drag(main, 400, 300)).toBe(false);
    await expect(Math.abs(main.getBoundingClientRect().width - before.width)).toBeLessThanOrEqual(1);

    // The sheet locks the page the same way, and a second overlay opened after the first leaves it unlocked when closed.
    const controls = canvas.getByRole('button', { name: 'Open analysis controls' });
    await userEvent.click(controls);
    await canvas.findByRole('dialog', { name: 'Analysis controls' });
    await expect(getComputedStyle(document.documentElement).overflow).toBe('hidden');
    await expect(drag(main, 400, 300)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    await expect(document.documentElement.style.overflow).toBe('');
    await expect(drag(main, 400, 300)).toBe(false);
    window.scrollTo(0, 0);
  },
};

export const CompactTidewater: Story = { render: () => <Example compact />, globals: { theme: 'tidewater' } };

export const TheStripTakesNoRoomAndNeverCoversContent: Story = {
  tags: ['desktop-only'],
  render: () => <Example compact={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const main = canvas.getByRole('main');
    const column = main.parentElement as HTMLElement;
    const footer = canvasElement.querySelector('footer') as HTMLElement;
    const strip = canvas.getByRole('complementary', { name: 'Sources and methodology' }).firstElementChild as HTMLElement;
    const probe = document.createElement('span');
    probe.style.paddingBottom = 'var(--syn-space-6)';
    document.body.appendChild(probe);
    const room = parseFloat(getComputedStyle(probe).paddingBottom);
    probe.remove();
    // Nothing is held in the page below the footer, and the canvas ends with one step of space.
    await expect(Math.abs(footer.getBoundingClientRect().bottom - column.getBoundingClientRect().bottom)).toBeLessThanOrEqual(1);
    await expect(parseFloat(getComputedStyle(main).paddingBottom)).toBe(room);
    // The strip floats over the bottom edge of the view while the page is read ...
    window.scrollTo(0, 0);
    await waitFor(() => expect(Math.abs(strip.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThanOrEqual(1));
    // ... and at the very end it rests in the canvas's own bottom space, above the footer, covering no content.
    window.scrollTo(0, document.documentElement.scrollHeight);
    await waitFor(() => expect(Math.abs(strip.getBoundingClientRect().bottom - footer.getBoundingClientRect().top)).toBeLessThanOrEqual(1));
    const last = main.querySelector('section:last-of-type') as HTMLElement;
    await expect(strip.getBoundingClientRect().top).toBeGreaterThanOrEqual(last.getBoundingClientRect().bottom - 0.5);
    window.scrollTo(0, 0);
  },
};

export const AControlReachedByKeyboardIsNeverHiddenUnderAPinnedBar: Story = {
  tags: ['desktop-only'],
  render: () => <Example compact={false} tall controls />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const strip = canvas.getByRole('complementary', { name: 'Sources and methodology' }).firstElementChild as HTMLElement;
    const pinnedTop = () => Math.max(0, ...[...document.querySelectorAll('[data-syn-sticky="top"]')].map((el) => (getComputedStyle(el).position === 'sticky' || getComputedStyle(el).position === 'fixed' ? el.getBoundingClientRect().bottom : 0)));
    window.scrollTo(0, 0);
    const probes = canvas.getAllByRole('button', { name: /^Control \d+$/ });
    // Walk the controls in order with the Tab key, as a keyboard user does, and check each one is fully clear of both the strip at the bottom and the bars at the top once it has focus.
    probes[0].focus();
    for (let i = 0; i < probes.length; i += 1) {
      if (i > 0) await userEvent.tab();
      await expect(document.activeElement).toBe(probes[i]);
      await new Promise((resolve) => setTimeout(resolve, 60));
      const box = probes[i].getBoundingClientRect();
      await expect(box.bottom).toBeLessThanOrEqual(strip.getBoundingClientRect().top + 0.5);
      await expect(box.top).toBeGreaterThanOrEqual(pinnedTop() - 0.5);
    }
    // Shift+Tab back up: the same at the top edge.
    for (let i = probes.length - 2; i >= 0; i -= 1) {
      await userEvent.tab({ shift: true });
      await expect(document.activeElement).toBe(probes[i]);
      await new Promise((resolve) => setTimeout(resolve, 60));
      const box = probes[i].getBoundingClientRect();
      await expect(box.bottom).toBeLessThanOrEqual(strip.getBoundingClientRect().top + 0.5);
      await expect(box.top).toBeGreaterThanOrEqual(pinnedTop() - 0.5);
    }
    window.scrollTo(0, 0);
  },
};

export const BackToTopStaysClearOfTheStripWhereverItIs: Story = {
  tags: ['desktop-only'],
  render: () => <Example compact={false} tall />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const strip = canvas.getByRole('complementary', { name: 'Sources and methodology' }).firstElementChild as HTMLElement;
    const clear = async () => {
      const button = await waitFor(() => canvas.getByRole('button', { name: 'Back to top' }));
      await new Promise((resolve) => setTimeout(resolve, 500));
      const a = button.getBoundingClientRect();
      const b = strip.getBoundingClientRect();
      // No overlap with the strip, and a press on the lower part of the button reaches the button, not the strip's own button.
      await expect(a.bottom <= b.top + 0.5 || a.top >= b.bottom - 0.5 || a.right <= b.left || a.left >= b.right).toBe(true);
      const hit = document.elementFromPoint(a.left + a.width / 2, a.bottom - 3);
      await expect(hit === button || button.contains(hit)).toBe(true);
    };
    // While the page is read the strip floats at the bottom edge of the view ...
    window.scrollTo(0, window.innerHeight * 1.5);
    await clear();
    // ... and at the very end it rests above the footer, so the button rises with it.
    window.scrollTo(0, document.documentElement.scrollHeight);
    await waitFor(() => expect(Math.abs(strip.getBoundingClientRect().bottom - (canvasElement.querySelector('footer') as HTMLElement).getBoundingClientRect().top)).toBeLessThanOrEqual(1));
    await clear();
    window.scrollTo(0, 0);
  },
};

export const PhoneGutterIsOneWidthForCanvasFooterAndStrip: Story = {
  render: () => <Example compact />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const probe = document.createElement('span');
    probe.style.paddingLeft = 'var(--syn-layout-page-gutter)';
    document.body.appendChild(probe);
    const gutter = parseFloat(getComputedStyle(probe).paddingLeft);
    probe.remove();
    const left = (el: Element) => parseFloat(getComputedStyle(el).paddingLeft);
    await expect(left(canvas.getByRole('main'))).toBe(gutter);
    await expect(left(canvasElement.querySelector('footer') as HTMLElement)).toBe(gutter);
    const line = canvas.getByRole('complementary', { name: 'Sources and methodology' }).querySelector('[class*="_line_"]') as HTMLElement;
    await expect(left(line)).toBe(gutter);
  },
};

const stripOf = (canvasElement: HTMLElement) => within(canvasElement).getByRole('complementary', { name: 'Sources and methodology' });
const tabOf = (canvasElement: HTMLElement) => within(stripOf(canvasElement)).queryByRole('button', { name: 'Show sources and methodology' });
const lineButtonOf = (canvasElement: HTMLElement) => within(stripOf(canvasElement)).queryByRole('button', { name: 'Methodology' });

export const OnAPhoneTheStripTucksIntoATabWhileScrollingAndReturnsAtTheEnd: Story = {
  render: () => <Example compact tall />,
  play: async ({ canvasElement }) => {
    window.scrollTo(0, 0);
    await waitFor(() => expect(lineButtonOf(canvasElement)).not.toBeNull());
    // Reading on: the line gives way to a small tab, so the page has the whole view.
    window.scrollTo(0, window.innerHeight);
    await waitFor(() => expect(tabOf(canvasElement)).not.toBeNull());
    await expect(lineButtonOf(canvasElement)).toBeNull();
    const body = stripOf(canvasElement).firstElementChild as HTMLElement;
    await expect(body.getBoundingClientRect().width).toBeLessThan(window.innerWidth / 2);
    // At the end of the page it is back in full, resting above the footer.
    window.scrollTo(0, document.documentElement.scrollHeight);
    await waitFor(() => expect(lineButtonOf(canvasElement)).not.toBeNull());
    await expect(tabOf(canvasElement)).toBeNull();
    window.scrollTo(0, 0);
  },
};

export const TheTabBringsTheStripBackOnRequestAndAnOpenPanelStays: Story = {
  render: () => <Example compact tall />,
  play: async ({ canvasElement }) => {
    window.scrollTo(0, window.innerHeight);
    const tab = await waitFor(() => { const t = tabOf(canvasElement); expect(t).not.toBeNull(); return t as HTMLElement; });
    await userEvent.click(tab);
    const open = await waitFor(() => { const b = lineButtonOf(canvasElement); expect(b).not.toBeNull(); return b as HTMLElement; });
    await userEvent.click(open);
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    // A panel that is open is being read: scrolling on does not tuck it away.
    window.scrollTo(0, window.innerHeight * 2);
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(within(stripOf(canvasElement)).getByRole('heading', { name: 'Sources' })).toBeVisible();
    await expect(tabOf(canvasElement)).toBeNull();
    await userEvent.click(open);
    window.scrollTo(0, 0);
  },
};

export const OnAWideScreenTheStripStaysAsItIs: Story = {
  tags: ['desktop-only'],
  render: () => <Example compact={false} tall />,
  play: async ({ canvasElement }) => {
    window.scrollTo(0, window.innerHeight * 1.5);
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(lineButtonOf(canvasElement)).not.toBeNull();
    await expect(tabOf(canvasElement)).toBeNull();
    window.scrollTo(0, 0);
  },
};

export const BackToTopClearsTheTabToo: Story = {
  render: () => <Example compact tall />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    window.scrollTo(0, window.innerHeight * 1.5);
    await waitFor(() => expect(tabOf(canvasElement)).not.toBeNull());
    const button = await waitFor(() => canvas.getByRole('button', { name: 'Back to top' }));
    await new Promise((resolve) => setTimeout(resolve, 500));
    const a = button.getBoundingClientRect();
    const b = (stripOf(canvasElement).firstElementChild as HTMLElement).getBoundingClientRect();
    await expect(a.bottom <= b.top + 0.5 || a.top >= b.bottom - 0.5 || a.right <= b.left || a.left >= b.right).toBe(true);
    const hit = document.elementFromPoint(a.left + a.width / 2, a.bottom - 3);
    await expect(hit === button || button.contains(hit)).toBe(true);
    window.scrollTo(0, 0);
  },
};

const countries = Array.from({ length: 30 }, (_, i) => ({ value: `c${i}`, label: ['Argentina', 'Brazil', 'Canada', 'Denmark', 'Egypt', 'France', 'Ghana', 'Hungary', 'India', 'Japan', 'Kenya', 'Laos', 'Mexico', 'Nepal', 'Oman', 'Peru', 'Qatar', 'Romania', 'Spain', 'Turkey', 'Uganda', 'Vietnam', 'Yemen', 'Zambia', 'Chile', 'Cuba', 'Iran', 'Iraq', 'Italy', 'Jordan'][i] }));
const yearOptions = Array.from({ length: 6 }, (_, i) => ({ value: String(2019 + i), label: String(2019 + i) }));

function SheetWithMenus() {
  const [chosen, setChosen] = useState<string[]>(['c0', 'c1']);
  const [year, setYear] = useState('2024');
  return (
    <AppShell
      compact
      rail={<Rail logo={placeholderMark} productName="Climate analysis" groups={navGroups} footerItems={navFooter} current="country" onItemClick={(_item, event) => event.preventDefault()} />}
      topBar={<TopBar logo={placeholderMark} title="Overview" summary="Example" />}
      analysisBar={
        <AnalysisBar title="Overview" purpose="Where emissions are.">
          <MultiSelect label="Countries" options={countries} value={chosen} onChange={setChosen} maxSelected={10} />
          <Select label="Year" options={yearOptions} value={year} onChange={setYear} suppressSearch />
        </AnalysisBar>
      }
      strip={<SourceStrip summary="Source: example" methodNotes={<p>Notes.</p>} />}
    >
      {modules}
    </AppShell>
  );
}

const openSheet = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Open analysis controls' }));
  return canvas.findByRole('dialog', { name: 'Analysis controls' });
};

export const AMenuInTheSheetOpensInlineAndPushesTheControlsBelowIt: Story = {
  render: () => <SheetWithMenus />,
  play: async ({ canvasElement }) => {
    const sheet = await openSheet(canvasElement);
    const countriesTrigger = within(sheet).getByRole('combobox', { name: /Countries/ });
    const yearTrigger = within(sheet).getByRole('combobox', { name: /Year/ });
    const before = yearTrigger.getBoundingClientRect().top;
    await userEvent.click(countriesTrigger);
    const list = await within(sheet).findByRole('listbox');
    const popup = list.parentElement as HTMLElement;
    // In the flow of the sheet, not floated over it: the sheet makes room, and the control after it moves down.
    await expect(getComputedStyle(popup).position).not.toBe('absolute');
    await waitFor(() => expect(yearTrigger.getBoundingClientRect().top).toBeGreaterThanOrEqual(popup.getBoundingClientRect().bottom - 1));
    await expect(yearTrigger.getBoundingClientRect().top).toBeGreaterThan(before + 100);
    // Every option the list shows can be reached: the last one in view is the element hit at its centre.
    const options = within(list).getAllByRole('option');
    const last = options.find((o) => o.getBoundingClientRect().bottom <= list.getBoundingClientRect().bottom) as HTMLElement;
    last.scrollIntoView({ block: 'nearest' });
    const box = last.getBoundingClientRect();
    await expect(last.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2))).toBe(true);
  },
};

export const EscapeInTheSheetClosesTheOpenListAndLeavesTheSheetOpen: Story = {
  render: () => <SheetWithMenus />,
  play: async ({ canvasElement }) => {
    const sheet = await openSheet(canvasElement);
    const trigger = within(sheet).getByRole('combobox', { name: /Countries/ });
    await userEvent.click(trigger);
    await within(sheet).findByRole('listbox');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(sheet).queryByRole('listbox')).toBeNull());
    await expect(within(canvasElement).getByRole('dialog', { name: 'Analysis controls' })).toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    // A second Escape, with nothing open, closes the sheet.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(canvasElement).queryByRole('dialog', { name: 'Analysis controls' })).toBeNull());
  },
};

/** The products fill the bar from the page: the controls are rendered by the page and portalled into a slot in the bar, so they sit in the bar's DOM but not in its React tree. */
function SheetWithPortalledMenus() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [chosen, setChosen] = useState<string[]>(['c0', 'c1']);
  const [year, setYear] = useState('2024');
  return (
    <AppShell
      compact
      rail={<Rail logo={placeholderMark} productName="Climate analysis" groups={navGroups} footerItems={navFooter} current="country" onItemClick={(_item, event) => event.preventDefault()} />}
      topBar={<TopBar logo={placeholderMark} title="Overview" summary="Example" />}
      analysisBar={<AnalysisBar title="Overview" purpose="Where emissions are."><div ref={setSlot} style={{ display: 'contents' }} /></AnalysisBar>}
      strip={<SourceStrip summary="Source: example" methodNotes={<p>Notes.</p>} />}
    >
      {slot ? createPortal(<><MultiSelect label="Countries" options={countries} value={chosen} onChange={setChosen} maxSelected={10} /><Select label="Year" options={yearOptions} value={year} onChange={setYear} suppressSearch /></>, slot) : null}
      {modules}
    </AppShell>
  );
}

export const MenusPortalledIntoTheSheetOpenInlineAndEscapeClosesOnlyTheList: Story = {
  render: () => <SheetWithPortalledMenus />,
  play: async ({ canvasElement }) => {
    const sheet = await openSheet(canvasElement);
    const trigger = await within(sheet).findByRole('combobox', { name: /Countries/ });
    const yearTrigger = within(sheet).getByRole('combobox', { name: /Year/ });
    const before = yearTrigger.getBoundingClientRect().top;
    await userEvent.click(trigger);
    const list = await within(sheet).findByRole('listbox');
    await expect(getComputedStyle(list.parentElement as HTMLElement).position).not.toBe('absolute');
    await waitFor(() => expect(yearTrigger.getBoundingClientRect().top).toBeGreaterThan(before + 100));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(sheet).queryByRole('listbox')).toBeNull());
    await expect(within(canvasElement).getByRole('dialog', { name: 'Analysis controls' })).toBeInTheDocument();
  },
};
