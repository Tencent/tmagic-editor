<template>
  <ContentMenu
    ref="menu"
    class="magic-editor-node-list-menu"
    style="max-width: 280px"
    :menu-data="menuData"
    :active="node?.id"
    :auto-hide="!pinned"
    @mouseenter="mouseenterHandler()"
  >
    <template #title>
      <NodeListMenuTitle v-model:pinned="pinned" @change="dragMenuHandler" @close="closeHandler"></NodeListMenuTitle>
    </template>
  </ContentMenu>
</template>

<script lang="ts" setup>
import { Component, computed, inject, ref, watch } from 'vue';
import type { OnDrag } from 'gesto';

import type { MNode } from '@tmagic/schema';
import { StageDragStatus } from '@tmagic/stage';
import { getNodes } from '@tmagic/utils';

import ContentMenu from '@editor/components/ContentMenu.vue';
import type { ComponentItem, MenuButton, Services } from '@editor/type';

import NodeListMenuTitle from './NodeListMenuTitle.vue';

const PINNED_STATUE_CACHE_KEY = 'tmagic-pinned-node-list-pinned-status';

const props = defineProps<{ isMultiSelect?: boolean }>();

const menu = ref<InstanceType<typeof ContentMenu>>();
const nodeList = ref<MNode[]>([]);
const pinned = ref(Boolean(globalThis.localStorage.getItem(PINNED_STATUE_CACHE_KEY)));
const firstShow = ref(true);

const services = inject<Services>('services');
const editorService = services?.editorService;
const componentListService = services?.componentListService;

const stage = computed(() => editorService?.get('stage'));
const page = computed(() => editorService?.get('page'));
const node = computed(() => editorService?.get('node'));

let timeout: NodeJS.Timeout | null = null;

const cancel = () => {
  if (timeout) {
    globalThis.clearTimeout(timeout);
  }

  if (pinned.value) {
    return;
  }

  nodeList.value = [];
  menu.value?.hide();
};

const clearTimeoutLazy = () => {
  globalThis.setTimeout(() => {
    if (timeout) {
      globalThis.clearTimeout(timeout);
    }
  }, 300);
};

const unWatch = watch(
  stage,
  (stage) => {
    if (!stage) return;

    stage.on('drag-start', () => {
      cancel();
    });

    stage.on('mousemove', (event: MouseEvent) => {
      cancel();

      if (props.isMultiSelect || stage.getDragStatus() !== StageDragStatus.END) {
        return;
      }

      timeout = globalThis.setTimeout(() => {
        const els = stage.renderer.getElementsFromPoint(event) || [];

        const nodes = getNodes(
          els.map((el) => el.id),
          page.value?.items,
        );

        if (pinned.value && nodes.length === 0) {
          return;
        }

        nodeList.value = nodes;

        if (nodeList.value.length > 1) {
          menu.value?.show(pinned.value && !firstShow.value ? undefined : event);
          firstShow.value = false;
        }
      }, 1500);
    });

    stage.on('mouseleave', () => {
      // mouseleave后，大概率还有最后一个mousemove事件，这里延迟清除
      clearTimeoutLazy();
    });

    unWatch();
  },
  {
    immediate: true,
  },
);

const componentMap = computed(() => {
  const map: Record<string, ComponentItem> = {};
  componentListService?.getList().forEach((group) => {
    group.items.forEach((item) => {
      map[item.type] = item;
    });
  });
  return map;
});

const menuData = computed<MenuButton[]>(() =>
  nodeList.value.map((node: MNode) => {
    let text = node.name;
    let icon: string | Component<{}, {}, any> | undefined;
    if (node.type) {
      const item = componentMap.value[node.type];
      text += ` (${item?.text})`;
      icon = item?.icon;
    }

    return {
      type: 'button',
      text,
      id: node.id,
      icon,
      handler: async () => {
        await editorService?.select(node);
        stage.value?.select(node.id);
      },
    };
  }),
);

const mouseenterHandler = () => {
  // menu的mouseenter后，大概率还有最后一个mousemove事件，这里延迟清除
  clearTimeoutLazy();
};

const dragMenuHandler = ({ deltaY, deltaX }: OnDrag) => {
  if (!menu.value) return;

  const { menuPosition } = menu.value;

  menu.value?.setPosition({
    clientY: menuPosition.top + deltaY,
    clientX: menuPosition.left + deltaX,
  });
};

const closeHandler = () => {
  menu.value?.hide();
};

watch(pinned, () => {
  globalThis.localStorage.setItem(PINNED_STATUE_CACHE_KEY, pinned.value.toString());
});
</script>
