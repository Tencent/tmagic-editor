<template>
  <content-menu :menu-data="menuData" ref="menu"></content-menu>
</template>

<script lang="ts">
import { computed, defineComponent, inject, markRaw, onMounted, reactive, ref, watch } from 'vue';
import { Bottom, Delete, DocumentCopy, Top } from '@element-plus/icons-vue';

import { NodeType } from '@tmagic/schema';
import type StageCore from '@tmagic/stage';

import ContentMenu from '@editor/components/ContentMenu.vue';
import { LayerOffset, Layout, MenuItem, Services } from '@editor/type';
import { COPY_STORAGE_KEY } from '@editor/utils/editor';

export default defineComponent({
  components: { ContentMenu },

  setup() {
    const services = inject<Services>('services');
    const editorService = services?.editorService;
    const menu = ref<InstanceType<typeof ContentMenu>>();
    const canPaste = ref(false);
    const canCenter = ref(false);

    const node = computed(() => editorService?.get('node'));
    const parent = computed(() => editorService?.get('parent'));
    const isPage = computed(() => node.value?.type === NodeType.PAGE);

    const stageContentMenu = inject<MenuItem[]>('stageContentMenu', []);

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
          [Layout.ABSOLUTE, Layout.FIXED].includes(layout) &&
          ![NodeType.ROOT, NodeType.PAGE, 'pop'].includes(`${node.value?.type}`);
      },
      { immediate: true },
    );

    return {
      menu,
      menuData: reactive<MenuItem[]>([
        {
          type: 'button',
          text: '水平居中',
          display: () => canCenter.value,
          handler: () => {
            node.value && editorService?.alignCenter(node.value);
          },
        },
        {
          type: 'button',
          text: '复制',
          icon: markRaw(DocumentCopy),
          handler: () => {
            node.value && editorService?.copy(node.value);
            canPaste.value = true;
          },
        },
        {
          type: 'button',
          text: '粘贴',
          display: () => canPaste.value,
          handler: () => {
            const stage = editorService?.get<StageCore>('stage');

            const rect = menu.value?.$el.getBoundingClientRect();
            const parentRect = stage?.container?.getBoundingClientRect();
            let left = (rect?.left || 0) - (parentRect?.left || 0);
            let top = (rect?.top || 0) - (parentRect?.top || 0);

            if (node.value?.items && stage) {
              const parentEl = stage.renderer.contentWindow?.document.getElementById(`${node.value.id}`);
              const parentElRect = parentEl?.getBoundingClientRect();
              left = left - (parentElRect?.left || 0);
              top = top - (parentElRect?.top || 0);
            }

            editorService?.paste({ left, top });
          },
        },
        {
          type: 'divider',
          direction: 'horizontal',
          display: () => !isPage.value,
        },
        {
          type: 'button',
          text: '上移一层',
          icon: markRaw(Top),
          display: () => !isPage.value,
          handler: () => {
            editorService?.moveLayer(1);
          },
        },
        {
          type: 'button',
          text: '下移一层',
          icon: markRaw(Bottom),
          display: () => !isPage.value,
          handler: () => {
            editorService?.moveLayer(-1);
          },
        },
        {
          type: 'button',
          text: '置顶',
          display: () => !isPage.value,
          handler: () => {
            editorService?.moveLayer(LayerOffset.TOP);
          },
        },
        {
          type: 'button',
          text: '置底',
          display: () => !isPage.value,
          handler: () => {
            editorService?.moveLayer(LayerOffset.BOTTOM);
          },
        },
        {
          type: 'divider',
          direction: 'horizontal',
          display: () => !isPage.value,
        },
        {
          type: 'button',
          text: '删除',
          icon: Delete,
          display: () => !isPage.value,
          handler: () => {
            node.value && editorService?.remove(node.value);
          },
        },
        {
          type: 'divider',
          direction: 'horizontal',
        },
        {
          type: 'button',
          text: '清空参考线',
          handler: () => {
            editorService?.get<StageCore>('stage').clearGuides();
          },
        },
        ...stageContentMenu,
      ]),

      show(e: MouseEvent) {
        menu.value?.show(e);
      },
    };
  },
});
</script>
