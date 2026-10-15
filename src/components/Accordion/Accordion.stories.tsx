import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Accordion } from './Accordion';

const items = [
  { id: 'a', title: 'Where the data comes from', content: <p>Sources and licences.</p> },
  { id: 'b', title: 'How projections are made', content: <p>Scenarios and ranges.</p> },
  { id: 'c', title: 'Known limits', content: <p>What the data cannot show.</p>, disabled: true },
  { id: 'd', title: 'Revisions', content: <p>How figures are revised.</p> },
];

const meta: Meta<typeof Accordion> = { title: 'Surfaces/Accordion', component: Accordion, args: { items }, decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, var(--syn-layout-module-min))' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Accordion>;

export const OpensOneAtATime: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole('button', { name: 'Where the data comes from' });
    const second = canvas.getByRole('button', { name: 'How projections are made' });
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(first);
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await expect(await canvas.findByRole('region', { name: 'Where the data comes from' })).toBeVisible();
    await userEvent.click(second);
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    // A closed panel is out of the page: not visible and not focusable.
    await waitFor(() => expect(canvas.getByText('Sources and licences.')).not.toBeVisible());
  },
};

export const MultipleStayOpen: Story = {
  args: { multiple: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Where the data comes from' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Revisions' }));
    await expect(canvas.getAllByRole('button', { expanded: true })).toHaveLength(2);
  },
};

export const ArrowKeysHomeAndEndMoveBetweenHeaders: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Where the data comes from' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('button', { name: 'How projections are made' })).toHaveFocus();
    // The disabled header is skipped.
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('button', { name: 'Revisions' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('button', { name: 'Where the data comes from' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('button', { name: 'Revisions' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(canvas.getByRole('button', { name: 'Where the data comes from' })).toHaveFocus();
  },
};

export const ControlledAndReportsChanges: Story = {
  args: { openIds: ['b'] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'How projections are made' })).toHaveAttribute('aria-expanded', 'true');
  },
};

export const HeadingsKeepTheOutline: Story = {
  args: { headingLevel: 4 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('heading', { level: 4 })).toHaveLength(4);
  },
};

export const OpenInTidewater: Story = { globals: { theme: 'tidewater' }, args: { defaultOpenIds: ['a'] } };
export const OpenInNight: Story = { globals: { theme: 'night' }, args: { defaultOpenIds: ['a'] } };
