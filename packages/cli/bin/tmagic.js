#!/usr/bin/env node

import { cli } from '../lib/index.js';

cli({
  source: process.cwd(),
  packages: {},
  componentFileAffix: '',
  cleanTemp: true,
  temp: '.tmagic',
  useTs: true,
  dynamicImport: false,
  npmConfig: {
    client: 'npm',
    autoInstall: true,
    keepPackageJsonClean: true,
  },
});
