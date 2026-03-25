<template>
  <component
    :is="containerComponent"
    :class="className"
    :style="style"
    :data-tmagic-id="config.id"
    :config="{ ...config, [IS_DSL_NODE_KEY]: false }"
  ></component>
</template>

<script lang="ts" setup>
import { inject } from 'vue';

import type TMagicApp from '@tmagic/core';
import { IS_DSL_NODE_KEY, type MPageFragment } from '@tmagic/core';
import {
  type ComponentProps,
  registerNodeHooks,
  useComponent,
  useComponentStatus,
  useNode,
} from '@tmagic/vue-runtime-help';

defineOptions({
  name: 'tmagic-page-fragment',
});

const props = defineProps<ComponentProps<MPageFragment>>();

const app = inject<TMagicApp>('app');
const node = useNode(props, app);
registerNodeHooks(node);

const containerComponent = useComponent({ componentType: 'container', app });
const { style, className } = useComponentStatus(props);
</script>
