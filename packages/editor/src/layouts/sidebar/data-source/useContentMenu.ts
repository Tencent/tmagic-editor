import { inject, markRaw, useTemplateRef } from 'vue';
import { CopyDocument, Delete, Edit } from '@element-plus/icons-vue';
import { cloneDeep } from 'lodash-es';

import ContentMenu from '@editor/components/ContentMenu.vue';
import type { EventBus, MenuButton, MenuComponent, TreeNodeData } from '@editor/type';

export const useContentMenu = () => {
  const eventBus = inject<EventBus>('eventBus');
  const menuRef = useTemplateRef<InstanceType<typeof ContentMenu>>('menu');

  let selectId = '';

  const menuData: (MenuButton | MenuComponent)[] = [
    {
      type: 'button',
      text: '编辑',
      icon: Edit,
      display: ({ dataSourceService }) => dataSourceService.get('editable'),
      handler: () => {
        if (!selectId) {
          return;
        }

        eventBus?.emit('edit-data-source', selectId);
      },
    },
    {
      type: 'button',
      text: '复制并粘贴至当前',
      icon: markRaw(CopyDocument),
      handler: ({ dataSourceService }) => {
        if (!selectId) {
          return;
        }

        const ds = dataSourceService.getDataSourceById(selectId);
        if (!ds) {
          return;
        }

        dataSourceService.add(cloneDeep(ds));
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

        eventBus?.emit('remove-data-source', selectId);
      },
    },
  ];

  const nodeContentMenuHandler = (event: MouseEvent, data: TreeNodeData) => {
    event.preventDefault();

    if (data.type === 'ds') {
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
