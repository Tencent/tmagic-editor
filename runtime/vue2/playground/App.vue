<template>
  <magic-ui-page v-if="pageConfig" :config="pageConfig"></magic-ui-page>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, provide, reactive, ref, watch } from 'vue';

import Core from '@tmagic/core';
import type { Id, MApp, MNode } from '@tmagic/schema';
import { Magic, RemoveData, UpdateData } from '@tmagic/stage';
import { getNodePath } from '@tmagic/utils';

declare global {
  interface Window {
    magic: Magic;
  }
}

export default defineComponent({
  setup() {
    const root = ref<MApp>();
    const curPageId = ref<Id>();
    const selectedId = ref<Id>();

    const pageConfig = computed(
      () => root.value?.items?.find((item: MNode) => item.id === curPageId.value) || root.value?.items?.[0],
    );

    const app = new Core({
      config: root.value,
      platform: 'editor',
    });

    provide('app', app);

    watch(pageConfig, async () => {
      await nextTick();
      const page = document.querySelector<HTMLElement>('.magic-ui-page');
      page && window.magic.onPageElUpdate(page);
    });

    window.magic?.onRuntimeReady({
      getApp() {
        return app;
      },

      updateRootConfig(config: MApp) {
        console.log('update config', config);
        root.value = config;
        app?.setConfig(config, curPageId.value);
      },

      updatePageId(id: Id) {
        console.log('update page id', id);
        curPageId.value = id;
        app?.setPage(id);
      },

      select(id: Id) {
        console.log('select config', id);
        selectedId.value = id;
        const el = document.getElementById(`${id}`);
        if (el) return el;
        // 未在当前文档下找到目标元素，可能是还未渲染，等待渲染完成后再尝试获取
        return nextTick().then(() => document.getElementById(`${id}`) as HTMLElement);
      },

      add({ config, parentId }: UpdateData) {
        console.log('add config', config);
        if (!root.value) throw new Error('error');
        if (!selectedId.value) throw new Error('error');
        const parent = getNodePath(parentId, [root.value]).pop();
        if (!parent) throw new Error('未找到父节点');
        parent.items?.push(config);
      },

      update({ config, parentId }: UpdateData) {
        console.log('update config', config);
        if (!root.value) throw new Error('error');
        const node = getNodePath(config.id, [root.value]).pop();
        const parent = getNodePath(parentId, [root.value]).pop();
        if (!node) throw new Error('未找到目标节点');
        if (!parent) throw new Error('未找到父节点');
        const index = parent.items?.findIndex((child: MNode) => child.id === node.id);
        parent.items.splice(index, 1, reactive(config));
      },

      remove({ id, parentId }: RemoveData) {
        if (!root.value) throw new Error('error');
        const node = getNodePath(id, [root.value]).pop();
        if (!node) throw new Error('未找到目标元素');
        const parent = getNodePath(parentId, [root.value]).pop();
        if (!parent) throw new Error('未找到父元素');
        const index = parent.items?.findIndex((child: MNode) => child.id === node.id);
        parent.items.splice(index, 1);
      },
    });

    return {
      pageConfig,
    };
  },
});
</script>

<style lang="scss">
::-webkit-scrollbar {
  width: 0;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
}

#app {
  position: relative;
  overflow: auto;
}

.magic-ui-container {
  background-color: rgba(136, 136, 136, 0.5);
}

.action-area {
  background-color: rgba(51, 153, 255, 0.5) !important;
}
</style>
