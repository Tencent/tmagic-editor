<template>
  <button class="magic-ui-button">
    <slot>
      <magic-ui-text :config="textConfig"></magic-ui-text>
    </slot>
  </button>
</template>
<script lang="ts" setup>
import { computed } from 'vue';

import { MComponent } from '@tmagic/schema';

import useApp from '../../useApp';

const props = withDefaults(
  defineProps<{
    config: MComponent;
    model?: any;
  }>(),
  {
    model: () => ({}),
  },
);

const textConfig = computed(() => ({
  type: 'text',
  text: props.config?.text || '',
}));

useApp({
  config: props.config,
  methods: {},
});
</script>
