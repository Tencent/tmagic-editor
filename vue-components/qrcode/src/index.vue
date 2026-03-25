<template>
  <img :src="imgUrl" @click="clickHandler" />
</template>

<script lang="ts" setup>
import { inject, ref, watch } from 'vue';
import QRCode from 'qrcode';

import type TMagicApp from '@tmagic/core';
import { COMMON_EVENT_PREFIX, type Id, type MComponent } from '@tmagic/core';
import { type ComponentProps, registerNodeHooks, useNode } from '@tmagic/vue-runtime-help';

interface QrCodeSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'qrcode';
  url: string;
}

defineOptions({
  name: 'tmagic-qrcode',
});

const props = defineProps<ComponentProps<QrCodeSchema>>();

const imgUrl = ref();

watch(
  () => props.config.url,
  (url = '') => {
    QRCode.toDataURL(url, (e: any, url: string) => {
      if (e) console.error(e);
      imgUrl.value = url;
    });
  },
  {
    immediate: true,
  },
);

const app = inject<TMagicApp>('app');
const node = useNode(props);
registerNodeHooks(node);

const clickHandler = () => {
  if (app && node) {
    app.emit(`${COMMON_EVENT_PREFIX}click`, node);
  }
};
</script>
