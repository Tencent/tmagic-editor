<template>
  <TMagicForm size="small" label-position="right" style="margin-left: 10px">
    <TMagicFormItem label="主题">
      <TMagicSelect v-model="theme" size="small" style="width: 150px" @change="themeChange">
        <TMagicOption value="default">默认</TMagicOption>
        <TMagicOption value="magic-admin">magic-admin</TMagicOption>
      </TMagicSelect>
    </TMagicFormItem>
  </TMagicForm>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { TMagicForm, TMagicFormItem, TMagicOption, TMagicSelect } from '@tmagic/design';

import { DEFAULT_THEME, loadTheme } from '../theme-loader';

const theme = ref(sessionStorage.getItem('tmagic-playground-theme') || DEFAULT_THEME);

const emit = defineEmits<{
  change: [theme: string];
}>();

const themeChange = async (value: string) => {
  await loadTheme(value);
  sessionStorage.setItem('tmagic-playground-theme', value);
  emit('change', value);
};
</script>

<style lang="scss">
.m-editor-nav-menu {
  .tmagic-design-form-item {
    margin-bottom: 0;
  }
}
</style>
