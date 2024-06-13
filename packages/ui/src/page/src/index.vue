<template>
  <MContainer class="magic-ui-page" :config="config"></MContainer>
</template>

<script lang="ts" setup>
import type { MPage } from '@tmagic/schema';
import { useApp } from '@tmagic/vue-runtime-help';

import MContainer from '../../container';

const props = withDefaults(
  defineProps<{
    config: MPage;
    model?: any;
  }>(),
  {
    model: () => ({}),
  },
);

const refresh = () => {
  window.location.reload();
};

useApp({
  config: props.config,
  methods: { refresh },
});
</script>
