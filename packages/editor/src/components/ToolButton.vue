<template>
  <div
    v-if="display"
    class="menu-item"
    :class="`${data.type} ${data.className || ''}`"
    @click="clickHandler(data, $event)"
    @mousedown="mousedownHandler(data, $event)"
    @mouseup="mouseupHandler(data, $event)"
  >
    <el-divider v-if="data.type === 'divider'" :direction="data.direction || 'vertical'"></el-divider>
    <div v-else-if="data.type === 'text'" class="menu-item-text">{{ data.text }}</div>

    <template v-else-if="data.type === 'button'">
      <el-tooltip v-if="data.tooltip" effect="dark" placement="bottom-start" :content="data.tooltip">
        <el-button size="small" text :disabled="disabled"
          ><MIcon v-if="data.icon" :icon="data.icon"></MIcon><span>{{ data.text }}</span></el-button
        >
      </el-tooltip>
      <el-button v-else size="small" text :disabled="disabled"
        ><MIcon v-if="data.icon" :icon="data.icon"></MIcon><span>{{ data.text }}</span></el-button
      >
    </template>

    <el-dropdown v-else-if="data.type === 'dropdown'" trigger="click" :disabled="disabled" @command="dropdownHandler">
      <span class="el-dropdown-link menubar-menu-button">
        {{ data.text }}<el-icon class="el-icon--right"><ArrowDown></ArrowDown></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu v-if="data.items && data.items.length">
          <el-dropdown-item v-for="(subItem, index) in data.items" :key="index" :command="{ data, subItem }">{{
            subItem.text
          }}</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <component v-else-if="data.type === 'component'" v-bind="data.props || {}" :is="data.component"></component>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';

import MIcon from '../components/Icon.vue';
import type { MenuButton, MenuComponent, Services } from '../type';

const props = withDefaults(
  defineProps<{
    data?: MenuButton | MenuComponent;
    eventType?: 'mousedown' | 'mouseup' | 'click';
  }>(),
  {
    data: () => ({
      type: 'text',
      display: false,
    }),
    eventType: 'click',
  },
);
const services = inject<Services>('services');

const disabled = computed(() => {
  if (typeof props.data === 'string') return false;
  if (props.data.type === 'component') return false;
  if (typeof props.data.disabled === 'function') {
    return props.data.disabled(services);
  }
  return props.data.disabled;
});

const display = computed(() => {
  if (!props.data) return false;
  if (typeof props.data === 'string') return true;
  if (typeof props.data.display === 'function') {
    return props.data.display(services);
  }
  return props.data.display ?? true;
});

const buttonHandler = (item: MenuButton | MenuComponent, event: MouseEvent) => {
  if (disabled.value) return;
  if (typeof (item as MenuButton).handler === 'function' && services) {
    (item as MenuButton).handler?.(services, event);
  }
};

const dropdownHandler = (command: any) => {
  if (command.item.handler) {
    command.item.handler(services);
  }
};

const clickHandler = (item: MenuButton | MenuComponent, event: MouseEvent) => {
  if (props.eventType !== 'click') return;
  if (item.type === 'button') {
    buttonHandler(item, event);
  }
};

const mousedownHandler = (item: MenuButton | MenuComponent, event: MouseEvent) => {
  if (props.eventType !== 'mousedown') return;
  if (item.type === 'button') {
    buttonHandler(item, event);
  }
};

const mouseupHandler = (item: MenuButton | MenuComponent, event: MouseEvent) => {
  if (props.eventType !== 'mouseup') return;
  if (item.type === 'button') {
    buttonHandler(item, event);
  }
};
</script>
