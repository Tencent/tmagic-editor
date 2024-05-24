<template>
  <MContainer class="magic-ui-page-fragment" :config="config"></MContainer>
</template>

<script lang="ts" setup>
import type { MPageFragment } from '@tmagic/schema';

import MContainer from '../../container';
import useApp from '../../useApp';

const props = withDefaults(
  defineProps<{
    config: MPageFragment;
    model?: any;
  }>(),
  {
    model: () => ({}),
  },
);

useApp({
  config: props.config,
  methods: {},
});
</script>
