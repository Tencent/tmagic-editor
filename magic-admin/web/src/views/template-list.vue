<template>
  <div>
    <el-breadcrumb separator="/" style="margin-bottom: 20px">
      <el-breadcrumb-item v-for="item in breadcrumb" :to="{ path: item.url }" :key="item.url">
        {{ item.text }}
      </el-breadcrumb-item>
    </el-breadcrumb>

    <el-card class="box-card">
      <template #header>
        <div class="clearfix">
          <span>创建新活动</span>
        </div>
      </template>
      <act-create-card @add="newActHandler" />
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';

import ActCreateCard from '@src/components/act-created-card.vue';

export interface BreadCrumbItem {
  url: string;
  text: string;
}

export default defineComponent({
  name: 'template-list',

  components: { ActCreateCard },

  setup() {
    const router = useRouter();
    const breadcrumb: BreadCrumbItem[] = [
      {
        url: '/',
        text: '首页',
      },
      {
        url: '/template/list',
        text: '模板',
      },
    ];

    const newActHandler = () => {
      router.push({
        path: '/act/my',
        query: {
          create: 'true',
        },
      });
    };

    return {
      breadcrumb,
      newActHandler,
    };
  },
});
</script>
