import type { Preview } from '@storybook/react-vite';
import { createElement } from 'react';
import { SynThemeProvider } from '../src/theme/SynThemeProvider';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '../src/styles.css';
import './story-base.css';

const themes = ['night', 'tidewater', 'ledger'] as const;
type ThemeName = (typeof themes)[number];

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: { title: 'Theme', icon: 'paintbrush', items: [...themes], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'night' },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme ?? 'night') as ThemeName;
      // The theme in force must be one of the pair on offer: ledger pairs with night, the others with each other.
      const pair = theme === 'ledger' ? (['night', 'ledger'] as const) : (['night', 'tidewater'] as const);
      return createElement(SynThemeProvider, { themes: pair, theme, storageKey: null }, createElement(Story));
    },
  ],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    controls: { disable: true },
  },
};

export default preview;
