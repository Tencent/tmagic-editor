import 'element-plus/dist/index.css';
import 'highlight.js/styles/github.css';

import ElementPlus from 'element-plus';
import Theme from 'vitepress/theme';

import TMagicDesign from '@tmagic/design';
import MagicElementPlusAdapter from '@tmagic/element-plus-adapter';
import MagicForm from '@tmagic/form';

import DemoBlock from './components/demo-block.vue';

import './styles/vars.css';

export default {
  ...Theme,

  enhanceApp({ app }) {
    app.use(ElementPlus);
    app.use(TMagicDesign, MagicElementPlusAdapter)
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
};
