import { type Ref, ref, watchEffect } from 'vue';

import Tree from '@editor/components/Tree.vue';
import type { Services } from '@editor/type';
import { KeyBindingContainerKey } from '@editor/utils/keybinding-config';

export const useKeybinding = (
  services: Services | undefined,
  container: Ref<InstanceType<typeof Tree> | undefined>,
) => {
  const keybindingService = services?.keybindingService;

  // 是否多选
  const isCtrlKeyDown = ref(false);

  const windowBlurHandler = () => {
    isCtrlKeyDown.value = false;
  };

  keybindingService?.registerCommand('layer-panel-global-keyup', () => {
    isCtrlKeyDown.value = false;
  });

  keybindingService?.registerCommand('layer-panel-global-keydown', () => {
    isCtrlKeyDown.value = true;
  });

  keybindingService?.register([
    {
      command: 'layer-panel-global-keydown',
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
    if (container.value) {
      globalThis.addEventListener('blur', windowBlurHandler);
      keybindingService?.registerEl(KeyBindingContainerKey.LAYER_PANEL, container.value.$el);
    } else {
      globalThis.removeEventListener('blur', windowBlurHandler);
      keybindingService?.unregisterEl(KeyBindingContainerKey.LAYER_PANEL);
    }
  });

  return {
    isCtrlKeyDown,
  };
};
