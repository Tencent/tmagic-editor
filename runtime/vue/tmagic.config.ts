import { defineConfig } from '@tmagic/cli';

export default defineConfig({
  componentFileAffix: '.vue',
  dynamicImport: true,
  npmConfig: {
    client: 'pnpm',
    keepPackageJsonClean: true,
  },
  packages: [
    {
      button: '@tmagic/vue-button',
      container: '@tmagic/vue-container',
      img: '@tmagic/vue-img' ,
      'iterator-container': '@tmagic/vue-iterator-container',
      overlay: '@tmagic/vue-overlay',
      page: '@tmagic/vue-page',
      'page-fragment': '@tmagic/vue-page-fragment',
      'page-fragment-container': '@tmagic/vue-page-fragment-container',
      'qrcode': '@tmagic/vue-qrcode',
      'text': '@tmagic/vue-text',
    },
  ],
});
