<template>
  <div class="m-editor-nav-menu" :style="{ height: `${height}px` }">
    <div v-for="key in keys" :class="`menu-${key}`" :key="key" :style="`width: ${columnWidth?.[key]}px`">
      <tool-button :data="item" v-for="(item, index) in data[key]" :key="index"></tool-button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType } from 'vue';

import ToolButton from '../components/ToolButton.vue';
import { GetColumnWidth, MenuBarData, Services } from '../type';

export default defineComponent({
  name: 'nav-menu',

  components: { ToolButton },

  props: {
    data: {
      type: Object as PropType<MenuBarData>,
      default: () => ({}),
    },

    height: {
      type: Number,
    },
  },

  setup(props) {
    const services = inject<Services>('services');

    return {
      keys: computed(() => Object.keys(props.data) as Array<keyof MenuBarData>),

      columnWidth: computed(() => services?.uiService.get<GetColumnWidth>('columnWidth')),
    };
  },
});
</script>
