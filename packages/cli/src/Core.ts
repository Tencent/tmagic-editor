import path from 'path';

import fs from 'fs-extra';

import { UserConfig } from './types';
import { prepareEntryFile, resolveAppPackages } from './utils';

export default class Core {
  public version = require('../package.json').version;

  public options: UserConfig;

  public moduleMainFilePath = {
    componentMap: {},
    pluginMap: {},
    configMap: {},
    valueMap: {},
    eventMap: {},
  };

  public dir = {
    temp: () => path.resolve(this.options.source, this.options.temp),
  };

  constructor(options: UserConfig) {
    this.options = options;
  }

  public async writeTemp(file: string, content: string) {
    await fs.outputFile(path.resolve(this.dir.temp(), file), content);
  }

  public async init() {
    this.moduleMainFilePath = resolveAppPackages(this);
  }

  public async prepare() {
    await prepareEntryFile(this);
  }
}
