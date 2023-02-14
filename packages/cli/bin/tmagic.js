#!/usr/bin/env node

const { cli } = require('../lib');

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
