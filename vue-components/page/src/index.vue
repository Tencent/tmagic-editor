<template>
  <component :is="containerComponent" class="magic-ui-page" :data-tmagic-id="config.id" :config="config"></component>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue-demi';

import { asyncLoadCss, asyncLoadJs, type MPage } from '@tmagic/core';
import { useApp, useComponent } from '@tmagic/vue-runtime-help';

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
    const refresh = () => {
      window.location.reload();
    };

    const { app } = useApp({
      config: props.config,
      methods: { refresh },
    });

    if (app?.jsEngine === 'browser') {
      createCss(props.config);
      createJs(props.config);
    }

    const containerComponent = useComponent({ componentType: 'container', app });

    return {
      containerComponent,
    };
  },
});
</script>
