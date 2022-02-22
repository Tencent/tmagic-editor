import 'element-plus/dist/index.css';
import 'highlight.js/styles/github.css';

import { defineClientAppEnhance } from '@vuepress/client';
import ElementPlus from 'element-plus';
import MagicForm from '@tmagic/form';
import DemoBlock from './demo-block.vue';

export default defineClientAppEnhance(({ app }) => {
  app.use(ElementPlus);
  app.use(MagicForm);
  app.component('demo-block', DemoBlock);
});
