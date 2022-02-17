<template>
  <div class="m-editor-nav-menu" :style="{ height: `${height}px` }">
    <div v-for="key in keys" :class="`menu-${key}`" :key="key">
      <tool-button :data="item" v-for="(item, index) in data[key]" :key="index"></tool-button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

import ToolButton from '@editor/components/ToolButton.vue';
import { MenuBarData } from '@editor/type';

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
    return {
      keys: computed(() => Object.keys(props.data) as Array<keyof MenuBarData>),
    };
  },
});
</script>
