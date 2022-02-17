<template>
  <m-table :columns="columns" :data="data" :show-header="true"></m-table>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const columns = ref([
  {
    type: 'expand',
    prop: 'b',
    table: [
      {
        prop: 'a',
        label: '1',
      },
    ],
  },
  {
    prop: 'a',
    label: '1231',
  },
]);

const data = ref([
  {
    a: 'a1',
    b: [
      {
        a: 1,
      },
    ],
  },
]);
</script>
