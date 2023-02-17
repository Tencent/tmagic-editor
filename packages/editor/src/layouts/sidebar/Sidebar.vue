<template>
  <TMagicTabs
    v-if="data.type === 'tabs' && data.items.length"
    class="m-editor-sidebar"
    v-model="activeTabName"
    type="card"
    tab-position="left"
  >
    <component
      :is="uiComponent.component"
      v-for="(config, index) in sideBarItems"
      :key="config.$key || index"
      :name="config.text"
    >
      <template #label>
        <div :key="config.text">
          <MIcon v-if="config.icon" :icon="config.icon"></MIcon>
          <div v-if="config.text" class="magic-editor-tab-panel-title">{{ config.text }}</div>
        </div>
      </template>

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
          #code-block-edit-panel-header="{ id }"
          v-if="config.$key === 'code-block' || config.slots?.codeBlockEditPanelHeader"
        >
          <slot v-if="config.$key === 'code-block'" name="code-block-edit-panel-header" :id="id"></slot>
          <component v-else-if="config.slots?.codeBlockEditPanelHeader" :is="config.slots.codeBlockEditPanelHeader" />
        </template>

        <template
          #layer-node-content="{ data: nodeData, node }"
          v-if="config.$key === 'layer' || config.slots?.layerNodeContent"
        >
          <slot v-if="config.$key === 'layer'" name="layer-node-content" :data="nodeData" :node="node"></slot>
          <component
            v-else-if="config.slots?.layerNodeContent"
            :is="config.slots.layerNodeContent"
            :data="nodeData"
            :node="node"
          />
        </template>
      </component>
    </component>
  </TMagicTabs>
</template>

<script lang="ts" setup name="MEditorSidebar">
import { computed, ref, watch } from 'vue';
import { Coin, EditPen, Files } from '@element-plus/icons-vue';

import { getConfig, TMagicTabs } from '@tmagic/design';

import MIcon from '../../components/Icon.vue';
import type { MenuButton, MenuComponent, SideComponent, SideItem } from '../../type';
import { SideBarData } from '../../type';

import CodeBlockList from './code-block/CodeBlockList.vue';
import ComponentListPanel from './ComponentListPanel.vue';
import LayerPanel from './LayerPanel.vue';

const props = withDefaults(
  defineProps<{
    data?: SideBarData;
    layerContentMenu: (MenuButton | MenuComponent)[];
  }>(),
  {
    data: () => ({ type: 'tabs', status: '组件', items: ['component-list', 'layer', 'code-block'] }),
  },
);

const uiComponent = getConfig('components').tabPane;

const activeTabName = ref(props.data?.status);

const getItemConfig = (data: SideItem): SideComponent => {
  const map: Record<string, SideComponent> = {
    'component-list': {
      $key: 'component-list',
      type: 'component',
      icon: Coin,
      text: '组件',
      component: ComponentListPanel,
      slots: {},
    },
    layer: {
      $key: 'layer',
      type: 'component',
      icon: Files,
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
      component: CodeBlockList,
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
