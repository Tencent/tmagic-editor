#!/usr/bin/env node

const { cli } = require('../lib');

cli({
  source: process.cwd(),
  packages: {},
  componentFileAffix: '',
  cleanTemp: true,
  temp: '.tmagic',
});
