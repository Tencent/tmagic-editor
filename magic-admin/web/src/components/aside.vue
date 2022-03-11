<!-- 侧边栏 -->
<template>
  <div class="m-aside">
    <h1 class="logo" ref="logo">{{ aside.collapse ? '魔方' : '魔方系统' }}</h1>
    <el-scrollbar :style="`height: ${height}`">
      <el-aside
        class="app-aside"
        style="overflow-y: auto; height: 100%"
        :class="{ collapse: aside.collapse }"
        :width="aside.collapse ? '64px' : '200px'"
      >
        <el-menu
          v-if="aside.data.length"
          background-color="#f8fbff"
          text-color="#353140"
          active-text-color="#fff"
          unique-opened
          :router="true"
          :collapse="aside.collapse"
          :default-active="defaultActive"
        >
          <template v-for="menu in aside.data">
            <el-menu-item v-if="!menu.items" :index="menu.url" :key="menu.url">
              <i :class="menu.icon"></i>
              <template #title>
                <span>{{ menu.text }}</span>
              </template>
            </el-menu-item>
            <el-sub-menu :index="menu.url" v-else :key="menu.url">
              <template #title>
                <i :class="menu.icon"></i>
                <span>{{ menu.text }}</span>
              </template>
              <el-menu-item v-for="item in menu.items" :index="menu.url + item.url" :key="menu.url + item.url">
                {{ item.text }}
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-aside>
    </el-scrollbar>
  </div>
</template>

<script lang="ts">
import { ComponentInternalInstance, computed, defineComponent, getCurrentInstance, inject, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import type { AsideState } from '@src/typings';

export default defineComponent({
  name: 'm-aside',
  setup() {
    const height = ref('auto');
    const aside = inject('aside') as AsideState;

    onMounted(() => {
      // 高度自适应
      const { proxy } = getCurrentInstance() as ComponentInternalInstance;
      const logoHeight = (proxy?.$refs.logo as Element)?.clientHeight || 40;
      height.value = `${window.document.body.clientHeight - logoHeight}px`;
      window.addEventListener('resize', () => {
        height.value = `${window.document.body.clientHeight - logoHeight}px`;
      });
    });

    return {
      aside,
      height,
      // 当前路由对应菜单项高亮
      defaultActive: computed(() => {
        const route = useRoute();
        if (route.path.startsWith('/act/my')) {
          return '/act/my';
        }
        if (route.path.startsWith('/act/all')) {
          return '/act/all';
        }
        return route.path;
      }),
    };
  },
});
</script>

<style lang="scss">
.m-aside {
  background: #f8fbff url(https://puui.qpic.cn/vupload/0/1572869106200_gxvvrqpf1g.png/0) no-repeat bottom;
  background-size: contain;

  .logo {
    text-align: center;
    height: 40px;
    line-height: 40px;
    background: #2882e0;
    color: #fff;
    font-weight: 200;
    font-size: 22px;
  }

  .el-aside .el-menu {
    border: none;
  }

  .el-aside .el-menu-item.is-active,
  .el-aside .el-sub-menu .el-menu-item.is-active {
    background: #2882e0 !important;
  }
  .app-aside {
    transition: width ease 0.4s;
  }
  .app-aside.collapse {
    overflow: visible;
  }

  .app-aside .el-sub-menu .el-menu-item {
    background: #f8fbff !important;
  }
}
</style>
