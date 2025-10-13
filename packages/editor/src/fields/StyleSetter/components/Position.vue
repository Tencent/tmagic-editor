<template>
  <div class="layout-box-container">
    <div v-for="(item, index) in list" :key="index" :class="item.class">
      <span class="next-input">
        <input
          v-model="model[item.name]"
          placeholder="0"
          :title="model[item.name]"
          :disabled="disabled"
          @change="change($event, item.name)"
        />
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ContainerChangeEventData, FormValue } from '@tmagic/form';

const list = [
  {
    name: 'top',
    class: 'outer-top-border',
  },
  {
    name: 'right',
    class: 'outer-right-border',
  },
  {
    name: 'bottom',
    class: 'outer-bottom-border',
  },
  {
    name: 'left',
    class: 'outer-left-border',
  },
];

const emit = defineEmits<{
  change: [v: string, eventData: ContainerChangeEventData];
}>();

withDefaults(
  defineProps<{
    model: FormValue;
    disabled?: boolean;
    size?: 'large' | 'default' | 'small';
  }>(),
  {},
);

const change = (event: Event, name: string) => {
  emit('change', (event.target as HTMLInputElement).value, {
    modifyKey: name,
  });
};
</script>
