import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Select, type SelectProps } from './Select';

const few = [{ value: 'world', label: 'World' }, { value: 'europe', label: 'Europe' }, { value: 'asia', label: 'Asia' }, { value: 'africa', label: 'Africa', disabled: true }, { value: 'oceania', label: 'Oceania' }];
const many = Array.from({ length: 24 }, (_, i) => ({ value: `c${i}`, label: ['Argentina', 'Brazil', 'Canada', 'Denmark', 'Egypt', 'France', 'Ghana', 'Hungary', 'India', 'Japan', 'Kenya', 'Laos', 'Mexico', 'Nepal', 'Oman', 'Peru', 'Qatar', 'Romania', 'Spain', 'Turkey', 'Uganda', 'Vietnam', 'Yemen', 'Zambia'][i] }));

function Controlled(props: Partial<SelectProps>) {
  const [value, setValue] = useState(props.value ?? 'world');
  return <div style={{ padding: 'var(--syn-space-5)', minHeight: '24rem', width: 'min(100%, var(--syn-layout-module-min))' }}><Select label="Geography" options={few} {...props} value={value} onChange={(v) => { setValue(v); props.onChange?.(v); }} /></div>;
}

const meta: Meta<typeof Select> = { title: 'Controls/Select', component: Select };
export default meta;
type Story = StoryObj<typeof Select>;

export const OpensAndChoosesWithTheKeyboard: Story = {
  args: { onChange: fn() },
  render: (args) => <Controlled onChange={args.onChange} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Geography/ });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const list = canvas.getByRole('listbox', { name: 'Geography' });
    await waitFor(() => expect(list).toHaveFocus());
    await expect(trigger).toHaveAttribute('aria-controls', list.id);
    await userEvent.keyboard('{ArrowDown}');
    await expect(list).toHaveAttribute('aria-activedescendant', canvas.getByRole('option', { name: 'Europe' }).id);
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenCalledWith('europe');
    // Closed again, and focus is back on the field.
    await waitFor(() => expect(canvas.queryByRole('listbox')).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAccessibleName(/Europe/);
  },
};

export const SkipsDisabledOptions: Story = {
  render: () => <Controlled value="asia" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox'));
    const list = canvas.getByRole('listbox');
    await userEvent.keyboard('{ArrowDown}');
    await expect(list).toHaveAttribute('aria-activedescendant', canvas.getByRole('option', { name: 'Oceania' }).id);
    await expect(canvas.getByRole('option', { name: 'Africa' })).toHaveAttribute('aria-disabled', 'true');
  },
};

export const EscapeClosesAndReturnsFocus: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox');
    await userEvent.click(trigger);
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('listbox')).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

export const TypeAhead: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.keyboard('o');
    await expect(canvas.getByRole('listbox')).toHaveAttribute('aria-activedescendant', canvas.getByRole('option', { name: 'Oceania' }).id);
  },
};

export const ClicksOutsideToClose: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.click(canvasElement);
    await waitFor(() => expect(canvas.queryByRole('listbox')).toBeNull());
  },
};

export const SearchAppearsWithTenOrMoreOptions: Story = {
  render: () => <Controlled options={many} value="c0" label="Country" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: /Country/ }));
    const search = canvas.getByRole('searchbox', { name: 'Search options' });
    await waitFor(() => expect(search).toHaveFocus());
    await userEvent.keyboard('an');
    await expect(canvas.getAllByRole('option').map((o) => o.textContent)).toEqual(expect.arrayContaining(['Canada', 'Japan']));
    await expect(canvas.queryByRole('option', { name: 'Brazil' })).toBeNull();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(canvas.queryByRole('listbox')).toBeNull());
  },
};

export const SearchCanBeSuppressed: Story = {
  render: () => <Controlled options={many} value="c0" label="Country" suppressSearch />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox'));
    await expect(canvas.queryByRole('searchbox')).toBeNull();
  },
};

export const FewOptionsHaveNoSearch: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox'));
    await expect(canvas.queryByRole('searchbox')).toBeNull();
  },
};

export const WithAriaLabelOnly: Story = {
  render: () => <Controlled label={undefined} ariaLabel="Geography" />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('combobox', { name: 'Geography' })).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  render: () => <Controlled disabled />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox');
    await userEvent.click(trigger);
    await expect(trigger).toBeDisabled();
    await expect(within(canvasElement).queryByRole('listbox')).toBeNull();
  },
};

export const ErrorMessageIsAssociated: Story = {
  render: () => <Controlled error="Choose a region." />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox');
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await expect(trigger).toHaveAccessibleDescription('Choose a region.');
  },
};

export const Small: Story = { render: () => <Controlled size="small" /> };

export const OpenInTidewater: Story = {
  render: () => <Controlled />,
  globals: { theme: 'tidewater' },
  play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole('combobox')); },
};

export const OpenInNight: Story = {
  render: () => <Controlled />,
  globals: { theme: 'night' },
  play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole('combobox')); },
};
