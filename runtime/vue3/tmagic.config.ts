import path from 'path';

import { defineConfig } from '@tmagic/cli';

export default defineConfig({
  packages: [path.join(__dirname, '../ui')],
  componentFileAffix: '.vue',
  dynamicImport: true,
});
