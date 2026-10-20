import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { placeholderMark } from '../storyFixtures';
import { TopBar } from './TopBar';

const meta: Meta<typeof TopBar> = {
  title: 'Shell/TopBar',
  component: TopBar,
  args: { logo: placeholderMark, title: 'Country profile', summary: 'Example country · 1990 to 2024 · CO₂', onOpenNavigation: fn(), onOpenControls: fn() },
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof TopBar>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Country profile' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Open navigation' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Open analysis controls' }));
    await expect(args.onOpenNavigation).toHaveBeenCalledOnce();
    await expect(args.onOpenControls).toHaveBeenCalledOnce();
  },
};

export const ButtonsAreTouchSized: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Open navigation' });
    await expect(Math.round(button.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  },
};

export const WithoutControls: Story = {
  args: { showControls: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Open navigation' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Open analysis controls' })).toBeNull();
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };

export const ShowsAShortProductNameBesideTheMarkAndTheTitleBelowIt: Story = {
  args: { productName: 'Example', title: 'Country profile', summary: 'Example country · 1990 to 2024 · CO₂' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvasElement.querySelector('header') as HTMLElement;
    const mark = canvas.getByRole('img', { name: 'Example product' }).getBoundingClientRect();
    const name = canvas.getByText('Example').getBoundingClientRect();
    const heading = canvas.getByRole('heading', { level: 1, name: 'Country profile' }).getBoundingClientRect();
    // The short name is beside the mark, and the page title is the line under it.
    await expect(name.left).toBeGreaterThanOrEqual(mark.right);
    await expect(Math.abs(name.top + name.height / 2 - (mark.top + mark.height / 2))).toBeLessThanOrEqual(mark.height);
    await expect(heading.top).toBeGreaterThanOrEqual(name.bottom - 1);
    await expect(heading.left).toBeCloseTo(name.left, 0);
    // The summary shares the title's line, so the bar keeps its height.
    const summary = canvas.getByText('Example country · 1990 to 2024 · CO₂').getBoundingClientRect();
    await expect(Math.abs(summary.top - heading.top)).toBeLessThanOrEqual(2);
    await expect(summary.left).toBeGreaterThanOrEqual(heading.right);
    await expect(bar.scrollHeight).toBeLessThanOrEqual(bar.clientHeight);
    const barHeight = parseFloat(getComputedStyle(document.documentElement).fontSize) * 3.5;
    await expect(Math.round(bar.getBoundingClientRect().height)).toBe(Math.round(barHeight));
  },
};

export const TheFullNameStaysTheAccessibleNameAndTheTooltip: Story = {
  args: { productName: 'Example' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The mark is named by the full name; the short text is not read as a second name.
    await expect(canvas.getByRole('img', { name: 'Example product' })).toBeInTheDocument();
    await expect(canvas.getByText('Example')).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.getByText('Example').closest('[title]')).toHaveAttribute('title', 'Example product');
  },
};

export const WithoutAShortNameTheTitleIsUnchanged: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByRole('heading', { level: 1 }).getBoundingClientRect();
    // The summary stays under the title, as before.
    await expect(canvas.getByText(/Example country/).getBoundingClientRect().top).toBeGreaterThanOrEqual(heading.bottom - 1);
    await expect(canvasElement.querySelector('[title]')).toBeNull();
  },
};
