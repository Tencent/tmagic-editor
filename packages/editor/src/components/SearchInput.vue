<template>
  <TMagicInput
    v-model="filterText"
    class="search-input"
    size="small"
    placeholder="输入关键字进行过滤"
    clearable
    @input="filterTextChangeHandler"
  >
    <template #prefix>
      <TMagicIcon><Search /></TMagicIcon>
    </template>
  </TMagicInput>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search } from '@element-plus/icons-vue';

import { TMagicIcon, TMagicInput } from '@tmagic/design';

defineOptions({
  name: 'MEditorSearchInput',
});

const emit = defineEmits(['search']);

const filterText = ref('');

let timer: NodeJS.Timeout | null = null;
const filterTextChangeHandler = () => {
  timer && clearTimeout(timer);
  timer = setTimeout(() => {
    emit('search', filterText.value);
  }, 300);
};
</script>
