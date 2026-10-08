// @vitest-environment node
import { describe, expect, test } from 'vitest';

import { DslValidationError } from '@editor/sdk';

import { createDsl, createSdk } from './helpers';

const textConfig = [{ name: 'text', text: '文本', rules: [{ required: true, message: '必填' }] }];

describe('validate: 结构', () => {
  test('组件类型不在组件列表中', async () => {
    const sdk = createSdk();
    const error = await sdk.editor.add({ type: 'not-exist' } as any).catch((e) => e);

    expect(error).toBeInstanceOf(DslValidationError);
    expect(error.errors[0]).toMatchObject({ kind: 'structure', path: 'type' });
    expect(error.errors[0].suggestion).toContain('text');
    expect(error.message).toContain('not-exist');
  });

  test('内置类型不需要出现在组件列表里；组件列表为空时不校验类型', async () => {
    const sdk = createSdk({ componentGroupList: [] });
    await expect(sdk.editor.add({ type: 'anything' } as any)).resolves.toBeTruthy();

    const sdk2 = createSdk();
    await expect(sdk2.editor.add({ type: 'container' } as any)).resolves.toBeTruthy();
  });

  test('类型比较忽略大小写写法差异（驼峰与下划线）', async () => {
    const sdk = createSdk({
      componentGroupList: [{ title: 'g', items: [{ text: 'a', type: 'page-fragment-container' }] }],
    });
    await expect(sdk.editor.add({ type: 'pageFragmentContainer' } as any)).resolves.toBeTruthy();
  });

  test('缺少 type', async () => {
    const sdk = createSdk();
    await expect(sdk.editor.add({} as any)).rejects.toThrow('组件类型不能为空');
  });

  test('父节点不是容器', async () => {
    const sdk = createSdk();
    const error = await sdk.editor
      .add({ type: 'text' } as any, sdk.editor.getNodeById('text_1') as any)
      .catch((e) => e);

    expect(error).toBeInstanceOf(DslValidationError);
    expect(error.errors[0].message).toContain('不是容器');
  });

  test('app 下只能添加页面', async () => {
    const sdk = createSdk();
    const error = await sdk.editor.add({ type: 'text' } as any, sdk.editor.get('root') as any).catch((e) => e);

    expect(error).toBeInstanceOf(DslValidationError);
    expect(error.errors[0].message).toContain('app 下只能添加页面');
  });

  test('可以添加页面（页面总是添加到 app 下）', async () => {
    const sdk = createSdk();
    await expect(sdk.editor.add({ type: 'page', name: 'p2' } as any)).resolves.toBeTruthy();
    expect(sdk.getDsl()!.items).toHaveLength(2);
  });

  test('checkAddStructure：页面 / 页面片只能放在 app 下，没有父节点', () => {
    const sdk = createSdk();
    const container = sdk.editor.getNodeById('container_1') as any;

    expect(sdk.validate.checkAddStructure({ id: 'p', type: 'page' } as any, container)[0].message).toContain(
      '只能添加到 app',
    );
    expect(sdk.validate.checkAddStructure({ id: 't', type: 'text' } as any, null)[0].message).toContain('未找到父节点');
  });

  test('id 已存在 / 批量里 id 重复', async () => {
    const sdk = createSdk();

    const exists = await sdk.editor.add([{ id: 'text_1', type: 'text' }] as any).catch((e) => e);
    expect(exists.errors[0].message).toContain('已存在');

    const dup = await sdk.editor
      .add([
        { id: 'new_1', type: 'text' },
        { id: 'new_1', type: 'text' },
      ] as any)
      .catch((e) => e);
    expect(dup.errors[0].message).toContain('重复');
  });

  test('disabledPageFragment', async () => {
    const sdk = createSdk({ disabledPageFragment: true });
    const error = await sdk.editor.add({ type: 'page-fragment' } as any).catch((e) => e);

    expect(error).toBeInstanceOf(DslValidationError);
    expect(error.errors[0].message).toContain('disabledPageFragment');
  });

  test('canDropIn 返回 false 时阻止添加与移动', async () => {
    const calls: any[] = [];
    const sdk = createSdk({
      canDropIn: (...args) => {
        calls.push(args);
        return false;
      },
    });

    const container = sdk.editor.getNodeById('container_1') as any;
    const add = await sdk.editor.add({ type: 'text' } as any, container).catch((e) => e);
    expect(add).toBeInstanceOf(DslValidationError);
    expect(calls[0]).toEqual([[], 'container_1', 'stage-add']);

    const move = await sdk.editor.moveToContainer({ id: 'text_1' } as any, 'container_1').catch((e) => e);
    expect(move).toBeInstanceOf(DslValidationError);
    expect(calls.at(-1)).toEqual([['text_1'], 'container_1', 'stage-drag']);

    const drag = await sdk.editor.dragTo({ id: 'text_1' } as any, container, 0).catch((e) => e);
    expect(drag).toBeInstanceOf(DslValidationError);
    expect(calls.at(-1)[2]).toBe('layer');
  });

  test('canDropIn 重定向到不存在的节点 / 非容器时报错，重定向到容器时放行', async () => {
    const sdk = createSdk({ canDropIn: () => 'nothing' });
    const container = sdk.editor.getNodeById('container_1') as any;
    const bad = await sdk.editor.add({ type: 'text' } as any, container).catch((e) => e);
    expect(bad.errors[0].message).toContain('重定向');

    const ok = createSdk({ canDropIn: () => 'container_1' });
    await expect(
      ok.editor.add({ type: 'text' } as any, ok.editor.getNodeById('container_1') as any),
    ).resolves.toBeTruthy();
  });

  test('移动：目标不是容器 / 移到自己里面 / 源节点不存在', async () => {
    const sdk = createSdk();

    const notContainer = await sdk.editor.moveToContainer({ id: 'button_1' } as any, 'text_1').catch((e) => e);
    expect(notContainer.errors[0].message).toContain('不是容器');

    const inside = await sdk.editor.moveToContainer({ id: 'container_1' } as any, 'container_1').catch((e) => e);
    expect(inside.errors[0].message).toContain('自己');

    const missing = await sdk.editor.moveToContainer({ id: 'nope' } as any, 'container_1').catch((e) => e);
    expect(missing.errors[0].message).toContain('不存在');
  });

  test('update：节点不存在 / 修改类型', async () => {
    const sdk = createSdk();

    const missing = await sdk.editor.update({ id: 'nope', text: 'x' } as any).catch((e) => e);
    expect(missing).toBeInstanceOf(DslValidationError);

    const typeChange = await sdk.editor.update({ id: 'text_1', type: 'button' } as any).catch((e) => e);
    expect(typeChange.errors[0].message).toContain('不允许修改节点类型');
  });

  test('update 根节点不做校验', async () => {
    const sdk = createSdk();
    await expect(sdk.editor.update({ id: 'app_1', name: 'renamed' } as any)).resolves.toBeTruthy();
  });

  test('数据源：类型不可用时 add / update 抛错', () => {
    const sdk = createSdk({ datasourceList: [{ type: 'custom', text: '自定义' }] });

    expect(() => sdk.dataSource.add({ id: 'ds_x', type: 'unknown' } as any)).toThrow(DslValidationError);
    expect(() => sdk.dataSource.update({ id: 'ds_1', type: 'unknown' } as any)).toThrow(DslValidationError);
    expect(() =>
      sdk.dataSource.add({ id: 'ds_y', type: 'custom', fields: [], methods: [], events: [] } as any),
    ).not.toThrow();
  });
});

describe('validate: 属性', () => {
  test('add 时校验属性表单', async () => {
    const sdk = createSdk({ propsConfigs: { text: textConfig }, propsValues: { text: { text: '' } } });
    await sdk.ready;

    const error = await sdk.editor.add({ type: 'text' } as any).catch((e) => e);
    expect(error).toBeInstanceOf(DslValidationError);
    expect(error.errors[0]).toMatchObject({ kind: 'props', target: 'node' });
    expect(error.errors[0].message).toContain('必填');

    await expect(sdk.editor.add({ type: 'text', text: 'ok' } as any)).resolves.toBeTruthy();
  });

  test('update 时校验合并之后的属性', async () => {
    const sdk = createSdk({ propsConfigs: { text: textConfig } });
    await sdk.ready;

    const error = await sdk.editor.update({ id: 'text_1', text: '' } as any).catch((e) => e);
    expect(error).toBeInstanceOf(DslValidationError);
    expect((sdk.editor.getNodeById('text_1') as any).text).toBe('${ds_1.name}');

    await expect(sdk.editor.update({ id: 'text_1', text: 'good' } as any)).resolves.toBeTruthy();
  });

  test('取属性配置时抛错，作为校验异常上报', async () => {
    const sdk = createSdk();
    sdk.props.usePlugin({
      beforeGetPropsConfig: () => {
        throw new Error('boom');
      },
    });

    const result = await sdk.validate.node('text_1');
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('boom');
  });

  test('checkNodeProps：没有配置 / root 不校验', async () => {
    const sdk = createSdk();
    expect(await sdk.validate.checkNodeProps({ id: 'a', type: 'unknown-without-config' } as any)).toEqual([]);
    expect(await sdk.validate.checkNodeProps({ id: 'app_1', type: 'app' } as any)).toEqual([]);
  });
});

describe('validate: 查询接口', () => {
  test('node()', async () => {
    const sdk = createSdk({ propsConfigs: { text: textConfig } });
    await sdk.ready;

    expect((await sdk.validate.node('button_1')).valid).toBe(true);
    expect(await sdk.validate.node('nope')).toMatchObject({ valid: false });

    sdk.ctx.validateMode = 'off';
    await sdk.editor.update({ id: 'text_1', text: '' } as any);

    const result = await sdk.validate.node('text_1');
    expect(result.valid).toBe(false);
    expect(result.errors[0].kind).toBe('props');
  });

  test('node() 能发现已经在 DSL 中的非法类型 / 被禁用的页面片', async () => {
    const dsl = createDsl();
    dsl.items[0].items!.push({ id: 'weird', type: 'weird-type' } as any);
    dsl.items.push({ id: 'frag_1', type: 'page-fragment', items: [] } as any);

    const sdk = createSdk({ dsl, disabledPageFragment: true });

    expect((await sdk.validate.node('weird')).errors[0].message).toContain('weird-type');
    expect((await sdk.validate.node('frag_1')).errors[0].message).toContain('disabledPageFragment');
  });

  test('dataSource()', async () => {
    const dsl = createDsl();
    dsl.dataSources![0].title = '';
    const sdk = createSdk({ dsl });

    expect((await sdk.validate.dataSource('nope')).valid).toBe(false);

    const result = await sdk.validate.dataSource('ds_1');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatchObject({ target: 'data-source', kind: 'props' });
  });

  test('dsl()：汇总整份 DSL 的问题', async () => {
    const dsl = createDsl();
    dsl.items[0].items!.push({ id: 'text_1', type: 'text' } as any, { id: 'text_2', type: 'text', text: '' } as any);

    const sdk = createSdk({ dsl, propsConfigs: { text: textConfig } });
    await sdk.ready;

    const result = await sdk.validate.dsl();
    expect(result.valid).toBe(false);
    expect(result.errors.some((item) => item.message.includes('重复'))).toBe(true);
    expect(result.errors.some((item) => item.kind === 'props')).toBe(true);

    expect((await createSdk({ dsl: null }).validate.dsl()).errors[0].target).toBe('dsl');
    expect((await createSdk().validate.dsl()).valid).toBe(true);
  });
});

describe('validateMode', () => {
  test('off：不校验', async () => {
    const sdk = createSdk({ validateMode: 'off' });
    await expect(sdk.editor.add({ type: 'not-exist' } as any)).resolves.toBeTruthy();
    expect(() => sdk.dataSource.add({ id: 'ds_z', type: 'unknown' } as any)).not.toThrow();
    await expect(sdk.editor.moveToContainer({ id: 'text_1' } as any, 'container_1')).resolves.toBeTruthy();
  });

  test('record：不抛错，错误写进 invalidNodeIds', async () => {
    const sdk = createSdk({ validateMode: 'record', propsConfigs: { text: textConfig } });
    await sdk.ready;

    await sdk.editor.update({ id: 'text_1', text: '' } as any);
    expect(sdk.editor.getInvalidNodeInfo('text_1')?.props).toContain('必填');

    await sdk.editor.update({ id: 'text_1', text: 'fixed' } as any);
    expect(sdk.editor.getInvalidNodeInfo('text_1')).toBeUndefined();

    // 结构问题同样只记录
    const added = (await sdk.editor.add({ type: 'text' } as any)) as any;
    expect(added).toBeTruthy();
    expect(sdk.editor.getInvalidNodeInfo(added.id)?.props).toContain('必填');

    // 数据源 / 移动只在 strict 模式下校验
    expect(() => sdk.dataSource.add({ id: 'ds_z', type: 'unknown' } as any)).not.toThrow();
    await expect(sdk.editor.moveToContainer({ id: 'text_1' } as any, 'container_1')).resolves.toBeTruthy();
  });

  test('运行时切换 validateMode', async () => {
    const sdk = createSdk();
    sdk.ctx.validateMode = 'off';
    await expect(sdk.editor.add({ type: 'not-exist' } as any)).resolves.toBeTruthy();
  });
});
