import KeyController from 'keycon';

import { isPage } from '@tmagic/utils';

import BaseService from './BaseService';
import editorService from './editor';
import uiService from './ui';

class Keybinding extends BaseService {
  private keycon = new KeyController();

  private ctrlKey = /mac os x/.test(navigator.userAgent.toLowerCase()) ? 'meta' : 'ctrl';

  constructor() {
    super();

    this.keycon
      .keyup((e) => {
        this.emit('keyup', e.inputEvent);
      })
      .keyup('delete', (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();

        this.removeNode();
      })
      .keyup('backspace', (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();

        this.removeNode();
      })
      .keydown([this.ctrlKey, 'c'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();

        const nodes = editorService.get('nodes');
        nodes && editorService.copy(nodes);
      })
      .keydown([this.ctrlKey, 'v'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();

        const nodes = editorService.get('nodes');
        nodes && editorService.paste({ offsetX: 10, offsetY: 10 });
      })
      .keydown([this.ctrlKey, 'x'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        const nodes = editorService.get('nodes');

        if (!nodes || isPage(nodes[0])) return;
        editorService.copy(nodes);
        editorService.remove(nodes);
      })
      .keydown([this.ctrlKey, 'z'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        editorService.undo();
      })
      .keydown([this.ctrlKey, 'shift', 'z'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        editorService.redo();
      })
      .keydown('up', (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        editorService.move(0, -1);
      })
      .keydown('down', (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        editorService.move(0, 1);
      })
      .keydown('left', (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        editorService.move(-1, 0);
      })
      .keydown('right', (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        editorService.move(1, 0);
      })
      .keydown([this.ctrlKey, 'up'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        editorService.move(0, -10);
      })
      .keydown([this.ctrlKey, 'down'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        editorService.move(0, 10);
      })
      .keydown([this.ctrlKey, 'left'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        editorService.move(-10, 0);
      })
      .keydown([this.ctrlKey, 'right'], (e) => {
        e.inputEvent.preventDefault();
        editorService.move(10, 0);
      })
      .keydown('tab', (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        editorService.selectNextNode();
      })
      .keydown([this.ctrlKey, 'tab'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        editorService.selectNextPage();
      })
      .keydown([this.ctrlKey, '='], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        uiService.zoom(0.1);
      })
      .keydown([this.ctrlKey, 'numpadplus'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        uiService.zoom(0.1);
      })
      .keydown([this.ctrlKey, '-'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        uiService.zoom(-0.1);
      })
      .keydown([this.ctrlKey, 'numpad-'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        uiService.zoom(-0.1);
      })
      .keydown([this.ctrlKey, '0'], async (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        uiService.set('zoom', await uiService.calcZoom());
      })
      .keydown([this.ctrlKey, '1'], (e) => {
        if (this.isDisabledKeyEvent(e.inputEvent.target)) {
          return;
        }

        e.inputEvent.preventDefault();
        uiService.set('zoom', 1);
      });
  }

  public destroy() {
    this.keycon.destroy();
  }

  private isDisabledKeyEvent(node: EventTarget | null) {
    const el = node as HTMLElement | null;

    if (!el) return false;

    // 当前是在输入框中，禁止响应画布快捷键
    return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
  }

  private removeNode() {
    const nodes = editorService.get('nodes');

    if (!nodes || isPage(nodes[0])) return;
    editorService.remove(nodes);
  }
}

export type KeybindingService = Keybinding;

export default new Keybinding();
