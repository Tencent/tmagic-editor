<template>
  <img :src="config.src" @click="clickHandler" />
</template>

<script lang="ts" setup>
import type { Id, MComponent } from '@tmagic/core';
import { type ComponentProps, registerNodeHooks, useNode } from '@tmagic/vue-runtime-help';

interface ImgSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'img';
  src: string;
  url?: string;
}

defineOptions({
  name: 'tmagic-img',
});

const props = defineProps<ComponentProps<ImgSchema>>();

const clickHandler = () => {
  if (props.config.url) window.location.href = props.config.url;
};

const node = useNode(props);
registerNodeHooks(node);
</script>
