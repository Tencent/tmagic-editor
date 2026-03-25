import { createApp, onBeforeUnmount, Plugin } from 'vue';
import cssStyle from 'element-plus/dist/index.css?raw';

import type { FormConfig, StageCore } from '@tmagic/editor';
import { editorService, formPlugin, injectStyle, Layout, propsService, uiService } from '@tmagic/editor';

import commonConfig from './form-config/common';
import App from './App.vue';
import formConfigs from './form-config';

export * from './component-group-list';

export const propsConfigs = formConfigs;

export const useRuntime = ({
  plugins = [],
  fillConfig = (config) => config,
}: {
  plugins?: Plugin[];
  fillConfig?: (config: FormConfig, mForm: any) => FormConfig;
} = {}) => {
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
    vueApp.use(formPlugin);
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
