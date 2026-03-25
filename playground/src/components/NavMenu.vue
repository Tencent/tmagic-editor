<template>
  <div class="m-editor-nav-menu">
    <AdapterSelect></AdapterSelect>
    <div v-for="(item, index) in data" :key="index" class="menu-item button">
      <TMagicButton size="small" link @click="item.handler">
        <TMagicIcon><component :is="item.icon"></component></TMagicIcon><span>{{ item.text }}</span>
      </TMagicButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { MenuButton, TMagicButton, TMagicIcon } from '@tmagic/editor';

import AdapterSelect from './AdapterSelect.vue';

defineProps<{
  data: MenuButton[];
}>();
</script>

<style lang="scss" scoped>
.m-editor-nav-menu {
  justify-content: flex-end;
  height: 35px;
}
</style>
