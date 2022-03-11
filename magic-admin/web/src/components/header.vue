<!-- 导航栏 -->
<template>
  <el-row class="m-header">
    <el-col :span="12">
      <!-- 折叠侧边栏按钮 -->
      <div
        v-if="!$route.meta.hideAside && aside && aside.data.length"
        class="aside-trigger"
        @click="$emit('asideTrigger')"
        :class="{ active: aside.collapse }"
      >
        <i
          :class="{
            'el-icon-s-fold': !aside.collapse,
            'el-icon-s-unfold': aside.collapse,
          }"
        ></i>
      </div>
      <div class="nav-list">
        <a href="/">首页</a>
        <a href="https://tencent.github.io/tmagic-editor/docs/" target="_blank">帮助文档</a>
      </div>
    </el-col>
    <el-col class="user" :span="12">
      <i class="el-icon-user"></i>
      <span>
        <span>{{ userName }}</span>
      </span>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import Cookies from 'js-cookie';

import type { AsideState } from '@src/typings';

export default defineComponent({
  name: 'm-header',

  emits: ['asideTrigger'],

  setup() {
    return {
      aside: inject('aside') as AsideState,
      userName: Cookies.get('userName'),
    };
  },
});
</script>

<style lang="scss">
.m-header {
  background-color: #2882e0;

  .user {
    height: 40px;
    line-height: 40px;
    text-align: right;
    padding-right: 20px;
    color: white;
    font-size: 14px;
  }

  .nav-list {
    height: 40px;
    line-height: 40px;
    color: #fff;
    display: flex;
    & > * {
      margin-left: 10px;
      padding: 0 8px;
      &:hover,
      &:active {
        background: rgba(0, 0, 0, 0.2);
      }
    }
  }

  a {
    color: white;
    cursor: pointer;
  }
}

.aside-trigger {
  width: 40px;
  height: 40px;
  float: left;
  position: relative;
  z-index: 1;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
  color: #ece5e5;
  font-size: 28px;
}
</style>
