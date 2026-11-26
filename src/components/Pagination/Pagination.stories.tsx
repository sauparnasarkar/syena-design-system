import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { hoverStyle } from '../storyHover';
import { Pagination, type PaginationProps } from './Pagination';

const meta: Meta<typeof Pagination> = { title: 'Controls/Pagination', component: Pagination };
export default meta;
type Story = StoryObj<typeof Pagination>;

function Demo(props: Partial<PaginationProps>) {
  const [page, setPage] = useState(props.page ?? 1);
  return <div style={{ padding: 'var(--syn-space-5)' }}><Pagination pageCount={20} {...props} page={page} onChange={setPage} /></div>;
}

export const NumberedPagesMoveWithPreviousAndNext: Story = {
  render: () => <Demo page={5} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Page 5' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(canvas.getByRole('button', { name: 'Page 6' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(canvas.getByRole('button', { name: 'Page 20' }));
    await expect(canvas.getByRole('button', { name: 'Page 20' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(canvas.getByRole('button', { name: 'Previous page' }));
    await expect(canvas.getByRole('button', { name: 'Page 19' })).toHaveAttribute('aria-current', 'page');
  },
};

export const GapsStandInForPagesLeftOut: Story = {
  render: () => <Demo page={10} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const numbers = canvas.getAllByRole('button').map((b) => b.getAttribute('aria-label')).filter((l) => l?.startsWith('Page '));
    await expect(numbers).toEqual(['Page 1', 'Page 9', 'Page 10', 'Page 11', 'Page 20']);
    await expect(canvasElement.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(2);
  },
};

export const AnEndThatCannotMoveStaysFocusableAndDoesNothing: Story = {
  args: { page: 1, pageCount: 5, onChange: fn() },
  render: (args) => <div style={{ padding: 'var(--syn-space-5)' }}><Pagination {...args} /></div>,
  play: async ({ canvasElement, args }) => {
    const previous = within(canvasElement).getByRole('button', { name: 'Previous page' });
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await expect(previous).not.toBeDisabled();
    await userEvent.tab();
    await expect(previous).toHaveFocus();
    await userEvent.click(previous);
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const CompactSaysWhereYouAre: Story = {
  render: () => <Demo page={3} pageCount={12} compact />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Page 3 of 12')).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Page 3' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(canvas.getByText('Page 4 of 12')).toBeInTheDocument();
  },
};

export const ALabelNamesTheNavigation: Story = {
  render: () => <Demo label="Results pages" />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('navigation', { name: 'Results pages' })).toBeInTheDocument();
  },
};

export const KeyboardFocusShowsTheRingOnAPage: Story = {
  render: () => <Demo page={2} pageCount={8} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.tab();
    const first = canvas.getByRole('button', { name: 'Page 1' });
    await expect(first).toHaveFocus();
    await expect(getComputedStyle(first).outlineStyle).toBe('solid');
    await expect(hoverStyle(first)?.getPropertyValue('background')).toContain('--syn-color-surface-sunken');
  },
};

const Gallery = () => (
  <div style={{ display: 'grid', gap: 'var(--syn-space-4)' }}>
    <Demo page={1} pageCount={5} label="First page of results" />
    <Demo page={10} label="Middle of results" />
    <Demo page={20} label="Last page of results" />
    <Demo page={3} pageCount={12} compact label="Compact results" />
  </div>
);
export const AllStates: Story = { render: () => <Gallery /> };
export const AllStatesTidewater: Story = { render: () => <Gallery />, globals: { theme: 'tidewater' } };
export const AllStatesLedger: Story = { render: () => <Gallery />, globals: { theme: 'ledger' } };
