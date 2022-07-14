import 'element-plus/dist/index.css';
import 'highlight.js/styles/github.css';

import './polyfills';
import { defineClientConfig  } from '@vuepress/client';
import ElementPlus from 'element-plus';
import MagicForm from '@tmagic/form';
import DemoBlock from './demo-block.vue';

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    app.use(ElementPlus);
    app.use(MagicForm, {
      request: (options: any) => new Promise((resolve) => {
        if (options.url === 'select/remote') {
          setTimeout(() => {
            resolve({
              data: [
                {
                  name: 'select-1',
                  id: 1
                },
                {
                  name: 'select-2',
                  id: 2
                },
              ],
            });
          }, 1000);
        } else {
          resolve({});
        }
      }),
    });
    app.component('demo-block', DemoBlock);
  },
  setup() {},
  rootComponents: [],
})
