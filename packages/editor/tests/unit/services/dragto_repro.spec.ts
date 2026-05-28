import { beforeAll, describe, expect, test } from 'vitest';
import { cloneDeep } from 'lodash-es';

import type { MApp, MContainer } from '@tmagic/core';
import { NodeType } from '@tmagic/core';

import editorService from '@editor/services/editor';
import historyService from '@editor/services/history';
import { setEditorConfig } from '@editor/utils';

setEditorConfig({
  // eslint-disable-next-line no-eval
  parseDSL: (dsl: string) => eval(dsl),
});

class LocalStorageMock {
  public length = 0;
  private store: Record<string, string> = {};
  clear() {
    this.store = {};
    this.length = 0;
  }
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
    this.length += 1;
  }
  removeItem(key: string) {
    delete this.store[key];
    this.length -= 1;
  }
  key(key: number) {
    return Object.keys(this.store)[key];
  }
}
globalThis.localStorage = new LocalStorageMock();

const ROOT_ID = 1;
const PAGE_ID = 2;
const CONTAINER_ID = 10;
const NODE_A = 11;
const NODE_B = 12;

const root: MApp = {
  id: ROOT_ID,
  type: NodeType.ROOT,
  items: [
    {
      id: PAGE_ID,
      type: NodeType.PAGE,
      layout: 'absolute',
      style: { width: 375 },
      items: [
        {
          id: CONTAINER_ID,
          type: NodeType.CONTAINER,
          layout: 'absolute',
          style: {},
          items: [
            { id: NODE_A, type: 'text', style: {} },
            { id: NODE_B, type: 'text', style: {} },
          ],
        },
      ],
    },
  ],
};

describe('dragTo undo/redo selection', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('dragTo 内同父排序后 undo/redo 不应在 nodes 中同时残留页面和组件', async () => {
    historyService.reset();
    await editorService.select(NODE_A);
    expect(editorService.get('nodes').map((n) => n.id)).toEqual([NODE_A]);

    const container = editorService.getNodeById(CONTAINER_ID, false) as MContainer;
    const nodeA = editorService.getNodeById(NODE_A, false)!;

    // 同容器内拖到末尾
    await editorService.dragTo([nodeA], container, 2);

    console.log(
      'after dragTo nodes:',
      editorService.get('nodes').map((n) => n.id),
    );

    await editorService.undo();
    // setTimeout(0) -> wait
    await new Promise((r) => setTimeout(r, 20));
    console.log(
      'after undo nodes:',
      editorService.get('nodes').map((n) => n.id),
    );
    console.log('after undo page:', editorService.get('page')?.id);

    await editorService.redo();
    await new Promise((r) => setTimeout(r, 20));
    console.log(
      'after redo nodes:',
      editorService.get('nodes').map((n) => n.id),
    );

    // 假设：undo 后 nodes 不应同时含有 page 和 component
    const undoNodes = editorService.get('nodes').map((n) => n.id);
    expect(undoNodes).not.toContain(PAGE_ID);
  });
});
