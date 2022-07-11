<template>
  <el-container style="height: 100%; display: flex" class="app" v-if="!hideFrame" :class="{ 'hide-nav': hideNav }">
    <m-aside v-if="!$route.meta.hideAside"></m-aside>
    <el-container>
      <el-header style="height: 40px; padding: 0">
        <m-header @asideTrigger="asideTrigger" />
      </el-header>
      <el-main style="background: #ffffff; padding: 0" class="main-container">
        <router-view :style="$route.meta.hideAside ? '' : 'padding: 20px'"></router-view>
      </el-main>
    </el-container>
  </el-container>
  <router-view v-else class="app" :class="{ 'hide-nav': hideNav }"></router-view>
</template>

<script lang="ts">
import { computed, defineComponent, provide, reactive, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import Cookies from 'js-cookie';

import { AsideFormConfig } from '@src/config/aside-config';
import type { AsideState } from '@src/typings';

export default defineComponent({
  name: 'app',
  setup() {
    const aside = reactive<AsideState>(AsideFormConfig);
    // 是否隐藏边框
    const hideFrame = computed(() => {
      const urlHideFrame = new URL(location.href).searchParams.get('hideFrame');
      return urlHideFrame || useRoute().meta?.hideFrame;
    });

    // 折叠侧边栏
    const asideTrigger: () => void = () => {
      aside.collapse = !aside.collapse;
    };

    provide('aside', aside);

    watchEffect(() => {
      const userName = process.env.VUE_APP_USER_NAME || 'defaultName';
      Cookies.set('userName', userName);
    });

    return {
      hideFrame,
      hideNav: !!new URL(location.href).searchParams.get('hideNav'),
      asideTrigger,
    };
  },
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: auto;
  font-family: 'Microsoft YaHei', '微软雅黑';
}
.clearfix:before,
.clearfix:after {
  display: table;
  content: ' ';
}
.clearfix:after {
  clear: both;
}
.f-left {
  float: left;
}
.f-right {
  float: right;
}
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}

a {
  color: #409eff;
  text-decoration: none;
}

.app .el-scrollbar__wrap {
  overflow-x: hidden;
}

.el-scrollbar__thumb {
  background-color: rgba(144, 147, 153, 1);
}

.el-card .el-card__header {
  font-weight: bold;
}
.m-fields-table .m-fields-relate .el-form-item {
  margin-bottom: 0;
}

.el-message-box {
  max-height: 100%;
  overflow: auto;
}

.app .el-card__header {
  padding: 10px 20px;
}

.fixed-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.92);
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* 不显示面包屑导航 */
.app.hide-nav > .el-breadcrumb {
  display: none;
}
</style>
