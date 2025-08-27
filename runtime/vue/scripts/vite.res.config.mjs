import { defineConfig } from 'vite';

export default defineConfig((mode) => {
  const capitalToken = mode
    .split(':')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('');

  const fileName = mode.replace(':', '-');

  return {
    publicDir: './.tmagic/public',
    build: {
      cssCodeSplit: false,
      sourcemap: true,
      minify: false,
      target: 'esnext',
      outDir: `./dist/entry/${fileName}`,

      lib: {
        entry: `./.tmagic/${fileName}-entry.ts`,
        name: `magicPreset${capitalToken}s`,
        fileName: 'index',
        formats: ['umd'],
      },
    },
  };
});
