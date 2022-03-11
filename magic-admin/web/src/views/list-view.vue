<!-- 活动列表视图 -->
<template>
  <div>
    <!-- 面包屑导航 -->
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="item in breadCrumbData" :key="item.index">
        {{ item.text }}
      </el-breadcrumb-item>
    </el-breadcrumb>
    <!-- 活动列表 -->
    <act-list></act-list>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import List from '@src/components/act-list.vue';

export default defineComponent({
  name: 'act-list-view',

  components: { 'act-list': List },

  setup() {
    return {
      breadCrumbData: ref([
        {
          text: '首页',
        },
        {
          text: `活动列表`,
        },
      ]),
    };
  },
});
</script>

<style>
.el-breadcrumb {
  margin-bottom: 20px;
}
</style>
