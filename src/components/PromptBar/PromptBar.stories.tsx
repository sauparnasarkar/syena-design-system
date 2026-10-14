import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { PromptBar, type PromptBarProps } from './PromptBar';

function Controlled(props: Partial<PromptBarProps>) {
  const [value, setValue] = useState(props.value ?? '');
  return <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, 48rem)' }}><PromptBar ariaLabel="Ask a question" placeholder="Ask about emissions, forecasts or scenarios" onSubmit={fn()} {...props} value={value} onChange={setValue} /></div>;
}

const meta: Meta<typeof PromptBar> = { title: 'Controls/PromptBar', component: PromptBar };
export default meta;
type Story = StoryObj<typeof PromptBar>;

export const EnterSubmitsShiftEnterInsertsALine: Story = {
  args: { onSubmit: fn() },
  render: (args) => <Controlled onSubmit={args.onSubmit} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Ask a question' });
    const send = canvas.getByRole('button', { name: 'Send question' });
    await expect(send).toBeDisabled();
    await userEvent.type(field, 'How have emissions changed?');
    await expect(send).toBeEnabled();
    await userEvent.type(field, '{Shift>}{Enter}{/Shift}Since 1990.');
    await expect(field).toHaveValue('How have emissions changed?\nSince 1990.');
    await expect(args.onSubmit).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    await expect(args.onSubmit).toHaveBeenCalledWith('How have emissions changed?\nSince 1990.');
  },
};

export const GrowsThenScrolls: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox') as HTMLTextAreaElement;
    const one = field.getBoundingClientRect().height;
    await userEvent.type(field, 'a{Shift>}{Enter}{/Shift}b{Shift>}{Enter}{/Shift}c');
    await expect(field.getBoundingClientRect().height).toBeGreaterThan(one);
    await userEvent.type(field, Array(12).fill('{Shift>}{Enter}{/Shift}x').join(''));
    const limit = parseFloat(getComputedStyle(field).maxHeight);
    await expect(field.getBoundingClientRect().height).toBeLessThanOrEqual(limit + 1);
    await expect(field.scrollHeight).toBeGreaterThan(field.clientHeight);
  },
};

export const LoadingShowsStopAndAnnounces: Story = {
  args: { onStop: fn() },
  render: (args) => <Controlled value="Why did emissions fall?" loading onStop={args.onStop} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: 'Send question' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Stop answering' }));
    await expect(args.onStop).toHaveBeenCalledOnce();
    await expect(canvas.getByRole('status')).toHaveTextContent('Answering');
    // Enter does not submit while loading.
    await userEvent.type(canvas.getByRole('textbox'), '{Enter}');
  },
};

export const HintIsAssociated: Story = {
  render: () => <Controlled hint="Answers use the data shown on this page." />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('textbox')).toHaveAccessibleDescription('Answers use the data shown on this page.');
  },
};

export const SlotsAboveAndBelow: Story = {
  render: () => <Controlled aboveContent={<><Button size="small">Compare countries</Button><Button size="small">Explain the trend</Button></>} belowContent={<p>Below slot</p>} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Explain the trend' })).toBeInTheDocument();
    await expect(within(canvasElement).getByText('Below slot')).toBeInTheDocument();
  },
};

export const Plain: Story = { render: () => <Controlled variant="plain" /> };
export const Disabled: Story = { render: () => <Controlled disabled /> };
export const Pinned: Story = { render: () => <div style={{ minHeight: '120vh' }}><Controlled pinned /></div> };
export const Tidewater: Story = { render: () => <Controlled hint="Answers use the data shown on this page." />, globals: { theme: 'tidewater' } };
