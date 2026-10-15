import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Overview } from './Screens';

const meta: Meta<typeof Overview> = {
  title: 'Specimens/Overview',
  component: Overview,
};

export default meta;
type Story = StoryObj<typeof Overview>;

export const Night: Story = {
  globals: { theme: 'night' },
  play: async ({ canvasElement }) => {
    // Missing data is one flat, quiet grey, here and on the maps: no hatch pattern, and the cell says so in words.
    await expect(canvasElement.querySelector('pattern')).toBeNull();
    const cell = [...canvasElement.querySelectorAll('svg rect')].find((r) => r.querySelector('title')?.textContent === 'No data') as SVGElement;
    const probe = document.createElement('span');
    probe.style.color = 'var(--syn-data-no-data)';
    canvasElement.appendChild(probe);
    await expect(getComputedStyle(cell).fill).toBe(getComputedStyle(probe).color);
    probe.remove();
    await expect(within(canvasElement).getByText('No data', { selector: 'span' })).toBeInTheDocument();
  },
};
export const Tidewater: Story = { globals: { theme: 'tidewater' } };
