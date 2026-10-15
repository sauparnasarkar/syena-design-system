import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { YearControl, type YearControlProps } from './YearControl';

const Controlled = (props: Partial<YearControlProps>) => {
  const [year, setYear] = useState(props.value ?? 2020);
  return <div style={{ padding: 'var(--syn-space-5)', maxWidth: '32rem' }}><YearControl min={2020} max={2024} intervalMs={80} {...props} value={year} onChange={setYear} /></div>;
};

const meta: Meta<typeof YearControl> = { title: 'Controls/YearControl', component: YearControl };
export default meta;
type Story = StoryObj<typeof YearControl>;

export const PlaysAndStopsOnTheLastYear: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole('slider', { name: 'Year' });
    await expect(slider).toHaveValue('2020');
    const play = canvas.getByRole('button', { name: 'Play year animation' });
    // It never starts by itself.
    await new Promise((r) => setTimeout(r, 250));
    await expect(slider).toHaveValue('2020');
    await userEvent.click(play);
    await waitFor(() => expect(slider).toHaveValue('2024'), { timeout: 3000 });
    // Playing stops on the last year, and the button says so.
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Play year animation' })).toHaveAttribute('aria-pressed', 'false'));
  },
};

export const PauseKeepsTheYear: Story = {
  render: () => <Controlled intervalMs={120} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole('slider', { name: 'Year' });
    await userEvent.click(canvas.getByRole('button', { name: 'Play year animation' }));
    await waitFor(() => expect(Number(slider.getAttribute('aria-valuenow') ?? (slider as HTMLInputElement).value)).toBeGreaterThan(2020));
    await userEvent.click(canvas.getByRole('button', { name: 'Pause year animation' }));
    const paused = (slider as HTMLInputElement).value;
    await new Promise((r) => setTimeout(r, 400));
    await expect((slider as HTMLInputElement).value).toBe(paused);
  },
};

export const DraggingThePageYearPausesAndSetsIt: Story = {
  render: () => <Controlled intervalMs={5000} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole('slider', { name: 'Year' });
    await userEvent.click(canvas.getByRole('button', { name: 'Play year animation' }));
    fireEvent.change(slider, { target: { value: '2023' } });
    await waitFor(() => expect(slider).toHaveValue('2023'));
    // Choosing a year by hand stops the animation.
    await expect(canvas.getByRole('button', { name: 'Play year animation' })).toHaveAttribute('aria-pressed', 'false');
  },
};

export const PlayFromTheEndStartsAgain: Story = {
  render: () => <Controlled value={2024} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole('slider', { name: 'Year' });
    await userEvent.click(canvas.getByRole('button', { name: 'Play year animation' }));
    // On the last year, play goes back to the first and steps forward again.
    await waitFor(() => expect(Number((slider as HTMLInputElement).value)).toBeLessThan(2024));
    await waitFor(() => expect(slider).toHaveValue('2024'), { timeout: 3000 });
  },
};

export const Tidewater: Story = { render: () => <Controlled />, globals: { theme: 'tidewater' } };
