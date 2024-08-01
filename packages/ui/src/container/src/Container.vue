<template>
  <div v-if="display(config)" :id="`${config.id}`" :class="className" :style="app?.transformStyle(config.style || {})">
    <slot>
      <template v-for="item in config.items">
        <component
          v-if="display(item)"
          :key="item.id"
          :is="`magic-ui-${toLine(item.type)}`"
          :id="item.id"
          :class="`${item.className || ''}`"
          :style="app?.transformStyle(item.style || {})"
          :config="{ ...item, [IS_DSL_NODE_KEY]: true }"
        ></component>
      </template>
    </slot>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import type { MContainer, UiComponentProps } from '@tmagic/schema';
import { IS_DSL_NODE_KEY, toLine } from '@tmagic/utils';
import { useApp } from '@tmagic/vue-runtime-help';

const props = withDefaults(defineProps<UiComponentProps<MContainer>>(), {
  model: () => ({}),
});

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
</script>
