<template>
  <TMagicEditor
    v-model="config"
    :menu="menu"
    :sidebar="sidebar"
    :component-group-list="componentGroupList"
    :props-configs="propsConfigs"
    :render="render"
    :can-select="canSelect"
    :disabled-page-fragment="true"
    :disabled-stage-overlay="true"
    :stage-rect="{ width: 'calc(100% - 70px)', height: '100%' }"
    :moveable-options="{ resizable: false }"
  >
    <template #layer-node-label="{ data }">
      {{ data.text || data.name || 'container' }}
    </template>
  </TMagicEditor>
</template>

<script setup lang="tsx">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Document } from '@element-plus/icons-vue';

import { MenuBarData, SideBarData, TMagicEditor, traverseNode } from '@tmagic/editor';
import { type MApp, NodeType } from '@tmagic/schema';
import {
  canSelect,
  COMPONENT_GROUP_LIST as componentGroupList,
  propsConfigs,
  useRuntime,
} from '@tmagic/tmagic-form-runtime';
import { guid } from '@tmagic/utils';

import formDsl from '../configs/formDsl';

formDsl.forEach((item) => {
  traverseNode<any>(item, (item) => {
    item.type = item.type || (item.items ? 'container' : 'text');
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
  items: [],
});

const { render } = useRuntime();

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
</script>
