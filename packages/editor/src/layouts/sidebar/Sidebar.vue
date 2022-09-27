<template>
  <el-tabs
    v-if="data.type === 'tabs' && data.items.length"
    class="m-editor-sidebar"
    v-model="activeTabName"
    type="card"
    tab-position="left"
  >
    <tab-pane v-for="(item, index) in data.items" :key="index" :data="item">
      <template #layer-panel-header v-if="item === 'layer'">
        <slot name="layer-panel-header"></slot>
      </template>

      <template #layer-node-content="{ node, data }" v-if="item === 'layer'">
        <slot name="layer-node-content" :data="data" :node="node"></slot>
      </template>

      <template #component-list-panel-header v-if="item === 'component-list'">
        <slot name="component-list-panel-header"></slot>
      </template>

      <template #component-list-item="{ component }" v-if="item === 'component-list'">
        <slot name="component-list-item" :component="component"></slot>
      </template>

      <template #code-block-panel-header v-if="item === 'code-block'">
        <slot name="code-block-panel-header"></slot>
      </template>

      <template #code-block-panel-tool="{ id, data }" v-if="item === 'code-block'">
        <slot name="code-block-panel-tool" :id="id" :data="data"></slot>
      </template>

      <template #code-block-edit-panel-header="{ id }" v-if="item === 'code-block'">
        <slot name="code-block-edit-panel-header" :id="id"></slot>
      </template>
    </tab-pane>
  </el-tabs>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

import { SideBarData } from '../../type';

import TabPane from './TabPane.vue';

const props = withDefaults(
  defineProps<{
    data?: SideBarData;
  }>(),
  {
    data: () => ({ type: 'tabs', status: '组件', items: ['component-list', 'layer', 'code-block'] }),
  },
);

const activeTabName = ref(props.data?.status);

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
