<template>
  <component
    :is="containerComponent"
    :class="className"
    :style="style"
    :data-tmagic-id="config.id"
    :config="{ ...config, [IS_DSL_NODE_KEY]: false }"
  ></component>
</template>

<script lang="ts">
import { defineComponent, inject, nextTick, type PropType, watch } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import { asyncLoadCss, asyncLoadJs, IS_DSL_NODE_KEY, type MPage } from '@tmagic/core';
import { useComponent, useComponentStatus, useNode } from '@tmagic/vue-runtime-help';

const createCss = (config: MPage) => {
  if (config.cssFile) {
    asyncLoadCss(config.cssFile);
  }

  if (Array.isArray(config.cssFiles)) {
    config.cssFiles.map((file) => asyncLoadCss(file.url));
  }

  if (config.css) {
    const style = window.document.createElement('style');
    style.innerHTML = config.css;
    window.document.head.appendChild(style);
  }
};

const createJs = (config: MPage) => {
  if (Array.isArray(config.jsFiles)) {
    config.jsFiles.map((file) => asyncLoadJs(file.url));
  }
};

export default defineComponent({
  name: 'tmagic-page',

  props: {
    config: {
      type: Object as PropType<MPage>,
      required: true,
    },
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    const app = inject<TMagicApp>('app');

    if (app?.jsEngine === 'browser') {
      createCss(props.config);
      createJs(props.config);
    }

    const containerComponent = useComponent({ componentType: 'container', app });

    const { style, className } = useComponentStatus(props);

    const refresh = () => {
      window.location.reload();
    };

    watch(
      () => props.config,
      async (config, preConfig) => {
        const node = useNode({ config: { ...config, [IS_DSL_NODE_KEY]: true } }, app);

        if (config.id !== preConfig?.id) {
          node?.setInstance({ config: props.config, refresh });
          node?.emit('created');
        }
        await nextTick();

        if (config.id !== preConfig?.id) {
          node?.emit('mounted');
          const preNode = useNode({ config: { ...preConfig, [IS_DSL_NODE_KEY]: true } }, app);
          preNode?.emit('destroy');
        }
      },
      {
        immediate: true,
      },
    );

    return {
      style,
      className,
      containerComponent,
      IS_DSL_NODE_KEY,
    };
  },
});
</script>
