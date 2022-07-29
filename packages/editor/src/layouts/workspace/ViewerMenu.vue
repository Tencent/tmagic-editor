<template>
  <content-menu :menu-data="menuData" ref="menu"></content-menu>
</template>

<script lang="ts">
import { computed, defineComponent, inject, markRaw, onMounted, reactive, ref, watch } from 'vue';
import { Bottom, Delete, DocumentCopy, Top } from '@element-plus/icons-vue';

import { Id, MNode, NodeType } from '@tmagic/schema';
import StageCore from '@tmagic/stage';

import ContentMenu from '@editor/components/ContentMenu.vue';
import { LayerOffset, Layout, MenuItem, Services } from '@editor/type';
import { COPY_STORAGE_KEY } from '@editor/utils/editor';

export default defineComponent({
  components: { ContentMenu },

  props: {
    isMultiSelect: {
      type: Boolean,
      default: false,
    },
  },

  setup(props) {
    const services = inject<Services>('services');
    const editorService = services?.editorService;
    const menu = ref<InstanceType<typeof ContentMenu>>();
    const canPaste = ref(false);
    const canCenter = ref(false);

    const node = computed(() => editorService?.get('node'));
    const selectedNodes = computed(() => editorService?.get('selectedNodes') || []);
    const parent = computed(() => editorService?.get('parent'));
    const isPage = computed(() => node.value?.type === NodeType.PAGE);
    const stage = editorService?.get<StageCore>('stage');

    const stageContentMenu = inject<MenuItem[]>('stageContentMenu', []);

    const getPositionInContainer = (position: { left?: number; top?: number } = {}, id: Id) => {
      let { left = 0, top = 0 } = position;
      const parentEl = stage?.renderer?.contentWindow?.document.getElementById(`${id}`);
      const parentElRect = parentEl?.getBoundingClientRect();
      left = left - (parentElRect?.left || 0);
      top = top - (parentElRect?.top || 0);
      return {
        left,
        top,
      };
    };

    const menuData = reactive<MenuItem[]>([
      {
        type: 'button',
        text: '水平居中',
        display: () => canCenter.value && !props.isMultiSelect,
        handler: () => {
          node.value && editorService?.alignCenter(node.value);
        },
      },
      {
        type: 'button',
        text: '复制',
        icon: markRaw(DocumentCopy),
        handler: () => {
          if (props.isMultiSelect) {
            // 多选
            editorService?.copy(selectedNodes.value);
            return;
          }
          node.value && editorService?.copy(node.value);
          canPaste.value = true;
        },
      },
      {
        type: 'button',
        text: '粘贴',
        display: () => canPaste.value,
        handler: () => {
          const rect = menu.value?.$el.getBoundingClientRect();
          const parentRect = stage?.container?.getBoundingClientRect();
          let initialLeft = (rect?.left || 0) - (parentRect?.left || 0);
          let initialTop = (rect?.top || 0) - (parentRect?.top || 0);
          const configStr = globalThis.localStorage.getItem(COPY_STORAGE_KEY);
          // eslint-disable-next-line prefer-const
          let config: any = {};
          if (!configStr) {
            return;
          }
          try {
            // eslint-disable-next-line no-eval
            eval(`config = ${configStr}`);
          } catch (e) {
            console.error(e);
            return;
          }
          // 粘贴时可能并未进入多选状态，因此不能用isMultiSelect来判断
          if (Array.isArray(config)) {
            // 粘贴多选
            if (selectedNodes.value.length === 0) return;
            selectedNodes.value.forEach((selectedNode: MNode) => {
              const pasteTargetConfig = config.find((item) => item.id === selectedNode.id);
              if (selectedNode?.items && stage) {
                const { left, top } = getPositionInContainer({ left: initialLeft, top: initialTop }, selectedNode.id);
                initialLeft = left;
                initialTop = top;
              }
              editorService?.paste({ left: initialLeft, top: initialTop }, pasteTargetConfig);
            });
          } else {
            if (node.value?.items && stage) {
              // 是否容器
              const { left, top } = getPositionInContainer({ left: initialLeft, top: initialTop }, node.value.id);
              initialLeft = left;
              initialTop = top;
            }
            editorService?.paste({ left: initialLeft, top: initialTop }, config);
          }
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
        display: () => !isPage.value && !props.isMultiSelect,
        handler: () => {
          editorService?.moveLayer(1);
        },
      },
      {
        type: 'button',
        text: '下移一层',
        icon: markRaw(Bottom),
        display: () => !isPage.value && !props.isMultiSelect,
        handler: () => {
          editorService?.moveLayer(-1);
        },
      },
      {
        type: 'button',
        text: '置顶',
        display: () => !isPage.value && !props.isMultiSelect,
        handler: () => {
          editorService?.moveLayer(LayerOffset.TOP);
        },
      },
      {
        type: 'button',
        text: '置底',
        display: () => !isPage.value && !props.isMultiSelect,
        handler: () => {
          editorService?.moveLayer(LayerOffset.BOTTOM);
        },
      },
      {
        type: 'divider',
        direction: 'horizontal',
        display: () => !isPage.value && !props.isMultiSelect,
      },
      {
        type: 'button',
        text: '删除',
        icon: Delete,
        display: () => !isPage.value,
        handler: () => {
          if (props.isMultiSelect) {
            // 多选
            selectedNodes.value.forEach((selectedNode: MNode) => {
              editorService?.remove(selectedNode);
            });
            return;
          }
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
    ]);

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
      menuData,
      show(e: MouseEvent) {
        menu.value?.show(e);
      },
    };
  },
});
</script>
