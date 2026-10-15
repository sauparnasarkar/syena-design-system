import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { CardHeader } from './CardHeader';

const meta: Meta<typeof CardHeader> = { title: 'Surfaces/CardHeader', component: CardHeader, args: { title: 'Emissions by sector', supportText: 'Share of the total, 2024' }, decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, var(--syn-layout-module-min))' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof CardHeader>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { level: 3, name: 'Emissions by sector' })).toBeInTheDocument();
  },
};

export const HeadingLevelFollowsTheOutline: Story = {
  args: { headingLevel: 2 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { level: 2 })).toBeInTheDocument();
  },
};

export const WithActionsAndDivider: Story = {
  args: { divider: true, actions: <><Button size="small" variant="ghost" icon="table" aria-label="View as table" /><Button size="small" variant="ghost" icon="download" aria-label="Download" /></> },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('button')).toHaveLength(2);
  },
};

export const LongTitleWraps: Story = { args: { title: 'A very long title that has to wrap inside a narrow card without pushing the actions out', actions: <Button size="small" variant="ghost" icon="download" aria-label="Download" /> } };
export const Tidewater: Story = { globals: { theme: 'tidewater' } };
