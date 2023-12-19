import { computed, markRaw, Ref } from 'vue';
import { CopyDocument, Delete, DocumentCopy } from '@element-plus/icons-vue';

import { Id, MContainer, NodeType } from '@tmagic/schema';
import { isPage, isPageFragment } from '@tmagic/utils';

import ContentMenu from '@editor/components/ContentMenu.vue';
import type { MenuButton, Services } from '@editor/type';

import { COPY_STORAGE_KEY } from './editor';

export const useDeleteMenu = (): MenuButton => ({
  type: 'button',
  text: '删除',
  icon: Delete,
  display: (services) => {
    const node = services?.editorService?.get('node');
    return node?.type !== NodeType.ROOT && !isPage(node) && !isPageFragment(node);
  },
  handler: (services) => {
    const nodes = services?.editorService?.get('nodes');
    nodes && services?.editorService?.remove(nodes);
  },
});

export const useCopyMenu = (): MenuButton => ({
  type: 'button',
  text: '复制',
  icon: markRaw(CopyDocument),
  handler: (services) => {
    const nodes = services?.editorService?.get('nodes');
    nodes && services?.editorService?.copy(nodes);
  },
});

export const usePasteMenu = (menu?: Ref<InstanceType<typeof ContentMenu> | undefined>): MenuButton => ({
  type: 'button',
  text: '粘贴',
  icon: markRaw(DocumentCopy),
  display: (services) => !!services?.storageService?.getItem(COPY_STORAGE_KEY),
  handler: (services) => {
    const nodes = services?.editorService?.get('nodes');
    if (!nodes || nodes.length === 0) return;

    if (menu?.value?.$el) {
      const stage = services?.editorService?.get('stage');
      const rect = menu.value.$el.getBoundingClientRect();
      const parentRect = stage?.container?.getBoundingClientRect();
      const initialLeft = (rect.left || 0) - (parentRect?.left || 0);
      const initialTop = (rect.top || 0) - (parentRect?.top || 0);
      services?.editorService?.paste({ left: initialLeft, top: initialTop });
    } else {
      services?.editorService?.paste();
    }
  },
});

const moveTo = (id: Id, services?: Services) => {
  if (!services?.editorService) return;

  const nodes = services.editorService.get('nodes') || [];
  const parent = services.editorService.getNodeById(id) as MContainer;

  if (!parent) return;

  services?.editorService.add(nodes, parent);
  services?.editorService.remove(nodes);
};

export const useMoveToMenu = (services?: Services): MenuButton => {
  const root = computed(() => services?.editorService?.get('root'));

  return {
    type: 'button',
    text: '移动至',
    display: (services) => {
      const node = services?.editorService?.get('node');
      const pageLength = services?.editorService?.get('pageLength') || 0;
      return !isPage(node) && pageLength > 1;
    },
    items: (root.value?.items || [])
      .filter((page) => page.id !== services?.editorService?.get('page')?.id)
      .map((page) => ({
        text: `${page.name}(${page.id})`,
        type: 'button',
        handler: (services?: Services) => {
          moveTo(page.id, services);
        },
      })),
  };
};
