<template>
  <div class="m-editor-sidebar" v-if="data.type === 'tabs' && data.items.length">
    <div class="m-editor-sidebar-header">
      <div
        class="m-editor-sidebar-header-item"
        v-for="(config, index) in sideBarItems"
        :key="config.$key ?? index"
        :class="{ 'is-active': activeTabName === config.text }"
        @click="activeTabName = config.text || `${index}`"
      >
        <MIcon v-if="config.icon" :icon="config.icon"></MIcon>
        <div v-if="config.text" class="magic-editor-tab-panel-title">{{ config.text }}</div>
      </div>
    </div>
    <div
      class="m-editor-sidebar-content"
      v-for="(config, index) in sideBarItems"
      :key="config.$key ?? index"
      v-show="activeTabName === config.text"
    >
      <component v-if="config" :is="config.component" v-bind="config.props || {}" v-on="config?.listeners || {}">
        <template
          #component-list-panel-header
          v-if="config.$key === 'component-list' || config.slots?.componentListPanelHeader"
        >
          <slot v-if="config.$key === 'component-list'" name="component-list-panel-header"></slot>
          <component v-else-if="config.slots?.componentListPanelHeader" :is="config.slots.componentListPanelHeader" />
        </template>

        <template
          #component-list-item="{ component }"
          v-if="config.$key === 'component-list' || config.slots?.componentListItem"
        >
          <slot v-if="config.$key === 'component-list'" name="component-list-item" :component="component"></slot>
          <component
            v-else-if="config.slots?.componentListItem"
            :is="config.slots.componentListItem"
            :component="component"
          />
        </template>

        <template #layer-panel-header v-if="config.$key === 'layer' || config.slots?.layerPanelHeader">
          <slot v-if="config.$key === 'layer'" name="layer-panel-header"></slot>
          <component v-else-if="config.slots?.layerPanelHeader" :is="config.slots.layerPanelHeader" />
        </template>

        <template #code-block-panel-header v-if="config.$key === 'code-block' || config.slots?.codeBlockPanelHeader">
          <slot v-if="config.$key === 'code-block'" name="code-block-panel-header"></slot>
          <component v-else-if="config.slots?.codeBlockPanelHeader" :is="config.slots.codeBlockPanelHeader" />
        </template>

        <template
          #code-block-panel-tool="{ id, data }"
          v-if="config.$key === 'code-block' || config.slots?.codeBlockPanelTool"
        >
          <slot v-if="config.$key === 'code-block'" name="code-block-panel-tool" :id="id" :data="data"></slot>
          <component v-else-if="config.slots?.codeBlockPanelTool" :is="config.slots.codeBlockPanelTool" />
        </template>

        <template
          #layer-node-content="{ data: nodeData }"
          v-if="config.$key === 'layer' || config.slots?.layerNodeContent"
        >
          <slot v-if="config.$key === 'layer'" name="layer-node-content" :data="nodeData"></slot>
          <component v-else-if="config.slots?.layerNodeContent" :is="config.slots.layerNodeContent" :data="nodeData" />
        </template>
      </component>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Coin, EditPen, Goods, List } from '@element-plus/icons-vue';

import MIcon from '@editor/components/Icon.vue';
import type { MenuButton, MenuComponent, SidebarSlots, SideComponent, SideItem } from '@editor/type';
import { SideBarData } from '@editor/type';

import CodeBlockListPanel from './code-block/CodeBlockListPanel.vue';
import DataSourceListPanel from './data-source/DataSourceListPanel.vue';
import LayerPanel from './layer/LayerPanel.vue';
import ComponentListPanel from './ComponentListPanel.vue';

defineSlots<SidebarSlots>();

defineOptions({
  name: 'MEditorSidebar',
});

const props = withDefaults(
  defineProps<{
    data: SideBarData;
    layerContentMenu: (MenuButton | MenuComponent)[];
  }>(),
  {
    data: () => ({ type: 'tabs', status: '组件', items: ['component-list', 'layer', 'code-block', 'data-source'] }),
  },
);

const activeTabName = ref(props.data?.status);

const getItemConfig = (data: SideItem): SideComponent => {
  const map: Record<string, SideComponent> = {
    'component-list': {
      $key: 'component-list',
      type: 'component',
      icon: Goods,
      text: '组件',
      component: ComponentListPanel,
      slots: {},
    },
    layer: {
      $key: 'layer',
      type: 'component',
      icon: List,
      text: '已选组件',
      props: {
        layerContentMenu: props.layerContentMenu,
      },
      component: LayerPanel,
      slots: {},
    },
    'code-block': {
      $key: 'code-block',
      type: 'component',
      icon: EditPen,
      text: '代码编辑',
      component: CodeBlockListPanel,
      slots: {},
    },
    'data-source': {
      $key: 'data-source',
      type: 'component',
      icon: Coin,
      text: '数据源',
      component: DataSourceListPanel,
      slots: {},
    },
  };

  return typeof data === 'string' ? map[data] : data;
};

const sideBarItems = computed(() => props.data.items.map((item) => getItemConfig(item)));

watch(
  () => props.data.status,
  (status) => {
    activeTabName.value = status || '0';
  },
);

defineExpose({
  activeTabName,
});
</script>
