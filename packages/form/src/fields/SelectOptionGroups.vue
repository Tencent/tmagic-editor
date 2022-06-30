<template>
  <el-option-group v-for="(group, index) in options" :key="index" :label="group.label" :disabled="group.disabled">
    <el-option
      v-for="(item, index) in group.options"
      :key="index"
      :label="item.label"
      :value="item.value"
      :disabled="item.disabled"
    >
    </el-option>
  </el-option-group>
</template>

<script lang="ts" setup>
import { SelectGroupOption } from '../schema';

defineProps<{
  options: SelectGroupOption[];
}>();
</script>
