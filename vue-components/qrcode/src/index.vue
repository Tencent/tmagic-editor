<template>
  <img :src="imgUrl" @click="clickHandler" />
</template>

<script lang="ts">
import { defineComponent, inject, type PropType, ref, watch } from 'vue-demi';
import QRCode from 'qrcode';

import type TMagicApp from '@tmagic/core';
import { COMMON_EVENT_PREFIX, type Id, type MComponent } from '@tmagic/core';
import { registerNodeHooks, useNode } from '@tmagic/vue-runtime-help';

interface QrCodeSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'qrcode';
  url: string;
}

export default defineComponent({
  name: 'tmagic-qrcode',

  props: {
    config: {
      type: Object as PropType<QrCodeSchema>,
      required: true,
    },
    iteratorIndex: Array as PropType<number[]>,
    iteratorContainerId: Array as PropType<Id[]>,
    containerIndex: Number,
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
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

    return {
      imgUrl,
      clickHandler,
    };
  },
});
</script>
