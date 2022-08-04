import path from 'path';

import { defineConfig } from '@tmagic/cli';

export default defineConfig({
  packages: [path.join(__dirname, '../../packages/ui-vue2')],
  componentFileAffix: '.vue',
});
