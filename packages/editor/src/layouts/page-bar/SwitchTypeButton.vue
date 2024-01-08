<template>
  <TMagicButton
    v-for="item in data"
    class="m-editor-page-bar-switch-type-button"
    size="small"
    :key="item.type"
    link
    :class="{ active: modelValue === item.type }"
    :type="modelValue === item.type ? 'primary' : ''"
    @click="clickHandler(item.type)"
    >{{ item.text }}</TMagicButton
  >
</template>

<script setup lang="ts">
import { TMagicButton } from '@tmagic/design';
import { NodeType } from '@tmagic/schema';

defineOptions({
  name: 'MEditorPageBarSwitchTypeButton',
});

defineProps<{
  modelValue: NodeType.PAGE | NodeType.PAGE_FRAGMENT;
}>();

const data: { type: NodeType.PAGE | NodeType.PAGE_FRAGMENT; text: string }[] = [
  {
    type: NodeType.PAGE,
    text: '页面',
  },
  {
    type: NodeType.PAGE_FRAGMENT,
    text: '页面片',
  },
];

const emit = defineEmits<{
  'update:modelValue': [value: NodeType.PAGE | NodeType.PAGE_FRAGMENT];
}>();

const clickHandler = (value: NodeType.PAGE | NodeType.PAGE_FRAGMENT) => {
  emit('update:modelValue', value);
};
</script>
