// @vitest-environment node
import { describe, expect, test, vi } from 'vitest';

import { DepTargetType } from '@tmagic/core';

import { createDslSdk } from '@editor/sdk';
import {
  addDataSourceTargets,
  getDataSourceRecollectTypes,
  removeDataSourceTargets,
  removeTargetDeps,
  resetDepTargets,
  writeTargetDeps,
} from '@editor/sdk/utils/dep';

import { createDsl, createSdk } from './helpers';

const record = (propPath?: string) => ({ propPath, value: undefined }) as any;

describe('getDataSourceRecollectTypes', () => {
  test('字段变化：重建数据源与条件依赖', () => {
    for (const path of ['fields', 'fields.0.name', 'fields.1.defaultValue', 'fields.2']) {
      expect(getDataSourceRecollectTypes([record(path)])).toEqual([
        DepTargetType.DATA_SOURCE,
        DepTargetType.DATA_SOURCE_COND,
      ]);
    }
  });

  test('mocks 变化：只重建数据源依赖', () => {
    expect(getDataSourceRecollectTypes([record('mocks')])).toEqual([DepTargetType.DATA_SOURCE]);
  });

  test('方法变化：只重建方法依赖', () => {
    for (const path of ['methods', 'methods.0.name', 'methods.3']) {
      expect(getDataSourceRecollectTypes([record(path)])).toEqual([DepTargetType.DATA_SOURCE_METHOD]);
    }
  });

  test('取第一条命中规则的记录，忽略没有 propPath 的记录', () => {
    expect(
      getDataSourceRecollectTypes([record(undefined), record('title'), record('methods'), record('fields')]),
    ).toEqual([DepTargetType.DATA_SOURCE_METHOD]);
  });

  test('不影响依赖的变化返回 null', () => {
    expect(getDataSourceRecollectTypes([record('title'), record(undefined)])).toBeNull();
    expect(getDataSourceRecollectTypes([])).toBeNull();
  });
});

describe('依赖目标与 root 写回', () => {
  const ds = { id: 'ds_1', type: 'base', fields: [], methods: [] } as any;

  test('addDataSourceTargets / removeDataSourceTargets 默认处理三类，可指定类型', () => {
    const dep = { addTarget: vi.fn(), removeTarget: vi.fn() };

    addDataSourceTargets(dep as any, ds, (v) => v);
    expect(dep.addTarget.mock.calls.map(([target]) => target.type)).toEqual([
      DepTargetType.DATA_SOURCE,
      DepTargetType.DATA_SOURCE_COND,
      DepTargetType.DATA_SOURCE_METHOD,
    ]);

    dep.addTarget.mockClear();
    addDataSourceTargets(dep as any, ds, (v) => v, [DepTargetType.DATA_SOURCE_METHOD]);
    expect(dep.addTarget).toHaveBeenCalledTimes(1);

    removeDataSourceTargets(dep as any, 'ds_1');
    expect(dep.removeTarget).toHaveBeenCalledTimes(3);
    removeDataSourceTargets(dep as any, 'ds_1', [DepTargetType.DATA_SOURCE]);
    expect(dep.removeTarget).toHaveBeenLastCalledWith('ds_1', DepTargetType.DATA_SOURCE);
  });

  test('resetDepTargets 先清空再建代码块与数据源目标', () => {
    const dep = { clearTargets: vi.fn(), addTarget: vi.fn() };

    resetDepTargets(dep as any, { code_1: { name: 'c', content: '', params: [] } } as any, [ds], (v) => v);

    expect(dep.clearTargets).toHaveBeenCalledTimes(1);
    expect(dep.addTarget.mock.calls.map(([target]) => target.type)).toEqual([
      DepTargetType.CODE_BLOCK,
      DepTargetType.DATA_SOURCE,
      DepTargetType.DATA_SOURCE_COND,
      DepTargetType.DATA_SOURCE_METHOD,
    ]);
  });

  test('writeTargetDeps / removeTargetDeps 只处理数据源三类依赖', () => {
    const root: any = {};
    const deps = { n1: { name: 'n1', keys: ['text'] } };

    writeTargetDeps(root, { id: 'ds_1', type: DepTargetType.DATA_SOURCE, deps } as any);
    writeTargetDeps(root, { id: 'ds_1', type: DepTargetType.DATA_SOURCE_COND, deps } as any);
    writeTargetDeps(root, { id: 'ds_1', type: DepTargetType.DATA_SOURCE_METHOD, deps } as any);
    writeTargetDeps(root, { id: 'code_1', type: DepTargetType.CODE_BLOCK, deps } as any);
    writeTargetDeps(null, { id: 'ds_1', type: DepTargetType.DATA_SOURCE, deps } as any);

    expect(root.dataSourceDeps.ds_1).toBe(deps);
    expect(root.dataSourceCondDeps.ds_1).toBe(deps);
    expect(root.dataSourceMethodDeps.ds_1).toBe(deps);
    expect(Object.keys(root)).toHaveLength(3);

    removeTargetDeps(root, 'ds_1', DepTargetType.DATA_SOURCE);
    removeTargetDeps(root, 'ds_1', DepTargetType.CODE_BLOCK);
    removeTargetDeps(root, 'ds_1', 'unknown');
    removeTargetDeps(undefined, 'ds_1', DepTargetType.DATA_SOURCE);
    removeTargetDeps({} as any, 'ds_1', DepTargetType.DATA_SOURCE);

    expect(root.dataSourceDeps.ds_1).toBeUndefined();
    expect(root.dataSourceCondDeps.ds_1).toBe(deps);
  });
});

describe('延迟绑定连线', () => {
  test('autoWiring 为 false 时，之后调用 bindWiring 会补收集已有 DSL 的依赖', async () => {
    const sdk = createSdk({ autoWiring: false });
    await sdk.ready;
    expect(sdk.getDsl()!.dataSourceDeps).toBeUndefined();

    const unbind = sdk.bindWiring();
    await sdk.ready;

    expect(sdk.getDsl()!.dataSourceDeps!.ds_1.text_1).toBeDefined();

    const node = (await sdk.editor.add({ type: 'text', text: '${ds_1.name}' } as any)) as any;
    expect(sdk.getDsl()!.dataSourceDeps!.ds_1[node.id]).toBeDefined();

    unbind();
  });

  test('重复 bindWiring 返回同一个解绑函数且不会重复绑定', async () => {
    const sdk = createDslSdk({ dsl: createDsl(), autoWiring: false });
    await sdk.ready;

    const first = sdk.bindWiring();
    const second = sdk.bindWiring();
    expect(second).toBe(first);

    first();
    expect(sdk.editor.listenerCount('add')).toBe(0);
  });
});

describe('登记表', () => {
  test('setPropsConfigs / setPropsValues 返回的 Promise 在异步配置处理完后 resolve', async () => {
    const sdk = createDslSdk({});

    await sdk.props.setPropsConfigs({ Text: [{ name: 'text', text: '文本' }] });
    await sdk.props.setPropsValues({ Text: { text: 'x' } });

    expect(sdk.props.getPropsConfigs()).toHaveProperty('text');
    expect(sdk.props.getPropsValues()).toHaveProperty('text', { text: 'x' });
  });

  test('setPropsConfigs 在配置全部写入后才 emit props-configs-change', async () => {
    const sdk = createDslSdk({});
    let hasTextAtEmit: boolean | undefined;
    sdk.props.on('props-configs-change', () => {
      hasTextAtEmit = sdk.props.hasPropsConfig('Text');
    });

    await sdk.props.setPropsConfigs({ Text: [{ name: 'text', text: '文本' }] });

    expect(hasTextAtEmit).toBe(true);
  });

  test('没有传 eventMethodList 时 events 保持为空', () => {
    const sdk = createDslSdk({});
    expect(sdk.events.getEvent('text')).toEqual([]);
    expect(sdk.events.getMethod('text')).toEqual([]);
  });
});
