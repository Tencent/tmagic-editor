<template>
  <div class="m-editor-nav-menu">
    <TMagicButton
      v-for="(item, index) in data"
      class="menu-item button"
      :key="index"
      size="small"
      link
      @click="item.handler"
    >
      <TMagicIcon><component :is="item.icon"></component></TMagicIcon><span>{{ item.text }}</span>
    </TMagicButton>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { TMagicButton, TMagicIcon } from '@tmagic/design';
import { MenuButton } from '@tmagic/editor';

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
