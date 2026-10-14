import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { SourceStrip } from './SourceStrip';

const meta: Meta<typeof SourceStrip> = {
  title: 'Shell/SourceStrip',
  component: SourceStrip,
  parameters: { layout: 'fullscreen' },
  args: {
    summary: 'Source: example dataset, example publisher · Period 1990 to 2050 · As of October 2026',
    sources: <ul><li>Example dataset, example publisher, open licence, released October 2026.</li></ul>,
    definitions: <p>Annual CO₂ emissions in gigatonnes, relative to no baseline.</p>,
    methodNotes: <p>Projections follow stated scenarios; ranges are 66% intervals.</p>,
  },
  decorators: [(Story) => <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SourceStrip>;

export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('complementary', { name: 'Sources and methodology' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Methodology' })).toHaveAttribute('aria-expanded', 'false');
  },
};

export const OpensAndClosesWithEscape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Methodology' });
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('heading', { name: 'Definitions' })).toBeInTheDocument();
    button.focus();
    await userEvent.keyboard('{Escape}');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('heading', { name: 'Definitions' })).toBeNull();
  },
};

export const Open: Story = { args: { defaultOpen: true } };
export const OpenTidewater: Story = { args: { defaultOpen: true }, globals: { theme: 'tidewater' } };
