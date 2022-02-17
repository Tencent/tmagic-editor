<template>
  <button class="magic-ui-button" @click="clickHandler">
    <slot>
      <magic-ui-text :config="textConfig"></magic-ui-text>
    </slot>
  </button>
</template>
<script lang="ts">
import { computed, defineComponent, getCurrentInstance, PropType, reactive } from '@vue/composition-api';

import { MComponent } from '@tmagic/schema';

export default defineComponent({
  name: 'magic-ui-button',
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
    const vm = getCurrentInstance()?.proxy;
    const actions = reactive<Function[]>([]);
    const actualActions = computed(() => [
      typeof props.config.preAction === 'function' ? props.config.preAction : () => true,
      ...actions,
      typeof props.config.postAction === 'function' ? props.config.postAction : () => true,
    ]);
    function pushAction(action: Function): void {
      actions.push(action);
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
