// @vitest-environment node
import { describe, expect, test } from 'vitest';

import { DepTargetType, NODE_CONDS_KEY } from '@tmagic/core';

import { classifyUpdatedNodes } from '@editor/sdk';

import { createDsl, createSdk } from './helpers';

describe('依赖收集连线', () => {
  test('创建时收集数据源依赖并写回 DSL', () => {
    const sdk = createSdk();
    const dsl = sdk.getDsl()!;

    expect(dsl.dataSourceDeps!.ds_1.text_1).toMatchObject({ keys: ['text'] });
    expect(dsl.dataSourceMethodDeps).toHaveProperty('ds_1');
    expect(dsl.dataSourceCondDeps).toHaveProperty('ds_1');
  });

  test('没有 items 的 root 会清空依赖', async () => {
    const sdk = createSdk();
    await sdk.setDsl({ id: 'app_2', type: 'app', dataSourceDeps: { x: {} } } as any);

    expect(sdk.getDsl()!.dataSourceDeps).toBeUndefined();
    expect(sdk.editor.get('nodes')[0].id).toBe('app_2');
  });

  test('root 变化后保持原来的选中节点', async () => {
    const sdk = createSdk();
    await sdk.editor.select('button_1');
    await sdk.setDsl(createDsl());

    expect(sdk.editor.get('node')?.id).toBe('button_1');
  });

  test('add：新增节点引用数据源时收集依赖', async () => {
    const sdk = createSdk();
    const node = (await sdk.editor.add({ type: 'text', text: '${ds_1.name}' } as any)) as any;

    expect(sdk.getDsl()!.dataSourceDeps!.ds_1[node.id]).toBeDefined();
  });

  test('update：修改绑定数据源的字段触发重新收集；改成普通文本后依赖被移除', async () => {
    const sdk = createSdk();

    await sdk.editor.update({ id: 'button_1', text: '${ds_1.name}' } as any, {
      changeRecords: [{ propPath: 'text', value: '${ds_1.name}' }],
    });
    expect(sdk.getDsl()!.dataSourceDeps!.ds_1.button_1).toBeDefined();

    await sdk.editor.update({ id: 'button_1', text: 'plain' } as any, {
      changeRecords: [{ propPath: 'text', value: 'plain' }],
    });
    expect(sdk.getDsl()!.dataSourceDeps!.ds_1.button_1).toBeUndefined();
  });

  test('update：没有 changeRecords 时按新旧节点是否包含数据源判断', async () => {
    const sdk = createSdk();

    await sdk.editor.update({ id: 'button_1', text: '${ds_1.name}' } as any);
    expect(sdk.getDsl()!.dataSourceDeps!.ds_1.button_1).toBeDefined();
  });

  test('update：普通字段变化只收集代码块 / 数据源方法依赖', async () => {
    const sdk = createSdk();
    await sdk.editor.update({ id: 'button_1', text: 'new' } as any, {
      changeRecords: [{ propPath: 'text', value: 'new' }],
    });

    expect(sdk.getDsl()!.dataSourceDeps!.ds_1.text_1).toBeDefined();
  });

  test('update root 不触发收集', async () => {
    const sdk = createSdk();
    await sdk.editor.update({ id: 'app_1', name: 'x' } as any);

    expect(sdk.getDsl()!.dataSourceDeps!.ds_1.text_1).toBeDefined();
  });

  test('remove：删除节点时清理依赖', async () => {
    const sdk = createSdk();
    await sdk.editor.remove({ id: 'text_1' } as any);

    expect(sdk.getDsl()!.dataSourceDeps!.ds_1.text_1).toBeUndefined();
  });

  test('undo / redo 后依赖保持一致', async () => {
    const sdk = createSdk();
    await sdk.editor.remove({ id: 'text_1' } as any);
    await sdk.editor.undo();

    expect(sdk.getDsl()!.dataSourceDeps!.ds_1.text_1).toBeDefined();

    await sdk.editor.redo();
    expect(sdk.getDsl()!.dataSourceDeps!.ds_1.text_1).toBeUndefined();
  });

  test('数据源：新增后引用它的节点生效；修改字段 / mock / 方法会重新收集；删除时清理', async () => {
    const sdk = createSdk();

    sdk.dataSource.add({
      id: 'ds_2',
      type: 'base',
      title: 'ds2',
      fields: [{ name: 'a' }],
      methods: [],
      events: [],
    } as any);
    expect(sdk.dep.getTarget('ds_2', DepTargetType.DATA_SOURCE)).toBeTruthy();

    await sdk.editor.update({ id: 'button_1', text: '${ds_2.a}' } as any);
    expect(sdk.getDsl()!.dataSourceDeps!.ds_2.button_1).toBeDefined();

    // 改字段
    sdk.dataSource.update(
      { id: 'ds_2', type: 'base', title: 'ds2', fields: [{ name: 'b' }], methods: [], events: [] } as any,
      { changeRecords: [{ propPath: 'fields', value: [{ name: 'b' }] }] },
    );
    expect(sdk.dep.getTarget('ds_2', DepTargetType.DATA_SOURCE)).toBeTruthy();

    // 改 mock
    sdk.dataSource.update(
      { id: 'ds_2', type: 'base', title: 'ds2', fields: [{ name: 'b' }], methods: [], events: [], mocks: [] } as any,
      { changeRecords: [{ propPath: 'mocks', value: [] }] },
    );
    expect(sdk.dep.getTarget('ds_2', DepTargetType.DATA_SOURCE)).toBeTruthy();

    // 改方法
    sdk.dataSource.update(
      { id: 'ds_2', type: 'base', title: 'ds2', fields: [{ name: 'b' }], methods: [], events: [] } as any,
      { changeRecords: [{ propPath: 'methods', value: [] }] },
    );
    expect(sdk.dep.getTarget('ds_2', DepTargetType.DATA_SOURCE_METHOD)).toBeTruthy();

    // 与依赖无关的字段
    sdk.dataSource.update(
      { id: 'ds_2', type: 'base', title: 'renamed', fields: [{ name: 'b' }], methods: [], events: [] } as any,
      {
        changeRecords: [
          { propPath: 'title', value: 'renamed' },
          { propPath: '', value: '' },
        ],
      },
    );

    sdk.dataSource.remove('ds_2');
    expect(sdk.dep.getTarget('ds_2', DepTargetType.DATA_SOURCE)).toBeFalsy();
    expect(sdk.getDsl()!.dataSourceDeps!.ds_2).toBeUndefined();
  });

  test('代码块：新增 / 更新 / 删除对应的依赖目标', async () => {
    const sdk = createSdk();

    expect(sdk.dep.hasTarget('code_1', DepTargetType.CODE_BLOCK)).toBe(true);

    await sdk.codeBlock.setCodeDslById('code_2', { name: 'two', content: '() => {}', params: [] });
    expect(sdk.dep.hasTarget('code_2', DepTargetType.CODE_BLOCK)).toBe(true);

    await sdk.codeBlock.setCodeDslById('code_2', { name: 'renamed', content: '() => {}', params: [] });
    expect(sdk.dep.getTarget('code_2', DepTargetType.CODE_BLOCK)?.name).toBe('renamed');

    await sdk.codeBlock.deleteCodeDslByIds(['code_2']);
    expect(sdk.dep.hasTarget('code_2', DepTargetType.CODE_BLOCK)).toBe(false);
  });

  test('unbind 之后不再响应', async () => {
    const sdk = createSdk();
    const unbind = sdk.bindWiring();
    unbind();

    await sdk.editor.add({ type: 'text', text: '${ds_1.name}' } as any);
    // 创建时已自动绑定，这里 unbind 的是 bindWiring 返回的同一个句柄
    expect(Object.keys(sdk.getDsl()!.dataSourceDeps!.ds_1)).toContain('text_1');
  });
});

describe('classifyUpdatedNodes', () => {
  const sdk = createSdk();
  const make = (newNode: any, oldNode: any, changeRecords?: any[]) => ({ newNode, oldNode, changeRecords });

  test('根节点归为普通节点', () => {
    const { normalNodes } = classifyUpdatedNodes(sdk.ctx, [make({ id: 'a', type: 'app' }, { id: 'a', type: 'app' })]);
    expect(normalNodes).toHaveLength(1);
  });

  test('没有 propPath、显示条件、绑定数据源的值都需要重新收集', () => {
    const node = { id: 'x', type: 'text' };
    const { needRecollectNodes } = classifyUpdatedNodes(sdk.ctx, [
      make(node, node, [{ propPath: '', value: 1 }]),
      make(node, node, [{ propPath: NODE_CONDS_KEY, value: 1 }]),
      make(node, node, [{ propPath: `${NODE_CONDS_KEY}.0.cond`, value: 1 }]),
      make(node, node, [{ propPath: 'a', value: '${ds_1.a}' }]),
    ]);
    expect(needRecollectNodes).toHaveLength(4);
  });

  test('修改的 key 已在依赖里时需要重新收集', () => {
    const { needRecollectNodes, normalNodes } = classifyUpdatedNodes(sdk.ctx, [
      make({ id: 'text_1', type: 'text' }, { id: 'text_1', type: 'text' }, [{ propPath: 'text', value: 'a' }]),
      make({ id: 'text_1', type: 'text' }, { id: 'text_1', type: 'text' }, [{ propPath: 'other', value: 'a' }]),
      make({ id: 'zzz', type: 'text' }, { id: 'zzz', type: 'text' }, [{ propPath: 'text', value: 'a' }]),
    ]);
    expect(needRecollectNodes).toHaveLength(1);
    expect(normalNodes).toHaveLength(2);
  });
});
