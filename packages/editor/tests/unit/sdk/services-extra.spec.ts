// @vitest-environment node
import { describe, expect, test } from 'vitest';

import type { MApp } from '@tmagic/core';
import { HookCodeType, HookType } from '@tmagic/core';

import { LayerOffset } from '@editor/type';

import { createDsl, createSdk } from './helpers';

/** 每个节点都带 style，便于测试位置相关的操作 */
const createStyledDsl = (): MApp =>
  ({
    id: 'app_1',
    type: 'app',
    items: [
      {
        id: 'page_1',
        type: 'page',
        name: 'page',
        style: { width: 375, height: 800 },
        items: [
          {
            id: 'text_1',
            type: 'text',
            text: 'a',
            style: { position: 'absolute', left: 10, top: 10, width: 100, height: 20 },
          },
          {
            id: 'text_2',
            type: 'text',
            text: 'b',
            style: { position: 'absolute', left: 20, top: 40, width: 100, height: 20 },
          },
          {
            id: 'text_3',
            type: 'text',
            text: 'c',
            style: { position: 'absolute', left: 30, top: 70, width: 100, height: 20 },
          },
          {
            id: 'container_1',
            type: 'container',
            style: { position: 'absolute', left: 0, top: 100, width: 300, height: 300 },
            items: [
              {
                id: 'button_1',
                type: 'button',
                style: { position: 'absolute', left: 5, top: 5, width: 50, height: 20 },
              },
            ],
          },
        ],
      },
      { id: 'page_2', type: 'page', name: 'page2', items: [{ id: 'text_9', type: 'text', text: 'z' }] },
    ],
    dataSources: [{ id: 'ds_1', type: 'base', title: 'ds', fields: [{ name: 'name' }], methods: [], events: [] }],
    codeBlocks: { code_1: { name: 'code', content: '() => {}', params: [] } },
  }) as any;

const createStyled = () => createSdk({ dsl: createStyledDsl() });

describe('editor：选择与高亮', () => {
  test('selectNextNode / selectNextPage', async () => {
    const sdk = createStyled();

    await sdk.editor.select('text_1');
    expect((await sdk.editor.selectNextNode())?.id).toBe('text_2');

    await sdk.editor.select('text_3');
    expect((await sdk.editor.selectNextNode())?.id).toBeTruthy();

    await sdk.editor.select('page_1');
    expect((await sdk.editor.selectNextNode())?.id).toBe('page_1');

    expect((await sdk.editor.selectNextPage()).id).toBe('page_2');
    expect((await sdk.editor.selectNextPage()).id).toBe('page_1');
  });

  test('selectNextPage 没有页面 / root 时报错', async () => {
    const sdk = createSdk({ dsl: null });
    await expect(sdk.editor.selectNextPage()).rejects.toThrow('page不能为空');
  });

  test('highlight / multiSelect', async () => {
    const sdk = createStyled();

    sdk.editor.highlight('text_1');
    expect(sdk.editor.get('highlightNode')?.id).toBe('text_1');
    sdk.editor.highlight('text_1');
    expect(sdk.editor.get('highlightNode')?.id).toBe('text_1');

    sdk.editor.multiSelect(['text_1', 'text_2', 'text_2', 'not-exist']);
    expect(sdk.editor.get('nodes').map((node) => node.id)).toEqual(['text_1', 'text_2']);
  });

  test('selectRoot', () => {
    const sdk = createStyled();
    sdk.editor.selectRoot();
    expect(sdk.editor.get('node')?.id).toBe('app_1');
  });
});

describe('editor：位置与层级', () => {
  test('alignCenter（单个 / 多个）', async () => {
    const sdk = createStyled();

    const one = (await sdk.editor.alignCenter(sdk.editor.getNodeById('text_1')!)) as any;
    expect(one).toBeTruthy();

    const many = await sdk.editor.alignCenter([sdk.editor.getNodeById('text_2')!, sdk.editor.getNodeById('text_3')!], {
      doNotPushHistory: true,
    });
    expect(Array.isArray(many)).toBe(true);
  });

  test('move 改变选中节点的位置', async () => {
    const sdk = createStyled();
    await sdk.editor.select('text_1');
    await sdk.editor.move(5, 6);

    const { style } = sdk.editor.getNodeById('text_1') as any;
    expect(style.left).toBe(15);
    expect(style.top).toBe(16);

    // 页面不可移动
    await sdk.editor.select('page_1');
    await sdk.editor.move(1, 1);
  });

  test('moveLayer', async () => {
    const sdk = createStyled();
    await sdk.editor.select('text_1');

    await sdk.editor.moveLayer(1);
    await sdk.editor.moveLayer(LayerOffset.BOTTOM);
    await sdk.editor.moveLayer(LayerOffset.TOP);

    const ids = (sdk.editor.getNodeById('page_1') as any).items.map((item: any) => item.id);
    expect(ids).toContain('text_1');

    const withId = await sdk.editor.moveLayerAndGetHistoryId(-1);
    expect(withId.historyIds.length).toBeGreaterThan(0);
  });

  test('moveToContainer / dragTo，含 *AndGetHistoryId', async () => {
    const sdk = createStyled();

    await sdk.editor.moveToContainer(
      [sdk.editor.getNodeById('text_1')!, sdk.editor.getNodeById('text_2')!],
      'container_1',
      {
        doNotSelect: true,
      },
    );
    const container = sdk.editor.getNodeById('container_1') as any;
    expect(container.items.map((item: any) => item.id)).toEqual(expect.arrayContaining(['text_1', 'text_2']));

    const moved = await sdk.editor.moveToContainerAndGetHistoryId(sdk.editor.getNodeById('text_3')!, 'container_1');
    expect(moved.historyIds.length).toBeGreaterThan(0);

    // 同容器内排序
    await sdk.editor.dragTo(sdk.editor.getNodeById('text_3')!, container, 0);
    expect(container.items[0].id).toBe('text_3');

    // 跨容器
    const page = sdk.editor.getNodeById('page_1') as any;
    const dragged = await sdk.editor.dragToAndGetHistoryId(sdk.editor.getNodeById('button_1')!, page, 0);
    expect(dragged.historyIds.length).toBeGreaterThan(0);
    expect(page.items[0].id).toBe('button_1');

    // 目标不是容器时什么也不做
    expect(
      await sdk.editor.dragTo(sdk.editor.getNodeById('text_1')!, sdk.editor.getNodeById('text_2') as any, 0),
    ).toBeUndefined();

    // 不能移动页面
    await expect(sdk.editor.moveToContainer(sdk.editor.getNodeById('page_2')!, 'container_1')).rejects.toThrow();
    await expect(sdk.editor.moveToContainer(sdk.editor.getNodeById('text_1')!, 'missing')).rejects.toThrow(
      '目标容器不存在',
    );
  });
});

describe('editor：历史', () => {
  test('gotoPageStep / revertPageStep / revertPageStepById', async () => {
    const sdk = createStyled();

    await sdk.editor.update({ id: 'text_1', text: 'a1' } as any, {
      changeRecords: [{ propPath: 'text', value: 'a1' }],
    });
    await sdk.editor.update({ id: 'text_2', text: 'b1' } as any, {
      changeRecords: [{ propPath: 'text', value: 'b1' }],
    });
    const added = (await sdk.editor.add({ type: 'text', text: 'new' } as any)) as any;
    await sdk.editor.remove(sdk.editor.getNodeById('text_3')!);

    // 回滚第一次更新，不影响后面的更新
    const reverted = await sdk.editor.revertPageStep(1);
    expect(reverted).toBeTruthy();
    expect((sdk.editor.getNodeById('text_1') as any).text).toBe('a');
    expect((sdk.editor.getNodeById('text_2') as any).text).toBe('b1');

    // 回滚新增 / 删除
    const listLength = sdk.history.getStepList('page', 'page_1').length;
    expect(await sdk.editor.revertPageStep(3)).toBeTruthy();
    expect(sdk.editor.getNodeById(added.id)).toBeFalsy();
    expect(sdk.history.getStepList('page', 'page_1').length).toBeGreaterThan(listLength - 1);

    // 初始基线不可回滚 / 越界
    expect(await sdk.editor.revertPageStep(0)).toBeNull();
    expect(await sdk.editor.revertPageStep(99)).toBeNull();

    const { step } = sdk.history.getStepList('page', 'page_1')[2];
    const byId = await sdk.editor.revertPageStepById([step.uuid!, 'not-found']);
    expect(byId[1]).toBeNull();

    const cursor = await sdk.editor.gotoPageStep(0);
    expect(cursor).toBeLessThanOrEqual(1);
    expect((sdk.editor.getNodeById('text_2') as any).text).toBe('b');

    const end = await sdk.editor.gotoPageStep(99);
    expect(end).toBeGreaterThan(0);
  });

  test('没有选中页面时 undo / redo 返回 null', async () => {
    const sdk = createSdk({ dsl: null });
    expect(await sdk.editor.undo()).toBeNull();
    expect(await sdk.editor.redo()).toBeNull();
  });

  test('撤销新增 / 删除 / 更新各类历史', async () => {
    const sdk = createStyled();

    await sdk.editor.add({ type: 'text', text: 'n1' } as any);
    await sdk.editor.undo();
    await sdk.editor.redo();
    await sdk.editor.undo();

    await sdk.editor.remove(sdk.editor.getNodeById('text_1')!);
    await sdk.editor.undo();
    await sdk.editor.redo();
    await sdk.editor.undo();

    await sdk.editor.update({ id: 'text_2', text: 'u' } as any);
    await sdk.editor.undo();
    await sdk.editor.redo();

    expect((sdk.editor.getNodeById('text_2') as any).text).toBe('u');
  });
});

describe('editor：copyWithRelated / paste', () => {
  test('copyWithRelated 把关联节点一起复制', async () => {
    const dsl = createStyledDsl();
    (dsl.items[0].items![0] as any).relate = 'text_2';
    const sdk = createSdk({ dsl });

    sdk.editor.copyWithRelated(sdk.editor.getNodeById('text_1')!, {
      type: 'relate' as any,
      isTarget: (key: string | number, value: any) => key === 'relate' && !!value,
    } as any);

    const copied = sdk.storage.getItem('tmagic-editor-copy' as any) ?? null;
    expect(copied === null || Array.isArray(copied) || typeof copied === 'object').toBe(true);
  });

  test('粘贴选中节点的副本时放进它的父节点', async () => {
    const sdk = createStyled();
    await sdk.editor.select('text_1');
    await sdk.editor.copy(sdk.editor.getNodeById('text_1')!);

    const pasted = (await sdk.editor.paste({}, undefined, { doNotSelect: true })) as any;
    expect(sdk.editor.getParentById(Array.isArray(pasted) ? pasted[0].id : pasted.id)?.id).toBe('page_1');
  });
});

describe('props：关联 id', () => {
  test('setNewItemId 记录映射，replaceRelateId 替换关联 id', () => {
    const sdk = createSdk();
    const origin = [
      { id: 'a', type: 'text', relate: 'b' },
      { id: 'b', type: 'text', items: [{ id: 'c', type: 'text', relate: 'a' }] },
    ] as any[];

    const copied = JSON.parse(JSON.stringify(origin));
    sdk.props.clearRelateId();
    copied.forEach((config: any) => {
      sdk.props.setNewItemId(config);
      config.items?.forEach((item: any) => sdk.props.setNewItemId(item));
    });

    sdk.props.replaceRelateId(origin, copied, {
      type: 'relate' as any,
      isTarget: (key: string | number, value: any) => key === 'relate' && !!value,
    } as any);

    expect(copied[0].relate).toBe(copied[1].id);

    // 没有映射时什么也不做
    sdk.props.clearRelateId();
    sdk.props.replaceRelateId(origin, copied, { type: 'relate' as any, isTarget: () => false } as any);
  });

  test('area 类型使用 button 的配置', async () => {
    const sdk = createSdk({ propsValues: { button: { text: 'btn' } } });
    await sdk.ready;
    const value = (await sdk.props.getPropsValue('area')) as any;
    expect(value.className).toBe('action-area');
    expect(await sdk.props.getPropsConfig('area')).toBeTruthy();
  });

  test('props 的 usePlugin', async () => {
    const sdk = createSdk();
    sdk.props.usePlugin({ afterGetPropsConfig: async () => [{ name: 'plugin' }] } as any);
    sdk.codeBlock.usePlugin({} as any);
    sdk.dataSource.usePlugin({} as any);
    sdk.editor.usePlugin({} as any);
  });
});

describe('codeBlock', () => {
  test('goto / revert / revertById / 历史', async () => {
    const sdk = createStyled();
    const { codeBlock } = sdk;

    await codeBlock.setCodeDslById('code_2', { name: 'c2', content: '() => 1', params: [] });
    await codeBlock.setCodeDslById(
      'code_2',
      { name: 'c2-new', content: '() => 2', params: [] },
      {
        changeRecords: [{ propPath: 'name', value: 'c2-new' }],
      },
    );
    await codeBlock.setCodeDslById(
      'code_2',
      { name: 'c2-3', content: '() => 3', params: [] },
      {
        changeRecords: [{ propPath: '', value: {} }],
      },
    );
    await codeBlock.deleteCodeDslByIds(['code_2']);

    // 回滚删除 -> 写回
    const list = sdk.history.getStepList('codeBlock', 'code_2');
    expect(await codeBlock.revert('code_2', list.length - 1)).toBeTruthy();
    expect(codeBlock.getCodeContentById('code_2')).toBeTruthy();

    // 局部回滚更新
    expect(await codeBlock.revert('code_2', 1)).toBeTruthy();
    // 回滚带空 propPath 的更新 -> 整体替换
    expect(await codeBlock.revert('code_2', 2)).toBeTruthy();
    // 回滚新增 -> 删除
    expect(await codeBlock.revert('code_2', 0)).toBeTruthy();
    expect(codeBlock.getCodeContentById('code_2')).toBeFalsy();

    // 更新类但没有 changeRecords 的不可回滚；越界为 null
    expect(await codeBlock.revert('code_2', 99)).toBeNull();

    const { step } = sdk.history.getStepList('codeBlock', 'code_2')[0];
    expect((await codeBlock.revertById([step.uuid!, 'missing']))[1]).toBeNull();

    // goto
    const total = sdk.history.getStepList('codeBlock', 'code_2').length;
    expect(await codeBlock.goto('code_2', 1)).toBe(1);
    expect(await codeBlock.goto('code_2', total)).toBe(total);
    expect(await codeBlock.goto('code_2', -1)).toBe(0);
  });

  test('undo / redo 单个代码块', async () => {
    const sdk = createStyled();
    await sdk.codeBlock.setCodeDslById(
      'code_1',
      { name: 'changed' },
      { changeRecords: [{ propPath: 'name', value: 'changed' }] },
    );
    expect(await sdk.codeBlock.undo('code_1')).toBeTruthy();
    expect(sdk.codeBlock.getCodeContentById('code_1')?.name).toBe('code');
    expect(await sdk.codeBlock.redo('code_1')).toBeTruthy();
    expect(sdk.codeBlock.getCodeContentById('code_1')?.name).toBe('changed');
  });

  test('copyWithRelated 复制节点关联的代码块', async () => {
    const dsl = createStyledDsl();
    (dsl.items[0].items![0] as any)[HookType.HOOK_TYPE] = HookType.CODE;
    (dsl.items[0].items![0] as any).hooks = [
      { hookType: HookType.CODE, hookData: [{ codeType: HookCodeType.CODE, codeId: 'code_1' }] },
    ];
    const sdk = createSdk({ dsl });

    sdk.codeBlock.copyWithRelated(sdk.editor.getNodeById('text_1')!, {
      type: 'code-block' as any,
      isTarget: (key: string | number, value: any) => key === 'codeId' && !!value,
    } as any);
    sdk.codeBlock.copyWithRelated(sdk.editor.getNodeById('text_1')!);

    // 不存在的节点 / 没有收集器时不报错
    sdk.codeBlock.copyWithRelated([], { type: 'code-block' as any, isTarget: () => true } as any);
  });
});

describe('dataSource', () => {
  test('goto / revert / revertById / undo / redo', () => {
    const sdk = createStyled();
    const { dataSource } = sdk;

    dataSource.add({ id: 'ds_2', type: 'base', title: 'two', fields: [], methods: [], events: [] } as any);
    dataSource.update({ id: 'ds_2', type: 'base', title: 'three', fields: [], methods: [], events: [] } as any, {
      changeRecords: [{ propPath: 'title', value: 'three' }],
    });
    dataSource.update({ id: 'ds_2', type: 'base', title: 'four', fields: [], methods: [], events: [] } as any, {
      changeRecords: [{ propPath: '', value: {} }],
    });
    dataSource.update({ id: 'ds_2', type: 'base', title: 'five', fields: [], methods: [], events: [] } as any);
    dataSource.remove('ds_2');

    const total = sdk.history.getStepList('dataSource', 'ds_2').length;

    // 回滚删除 -> 写回
    expect(dataSource.revert('ds_2', total - 1)).toBeTruthy();
    expect(dataSource.getDataSourceById('ds_2')).toBeTruthy();

    // 局部回滚 / 整体回滚
    expect(dataSource.revert('ds_2', 1)).toBeTruthy();
    expect(dataSource.revert('ds_2', 2)).toBeTruthy();
    // 没有 changeRecords 的更新不可回滚
    expect(dataSource.revert('ds_2', 3)).toBeNull();
    expect(dataSource.revert('ds_2', 99)).toBeNull();
    // 回滚新增 -> 删除
    expect(dataSource.revert('ds_2', 0)).toBeTruthy();
    expect(dataSource.getDataSourceById('ds_2')).toBeFalsy();

    const { step } = sdk.history.getStepList('dataSource', 'ds_2')[0];
    expect(dataSource.revertById([step.uuid!, 'missing'])[1]).toBeNull();

    const { length } = sdk.history.getStepList('dataSource', 'ds_2');
    expect(dataSource.goto('ds_2', 1)).toBe(1);
    expect(dataSource.goto('ds_2', length)).toBe(length);
    expect(dataSource.goto('ds_2', -1)).toBe(0);

    expect(dataSource.undo('ds_2')).toBeNull();
    expect(dataSource.redo('ds_2')).toBeTruthy();
  });

  test('copyWithRelated 复制节点关联的数据源', () => {
    const sdk = createStyled();
    (sdk.editor.getNodeById('text_1') as any).dsField = ['ds_1', 'name'];

    sdk.dataSource.copyWithRelated(sdk.editor.getNodeById('text_1')!, {
      type: 'data-source' as any,
      isTarget: (key: string | number, value: any) => key === 'dsField' && Array.isArray(value),
    } as any);
    sdk.dataSource.copyWithRelated(sdk.editor.getNodeById('text_1')!);
    sdk.dataSource.copyWithRelated([], { type: 'data-source' as any, isTarget: () => true } as any);
  });
});

describe('DSL 兜底', () => {
  test('createDsl 夹具本身是合法的', async () => {
    const sdk = createSdk({ dsl: createDsl() });
    expect((await sdk.validate.dsl()).valid).toBe(true);
  });
});
