<template>
  <div v-if="display(config)" :class="className" :style="style">
    <slot>
      <template v-for="(item, index) in config.items">
        <ItemComponent
          v-if="display(item)"
          :key="item.id"
          :config="item"
          :index="index"
          :iterator-index="iteratorIndex"
          :iterator-container-id="iteratorContainerId"
        ></ItemComponent>
      </template>
    </slot>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue-demi';

import type { Id, MContainer } from '@tmagic/core';
import { IS_DSL_NODE_KEY } from '@tmagic/core';
import { useApp } from '@tmagic/vue-runtime-help';

import ItemComponent from './Component';

interface ContainerSchema extends Omit<MContainer, 'id'> {
  id?: Id;
  type?: 'container';
}

export default defineComponent({
  name: 'tmagic-container',

  props: {
    config: {
      type: Object as PropType<ContainerSchema>,
      required: true,
    },
    iteratorIndex: {
      type: Array as PropType<number[]>,
      default: () => [],
    },
    iteratorContainerId: {
      type: Array as PropType<Id[]>,
      default: () => [],
    },
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  components: { ItemComponent },

  setup(props) {
    const { display, app } = useApp({
      config: props.config,
      iteratorContainerId: props.iteratorContainerId,
      iteratorIndex: props.iteratorIndex,
      methods: {},
    });

    const className = computed(() => {
      const list = ['magic-ui-container'];
      if (props.config.layout) {
        list.push(`magic-layout-${props.config.layout}`);
      }
      if (props.config.className) {
        list.push(props.config.className);
      }
      return list.join(' ');
    });

    const style = computed(() => {
      if (props.config[IS_DSL_NODE_KEY]) {
        return {};
      }
      return app?.transformStyle(props.config.style || {});
    });

    return {
      app,
      className,
      style,

      display,
    };
  },
});
</script>
