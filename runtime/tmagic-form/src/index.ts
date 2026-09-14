import { createApp, getCurrentInstance, onBeforeUnmount, Plugin } from 'vue';
import cssStyle from 'element-plus/dist/index.css?raw';

import type { FormConfig, FormInstallOptions, StageCore } from '@tmagic/editor';
import { editorService, formPlugin, injectStyle, Layout, propsService, uiService } from '@tmagic/editor';

import commonConfig from './form-config/common';
import App from './App.vue';
import formConfigs from './form-config';
import { mergeFormInstallOptions } from './mergeFormOptions';

export * from './component-group-list';

export const propsConfigs = formConfigs;

export const useRuntime = ({
  plugins = [],
  fillConfig = (config) => config,
  formOptions = {},
}: {
  plugins?: Plugin[];
  fillConfig?: (config: FormConfig, mForm: any) => FormConfig;
  /**
   * 透传给 `@tmagic/form` 的安装选项（如 `request`）。
   *
   * formPlugin 的 `setConfig` 是整对象替换。`useRuntime` 在调用时读取宿主
   * `$MAGIC_FORM`，再与 `formOptions` 浅合并后安装，避免画布二次安装清空
   * 宿主的 `request` / `flat` 等。画布侧要覆盖或补齐时再传入。
   */
  formOptions?: FormInstallOptions;
} = {}) => {
  const hostFormOptions = getCurrentInstance()?.appContext.config.globalProperties.$MAGIC_FORM as
    FormInstallOptions | undefined;

  const render = (stage: StageCore) => {
    const doc = stage.renderer?.getDocument();

    if (doc) {
      injectStyle(doc, cssStyle);
      injectStyle(
        doc,
        `html,
          body,
          #app {
            width: 100%;
            height: 100%;
            margin: 0;
          }
          ::-webkit-scrollbar {
            width: 0;
          }
        `,
      );
    }

    const el: HTMLDivElement = globalThis.document.createElement('div');
    el.id = 'app';
    el.style.overflow = 'auto';

    const vueApp = createApp(App, {
      stage,
      fillConfig,
    });
    vueApp.use(formPlugin, mergeFormInstallOptions(hostFormOptions, formOptions));
    plugins.forEach((plugin) => vueApp.use(plugin));
    vueApp.mount(el);

    setTimeout(() => {
      uiService.set('showRule', false);
    });

    return el;
  };

  propsService.usePlugin({
    async afterFillConfig(config: FormConfig, itemConfig: FormConfig, labelWidth = '80px') {
      return [
        {
          type: 'tab',
          items: [
            {
              title: '属性',
              labelWidth,
              items: [...commonConfig, ...itemConfig],
            },
          ],
        },
      ] as FormConfig;
    },
  });

  editorService.usePlugin({
    async afterGetLayout() {
      return Layout.RELATIVE;
    },
  });

  onBeforeUnmount(() => {
    propsService.removeAllPlugins();
    editorService.removeAllPlugins();
  });

  return {
    render,
  };
};
