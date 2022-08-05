<template>
  <span ref="target" class="m-editor-resizer">
    <slot></slot>
  </span>
</template>

<script lang="ts">
import { defineComponent, inject, onMounted, onUnmounted, ref, toRaw } from 'vue';
import Gesto from 'gesto';

import { Services } from '../type';

export default defineComponent({
  name: 'm-editor-resize',

  props: {
    type: {
      type: String,
    },
  },

  setup(props) {
    const services = inject<Services>('services');

    const target = ref<HTMLSpanElement>();

    let getso: Gesto;

    onMounted(() => {
      if (!target.value) return;
      getso = new Gesto(target.value, {
        container: window,
        pinchOutside: true,
      }).on('drag', (e) => {
        if (!target.value || !services) return;

        let { left, right } = {
          ...toRaw(services.uiService.get('columnWidth')),
        };
        if (props.type === 'left') {
          left += e.deltaX;
        } else if (props.type === 'right') {
          right -= e.deltaX;
        }
        services.uiService.set('columnWidth', {
          left,
          right,
        });
      });
    });

    onUnmounted(() => {
      getso?.unset();
    });

    return {
      target,
    };
  },
});
</script>
