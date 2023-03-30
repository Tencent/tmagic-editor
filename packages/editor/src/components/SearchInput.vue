<template>
  <TMagicInput
    v-model="filterText"
    class="search-input"
    size="small"
    placeholder="输入关键字进行过滤"
    clearable
    :prefix-icon="Search"
    @input="filterTextChangeHandler"
  ></TMagicInput>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search } from '@element-plus/icons-vue';

import { TMagicInput } from '@tmagic/design';

const emit = defineEmits(['search']);

const filterText = ref('');

const filterTextChangeHandler = () => {
  emit('search', filterText.value);
};
</script>
