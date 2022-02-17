<template>
  <div class="magic-editor-content-menu" ref="menu">
    <div>
      <div class="magic-editor-content-menu-item" @click="() => center()" v-if="canCenter">水平居中</div>
      <div class="magic-editor-content-menu-item" @click="() => copy()">复制</div>
      <div class="magic-editor-content-menu-item" @click="paste" v-if="canPaste">粘贴</div>
      <template v-if="canMoveZPos">
        <div class="separation"></div>
        <div class="magic-editor-content-menu-item" @click="topItem">上移一层</div>
        <div class="magic-editor-content-menu-item" @click="bottomItem">下移一层</div>
        <div class="magic-editor-content-menu-item" @click="top">置顶</div>
        <div class="magic-editor-content-menu-item" @click="bottom">置底</div>
      </template>
      <template v-if="canDelete">
        <div class="separation"></div>
        <div class="magic-editor-content-menu-item" @click="() => remove()">删除</div>
      </template>
      <div class="separation"></div>
      <div class="magic-editor-content-menu-item" @click="clearGuides">清空参考线</div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onMounted, ref, watch } from 'vue';

import type StageCore from '@tmagic/stage';

import { LayerOffset, Layout, Services } from '@editor/type';
import { COPY_STORAGE_KEY } from '@editor/utils/editor';

export default defineComponent({
  name: 'magic-editor-ui-viewer-menu',

  setup() {
    const services = inject<Services>('services');
    const editorService = services?.editorService;
    const menu = ref<HTMLDivElement>();
    const canPaste = ref(false);
    const canCenter = ref(false);

    const node = computed(() => editorService?.get('node'));
    const parent = computed(() => editorService?.get('parent'));

    onMounted(() => {
      const data = globalThis.localStorage.getItem(COPY_STORAGE_KEY);
      canPaste.value = data !== 'undefined' && !!data;
    });

    watch(
      parent,
      async () => {
        if (!parent.value || !editorService) return (canCenter.value = false);
        const layout = await editorService.getLayout(parent.value);
        canCenter.value =
          [Layout.ABSOLUTE, Layout.FIXED].includes(layout) && !['app', 'page', 'pop'].includes(`${node.value?.type}`);
      },
      { immediate: true },
    );

    return {
      menu,
      canPaste,

      canDelete: computed(() => node.value?.type !== 'page'),
      canMoveZPos: computed(() => node.value?.type !== 'page'),
      canCenter,

      center() {
        node.value && editorService?.alignCenter(node.value);
      },

      copy() {
        node.value && editorService?.copy(node.value);
        canPaste.value = true;
      },

      paste() {
        const top = menu.value?.offsetTop || 0;
        const left = menu.value?.offsetLeft || 0;
        editorService?.paste({ left, top });
      },

      remove() {
        node.value && editorService?.remove(node.value);
      },

      top() {
        editorService?.moveLayer(LayerOffset.TOP);
      },

      bottom() {
        editorService?.moveLayer(LayerOffset.BOTTOM);
      },

      topItem() {
        editorService?.moveLayer(1);
      },

      bottomItem() {
        editorService?.moveLayer(-1);
      },

      clearGuides() {
        editorService?.get<StageCore>('stage').clearGuides();
      },
    };
  },
});
</script>
