<template>
  <el-icon v-if="!icon"><Edit></Edit></el-icon>
  <el-icon v-else-if="typeof icon === 'string' && icon.startsWith('http')"><img :src="icon" /></el-icon>
  <i v-else-if="typeof icon === 'string'" :class="icon"></i>
  <el-icon v-else><component :is="toRaw(icon)"></component></el-icon>
</template>

<script lang="ts" setup>
import { toRaw } from 'vue';
import { Edit } from '@element-plus/icons-vue';

defineProps<{
  icon?: any;
}>();
</script>
