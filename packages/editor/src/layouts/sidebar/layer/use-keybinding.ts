import { type Ref, ref, watchEffect } from 'vue';

import Tree from '@editor/components/Tree.vue';
import type { Services } from '@editor/type';
import { KeyBindingContainerKey } from '@editor/utils/keybinding-config';

export const useKeybinding = (
  services: Services | undefined,
  contianer: Ref<InstanceType<typeof Tree> | undefined>,
) => {
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

  watchEffect(() => {
    if (contianer.value) {
      globalThis.addEventListener('blur', windowBlurHandler);
      keybindingService?.registeEl(KeyBindingContainerKey.LAYER_PANEL, contianer.value.$el);
    } else {
      globalThis.removeEventListener('blur', windowBlurHandler);
      keybindingService?.unregisteEl(KeyBindingContainerKey.LAYER_PANEL);
    }
  });

  return {
    isCtrlKeyDown,
  };
};
