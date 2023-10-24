import { KeyBindingCommand, KeyBindingItem } from '@editor/type';

export enum KeyBindingContainerKey {
  STAGE = 'stage',
  LAYER_PANEL = 'layer-panel',
}

export default [
  {
    command: KeyBindingCommand.DELETE_NODE,
    keybinding: ['delete', 'backspace'],
    when: [
      [KeyBindingContainerKey.STAGE, 'keyup'],
      [KeyBindingContainerKey.LAYER_PANEL, 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.COPY_NODE,
    keybinding: 'ctrl+c',
    when: [
      [KeyBindingContainerKey.STAGE, 'keydown'],
      [KeyBindingContainerKey.LAYER_PANEL, 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.PASTE_NODE,
    keybinding: 'ctrl+v',
    when: [
      [KeyBindingContainerKey.STAGE, 'keydown'],
      [KeyBindingContainerKey.LAYER_PANEL, 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.CUT_NODE,
    keybinding: 'ctrl+x',
    when: [
      [KeyBindingContainerKey.STAGE, 'keydown'],
      [KeyBindingContainerKey.LAYER_PANEL, 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.UNDO,
    keybinding: 'ctrl+z',
    when: [
      [KeyBindingContainerKey.STAGE, 'keydown'],
      [KeyBindingContainerKey.LAYER_PANEL, 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.REDO,
    keybinding: 'ctrl+shift+z',
    when: [
      [KeyBindingContainerKey.STAGE, 'keydown'],
      [KeyBindingContainerKey.LAYER_PANEL, 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.MOVE_UP_1,
    keybinding: 'up',
    when: [[KeyBindingContainerKey.STAGE, 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_DOWN_1,
    keybinding: 'down',
    when: [[KeyBindingContainerKey.STAGE, 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_LEFT_1,
    keybinding: 'left',
    when: [[KeyBindingContainerKey.STAGE, 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_RIGHT_1,
    keybinding: 'right',
    when: [[KeyBindingContainerKey.STAGE, 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_UP_10,
    keybinding: 'ctrl+up',
    when: [[KeyBindingContainerKey.STAGE, 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_DOWN_10,
    keybinding: 'ctrl+down',
    when: [[KeyBindingContainerKey.STAGE, 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_LEFT_10,
    keybinding: 'ctrl+left',
    when: [[KeyBindingContainerKey.STAGE, 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_RIGHT_10,
    keybinding: 'ctrl+right',
    when: [[KeyBindingContainerKey.STAGE, 'keydown']],
  },
  {
    command: KeyBindingCommand.SWITCH_NODE,
    keybinding: 'tab',
    when: [
      [KeyBindingContainerKey.STAGE, 'keydown'],
      [KeyBindingContainerKey.LAYER_PANEL, 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.ZOOM_IN,
    keybinding: ['ctrl+=', 'ctrl+numpadplus'],
    when: [[KeyBindingContainerKey.STAGE, 'keydown']],
  },
  {
    command: KeyBindingCommand.ZOOM_OUT,
    keybinding: ['ctrl+-', 'ctrl+numpad-'],
    when: [[KeyBindingContainerKey.STAGE, 'keydown']],
  },
  {
    command: KeyBindingCommand.ZOOM_FIT,
    keybinding: 'ctrl+0',
    when: [[KeyBindingContainerKey.STAGE, 'keydown']],
  },
  {
    command: KeyBindingCommand.ZOOM_RESET,
    keybinding: 'ctrl+1',
    when: [[KeyBindingContainerKey.STAGE, 'keydown']],
  },
] as KeyBindingItem[];
