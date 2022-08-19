<template>
  <button class="magic-ui-button" @click="clickHandler">
    <slot>
      <magic-ui-text :config="textConfig"></magic-ui-text>
    </slot>
  </button>
</template>
<script lang="ts">
import { computed, defineComponent, getCurrentInstance, PropType, ref } from 'vue';

import type { MComponent } from '@tmagic/schema';

import useApp from '../useApp';

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<MComponent>,
      default: () => ({}),
    },

    model: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    useApp(props);
    const vm = getCurrentInstance()?.proxy;
    const actions = ref<Function[]>([]);
    const actualActions = computed(() => [
      typeof props.config.preAction === 'function' ? props.config.preAction : () => true,
      ...actions.value,
      typeof props.config.postAction === 'function' ? props.config.postAction : () => true,
    ]);
    function pushAction(action: Function): void {
      actions.value.push(action);
    }
    async function clickHandler(): Promise<void> {
      for (const fn of actualActions.value) {
        if (typeof fn === 'function') {
          const ret = await fn(vm, { model: props.model });
          if (ret === false) {
            break;
          }
        }
      }
    }

    const textConfig = computed(() => ({
      type: 'text',
      text: props.config?.text || '',
      disabledText: props.config?.disabledText || '',
      html: props.config?.html || '',
    }));

    return {
      pushAction,
      clickHandler,
      textConfig,
    };
  },
});
</script>
