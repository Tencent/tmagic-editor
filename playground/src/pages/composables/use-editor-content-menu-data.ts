import { computed, markRaw, type Ref } from 'vue';
import { CopyDocument, DocumentCopy } from '@element-plus/icons-vue';

import { cloneDeep } from '@tmagic/core';
import { calcValueByFontsize, ContentMenu, COPY_STORAGE_KEY, type MenuButton, type Services } from '@tmagic/editor';

export const useEditorContentMenuData = () => {
  const collectorOptions = {
    id: '',
    name: '蒙层',
    isTarget: (key: string | number, value: any) =>
      typeof key === 'string' && typeof value === 'string' && key.includes('events') && value.startsWith('overlay_'),
    isCollectByDefault: false,
  };

  const usePasteMenu = (menu?: Ref<InstanceType<typeof ContentMenu> | undefined>): MenuButton => ({
    type: 'button',
    text: '粘贴(带关联信息)',
    icon: markRaw(DocumentCopy),
    display: (services) => !!services?.storageService?.getItem(COPY_STORAGE_KEY),
    handler: (services) => {
      const nodes = services?.editorService?.get('nodes');
      if (!nodes || nodes.length === 0) return;

      if (menu?.value?.$el) {
        const stage = services?.editorService?.get('stage');
        const rect = menu.value.$el.getBoundingClientRect();
        const parentRect = stage?.container?.getBoundingClientRect();
        const initialLeft =
          calcValueByFontsize(stage?.renderer?.getDocument(), (rect.left || 0) - (parentRect?.left || 0)) /
          services.uiService.get('zoom');
        const initialTop =
          calcValueByFontsize(stage?.renderer?.getDocument(), (rect.top || 0) - (parentRect?.top || 0)) /
          services.uiService.get('zoom');
        services?.editorService?.paste({ left: initialLeft, top: initialTop }, collectorOptions);
      } else {
        services?.editorService?.paste({}, collectorOptions);
        services?.codeBlockService?.paste();
        services?.dataSourceService?.paste();
      }
    },
  });
  const contentMenuData = computed<MenuButton[]>(() => [
    {
      type: 'button',
      text: '复制(带关联信息)',
      icon: markRaw(CopyDocument),
      handler: (services: Services) => {
        const nodes = services?.editorService?.get('nodes');
        nodes && services?.editorService?.copyWithRelated(cloneDeep(nodes), collectorOptions);
        nodes && services?.codeBlockService?.copyWithRelated(cloneDeep(nodes));
        nodes && services?.dataSourceService?.copyWithRelated(cloneDeep(nodes));
      },
    },
    usePasteMenu(),
  ]);

  return {
    contentMenuData,
  };
};
