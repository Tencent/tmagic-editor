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

      <template #component-list-panel-header v-if="item === 'component-list'">
        <slot name="component-list-panel-header"></slot>
      </template>
    </tab-pane>
  </el-tabs>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue';

import { SideBarData } from '../../type';

import TabPane from './TabPane.vue';

export default defineComponent({
  components: { TabPane },

  name: 'm-sidebar',

  props: {
    data: {
      type: Object as PropType<SideBarData>,
      default: () => ({ type: 'tabs', status: '组件', items: ['component-list', 'layer'] }),
    },
  },

  setup(props) {
    const activeTabName = ref(props.data?.status);

    watch(
      () => props.data?.status,
      (status) => {
        activeTabName.value = status || '0';
      },
    );

    return {
      activeTabName,
    };
  },
});
</script>
