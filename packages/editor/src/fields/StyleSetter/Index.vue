<template>
  <div class="m-fields-style-setter">
    <TMagicCollapse :model-value="collapseValue">
      <template v-for="(item, index) in list" :key="index">
        <TMagicCollapseItem :name="`${index}`">
          <template #title><MIcon :icon="Grid"></MIcon>{{ item.title }}</template>
          <component v-if="item.component" :is="item.component" :values="model[name]" @change="change"></component>
        </TMagicCollapseItem>
      </template>
    </TMagicCollapse>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';
import { Grid } from '@element-plus/icons-vue';

import { TMagicCollapse, TMagicCollapseItem } from '@tmagic/design';
import type { ContainerChangeEventData, FieldProps } from '@tmagic/form';
import type { StyleSchema } from '@tmagic/schema';

import MIcon from '@editor/components/Icon.vue';

import { Background, Border, Font, Layout, Position } from './pro/';

defineOptions({
  name: 'MFieldsStyleSetter',
});

const props = defineProps<FieldProps<StyleSchema>>();

const emit = defineEmits<{
  change: [v: any, eventData: ContainerChangeEventData];
}>();

const list = [
  {
    name: 'font',
    title: '布局',
    component: Layout,
  },
  {
    title: '位置',
    component: Position,
  },
  {
    title: '背景',
    component: Background,
  },
  {
    title: '文字',
    component: Font,
  },
  {
    title: '边框与圆角',
    component: Border,
  },
];

const collapseValue = shallowRef(
  Array(list.length)
    .fill(1)
    .map((x, i) => `${i}`),
);

const change = (v: any, eventData: ContainerChangeEventData) => {
  eventData.changeRecords?.forEach((record) => {
    record.propPath = `${props.name}.${record.propPath}`;
  });
  emit('change', v, eventData);
};
</script>
