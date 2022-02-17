<template>
  <component
    v-if="display()"
    :is="tagName"
    :id="config.id"
    :class="`magic-ui-component${config.className ? ` ${config.className}` : ''}`"
    :style="style"
    :config="config"
  ></component>
</template>

<script lang="ts">
import { computed, defineComponent, getCurrentInstance, PropType, provide } from '@vue/composition-api';

import { MComponent } from '@tmagic/schema';
import { toLine } from '@tmagic/utils';

import useApp from './useApp';
import useCommonMethod from './useCommonMethod';

export default defineComponent({
  name: 'magic-ui-component',

  props: {
    config: {
      type: Object as PropType<MComponent>,
      default: () => ({}),
    },
  },

  setup(props) {
    const vm = getCurrentInstance()?.proxy;
    const app = useApp(props);

    provide('hoc', vm);

    return {
      tagName: computed(() => `magic-ui-${toLine(props.config.type)}`),
      style: computed(() => app?.transformStyle(props.config.style || {})),

      display: () => {
        const displayCfg = props.config?.display;

        if (typeof displayCfg === 'function') {
          return displayCfg(app);
        }
        return displayCfg !== false;
      },
      ...useCommonMethod(),
    };
  },
});
</script>
