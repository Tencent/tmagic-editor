// @vitest-environment node
import { describe, expect, test } from 'vitest';

import { createDslSdk, defaultParseDSL, DslValidationError } from '@editor/sdk';

import { createDsl, createSdk } from './helpers';

const styleConfig = [
  {
    name: 'style',
    items: [{ name: 'width', text: '宽', rules: [{ required: true }] }, { name: 'color' }],
  },
];

const createStyledSdk = (validateMode: 'strict' | 'record' = 'strict') => {
  const dsl = createDsl() as any;
  dsl.items[0].items[0].style = { width: 100 };
  return createSdk({ dsl, validateMode, propsConfigs: { text: styleConfig } as any });
};

describe('strict 校验与 update 的合并语义一致', () => {
  test('深合并的局部更新不会因为缺少已有的必填字段被拒绝', async () => {
    const sdk = createStyledSdk();
    await sdk.ready;

    await expect(sdk.editor.update({ id: 'text_1', style: { color: 'red' } } as any)).resolves.toBeTruthy();
    expect((sdk.editor.getNodeById('text_1') as any).style).toEqual({ width: 100, color: 'red' });
  });

  test('replace 时按传入配置整体校验：丢掉必填字段会被拒绝', async () => {
    const sdk = createStyledSdk();
    await sdk.ready;

    const error = await sdk.editor
      .update({ id: 'text_1', type: 'text', style: { color: 'red' } } as any, { replace: true })
      .catch((e) => e);

    expect(error).toBeInstanceOf(DslValidationError);
    expect((sdk.editor.getNodeById('text_1') as any).style).toEqual({ width: 100 });
  });
});

describe('校验失败不污染后续历史记录', () => {
  test('被拒绝的 moveToContainer 不会留下过期快照', async () => {
    const sdk = createSdk();
    await sdk.ready;

    await sdk.editor.select('text_1');
    await expect(sdk.editor.moveToContainer({ id: 'button_1' } as any, 'text_1')).rejects.toBeInstanceOf(
      DslValidationError,
    );

    await sdk.editor.select('button_1');
    await sdk.editor.update({ id: 'button_1', text: 'changed' } as any);

    const steps = sdk.history.getStepList('page', sdk.editor.get('page')!.id);
    expect((steps[steps.length - 1].step as any).extra.selectedBefore).toEqual(['button_1']);
  });

  test('被拒绝的 update 之后，下一条历史记录的选区快照来自它自己', async () => {
    const sdk = createSdk({
      propsConfigs: { text: [{ name: 'text', rules: [{ required: true }] }] } as any,
    });
    await sdk.ready;

    await sdk.editor.select('text_1');
    await expect(sdk.editor.update({ id: 'text_1', text: '' } as any)).rejects.toBeInstanceOf(DslValidationError);

    // 换一个选区后再做一次成功的操作
    await sdk.editor.select('button_1');
    await sdk.editor.update({ id: 'button_1', text: 'changed' } as any);

    const pageId = sdk.editor.get('page')!.id;
    const steps = sdk.history.getStepList('page', pageId);
    const last = steps[steps.length - 1].step as any;
    expect(last.extra.selectedBefore).toEqual(['button_1']);
  });

  test('被拒绝的 add 同样不会留下过期快照', async () => {
    const sdk = createSdk();
    await sdk.ready;

    await sdk.editor.select('text_1');
    await expect(sdk.editor.add({ type: 'not-exist' } as any)).rejects.toBeInstanceOf(DslValidationError);

    await sdk.editor.select('button_1');
    await sdk.editor.update({ id: 'button_1', text: 'changed' } as any);

    const steps = sdk.history.getStepList('page', sdk.editor.get('page')!.id);
    expect((steps[steps.length - 1].step as any).extra.selectedBefore).toEqual(['button_1']);
  });
});

describe('依赖收集：同一批更新里数据源引用与方法一起变化', () => {
  test('dataSourceMethodDeps 不会丢失', async () => {
    const dsl = createDsl() as any;
    dsl.dataSources[0].methods = [{ name: 'refresh', content: '() => {}', params: [] }];
    const sdk = createSdk({ dsl, validateMode: 'off' });
    await sdk.ready;

    await sdk.editor.update({
      id: 'text_1',
      text: '${ds_1.name}x',
      action: ['ds_1', 'refresh'],
    } as any);

    const out = sdk.getDsl() as any;
    expect(out.dataSourceDeps.ds_1.text_1).toBeTruthy();
    expect(out.dataSourceMethodDeps.ds_1.text_1).toBeTruthy();
  });

  test('一个节点有多条未命中的 changeRecord 时只归类一次', async () => {
    const { classifyUpdatedNodes } = await import('@editor/sdk');
    const node: any = { id: 'n1', type: 'text' };
    const result = classifyUpdatedNodes({ dep: { getTargets: () => ({}) } } as any, [
      {
        newNode: node,
        oldNode: node,
        changeRecords: [
          { propPath: 'a', value: 1 },
          { propPath: 'b', value: 2 },
        ],
      },
    ]);
    expect(result.normalNodes).toHaveLength(1);
    expect(result.needRecollectNodes).toHaveLength(0);
  });
});

describe('历史快照还原', () => {
  test('默认 parseDSL 无法解析函数时给出明确的错误', () => {
    expect(() => defaultParseDSL('({"a":() => 1})')).toThrow('默认的 parseDSL 只能解析 JSON');
  });

  test('传入自己的 parseDSL 后带函数的历史可以往返', async () => {
    // eslint-disable-next-line no-new-func
    const parseDSL = (code: string) => new Function(`return ${code}`)();
    const sdk = createSdk({ parseDSL, validateMode: 'off' });
    await sdk.ready;
    await sdk.editor.update({ id: 'text_1', onClick: () => 1 } as any);

    const snapshot = JSON.parse(JSON.stringify(sdk.serializeHistory()));
    expect(() => createDslSdk({ dsl: sdk.getDsl(), history: snapshot, parseDSL, validateMode: 'off' })).not.toThrow();
  });

  test('extra 里只有已知的 Map 字段会被转换，其他字段原样保留', async () => {
    const sdk = createSdk({ validateMode: 'off' });
    await sdk.ready;
    await sdk.editor.update({ id: 'text_1', text: 'a' } as any);

    const snapshot = sdk.history.serialize({ jsonSafe: true });
    const list = Object.values(snapshot.steps.page)[0].elementList as any[];
    const step = list.find((item) => item.extra);
    step.extra.custom = new Map([['k', 'v']]);

    const restored = createSdk({ dsl: sdk.getDsl(), history: snapshot, validateMode: 'off' });
    const restoredStep = (Object.values(restored.history.serialize().steps.page)[0].elementList as any[]).find(
      (item) => item.extra,
    );
    expect(restoredStep.extra.modifiedNodeIds).toBeInstanceOf(Map);
    expect(restoredStep.extra.custom).toBeInstanceOf(Map);
  });
});
