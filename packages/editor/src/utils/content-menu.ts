import { computed, markRaw, type ShallowRef } from 'vue';
import { CopyDocument, Delete, DocumentCopy } from '@element-plus/icons-vue';

import { cloneDeep, Id, MContainer, NodeType } from '@tmagic/core';
import { calcValueByFontsize, isPage, isPageFragment } from '@tmagic/utils';

import ContentMenu from '@editor/components/ContentMenu.vue';
import type { HistoryOpSource, MenuButton, Services } from '@editor/type';

import { COPY_STORAGE_KEY } from './editor';

/**
 * 共享的右键菜单项构造器（画布 ViewerMenu 与图层树 LayerMenu 共用）。
 * `historySource` 用于标记本次操作的途径，调用方按所在面板传入：
 * 画布传 `'stage-contextmenu'`，树形面板传 `'tree-contextmenu'`。
 */
export const useDeleteMenu = (historySource?: HistoryOpSource): MenuButton => ({
  type: 'button',
  text: '删除',
  icon: Delete,
  display: ({ editorService }) => {
    const node = editorService.get('node');
    return node?.type !== NodeType.ROOT && !isPage(node) && !isPageFragment(node);
  },
  handler: ({ editorService }) => {
    const nodes = editorService.get('nodes');
    nodes && editorService.remove(nodes, { historySource });
  },
});

export const useCopyMenu = (): MenuButton => ({
  type: 'button',
  text: '复制',
  icon: markRaw(CopyDocument),
  handler: ({ editorService }) => {
    const nodes = editorService?.get('nodes');
    nodes && editorService?.copy(nodes);
  },
});

export const usePasteMenu = (
  historySource?: HistoryOpSource,
  menu?: ShallowRef<InstanceType<typeof ContentMenu> | null>,
): MenuButton => ({
  type: 'button',
  text: '粘贴',
  icon: markRaw(DocumentCopy),
  display: ({ storageService }) => !!storageService.getItem(COPY_STORAGE_KEY),
  handler: ({ editorService, uiService }) => {
    const nodes = editorService?.get('nodes');
    if (!nodes || nodes.length === 0) return;

    if (menu?.value?.$el) {
      const stage = editorService.get('stage');
      const rect = menu.value.$el.getBoundingClientRect();
      const parentRect = stage?.container?.getBoundingClientRect();
      const initialLeft =
        calcValueByFontsize(stage?.renderer?.getDocument(), (rect.left || 0) - (parentRect?.left || 0)) /
        uiService.get('zoom');
      const initialTop =
        calcValueByFontsize(stage?.renderer?.getDocument(), (rect.top || 0) - (parentRect?.top || 0)) /
        uiService.get('zoom');
      editorService.paste({ left: initialLeft, top: initialTop }, undefined, { historySource });
    } else {
      editorService.paste(undefined, undefined, { historySource });
    }
  },
});

const moveTo = async (id: Id, { editorService }: Services, historySource?: HistoryOpSource) => {
  const nodes = editorService.get('nodes') || [];
  const parent = editorService.getNodeById(id) as MContainer;

  if (!parent || nodes.length === 0) return;

  // 直接调用 moveToContainer：内部对多选场景已做合并，整批只产生一条历史记录。
  // 不要再走 remove + add 两步，否则会被切成两条历史（且语义也不正确）。
  await editorService.moveToContainer(cloneDeep(nodes), parent.id, {
    doNotSwitchPage: true,
    historySource,
  });
};

export const useMoveToMenu = ({ editorService }: Services, historySource?: HistoryOpSource): MenuButton => {
  const root = computed(() => editorService.get('root'));

  return {
    type: 'button',
    text: '移动至',
    display: ({ editorService }) => {
      const node = editorService.get('node');
      const pageLength = editorService.get('pageLength');
      return !isPage(node) && pageLength > 1;
    },
    items: (root.value?.items || [])
      .filter((page) => page.id !== editorService.get('page')?.id)
      .map((page) => ({
        text: `${page.name}(${page.id})`,
        type: 'button',
        handler: (services: Services) => {
          moveTo(page.id, services, historySource);
        },
      })),
  };
};
