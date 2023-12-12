<template>
  <TMagicEditor
    v-model="config"
    :menu="menu"
    :sidebar="sidebar"
    :component-group-list="componentGroupList"
    :render-type="RenderType.NATIVE"
    :render="render"
    :can-select="canSelect"
    :update-drag-el="updateDragEl"
    :stage-rect="{ width: 'calc(100% - 70px)', height: '100%' }"
  >
    <template #layer-node-label="{ data }">
      {{ data.text || data.name || 'container' }}
    </template>
  </TMagicEditor>
</template>

<script setup lang="tsx">
import { createApp, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Document } from '@element-plus/icons-vue';

import { ComponentGroup, MenuBarData, SideBarData, TMagicEditor, traverseNode, uiService } from '@tmagic/editor';
import MagicForm, { MForm } from '@tmagic/form';
import { MApp, MNode, NodeType } from '@tmagic/schema';
import { getOffset, RenderType, RuntimeWindow, TargetElement } from '@tmagic/stage';
import { guid } from '@tmagic/utils';

import formDsl from '../configs/formDsl';

formDsl.forEach((item) => {
  traverseNode<any>(item, (item) => {
    item.id = `${item.type}_${guid()}`;
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

const render = () => {
  const el = globalThis.document.createElement('div');
  el.style.position = 'relative';
  createApp(MForm, {
    config: formDsl,
    initValues: {},
  })
    .use(MagicForm)
    .mount(el);

  nextTick(() => {
    (globalThis as unknown as RuntimeWindow).magic.onPageElUpdate(el);
    uiService.set('showRule', false);
  });

  return el;
};

const updateDragEl = (el: TargetElement, target: TargetElement, container: HTMLElement) => {
  const { left, top } = getOffset(container);
  el.style.left = `${globalThis.parseFloat(el.style.left) - left}px`;
  el.style.top = `${globalThis.parseFloat(el.style.top) - top}px`;
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

const canSelect = (el: HTMLElement) => el.classList.contains('m-form-container');
</script>
