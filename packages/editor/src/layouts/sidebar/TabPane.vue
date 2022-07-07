<template>
  <el-tab-pane v-if="config" :name="config.text">
    <template #label>
      <div :key="config.text">
        <m-icon v-if="config.icon" :icon="config.icon"></m-icon>
        <div v-if="config.text" class="magic-editor-tab-panel-title">{{ config.text }}</div>
      </div>
    </template>

    <component :is="config.component" v-bind="config.props || {}" v-on="config?.listeners || {}">
      <template #layer-panel v-if="data === 'layer'">
        <slot name="layer-panel"></slot>
      </template>

      <template #component-list-panel v-if="data === 'component-list'">
        <slot name="component-list-panel"></slot>
      </template>

      <template #layer-node-content="{ data, node }" v-if="config.slots?.layerNodeContent">
        <component :is="config.slots?.layerNodeContent" :data="data" :node="node" />
      </template>
    </component>
  </el-tab-pane>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { Coin, Files } from '@element-plus/icons';

import MIcon from '@editor/components/Icon.vue';
import { SideComponent, SideItem } from '@editor/type';

import ComponentListPanel from './ComponentListPanel.vue';
import LayerPanel from './LayerPanel.vue';

export default defineComponent({
  components: { MIcon },

  props: {
    data: {
      type: [Object, String] as PropType<SideItem>,
    },
  },

  setup(props) {
    return {
      config: computed<SideComponent | undefined>(() => {
        if (typeof props.data !== 'string') {
          return props.data;
        }

        switch (props.data) {
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
            return undefined;
        }
      }),
    };
  },
});
</script>
