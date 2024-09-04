<template>
  <img :src="imgUrl" />
</template>

<script lang="ts">
import { defineComponent, type PropType, ref, watch } from 'vue-demi';
import QRCode from 'qrcode';

import type { Id, MComponent } from '@tmagic/core';
import { useApp } from '@tmagic/vue-runtime-help';

interface QrCodeSchema extends Omit<MComponent, 'id'> {
  id?: Id;
  type?: 'qrcode';
  url: string;
}

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<QrCodeSchema>,
      required: true,
    },
    iteratorIndex: Array as PropType<number[]>,
    iteratorContainerId: Array as PropType<Id[]>,
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

    useApp({
      config: props.config,
      methods: {},
      iteratorContainerId: props.iteratorContainerId,
      iteratorIndex: props.iteratorIndex,
    });

    return {
      imgUrl,
    };
  },
});
</script>
