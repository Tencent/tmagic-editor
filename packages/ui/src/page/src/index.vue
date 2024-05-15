<template>
  <MContainer class="magic-ui-page" :config="config"></MContainer>
</template>

<script lang="ts" setup>
import type { MPage } from '@tmagic/schema';

import MContainer from '../../container';
import useApp from '../../useApp';

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
