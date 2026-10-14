import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  core: { disableTelemetry: true },
  typescript: { reactDocgen: false },
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    build: { ...viteConfig.build, cssMinify: 'esbuild' },
    css: {
      ...viteConfig.css,
      modules: {
        generateScopedName:
          process.env.NODE_ENV === 'production' ? '[hash:base64:8]' : '[name]__[local]__[hash:base64:4]',
      },
    },
  }),
};

export default config;
