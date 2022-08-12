import path from 'path';

import { loadUserConfig } from '@vuepress/cli';
import fs from 'fs-extra';

import App from '../Core';
import { UserConfig } from '../types';

export const scripts = (defaultAppConfig: UserConfig) => {
  const entry = async (): Promise<void> => {
    if (process.env.NODE_ENV === undefined) {
      process.env.NODE_ENV = 'development';
    }

    // resolve user config file
    const userConfigPath = [
      path.resolve(defaultAppConfig.source, 'tmagic.config.ts'),
      path.resolve(defaultAppConfig.source, 'tmagic.config.js'),
      path.resolve(defaultAppConfig.source, 'tmagic.config.cjs'),
      path.resolve(defaultAppConfig.temp, 'config.ts'),
      path.resolve(defaultAppConfig.temp, 'config.js'),
      path.resolve(defaultAppConfig.temp, 'config.cjs'),
    ].find((item) => fs.pathExistsSync(item));

    const userConfig = await loadUserConfig(userConfigPath);

    // resolve the final app config to use
    const appConfig = {
      ...defaultAppConfig,
      ...userConfig,
    };

    if (appConfig === null) {
      return;
    }

    // create vuepress app
    const app = new App(appConfig);

    // clean temp and cache
    if (appConfig.cleanTemp === true) {
      await fs.remove(app.dir.temp());
    }

    // initialize and prepare
    await app.init();
    await app.prepare();
  };

  return entry;
};
