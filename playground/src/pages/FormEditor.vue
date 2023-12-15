<template>
  <TMagicEditor
    v-model="config"
    :menu="menu"
    :sidebar="sidebar"
    :component-group-list="componentGroupList"
    :props-configs="propsConfigs"
    :render="render"
    :can-select="canSelect"
    :stage-rect="{ width: 'calc(100% - 70px)', height: '100%' }"
    :moveable-options="{ resizable: false }"
  >
    <template #layer-node-label="{ data }">
      {{ data.text || data.name || 'container' }}
    </template>
  </TMagicEditor>
</template>

<script setup lang="tsx">
import { createApp, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Document } from '@element-plus/icons-vue';
import cssStyle from 'element-plus/dist/index.css?raw';

import {
  ComponentGroup,
  MenuBarData,
  propsService,
  SideBarData,
  TMagicEditor,
  traverseNode,
  uiService,
} from '@tmagic/editor';
import MagicForm, { type FormConfig, MForm } from '@tmagic/form';
import { type MApp, type MNode, NodeType } from '@tmagic/schema';
import type StageCore from '@tmagic/stage';
import { guid, injectStyle } from '@tmagic/utils';

import propsConfigs from '../configs/form-config';
import commonConfig from '../configs/form-config/common';
import formDsl from '../configs/formDsl';

formDsl.forEach((item) => {
  traverseNode<any>(item, (item) => {
    item.id = `${item.type}_${guid()}`;
    item.type = item.type || (item.items ? 'container' : 'text');
    item.style = {
      left: 0,
      top: 0,
      position: 'relative',
    };
  });
});

const config = ref<MApp>({
  type: NodeType.ROOT,
  id: 'app_form',
  items: [
    {
      type: NodeType.PAGE,
      id: 'page_form',
      layout: 'relative',
      items: formDsl as unknown as MNode[],
    },
  ],
});

const render = (stage: StageCore) => {
  injectStyle(stage.renderer.getDocument()!, cssStyle);
  injectStyle(
    stage.renderer.getDocument()!,
    `
html,
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

  const el: HTMLDivElement = globalThis.document.createElement('div');
  el.id = 'app';
  el.style.overflow = 'auto';
  createApp(MForm, {
    config: config.value.items[0].items,
    initValues: {},
  })
    .use(MagicForm)
    .mount(el);

  stage.renderer.contentWindow?.magic?.onRuntimeReady({});
  setTimeout(() => {
    stage.renderer.contentWindow?.magic.onPageElUpdate(el.children[0] as HTMLElement);
    uiService.set('showRule', false);
  });

  return el;
};

const componentGroupList: ComponentGroup[] = [
  {
    title: '容器',
    items: [
      {
        text: '普通容器',
        type: 'container',
        data: {
          items: [],
        },
      },
      {
        text: '表格',
        type: 'table',
        data: {
          items: [],
        },
      },
      {
        text: '组列表',
        type: 'group-list',
        data: {
          items: [],
        },
      },
      {
        text: '面板',
        type: 'panel',
        data: {
          items: [],
        },
      },
      {
        text: '行',
        type: 'row',
        data: {
          items: [],
        },
      },
    ],
  },
];

const router = useRouter();

const menu: MenuBarData = {
  left: [
    {
      type: 'text',
      text: '魔方',
    },
  ],
  center: ['delete', 'undo', 'redo', 'zoom'],
  right: [
    {
      type: 'button',
      text: 'Editor Playground',
      handler: () => router.push('/'),
    },
    {
      type: 'button',
      text: 'Form Playground',
      handler: () => router.push('form'),
    },
    {
      type: 'button',
      text: 'Table Playground',
      handler: () => router.push('table'),
    },
    '/',
    {
      type: 'button',
      icon: Document,
      tooltip: '源码',
      handler: (service) => service?.uiService.set('showSrc', !service?.uiService.get('showSrc')),
    },
  ],
};

const sidebar: SideBarData = {
  type: 'tabs',
  status: '组件',
  items: ['component-list', 'layer'],
};

const canSelect = (el: HTMLElement) => Boolean(el.dataset.magicId);

propsService.usePlugin({
  afterFillConfig(config: FormConfig, itemConfig: FormConfig) {
    return [
      {
        type: 'tab',
        items: [
          {
            title: '属性',
            labelWidth: '80px',
            items: [...commonConfig, ...itemConfig],
          },
        ],
      },
    ];
  },
});

onBeforeUnmount(() => {
  propsService.removeAllPlugins();
});
</script>
