<template>
  <el-icon v-if="!icon"><edit></edit></el-icon>
  <el-icon v-else-if="typeof icon === 'string' && icon.startsWith('http')"><img :src="icon" /></el-icon>
  <i v-else-if="typeof icon === 'string'" :class="icon"></i>
  <el-icon v-else><component :is="toRaw(icon)"></component></el-icon>
</template>

<script lang="ts">
import { Component, defineComponent, PropType, toRaw } from 'vue';
import { Edit } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'm-icon',

  components: { Edit },

  props: {
    icon: {
      type: [String, Object] as PropType<string | Component>,
    },
  },

  setup() {
    return {
      toRaw,
    };
  },
});
</script>
