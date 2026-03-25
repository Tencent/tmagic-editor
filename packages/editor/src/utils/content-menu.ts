import { computed, markRaw, type ShallowRef } from 'vue';
import { CopyDocument, Delete, DocumentCopy } from '@element-plus/icons-vue';

import { Id, MContainer, NodeType } from '@tmagic/core';
import { calcValueByFontsize, isPage, isPageFragment } from '@tmagic/utils';

import ContentMenu from '@editor/components/ContentMenu.vue';
import type { MenuButton, Services } from '@editor/type';

import { COPY_STORAGE_KEY } from './editor';

export const useDeleteMenu = (): MenuButton => ({
  type: 'button',
  text: '删除',
  icon: Delete,
  display: ({ editorService }) => {
    const node = editorService.get('node');
    return node?.type !== NodeType.ROOT && !isPage(node) && !isPageFragment(node);
  },
  handler: ({ editorService }) => {
    const nodes = editorService.get('nodes');
    nodes && editorService.remove(nodes);
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

export const usePasteMenu = (menu?: ShallowRef<InstanceType<typeof ContentMenu> | null>): MenuButton => ({
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
      editorService.paste({ left: initialLeft, top: initialTop });
    } else {
      editorService.paste();
    }
  },
});

const moveTo = (id: Id, { editorService }: Services) => {
  const nodes = editorService.get('nodes') || [];
  const parent = editorService.getNodeById(id) as MContainer;

  if (!parent) return;

  editorService.add(nodes, parent);
  editorService.remove(nodes);
};

export const useMoveToMenu = ({ editorService }: Services): MenuButton => {
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
          moveTo(page.id, services);
        },
      })),
  };
};
