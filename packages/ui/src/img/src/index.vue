<template>
  <img class="magic-ui-img" :src="config.src" @click="clickHandler" />
</template>

<script lang="ts" setup>
import type { MComponent } from '@tmagic/schema';
import { useApp } from '@tmagic/vue-runtime-help';

interface ImgSchema extends MComponent {
  type: 'img';
  src: string;
  url: string;
}

const props = withDefaults(
  defineProps<{
    config: ImgSchema;
    model?: any;
  }>(),
  {
    model: () => ({}),
  },
);

const clickHandler = () => {
  if (props.config.url) window.location.href = props.config.url;
};

useApp({
  config: props.config,
  methods: {},
});
</script>
