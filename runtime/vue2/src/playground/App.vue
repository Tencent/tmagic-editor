<template>
  <magic-ui-page v-if="pageConfig" :config="pageConfig"></magic-ui-page>
</template>

<script lang="ts">
/* eslint-disable no-param-reassign */
import Vue from 'vue';
import { reactive } from '@vue/composition-api';

import Core from '@tmagic/core';
import { MApp, MNode, MPage } from '@tmagic/schema';
import { RemoveData, SortEventData, UpdateData } from '@tmagic/stage';
import { getNodePath } from '@tmagic/utils';

// @ts-ignore
export default Vue.extend({
  data(): {
    app: Core | null;
    config?: MApp;
    curPageId: string;
    selectedId: string;
  } {
    return {
      app: null,
      config: undefined,
      curPageId: '',
      selectedId: '',
    };
  },

  computed: {
    pageConfig(): MPage | undefined {
      return this.config?.items?.find((item: MNode) => item.id === this.curPageId) || this.config?.items?.[0];
    },
  },

  provide() {
    this.app = new Core({
      config: this.config,
      platform: 'editor',
    });
    return {
      app: this.app,
    };
  },

  mounted() {
    // @ts-ignore
    globalThis.magic?.onRuntimeReady(this);
  },

  watch: {
    async pageConfig() {
      await this.$nextTick();
      // @ts-ignore
      globalThis.magic.onPageElUpdate(document.querySelector('.magic-ui-page'));
    },
  },

  methods: {
    updateRootConfig(config: MApp) {
      console.log('update config', config);
      this.config = config;
      this.app?.setConfig(config, this.curPageId);
    },

    updatePageId(id: string) {
      console.log('update page id', id);
      this.curPageId = id;
      this.app?.setPage(id);
    },

    getSnapElementQuerySelector() {
      return '[class*=magic-ui][id]';
    },

    select(id: string) {
      console.log('select config', id);
      this.selectedId = id;
      const el = document.getElementById(id);
      if (el) return el;
      // 未在当前文档下找到目标元素，可能是还未渲染，等待渲染完成后再尝试获取
      return this.$nextTick().then(() => document.getElementById(id));
    },

    add({ config }: UpdateData) {
      console.log('add config', config);
      if (!this.config) throw new Error('error');
      const path = getNodePath(this.selectedId, [this.config]);
      const node = path.pop();
      const parent = node?.items ? node : path.pop();
      if (!parent) throw new Error('未找到父节点');
      parent.items?.push(config);
    },

    update({ config }: UpdateData) {
      console.log('update config', config);
      if (!this.config) throw new Error('error');
      const path = getNodePath(config.id, [this.config]);
      const node = path.pop();
      const parent = path.pop();
      if (!node) throw new Error('未找到目标节点');
      if (!parent) throw new Error('未找到父节点');
      const index = parent.items?.findIndex((child: MNode) => child.id === node.id);
      parent.items.splice(index, 1, reactive(config));
    },

    sortNode({ src, dist }: SortEventData) {
      if (!this.config) throw new Error('error');
      const path = getNodePath(this.selectedId, [this.config]);
      path.pop();
      const parent = path.pop();
      if (!parent) return;
      // 在 id1 的兄弟组件中若无 id2 则直接 return
      const index2 = parent.items.findIndex((node: MNode) => node.id === dist);
      if (index2 < 0) return;
      const index1 = parent.items.findIndex((node: MNode) => node.id === src);
      parent.items.splice(index2, 0, ...parent.items.splice(index1, 1));
    },

    remove({ id }: RemoveData) {
      if (!this.config) throw new Error('error');
      const path = getNodePath(id, [this.config]);
      const node = path.pop();
      if (!node) throw new Error('未找到目标元素');
      const parent = path.pop();
      if (!parent) throw new Error('未找到父元素');
      const index = parent.items?.findIndex((child: MNode) => child.id === node.id);
      parent.items.splice(index, 1);
    },
  },
});
</script>

<style lang="scss">
html,
body,
#app {
  width: 100%;
  height: 100%;
}

#app {
  position: relative;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 0;
  }
}

.magic-ui-container {
  background-color: rgba(136, 136, 136, 0.5);
}

.action-area {
  background-color: rgba(51, 153, 255, 0.5) !important;
}
</style>
