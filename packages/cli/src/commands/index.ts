import path from 'node:path';

import fs from 'fs-extra';
// @ts-ignore
import mergeOptions from 'merge-options';

import App from '../Core';
import { UserConfig } from '../types';
import { loadUserConfig } from '../utils/loadUserConfig';

export const scripts = (defaultAppConfig: UserConfig) => {
  const entry = async (): Promise<App> => {
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

    const localUserConfigPath = [
      path.resolve(defaultAppConfig.source, 'tmagic.config.local.ts'),
      path.resolve(defaultAppConfig.source, 'tmagic.config.local.js'),
      path.resolve(defaultAppConfig.source, 'tmagic.config.local.cjs'),
      path.resolve(defaultAppConfig.temp, 'config.local.ts'),
      path.resolve(defaultAppConfig.temp, 'config.local.js'),
      path.resolve(defaultAppConfig.temp, 'config.local.cjs'),
    ].find((item) => fs.pathExistsSync(item));

    let userConfig = await loadUserConfig(userConfigPath);

    if (localUserConfigPath) {
      const localUserConfig = await loadUserConfig(localUserConfigPath);

      if (localUserConfig.packages?.length) {
        localUserConfig.packages = [...(userConfig.packages || []), ...localUserConfig.packages];
      }

      userConfig = mergeOptions(userConfig, localUserConfig);
    }

    // resolve the final app config to use
    const appConfig = mergeOptions(defaultAppConfig, userConfig);
    const app = new App(appConfig);

    // clean temp and cache
    if (appConfig.cleanTemp === true) {
      await fs.remove(app.dir.temp());
    }

    // initialize and prepare
    await app.init();
    await app.prepare();

    return app;
  };

  return entry;
};
