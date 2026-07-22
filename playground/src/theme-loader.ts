export const DEFAULT_THEME = 'magic-admin';

const themeLoaders: Record<string, () => Promise<unknown>> = {
  default: () => import('@tmagic/editor/dist/style.css'),
  'magic-admin': () => import('@tmagic/editor/dist/themes/magic-admin.css'),
};

export const loadTheme = (theme: string) => themeLoaders[theme]?.() ?? Promise.resolve();
