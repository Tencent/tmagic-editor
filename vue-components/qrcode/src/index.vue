<template>
  <img class="magic-ui-qrcode" :src="imgUrl" />
</template>

<script lang="ts">
import { defineComponent, type PropType, ref, watch } from 'vue-demi';
import QRCode from 'qrcode';

import type { MComponent } from '@tmagic/schema';
import { useApp } from '@tmagic/vue-runtime-help';

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<MComponent>,
      required: true,
    },
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
    });

    return {
      imgUrl,
    };
  },
});
</script>
