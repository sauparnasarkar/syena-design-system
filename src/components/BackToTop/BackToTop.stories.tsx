import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { BackToTop } from './BackToTop';

const Page = () => (
  <div>
    <h1 id="top">Long page</h1>
    <div style={{ height: '300vh', padding: 'var(--syn-space-5)' }}>Scroll down.</div>
    <BackToTop targetId="top" />
  </div>
);

const meta: Meta<typeof BackToTop> = { title: 'Shell/BackToTop', component: BackToTop, parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj<typeof BackToTop>;

export const AppearsAfterOneViewport: Story = {
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: 'Back to top' })).toBeNull();
    window.scrollTo(0, window.innerHeight * 2);
    const button = await waitFor(() => canvas.getByRole('button', { name: 'Back to top' }));
    await userEvent.click(button);
    await waitFor(() => expect(document.getElementById('top')).toHaveFocus());
    await waitFor(() => expect(window.scrollY).toBeLessThan(10));
  },
};

export const Tidewater: Story = {
  render: () => <Page />,
  globals: { theme: 'tidewater' },
  play: async ({ canvasElement }) => {
    window.scrollTo(0, window.innerHeight * 2);
    await waitFor(() => expect(within(canvasElement).getByRole('button', { name: 'Back to top' })).toBeInTheDocument());
    window.scrollTo(0, 0);
  },
};
