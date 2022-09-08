<template>
  <el-icon v-if="!icon" class="magic-editor-icon"><Edit></Edit></el-icon>
  <el-icon v-else-if="typeof icon === 'string' && icon.startsWith('http')" class="magic-editor-icon"
    ><img :src="icon"
  /></el-icon>
  <i v-else-if="typeof icon === 'string'" class="magic-editor-icon" :class="icon"></i>
  <el-icon v-else class="magic-editor-icon"><component :is="toRaw(icon)"></component></el-icon>
</template>

<script lang="ts" setup>
import { toRaw } from 'vue';
import { Edit } from '@element-plus/icons-vue';

defineProps<{
  icon?: any;
}>();
</script>
