import KeyController, { KeyControllerEvent } from 'keycon';

import { isPage, isPageFragment } from '@tmagic/utils';

import { KeyBindingCacheItem, KeyBindingCommand, KeyBindingItem } from '@editor/type';

import BaseService from './BaseService';
import editorService from './editor';
import uiService from './ui';

class Keybinding extends BaseService {
  public ctrlKey = /mac os x/.test(navigator.userAgent.toLowerCase()) ? 'meta' : 'ctrl';

  private controllers = new Map<string, KeyController>();

  private bindingList: KeyBindingCacheItem[] = [];

  private commands: Record<KeyBindingCommand | string, (e: KeyboardEvent) => void | Promise<void>> = {
    [KeyBindingCommand.DELETE_NODE]: () => {
      const nodes = editorService.get('nodes');

      if (!nodes || isPage(nodes[0]) || isPageFragment(nodes[0])) return;
      editorService.remove(nodes);
    },
    [KeyBindingCommand.COPY_NODE]: () => {
      const nodes = editorService.get('nodes');
      nodes && editorService.copy(nodes);
    },
    [KeyBindingCommand.CUT_NODE]: () => {
      const nodes = editorService.get('nodes');

      if (!nodes || isPage(nodes[0]) || isPageFragment(nodes[0])) return;
      editorService.copy(nodes);
      editorService.remove(nodes);
    },
    [KeyBindingCommand.PASTE_NODE]: () => {
      const nodes = editorService.get('nodes');
      nodes && editorService.paste({ offsetX: 10, offsetY: 10 });
    },
    [KeyBindingCommand.UNDO]: () => {
      editorService.undo();
    },
    [KeyBindingCommand.REDO]: () => {
      editorService.redo();
    },
    [KeyBindingCommand.ZOOM_IN]: () => {
      uiService.zoom(0.1);
    },
    [KeyBindingCommand.ZOOM_OUT]: () => {
      uiService.zoom(-0.1);
    },
    [KeyBindingCommand.ZOOM_RESET]: () => {
      uiService.set('zoom', 1);
    },
    [KeyBindingCommand.ZOOM_FIT]: async () => {
      uiService.set('zoom', await uiService.calcZoom());
    },
    [KeyBindingCommand.MOVE_UP_1]: () => {
      editorService.move(0, -1);
    },
    [KeyBindingCommand.MOVE_DOWN_1]: () => {
      editorService.move(0, 1);
    },
    [KeyBindingCommand.MOVE_LEFT_1]: () => {
      editorService.move(-1, 0);
    },
    [KeyBindingCommand.MOVE_RIGHT_1]: () => {
      editorService.move(1, 0);
    },
    [KeyBindingCommand.MOVE_UP_10]: () => {
      editorService.move(0, -10);
    },
    [KeyBindingCommand.MOVE_DOWN_10]: () => {
      editorService.move(0, 10);
    },
    [KeyBindingCommand.MOVE_LEFT_10]: () => {
      editorService.move(-10, 0);
    },
    [KeyBindingCommand.MOVE_RIGHT_10]: () => {
      editorService.move(10, 0);
    },
    [KeyBindingCommand.SWITCH_NODE]: () => {
      editorService.selectNextNode();
    },
  };

  public registerCommand(command: string, handler: (e: KeyboardEvent) => void | Promise<void>) {
    this.commands[command] = handler;
  }

  /**
   * @deprecated
   */
  public registeCommand(command: string, handler: (e: KeyboardEvent) => void | Promise<void>) {
    this.registerCommand(command, handler);
  }

  public unregisterCommand(command: string) {
    delete this.commands[command];
  }

  /**
   * @deprecated
   */
  public unregisteCommand(command: string) {
    this.unregisterCommand(command);
  }

  public registerEl(name: string, el?: HTMLElement) {
    if (name !== 'global' && !el) {
      throw new Error('只有name为global可以不传el');
    }

    const keycon = new KeyController(el);
    this.controllers.set(name, keycon);
    this.bind(name);
  }

  /**
   * @deprecated
   */
  public registeEl(name: string, el?: HTMLElement) {
    this.registerEl(name, el);
  }

  public unregisterEl(name: string) {
    this.controllers.get(name)?.destroy();
    this.controllers.delete(name);
    this.bindingList.forEach((item) => {
      item.bound = false;
    });
  }

  /**
   * @deprecated
   */
  public unregisteEl(name: string) {
    this.unregisterEl(name);
  }

  public register(maps: KeyBindingItem[]) {
    for (const keybindingItem of maps) {
      const { command, keybinding, when } = keybindingItem;

      for (const [type = '', eventType = 'keydown'] of when) {
        const cacheItem: KeyBindingCacheItem = { type, command, keybinding, eventType, bound: false };

        this.bindingList.push(cacheItem);
      }
    }

    this.bind();
  }

  /**
   * @deprecated
   */
  public registe(map: KeyBindingItem[]) {
    this.register(map);
  }

  public reset() {
    this.controllers.forEach((keycon) => {
      keycon.destroy();
    });
    this.controllers.clear();
    this.bindingList = [];
  }

  public destroy() {
    this.reset();
  }

  private bind(name?: string) {
    for (const item of this.bindingList) {
      const { type, eventType, command, keybinding, bound } = item;

      if (name && name !== type) {
        continue;
      }

      if (bound) {
        continue;
      }

      const keycon = this.controllers.get(type);
      if (!keycon) {
        continue;
      }

      const handler = (e: KeyControllerEvent) => {
        e.inputEvent.preventDefault();

        this.commands[command]?.(e.inputEvent);
      };
      this.getKeyconKeys(keybinding).forEach((keys) => {
        if (keys[0]) {
          keycon[eventType](keys, handler);
        } else {
          keycon[eventType](handler);
        }
      });

      item.bound = true;
    }
  }

  private getKeyconKeys(keybinding: string | string[] = '') {
    const splitKey = (key: string) => key.split('+').map((k) => (k === 'ctrl' ? this.ctrlKey : k));

    if (Array.isArray(keybinding)) {
      return keybinding.map((key) => splitKey(key));
    }
    return [splitKey(keybinding)];
  }
}

export type KeybindingService = Keybinding;

export default new Keybinding();
