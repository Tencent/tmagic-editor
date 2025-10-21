<template>
  <div class="m-editor-nav-menu">
    <div v-for="(item, index) in data" :key="index" class="menu-item button">
      <TMagicButton size="small" link @click="item.handler">
        <TMagicIcon><component :is="item.icon"></component></TMagicIcon><span>{{ item.text }}</span>
      </TMagicButton>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { MenuButton, TMagicButton, TMagicIcon } from '@tmagic/editor';

export default defineComponent({
  name: 'nav-menu',
  props: {
    data: {
      type: Array as PropType<MenuButton[]>,
      default: () => [],
    },
  },
  components: { TMagicIcon, TMagicButton },
});
</script>

<style lang="scss" scoped>
.m-editor-nav-menu {
  justify-content: flex-end;
  height: 35px;
}
</style>
