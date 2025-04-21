import path from 'node:path';

import fs from 'fs-extra';

import { ModuleMainFilePath, UserConfig } from './types';
import { prepareEntryFile, resolveAppPackages } from './utils';

export default class Core {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  public version = require('../package.json').version;

  public options: UserConfig;

  public moduleMainFilePath: ModuleMainFilePath = {
    componentPackage: {},
    componentMap: {},
    pluginPakcage: {},
    pluginMap: {},
    configMap: {},
    valueMap: {},
    eventMap: {},
    datasourcePackage: {},
    datasourceMap: {},
    dsConfigMap: {},
    dsValueMap: {},
    dsEventMap: {},
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
    if (typeof this.options.onInit === 'function') {
      this.moduleMainFilePath = await this.options.onInit(this);
    }
  }

  public async prepare() {
    await prepareEntryFile(this);

    if (typeof this.options.onPrepare === 'function') {
      this.options.onPrepare(this);
    }
  }
}
