import { defineConfig } from '@tmagic/cli';

export default defineConfig({
  componentFileAffix: '.tsx',
  npmConfig: {
    client: 'pnpm',
    keepPackageJsonClean: true,
  },
  packages: [
    {
      button: '@tmagic/react-button' ,
      container: '@tmagic/react-container' ,
      img: '@tmagic/react-img' ,
      'iterator-container': '@tmagic/react-iterator-container' ,
      overlay: '@tmagic/react-overlay' ,
      page: '@tmagic/react-page' ,
      'page-fragment': '@tmagic/react-page-fragment' ,
      'page-fragment-container': '@tmagic/react-page-fragment-container' ,
      'qrcode': '@tmagic/react-qrcode' ,
      'text': '@tmagic/react-text' ,
    }
  ],
});
