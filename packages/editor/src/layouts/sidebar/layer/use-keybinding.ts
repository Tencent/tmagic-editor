import { onBeforeUnmount, onMounted, ref } from 'vue';

import type { Services } from '@editor/type';

export const useKeybinding = (services: Services | undefined) => {
  const keybindingService = services?.keybindingService;

  // 是否多选
  const isCtrlKeyDown = ref(false);

  const windowBlurHandler = () => {
    isCtrlKeyDown.value = false;
  };

  keybindingService?.registeCommand('layer-panel-global-keyup', () => {
    isCtrlKeyDown.value = false;
  });

  keybindingService?.registeCommand('layer-panel-global-keydwon', () => {
    isCtrlKeyDown.value = true;
  });

  keybindingService?.registe([
    {
      command: 'layer-panel-global-keydwon',
      keybinding: 'ctrl',
      when: [['global', 'keydown']],
    },
    {
      command: 'layer-panel-global-keyup',
      keybinding: 'ctrl',
      when: [['global', 'keyup']],
    },
  ]);

  onMounted(() => {
    globalThis.addEventListener('blur', windowBlurHandler);
  });

  onBeforeUnmount(() => {
    globalThis.removeEventListener('blur', windowBlurHandler);
  });

  return {
    isCtrlKeyDown,
  };
};
