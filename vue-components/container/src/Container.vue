<template>
  <div @click="clickHandler">
    <slot>
      <ItemComponent
        v-for="(item, index) in config.items"
        :key="item.id"
        :config="item"
        :index="index"
        :iterator-index="iteratorIndex"
        :iterator-container-id="iteratorContainerId"
        :page-fragment-container-id="pageFragmentContainerId"
      ></ItemComponent>
    </slot>
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue';

import type TMagicApp from '@tmagic/core';
import { COMMON_EVENT_PREFIX, type Id, type MContainer } from '@tmagic/core';
import { type ComponentProps, registerNodeHooks, useNode } from '@tmagic/vue-runtime-help';

import ItemComponent from './Component';

interface ContainerSchema extends Omit<MContainer, 'id'> {
  id?: Id;
  type?: 'container';
}

defineOptions({
  name: 'tmagic-container',
});

const props = defineProps<ComponentProps<ContainerSchema>>();

const app = inject<TMagicApp>('app');
const node = useNode(props, app);
registerNodeHooks(node);

const clickHandler = () => {
  if (app && node) {
    app.emit(`${COMMON_EVENT_PREFIX}click`, node);
  }
};
</script>
