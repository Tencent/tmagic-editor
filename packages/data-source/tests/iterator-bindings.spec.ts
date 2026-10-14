import { afterEach, describe, expect, test, vi } from 'vitest';

import TMagicApp, { type MNode, NodeType, Watcher } from '@tmagic/core';

import { DataSourceManager } from '@data-source/index';

describe('迭代器编辑后的数据源绑定', () => {
  let app: TMagicApp;
  let manager: DataSourceManager;

  const createManager = (platform = 'editor') => {
    app = new TMagicApp({
      platform,
      config: {
        type: NodeType.ROOT,
        id: 'binding_app',
        items: [],
        dataSources: [
          {
            id: 'binding_ds',
            type: 'base',
            fields: [
              {
                name: 'list',
                type: 'array',
                fields: [{ name: 'label', type: 'string' }],
                defaultValue: [{ label: 'Alice' }],
              },
            ],
            methods: [],
            events: [],
          },
        ],
      },
    });
    manager = new DataSourceManager({ app });
  };

  const compileRows = (nodes: MNode[]) =>
    ['Alice', 'Bob'].map((label) => manager.compliedIteratorItems({ label }, nodes, ['binding_ds', 'list']));

  afterEach(() => {
    manager.destroy();
    app.destroy();
    vi.restoreAllMocks();
  });

  test('节点 ID 不变时立即编译新增绑定，并在同批迭代项间复用依赖', () => {
    createManager();
    const nodes: MNode[] = [{ id: 'new_binding', type: 'text', text: 'Text' }];
    expect(compileRows(nodes).map((row) => row[0].text)).toEqual(['Text', 'Text']);

    nodes[0] = manager.compiledNode({ ...nodes[0], text: '${binding_ds.list.label}' }, undefined, true);
    const collect = vi.spyOn(Watcher.prototype, 'collect');

    expect(compileRows(nodes).map((row) => row[0].text)).toEqual(['Alice', 'Bob']);
    expect(collect).toHaveBeenCalledTimes(1);
  });

  test('编辑嵌套节点的新绑定属性时刷新依赖', () => {
    createManager();
    const nodes = [
      {
        id: 'nested_container',
        type: 'container',
        items: [{ id: 'nested_text', type: 'text', text: '${binding_ds.list.label}', title: 'Title' }],
      },
    ];
    expect(compileRows(nodes).map((row) => row[0].items[0].title)).toEqual(['Title', 'Title']);

    const updated = manager.compiledNode(
      {
        ...nodes[0],
        items: [{ ...nodes[0].items[0], title: '${binding_ds.list.label}' }],
      },
      undefined,
      true,
    );

    expect(compileRows([updated]).map((row) => row[0].items[0].title)).toEqual(['Alice', 'Bob']);
  });

  test('运行时深度编译保持现有的迭代依赖缓存', () => {
    createManager('mobile');
    const nodes = [{ id: 'runtime_binding', type: 'text', text: '${binding_ds.list.label}' }];
    expect(compileRows(nodes).map((row) => row[0].text)).toEqual(['Alice', 'Bob']);
    const collect = vi.spyOn(Watcher.prototype, 'collect');

    manager.compiledNode({ id: 'unrelated', type: 'container', items: [] }, undefined, true);

    expect(compileRows(nodes).map((row) => row[0].text)).toEqual(['Alice', 'Bob']);
    expect(collect).not.toHaveBeenCalled();
  });
});
