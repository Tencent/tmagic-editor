<template>
  <el-tabs v-if="data.type === 'tabs'" class="m-editor-sidebar" v-model="activeTabName" type="card" tab-position="left">
    <el-tab-pane v-for="item in items" :key="item.text" :name="item.text">
      <template #label>
        <span>
          <m-icon v-if="item.icon" :icon="item.icon"></m-icon>
          <div v-if="item.text" class="magic-editor-tab-panel-title">{{ item.text }}</div>
        </span>
      </template>

      <component :is="item.component" v-bind="item.props || {}" v-on="item.listeners || {}">
        <template #layer-node-content="{ data, node }" v-if="item.slots?.layerNodeContent">
          <component :is="item.slots.layerNodeContent" :data="data" :node="node" />
        </template>
      </component>
    </el-tab-pane>
  </el-tabs>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue';
import { Coin, Files } from '@element-plus/icons';

import MIcon from '@editor/components/Icon.vue';
import { SideBarData, SideComponent } from '@editor/type';

import ComponentListPanel from './ComponentListPanel.vue';
import LayerPanel from './LayerPanel.vue';

export default defineComponent({
  name: 'm-sidebar',

  components: { MIcon },

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

      items: computed<SideComponent[] | Record<string, any>[]>(() =>
        props.data?.items.map((item) => {
          if (typeof item !== 'string') {
            return item;
          }

          switch (item) {
            case 'component-list':
              return {
                type: 'component',
                icon: Coin,
                text: '组件',
                component: ComponentListPanel,
                slots: {},
              };
            case 'layer':
              return {
                type: 'component',
                icon: Files,
                text: '已选组件',
                component: LayerPanel,
                slots: {},
              };
            default:
              return {};
          }
        }),
      ),
    };
  },
});
</script>
