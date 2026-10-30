import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { prefersReducedMotion } from '../lib/motion';
import { SynMotionProvider, type MotionChoice } from './SynMotionProvider';

function Readout() {
  const reduced = useReducedMotion();
  return <p>Reduced: <output aria-label="Reduced">{String(reduced)}</output>.</p>;
}

const meta: Meta<{ choice?: MotionChoice }> = {
  title: 'Theme/SynMotionProvider',
  render: ({ choice }) => (choice ? <SynMotionProvider choice={choice}><Readout /></SynMotionProvider> : <Readout />),
};
export default meta;
type Story = StoryObj<{ choice?: MotionChoice }>;

const device = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const WithoutAProviderTheDeviceDecides: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Reduced')).toHaveTextContent(String(device()));
    await expect(document.documentElement).not.toHaveAttribute('data-syn-motion');
  },
};

export const SystemLeavesTheDeviceInCharge: Story = {
  args: { choice: 'system' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('Reduced')).toHaveTextContent(String(device()));
    await expect(document.documentElement).not.toHaveAttribute('data-syn-motion');
  },
};

export const ReduceForcesReducedMotion: Story = {
  args: { choice: 'reduce' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Reduced')).toHaveTextContent('true');
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-syn-motion', 'reduce'));
    await expect(prefersReducedMotion()).toBe(true); // code outside React follows too
    // The stylesheet's rule follows: transitions are off.
    const probe = document.createElement('div');
    probe.style.transition = 'opacity 1s';
    document.body.append(probe);
    await expect(getComputedStyle(probe).transitionDuration).toBe('0s');
    probe.remove();
    // The document's own smooth scrolling is turned off too, not only its descendants'.
    document.documentElement.style.scrollBehavior = 'smooth';
    await expect(getComputedStyle(document.documentElement).scrollBehavior).toBe('auto');
    document.documentElement.style.scrollBehavior = '';
  },
};

export const FullForcesMotionWhateverTheDeviceSays: Story = {
  args: { choice: 'full' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Reduced')).toHaveTextContent('false');
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-syn-motion', 'full'));
    await expect(prefersReducedMotion()).toBe(false);
  },
};
