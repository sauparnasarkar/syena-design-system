import type { Meta, StoryObj } from '@storybook/react-vite';
import { Wireframe } from './Wireframe';

const meta: Meta<typeof Wireframe> = {
  title: 'Shell/Wireframes',
  component: Wireframe,
  parameters: {
    docs: {
      description: {
        component:
          'Low-fidelity layouts for the application shell: a navigation rail, a contextual analysis bar, a canvas of modules and a sticky source and methodology strip.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Wireframe>;

export const Desktop: Story = { args: { variant: 'desktop' } };
export const DesktopProductSwitcher: Story = { args: { variant: 'desktop-product-switcher' } };
export const DesktopSourcesOpen: Story = { args: { variant: 'desktop-sources-open' } };
export const Tablet: Story = { args: { variant: 'tablet' } };
export const Phone: Story = { args: { variant: 'phone' } };
export const PhoneNavigationOpen: Story = { args: { variant: 'phone-menu' } };
export const PhoneAnalysisControlsOpen: Story = { args: { variant: 'phone-filters' } };
export const DesktopTidewater: Story = { args: { variant: 'desktop' }, globals: { theme: 'tidewater' } };
