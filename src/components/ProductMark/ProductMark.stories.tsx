import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { placeholderMark } from '../storyFixtures';
import { ProductMark } from './ProductMark';

const meta: Meta<typeof ProductMark> = { title: 'Shell/ProductMark', component: ProductMark };
export default meta;
type Story = StoryObj<typeof ProductMark>;

export const FromNode: Story = {
  args: { mark: placeholderMark },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Example product' })).toBeInTheDocument();
  },
};

export const FromImageSource: Story = {
  args: { mark: { name: 'Example product image', src: 'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Crect width=%2224%22 height=%2224%22 rx=%226%22/%3E%3C/svg%3E' } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByAltText('Example product image')).toBeInTheDocument();
  },
};
