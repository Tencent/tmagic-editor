<template>
  <div class="layout-box-container">
    <div v-for="(item, index) in list" :key="index" :class="item.class">
      <span class="help-txt" v-if="item.text">{{ item.text }}</span>
      <span class="next-input">
        <input
          :model-value="model[item.name]"
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
    name: 'marginTop',
    class: 'outer-top-border',
  },
  {
    name: 'marginRight',
    class: 'outer-right-border',
  },
  {
    name: 'marginBottom',
    text: 'MARGIN',
    class: 'outer-bottom-border',
  },
  {
    name: 'marginLeft',
    class: 'outer-left-border',
  },
  {
    name: 'paddingTop',
    class: 'inner-top-border',
  },
  {
    name: 'paddingRight',
    class: 'inner-right-border',
  },
  {
    name: 'paddingBottom',
    text: 'PADDING',
    class: 'inner-bottom-border',
  },
  {
    name: 'paddingLeft',
    class: 'inner-left-border',
  },
];

const emit = defineEmits<{
  change: [v: string, eventData: ContainerChangeEventData];
}>();

withDefaults(
  defineProps<{
    disabled?: boolean;
    size?: 'large' | 'default' | 'small';
    model: FormValue;
  }>(),
  {},
);

const change = (event: Event, name: string) => {
  emit('change', (event.target as HTMLInputElement).value, {
    modifyKey: name,
  });
};
</script>
