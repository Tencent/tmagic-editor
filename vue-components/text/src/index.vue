<template>
  <p @click="clickHandler" v-html="config.text"></p>
</template>

<script lang="ts" setup>
import { inject } from 'vue';

import type TMagicApp from '@tmagic/core';
import { COMMON_EVENT_PREFIX, type Id, type MComponent } from '@tmagic/core';
import { type ComponentProps, registerNodeHooks, useNode } from '@tmagic/vue-runtime-help';

interface TextSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'text';
  text: string;
}

defineOptions({
  name: 'tmagic-text',
});

const props = defineProps<ComponentProps<TextSchema>>();

const app = inject<TMagicApp>('app');
const node = useNode(props);
registerNodeHooks(node);

const clickHandler = () => {
  if (app && node) {
    app.emit(`${COMMON_EVENT_PREFIX}click`, node);
  }
};
</script>
