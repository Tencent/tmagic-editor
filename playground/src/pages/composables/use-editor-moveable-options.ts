import { onMounted, type ShallowRef } from 'vue';

import { NodeType } from '@tmagic/core';
import type { CustomizeMoveableOptionsFunction, MoveableOptions, TMagicEditor } from '@tmagic/editor';

export const useEditorMoveableOptions = (editor: ShallowRef<InstanceType<typeof TMagicEditor> | undefined>) => {
  let keepRatio = false;

  const moveableOptions: CustomizeMoveableOptionsFunction = (config) => {
    const options: MoveableOptions = {};

    if (!editor.value) return options;

    const page = editor.value.editorService.get('page');

    const ids = config.targetElIds || [];
    let isPage = page && ids.includes(`${page.id}`);

    if (!isPage) {
      const id = config.targetElId;
      if (id) {
        const node = editor.value.editorService.getNodeById(id);
        isPage = node?.type === NodeType.PAGE;
      }
    }

    options.draggable = !isPage;
    options.resizable = !isPage;
    options.rotatable = !isPage;
    options.keepRatio = keepRatio;

    // 双击后在弹层中编辑时，根组件不能拖拽
    if (config?.targetEl?.parentElement?.classList.contains('tmagic-editor-sub-stage-wrap')) {
      options.draggable = false;
      options.resizable = false;
      options.rotatable = false;
    }

    return options;
  };

  onMounted(() => {
    if (!editor.value) return;

    const registerEnableRotatable = () => {
      editor.value?.keybindingService.registerCommand('moveable-options-rotatable-endable', () => {
        keepRatio = true;
        editor.value?.editorService.get('stage')?.actionManager?.updateMoveableOptions();

        editor.value?.keybindingService.unregisterCommand('moveable-options-rotatable-endable');
      });
    };

    registerEnableRotatable();

    editor.value.keybindingService.registerCommand('moveable-options-rotatable-disable', () => {
      keepRatio = false;
      editor.value?.editorService.get('stage')?.actionManager?.updateMoveableOptions();

      registerEnableRotatable();
    });

    editor.value.keybindingService.register([
      {
        command: 'moveable-options-rotatable-endable',
        keybinding: 'shift',
        when: [['stage', 'keydown']],
      },
      {
        command: 'moveable-options-rotatable-disable',
        keybinding: 'shift',
        when: [['stage', 'keyup']],
      },
    ]);
  });

  return {
    moveableOptions,
  };
};
