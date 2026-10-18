import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AnalysisBar } from '../AnalysisBar/AnalysisBar';
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

const modules = ['Key figures', 'Trend', 'Composition', 'Comparison'].map((name) => (
  <section key={name} aria-label={name} style={{ minHeight: '40vh', padding: 'var(--syn-space-4)', border: 'var(--syn-layout-border-hairline) solid var(--syn-color-border-default)', borderRadius: 'var(--syn-radius-card)', background: 'var(--syn-color-surface-raised)' }}>
    <h2 style={{ font: 'var(--syn-type-title-sm-weight) var(--syn-type-title-sm-size) / var(--syn-type-title-sm-line) var(--syn-type-title-sm-family)' }}>{name}</h2>
  </section>
));

function Example({ compact, slots }: { compact?: boolean; slots?: boolean }) {
  return (
    <AppShell
      compact={compact}
      rail={<Rail logo={placeholderMark} productName="Climate analysis" groups={navGroups} footerItems={navFooter} current="country" onItemClick={(_item, event) => event.preventDefault()} actions={slots ? <button type="button">Ask the agent</button> : undefined} utilities={slots ? <button type="button">Theme</button> : undefined} />}
      topBar={<TopBar logo={placeholderMark} title="Country profile" summary="Example country · 1990 to 2024" />}
      analysisBar={
        <AnalysisBar title="Country profile" purpose="How one country's emissions have changed and where current policy leads.">
          {control('Geography', 'Example country')}{control('Period', '1990 to 2024')}
        </AnalysisBar>
      }
      strip={<SourceStrip summary="Source: example dataset · Period 1990 to 2024 · As of October 2026" methodNotes={<p>Method notes.</p>} />}
      footer={<Footer copyright="© 2026 Example organisation" links={[{ label: 'Privacy', href: '#privacy' }]} />}
    >
      {modules}
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

export const CompactTidewater: Story = { render: () => <Example compact />, globals: { theme: 'tidewater' } };
