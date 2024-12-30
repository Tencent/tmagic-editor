<template>
  <div class="border-box-container">
    <div class="border-icon-container">
      <div class="border-icon-container-row">
        <div
          class="border-icon border-icon-top"
          :class="{ active: direction === 'Top' }"
          @click="selectDirection('Top')"
        ></div>
      </div>
      <div class="border-icon-container-row">
        <div
          class="border-icon border-icon-left"
          :class="{ active: direction === 'Left' }"
          @click="selectDirection('Left')"
        ></div>
        <div class="border-icon" :class="{ active: direction === '' }" @click="selectDirection()"></div>
        <div
          class="border-icon border-icon-right"
          :class="{ active: direction === 'Right' }"
          @click="selectDirection('Right')"
        ></div>
      </div>
      <div class="border-icon-container-row">
        <div
          class="border-icon border-icon-bottom"
          :class="{ active: direction === 'Bottom' }"
          @click="selectDirection('Bottom')"
        ></div>
      </div>
    </div>
    <div class="border-value-container">
      <MContainer :config="config" :model="model" @change="change"></MContainer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import type { ContainerChangeEventData, FormValue } from '@tmagic/form';
import { MContainer } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

const direction = ref('');

const config = computed(() => ({
  items: [
    {
      name: `border${direction.value}Width`,
      text: '边框宽度',
      labelWidth: '68px',
      type: 'data-source-field-select',
      fieldConfig: {
        type: 'text',
      },
    },
    {
      name: `border${direction.value}Color`,
      text: '边框颜色',
      labelWidth: '68px',
      type: 'data-source-field-select',
      fieldConfig: {
        type: 'colorPicker',
      },
    },
    {
      name: `border${direction.value}Style`,
      text: '边框样式',

      labelWidth: '68px',
      type: 'data-source-field-select',
      fieldConfig: {
        type: 'select',
        options: ['solid', 'dashed', 'dotted'].map((item) => ({
          value: item,
          text: item,
        })),
      },
    },
  ],
}));

const selectDirection = (d?: string) => (direction.value = d || '');

const emit = defineEmits<{
  change: [v: StyleSchema, eventData: ContainerChangeEventData];
}>();

withDefaults(
  defineProps<{
    model: FormValue;
  }>(),
  {},
);

const change = (value: StyleSchema, eventData: ContainerChangeEventData) => {
  eventData.changeRecords?.forEach((record) => {
    emit('change', record.value, {
      modifyKey: record.propPath,
    });
  });
};
</script>
