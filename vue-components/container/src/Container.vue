<template>
  <div v-if="display(config)" :class="className" :style="style">
    <slot>
      <template v-for="(item, index) in config.items">
        <component
          v-if="display(item)"
          :key="item.id"
          :is="useComponent({ componentType: item.type, app })"
          :data-tmagic-id="item.id"
          :data-tmagic-iterator-index="iteratorIndex"
          :data-tmagic-iterator-container-id="iteratorContainerId"
          :data-container-index="index"
          :class="item.className ? `${item.className} magic-ui-${toLine(item.type)}` : `magic-ui-${toLine(item.type)}`"
          :style="app?.transformStyle(item.style || {})"
          :config="{ ...item, [IS_DSL_NODE_KEY]: true }"
          :container-index="index"
          :iterator-index="iteratorIndex"
          :iterator-container-id="iteratorContainerId"
        ></component>
      </template>
    </slot>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue-demi';

import type { Id, MContainer } from '@tmagic/core';
import { IS_DSL_NODE_KEY, toLine } from '@tmagic/core';
import { useApp, useComponent } from '@tmagic/vue-runtime-help';

interface ContainerSchema extends Omit<MContainer, 'id'> {
  id?: Id;
  type?: 'container';
}

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<ContainerSchema>,
      required: true,
    },
    iteratorIndex: Array as PropType<number[]>,
    iteratorContainerId: Array as PropType<Id[]>,
    model: {
      type: Object,
      default: () => ({}),
    },
  },

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
      IS_DSL_NODE_KEY,

      display,
      toLine,
      useComponent,
    };
  },
});
</script>
