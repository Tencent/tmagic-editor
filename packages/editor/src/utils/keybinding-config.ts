import { KeyBindingCommand, KeyBindingItem } from '@editor/type';

export default [
  {
    command: KeyBindingCommand.DELETE_NODE,
    keybinding: ['delete', 'backspace'],
    when: [
      ['stage', 'keyup'],
      ['layer-panel', 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.COPY_NODE,
    keybinding: 'ctrl+c',
    when: [
      ['stage', 'keydown'],
      ['layer-panel', 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.PASTE_NODE,
    keybinding: 'ctrl+v',
    when: [
      ['stage', 'keydown'],
      ['layer-panel', 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.CUT_NODE,
    keybinding: 'ctrl+x',
    when: [
      ['stage', 'keydown'],
      ['layer-panel', 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.UNDO,
    keybinding: 'ctrl+z',
    when: [
      ['stage', 'keydown'],
      ['layer-panel', 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.REDO,
    keybinding: 'ctrl+shift+z',
    when: [
      ['stage', 'keydown'],
      ['layer-panel', 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.MOVE_UP_1,
    keybinding: 'up',
    when: [['stage', 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_DOWN_1,
    keybinding: 'down',
    when: [['stage', 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_LEFT_1,
    keybinding: 'left',
    when: [['stage', 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_RIGHT_1,
    keybinding: 'right',
    when: [['stage', 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_UP_10,
    keybinding: 'ctrl+up',
    when: [['stage', 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_DOWN_10,
    keybinding: 'ctrl+down',
    when: [['stage', 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_LEFT_10,
    keybinding: 'ctrl+left',
    when: [['stage', 'keydown']],
  },
  {
    command: KeyBindingCommand.MOVE_RIGHT_10,
    keybinding: 'ctrl+right',
    when: [['stage', 'keydown']],
  },
  {
    command: KeyBindingCommand.SWITCH_NODE,
    keybinding: 'tab',
    when: [
      ['stage', 'keydown'],
      ['layer-panel', 'keydown'],
    ],
  },
  {
    command: KeyBindingCommand.ZOOM_IN,
    keybinding: ['ctrl+=', 'ctrl+numpadplus'],
    when: [['stage', 'keydown']],
  },
  {
    command: KeyBindingCommand.ZOOM_OUT,
    keybinding: ['ctrl+-', 'ctrl+numpad-'],
    when: [['stage', 'keydown']],
  },
  {
    command: KeyBindingCommand.ZOOM_FIT,
    keybinding: 'ctrl+0',
    when: [['stage', 'keydown']],
  },
  {
    command: KeyBindingCommand.ZOOM_RESET,
    keybinding: 'ctrl+1',
    when: [['stage', 'keydown']],
  },
] as KeyBindingItem[];
