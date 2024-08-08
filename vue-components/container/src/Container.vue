<template>
  <div
    v-if="display(config)"
    :id="`${config.id}`"
    :data-iterator-index="iteratorIndex"
    :data-iterator-container-id="iteratorContainerId"
    :class="className"
    :style="app?.transformStyle(config.style || {})"
  >
    <slot>
      <template v-for="(item, index) in config.items">
        <component
          v-if="display(item)"
          :key="item.id"
          :is="`magic-ui-${toLine(item.type)}`"
          :id="item.id"
          :data-container-index="index"
          :data-iterator-index="iteratorIndex"
          :data-iterator-container-id="iteratorContainerId"
          :class="`${item.className || ''}`"
          :style="app?.transformStyle(item.style || {})"
          :config="{ ...item, [IS_DSL_NODE_KEY]: true }"
        ></component>
      </template>
    </slot>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue-demi';

import type { Id, MContainer } from '@tmagic/schema';
import { IS_DSL_NODE_KEY, toLine } from '@tmagic/utils';
import { useApp } from '@tmagic/vue-runtime-help';

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<MContainer>,
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

    return {
      app,
      className,
      IS_DSL_NODE_KEY,

      display,
      toLine,
    };
  },
});
</script>
