import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { AnalysisBar } from '../AnalysisBar/AnalysisBar';
import { BackToTop } from '../BackToTop/BackToTop';
import { Footer } from '../Footer/Footer';
import { Rail } from '../Rail/Rail';
import { SourceStrip } from '../SourceStrip/SourceStrip';
import { navFooter, navGroups, placeholderMark } from '../storyFixtures';
import { withScreen, type Screen } from '../storyScreen';
import { TopBar } from '../TopBar/TopBar';
import { scrollToJumpTarget } from '../../lib/scrollToJumpTarget';
import { AppShell } from './AppShell';

const sections = [['trend', 'Trend'], ['composition', 'Composition'], ['comparison', 'Comparison']] as const;

const control = (label: string, value: string) => (
  <label key={label} style={{ display: 'grid', gap: 'var(--syn-space-1)', color: 'var(--syn-color-text-muted)' }}>
    {label}
    <input defaultValue={value} />
  </label>
);

/** A page as the shell is used on a phone turned sideways: an analysis bar with controls, a row of jump links pinned under the top of the page, and sections to jump to. */
function Landscape({ onCollapsedChange }: { onCollapsedChange?: (collapsed: boolean) => void }) {
  return (
    <AppShell
      rail={<Rail logo={placeholderMark} productName="Climate analysis" groups={navGroups} footerItems={navFooter} current="country" onCollapsedChange={onCollapsedChange} onItemClick={(_item, event) => event.preventDefault()} actions={<button type="button">Ask the agent</button>} utilities={<button type="button">Theme</button>} />}
      topBar={<TopBar logo={placeholderMark} title="Country profile" />}
      analysisBar={
        <AnalysisBar title="Country profile" purpose="How one country's emissions have changed and where current policy leads.">
          {control('Geography', 'Example country')}{control('Period', '1990 to 2024')}
        </AnalysisBar>
      }
      strip={<SourceStrip summary="Source: example dataset · Period 1990 to 2024" methodNotes={<p>Method notes.</p>} />}
      footer={<Footer copyright="© 2026 Example organisation" links={[{ label: 'Privacy', href: '#privacy' }]} />}
    >
      <div data-syn-sticky="top" style={{ position: 'sticky', top: 0, zIndex: 'var(--syn-layer-sticky)', padding: 'var(--syn-space-2) 0', background: 'var(--syn-color-surface-base)' }}>
        <nav aria-label="Sections">
          <ul style={{ display: 'flex', gap: 'var(--syn-space-4)', margin: 0, padding: 0, listStyle: 'none', whiteSpace: 'nowrap' }}>
            {sections.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}
          </ul>
        </nav>
      </div>
      {sections.map(([id, label]) => (
        <section key={id} id={id} aria-label={label} style={{ minHeight: '90vh' }}>
          <h2>{label}</h2>
        </section>
      ))}
      <BackToTop targetId="content" />
    </AppShell>
  );
}

const meta: Meta<typeof Landscape> = { title: 'Shell/AppShell/Landscape phone', component: Landscape, parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj<typeof Landscape>;

/** A token's length in px. */
const lengthOf = (token: string) => {
  const probe = document.createElement('div');
  probe.style.cssText = `position:absolute;visibility:hidden;width:var(${token})`;
  document.body.appendChild(probe);
  const px = probe.getBoundingClientRect().width;
  probe.remove();
  return px;
};

/** The lowest edge of what is pinned to the top of the page (only elements that are in fact pinned). */
const pinnedBottom = () => Math.max(0, ...[...document.querySelectorAll('[data-syn-sticky="top"]')]
  .filter((el) => getComputedStyle(el).position === 'sticky')
  .map((el) => el.getBoundingClientRect().bottom));

const widthIs = (el: HTMLElement, px: number) => waitFor(() => expect(Math.abs(el.getBoundingClientRect().width - px)).toBeLessThan(1));

/** What a landscape phone of this size must do: the rail is the narrow one beside the content, only the jump links stay pinned, an opened rail lies over the content, and nothing sits under the notch or the home bar. */
const landscape = (screen: Screen): Story => ({
  render: () => <Landscape />,
  play: ({ canvasElement }) => withScreen(screen, async () => {
    const { left = 0, right = 0, bottom = 0 } = screen.insets ?? {};
    const canvas = within(canvasElement);
    const narrow = lengthOf('--syn-layout-rail-width-collapsed');
    const wide = lengthOf('--syn-layout-rail-width-expanded');
    const rail = canvas.getByRole('navigation', { name: 'Primary' });
    const main = canvas.getByRole('main');

    // The rail starts narrow, inside the left inset, and the content fills the rest up to the right inset.
    await widthIs(rail, narrow);
    await expect(Math.abs(rail.getBoundingClientRect().left - left)).toBeLessThan(1);
    const box = main.getBoundingClientRect();
    await expect(Math.abs(box.left - (left + narrow))).toBeLessThan(1);
    await expect(Math.abs(document.documentElement.clientWidth - box.right - right)).toBeLessThan(1);

    // The analysis bar scrolls away; only the row of jump links is pinned, at the very top.
    const row = canvas.getByRole('navigation', { name: 'Sections' }).parentElement as HTMLElement;
    await expect(getComputedStyle(canvas.getByRole('region', { name: 'Analysis controls' })).position).toBe('static');
    window.scrollTo(0, 500);
    await waitFor(() => expect(window.scrollY).toBe(500));
    await expect(Math.abs(row.getBoundingClientRect().top)).toBeLessThan(1);
    await expect(pinnedBottom()).toBeLessThanOrEqual(row.getBoundingClientRect().height + 1);

    // Back to top clears the notch side and the home bar; the rail's last control does too (the rail scrolls when it is taller than the screen).
    window.scrollTo(0, 800);
    const top = await canvas.findByRole('button', { name: 'Back to top' });
    const gap = top.getBoundingClientRect();
    await expect(document.documentElement.clientWidth - gap.right).toBeGreaterThanOrEqual(right + lengthOf('--syn-space-5') - 1);
    await expect(window.innerHeight - gap.bottom).toBeGreaterThanOrEqual(bottom + lengthOf('--syn-space-4') - 1);
    rail.scrollTop = rail.scrollHeight;
    const toggle = canvas.getByRole('button', { name: 'Expand navigation' });
    await expect(toggle.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight - bottom + 1);
    window.scrollTo(0, 0);

    // Expanding the rail lays it over the content: the content does not move, and the rail is what is hit.
    const before = main.getBoundingClientRect();
    await userEvent.click(toggle);
    await widthIs(rail, wide);
    await expect(toggle).toHaveAccessibleName('Collapse navigation');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const during = main.getBoundingClientRect();
    await expect(Math.abs(during.left - before.left)).toBeLessThan(1);
    await expect(Math.abs(during.width - before.width)).toBeLessThan(1);
    const over = rail.getBoundingClientRect();
    await expect(rail.contains(document.elementFromPoint(over.left + wide - 6, over.top + 8))).toBe(true);

    // Escape closes it and focus returns to the rail's toggle (also where a click does not focus a button, as in Safari).
    (document.activeElement as HTMLElement).blur();
    await userEvent.keyboard('{Escape}');
    await widthIs(rail, narrow);
    await expect(canvas.getByRole('button', { name: 'Expand navigation' })).toHaveFocus();

    // So does a tap on the content ...
    await userEvent.click(canvas.getByRole('button', { name: 'Expand navigation' }));
    await widthIs(rail, wide);
    await userEvent.click(canvas.getByRole('heading', { level: 2, name: 'Trend' }));
    await widthIs(rail, narrow);

    // ... a tap on a destination, with focus back on the toggle ...
    await userEvent.click(canvas.getByRole('button', { name: 'Expand navigation' }));
    await widthIs(rail, wide);
    (document.activeElement as HTMLElement).blur();
    await userEvent.click(within(rail).getByRole('link', { name: 'Overview' }));
    await widthIs(rail, narrow);
    await expect(canvas.getByRole('button', { name: 'Expand navigation' })).toHaveFocus();

    // ... and a tap on the rail's action.
    await userEvent.click(canvas.getByRole('button', { name: 'Expand navigation' }));
    await widthIs(rail, wide);
    await userEvent.click(within(rail).getByRole('button', { name: 'Ask the agent' }));
    await widthIs(rail, narrow);
  }),
});

export const Phone844x390: Story = landscape({ width: 844, height: 390, insets: { left: 47, right: 47, bottom: 21 } });
export const Phone844x340: Story = landscape({ width: 844, height: 340, insets: { left: 47, right: 47, bottom: 21 } });
export const Phone932x430: Story = landscape({ width: 932, height: 430, insets: { left: 59, right: 59, bottom: 21 } });
export const Phone852x393: Story = landscape({ width: 852, height: 393, insets: { left: 59, right: 59, bottom: 21 } });

/** A jump from the top of the page lands the section just below the jump links: the analysis bar, which scrolls away on this screen, is not counted. */
export const JumpLinksLandBelowTheTabRowOnly: Story = {
  render: () => <Landscape />,
  play: ({ canvasElement }) => withScreen({ width: 844, height: 340, insets: { left: 47, right: 47, bottom: 21 } }, async () => {
    window.scrollTo(0, 0);
    await waitFor(() => expect(window.scrollY).toBe(0));
    const row = within(canvasElement).getByRole('navigation', { name: 'Sections' }).parentElement as HTMLElement;
    await expect(scrollToJumpTarget('composition', { reducedMotion: true })).toBe(true);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
    const target = document.getElementById('composition') as HTMLElement;
    await waitFor(() => expect(Math.abs(target.getBoundingClientRect().top - row.getBoundingClientRect().bottom)).toBeLessThan(1));
  }),
};

/** The strip pinned to the bottom of the view keeps its text and its button above the home bar, while its background runs under it. */
const stripClearsTheHomeBar = (screen: Screen): Story => ({
  render: () => <Landscape />,
  play: ({ canvasElement }) => withScreen(screen, async () => {
    const bottom = screen.insets?.bottom ?? 0;
    const canvas = within(canvasElement);
    window.scrollTo(0, 300);
    await waitFor(() => expect(window.scrollY).toBe(300));
    const strip = canvas.getByRole('complementary', { name: 'Sources and methodology' });
    const box = strip.firstElementChild as HTMLElement;
    const text = (canvas.queryByRole('button', { name: 'Methodology' }) ?? canvas.getByRole('button', { name: 'Show sources and methodology' })).getBoundingClientRect();
    await expect(text.bottom).toBeLessThanOrEqual(window.innerHeight - bottom + 1);
    await expect(Math.abs(box.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThan(1);
  }),
});

export const StripClearsTheHomeBarInLandscape: Story = stripClearsTheHomeBar({ width: 844, height: 390, insets: { left: 47, right: 47, bottom: 21 } });
export const StripClearsTheHomeBarInPortrait: Story = stripClearsTheHomeBar({ width: 390, height: 844, insets: { top: 47, bottom: 34 } });

/** The rail's own choice is the person's: the short screen collapses it without changing it, and the choice is back when the screen is not short. */
export const ShortScreenKeepsTheRailChoice: Story = {
  args: { onCollapsedChange: fn() },
  render: (args) => <Landscape {...args} />,
  play: ({ canvasElement, args }) => withScreen({ width: 1280, height: 800 }, async () => {
    const canvas = within(canvasElement);
    const narrow = lengthOf('--syn-layout-rail-width-collapsed');
    const wide = lengthOf('--syn-layout-rail-width-expanded');
    const rail = () => canvas.getByRole('navigation', { name: 'Primary' });
    const onChange = args.onCollapsedChange;
    const short = { width: 844, height: 390, insets: { left: 47, right: 47, bottom: 21 } };

    // Expanded by choice: a short screen shows it narrow, and it can be opened over the content there; the choice is not reported.
    await widthIs(rail(), wide);
    await withScreen(short, async () => {
      await widthIs(rail(), narrow);
      await userEvent.click(canvas.getByRole('button', { name: 'Expand navigation' }));
      await widthIs(rail(), wide);
      await userEvent.keyboard('{Escape}');
      await widthIs(rail(), narrow);
    });
    await widthIs(rail(), wide);
    await expect(onChange).not.toHaveBeenCalled();

    // Collapsed by choice: a short screen still shows it narrow, and the choice is back afterwards.
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse navigation' }));
    await widthIs(rail(), narrow);
    await expect(onChange).toHaveBeenCalledTimes(1);
    await withScreen(short, async () => {
      await widthIs(rail(), narrow);
      await userEvent.click(canvas.getByRole('button', { name: 'Expand navigation' }));
      await widthIs(rail(), wide);
    });
    await widthIs(rail(), narrow);
    await expect(canvas.getByRole('button', { name: 'Expand navigation' })).toHaveAttribute('aria-expanded', 'false');
    await expect(onChange).toHaveBeenCalledTimes(1);
  }),
};
