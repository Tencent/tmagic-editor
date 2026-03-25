<template>
  <TMagicForm size="small" label-position="right" style="margin-left: 10px">
    <TMagicFormItem label="UI组件库">
      <TMagicSelect v-model="adapter" size="small" @change="adapterChange" style="width: 150px">
        <TMagicOption value="element-plus">element-plus</TMagicOption>
        <TMagicOption value="tdesign-vue-next">tdesign-vue-next</TMagicOption>
      </TMagicSelect>
    </TMagicFormItem>
  </TMagicForm>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { TMagicForm, TMagicFormItem, TMagicOption, TMagicSelect } from '@tmagic/design';

const adapter = ref(sessionStorage.getItem('tmagic-playground-ui-adapter') || 'element-plus');

const adapterChange = (adapter: string) => {
  sessionStorage.setItem('tmagic-playground-ui-adapter', adapter);
  globalThis.location.reload();
};
</script>

<style lang="scss">
.m-editor-nav-menu {
  .tmagic-design-form-item {
    margin-bottom: 0;
  }
}
</style>
