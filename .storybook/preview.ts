import type { Preview } from '@storybook/react-vite';
import { createElement, useLayoutEffect } from 'react';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '../src/styles.css';
import './story-base.css';

const themes = ['night', 'tidewater'] as const;
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
      useLayoutEffect(() => {
        document.documentElement.setAttribute('data-syn-theme', theme);
      }, [theme]);
      return createElement('div', { 'data-syn-theme': theme }, createElement(Story));
    },
  ],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    controls: { disable: true },
  },
};

export default preview;
