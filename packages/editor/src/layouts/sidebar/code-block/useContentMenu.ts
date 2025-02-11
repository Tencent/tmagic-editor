import { inject, markRaw, useTemplateRef } from 'vue';
import { CopyDocument, Delete, Edit } from '@element-plus/icons-vue';
import { cloneDeep } from 'lodash-es';

import ContentMenu from '@editor/components/ContentMenu.vue';
import type { EventBus, MenuButton, MenuComponent, TreeNodeData } from '@editor/type';

export const useContentMenu = (deleteCode: (id: string) => void) => {
  const eventBus = inject<EventBus>('eventBus');
  const menuRef = useTemplateRef<InstanceType<typeof ContentMenu>>('menu');

  let selectId = '';

  const menuData: (MenuButton | MenuComponent)[] = [
    {
      type: 'button',
      text: '编辑',
      icon: Edit,
      display: ({ codeBlockService }) => codeBlockService.getEditStatus(),
      handler: () => {
        if (!selectId) {
          return;
        }

        eventBus?.emit('edit-code', selectId);
      },
    },
    {
      type: 'button',
      text: '复制并粘贴至当前',
      icon: markRaw(CopyDocument),
      handler: async ({ codeBlockService }) => {
        if (!selectId) {
          return;
        }

        const codeBlock = codeBlockService.getCodeContentById(selectId);
        if (!codeBlock) {
          return;
        }

        const newCodeId = await codeBlockService.getUniqueId();

        codeBlockService.setCodeDslById(newCodeId, cloneDeep(codeBlock));
      },
    },
    {
      type: 'button',
      text: '删除',
      icon: Delete,
      handler: () => {
        if (!selectId) {
          return;
        }

        deleteCode(selectId);
      },
    },
  ];

  const nodeContentMenuHandler = (event: MouseEvent, data: TreeNodeData) => {
    event.preventDefault();

    if (data.type === 'code') {
      menuRef.value?.show(event);
      if (data.id) {
        selectId = `${data.id}`;
      } else {
        selectId = '';
      }
    }
  };

  const contentMenuHideHandler = () => {
    selectId = '';
  };

  return {
    menuData,
    nodeContentMenuHandler,
    contentMenuHideHandler,
  };
};
