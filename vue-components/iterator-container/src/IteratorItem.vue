<template>
  <component
    :is="containerComponent"
    :style="style"
    :class="className"
    :config="config"
    :iterator-index="iteratorIndex"
    :iterator-container-id="iteratorContainerId"
    :page-fragment-container-id="pageFragmentContainerId"
  ></component>
</template>

<script lang="ts" setup>
import { inject } from 'vue';

import type TMagicApp from '@tmagic/core';
import { type Id } from '@tmagic/core';
import { useComponent, useComponentStatus } from '@tmagic/vue-runtime-help';

import { IteratorItemSchema } from './type';

interface IteratorItemProps {
  config: IteratorItemSchema;
  iteratorIndex?: number[];
  iteratorContainerId?: Id[];
  containerIndex?: number;
  pageFragmentContainerId?: Id;
  index?: number;
  model?: Record<string, any>;
}

defineOptions({
  name: 'tmagic-iterator-container-item',
});

const props = defineProps<IteratorItemProps>();

const app = inject<TMagicApp>('app');

const containerComponent = useComponent({ componentType: 'container', app });

const { style, className } = useComponentStatus(props);
</script>
