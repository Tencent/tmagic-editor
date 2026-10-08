// @vitest-environment node
import { describe, expect, test, vi } from 'vitest';
import { isReactive, reactive, toRaw } from 'vue';

import { createDslSdk, DslValidationError, MemoryStorage } from '@editor/sdk';

import { createDsl, createSdk } from './helpers';

describe('createDslSdk', () => {
  test('不传任何参数也能创建，Node 下默认 validateMode 为 strict', async () => {
    const sdk = createDslSdk();
    await sdk.ready;

    expect(sdk.getDsl()).toBeNull();
    expect(sdk.ctx.validateMode).toBe('strict');
    expect(sdk.editor.get('root')).toBeNull();
  });

  test('传入的 DSL 会被深拷贝，不会被修改', async () => {
    const dsl = createDsl();
    const snapshot = JSON.stringify(dsl);
    const sdk = createSdk({ dsl });

    await sdk.editor.update({ id: 'text_1', text: 'changed' } as any);

    expect(JSON.stringify(dsl)).toBe(snapshot);
    expect(sdk.getDsl()!.items[0].items![0].text).toBe('changed');
  });

  test('getDsl 返回的是深拷贝', () => {
    const sdk = createSdk();
    const dsl = sdk.getDsl()!;
    dsl.items.length = 0;

    expect(sdk.getDsl()!.items).toHaveLength(1);
  });

  test('创建后自动选中第一个页面', () => {
    const sdk = createSdk();
    expect(sdk.editor.get('page')?.id).toBe('page_1');
  });

  test('多个实例互相独立', async () => {
    const a = createSdk();
    const b = createSdk();

    await a.editor.remove({ id: 'text_1' } as any);

    expect(a.editor.getNodeById('text_1')).toBeFalsy();
    expect(b.editor.getNodeById('text_1')).toBeTruthy();
  });

  test('add / update / remove / undo / redo', async () => {
    const sdk = createSdk();

    const added = (await sdk.editor.add({ type: 'text', text: 'new' } as any)) as any;
    expect(sdk.editor.getNodeById(added.id)).toBeTruthy();

    await sdk.editor.update({ id: added.id, text: 'updated' } as any);
    expect((sdk.editor.getNodeById(added.id) as any).text).toBe('updated');

    await sdk.editor.undo();
    expect((sdk.editor.getNodeById(added.id) as any).text).toBe('new');

    await sdk.editor.redo();
    expect((sdk.editor.getNodeById(added.id) as any).text).toBe('updated');

    await sdk.editor.remove(sdk.editor.getNodeById(added.id)!);
    expect(sdk.editor.getNodeById(added.id)).toBeFalsy();

    await sdk.editor.undo();
    expect(sdk.editor.getNodeById(added.id)).toBeTruthy();
  });

  test('moveToContainer 把节点移动到容器中', async () => {
    const sdk = createSdk();

    await sdk.editor.moveToContainer({ id: 'text_1' } as any, 'container_1');

    const container = sdk.editor.getNodeById('container_1') as any;
    expect(container.items.map((item: any) => item.id)).toContain('text_1');
  });

  test('setDsl 整体替换并写入新的 root', async () => {
    const sdk = createSdk();
    const next = createDsl();
    next.items[0].id = 'page_2';

    await sdk.setDsl(next);
    expect(sdk.getDsl()!.items[0].id).toBe('page_2');
    expect(sdk.editor.get('page')?.id).toBe('page_2');

    await sdk.setDsl(null);
    expect(sdk.getDsl()).toBeNull();
  });

  test('历史快照可以导出后在新实例中恢复（无状态使用）', async () => {
    const first = createSdk();
    await first.editor.update({ id: 'text_1', text: 'step1' } as any);
    await first.editor.update({ id: 'text_1', text: 'step2' } as any);

    const dsl = first.getDsl()!;
    const history = JSON.parse(JSON.stringify(first.serializeHistory()));

    const second = createSdk({ dsl, history });
    expect((second.editor.getNodeById('text_1') as any).text).toBe('step2');

    await second.editor.undo();
    expect((second.editor.getNodeById('text_1') as any).text).toBe('step1');

    await second.editor.undo();
    expect((second.editor.getNodeById('text_1') as any).text).toBe('${ds_1.name}');
  });

  test('登记表：属性配置 / 属性默认值 / 事件 / 数据源配置', async () => {
    const sdk = createSdk({
      propsConfigs: { text: [{ name: 'text', text: '文本' }] },
      propsValues: { text: { text: '默认文案' } },
      eventMethodList: {
        text: { events: [{ label: 'click', value: 'click' }], methods: [{ label: 'm', value: 'm' }] },
      },
      datasourceList: [{ type: 'custom', text: '自定义' }],
      datasourceConfigs: { custom: [{ name: 'a', text: 'a' }] },
      datasourceValues: { custom: { title: 'custom' } as any },
      datasourceEventMethodList: {
        custom: { events: [{ label: 'e', value: 'e' }], methods: [{ label: 'm', value: 'm' }] },
      },
      disabledCodeBlock: true,
      disabledDataSource: true,
      disabledMultiSelect: true,
      alwaysMultiSelect: true,
      disabledPageFragment: true,
    });
    await sdk.ready;

    expect(JSON.stringify(await sdk.props.getPropsConfig('text'))).toContain('"text":"文本"');
    expect(((await sdk.props.getPropsValue('text')) as any).text).toBe('默认文案');
    expect(sdk.events.getEvent('text')).toHaveLength(1);
    expect(sdk.events.getMethod('text')).toHaveLength(1);
    expect(sdk.dataSource.get('datasourceTypeList')).toHaveLength(1);
    expect(sdk.dataSource.getFormConfig('custom')).toContainEqual({ name: 'a', text: 'a' });
    expect(sdk.dataSource.getFormEvent('custom')).toHaveLength(1);
    expect(sdk.dataSource.getFormMethod('custom')).toHaveLength(1);
    expect(sdk.props.getDisabledCodeBlock()).toBe(true);
    expect(sdk.props.getDisabledDataSource()).toBe(true);
    expect(sdk.editor.get('disabledMultiSelect')).toBe(true);
    expect(sdk.editor.get('alwaysMultiSelect')).toBe(true);
    expect(sdk.editor.getConfig().disabledPageFragment).toBe(true);
  });

  test('默认使用 Vue 的响应式实现', () => {
    const sdk = createSdk();
    expect(sdk.ctx.reactivity.reactive).toBe(reactive);
    expect(sdk.ctx.reactivity.toRaw).toBe(toRaw);
    expect(isReactive(sdk.ctx.reactivity.reactive({ a: 1 }))).toBe(true);
    expect(toRaw(sdk.ctx.reactivity.reactive(sdk.ctx.reactivity.reactive({ a: 1 })))).toEqual({ a: 1 });
  });

  test('注入 reactivity 与 storage', async () => {
    const reactiveSpy = vi.fn(<T>(v: T) => v);
    const storage = new MemoryStorage();
    const sdk = createSdk({ reactivity: { reactive: reactiveSpy as any }, storage });

    expect(reactiveSpy).toHaveBeenCalled();

    await sdk.editor.copy({ id: 'text_1', type: 'text' } as any);
    expect(storage.length).toBeGreaterThan(0);
  });

  test('parseDSL 可注入，用于还原带函数的存储内容', () => {
    // eslint-disable-next-line no-eval
    const parseDSL = vi.fn((code: string) => eval(code));
    const sdk = createSdk({ parseDSL });

    sdk.storage.setItem('fn', () => 1, { protocol: 'object' as any });
    const value = sdk.storage.getItem('fn', { protocol: 'object' as any });

    expect(parseDSL).toHaveBeenCalled();
    expect(typeof value).toBe('function');
  });

  test('autoWiring 为 false 时不收集依赖，bindWiring 之后再绑定', async () => {
    const sdk = createSdk({ autoWiring: false });
    expect(sdk.getDsl()!.dataSourceDeps).toBeUndefined();

    const unbind = sdk.bindWiring();
    await sdk.setDsl(createDsl());
    expect(sdk.getDsl()!.dataSourceDeps!.ds_1.text_1).toBeDefined();

    // 重复调用不会重复绑定
    sdk.bindWiring();
    unbind();
    await sdk.editor.update({ id: 'text_1', text: 'plain' } as any);
    expect(sdk.getDsl()!.dataSourceDeps!.ds_1.text_1).toBeDefined();
  });

  test('strict 模式下校验失败抛出 DslValidationError 且不修改 DSL', async () => {
    const sdk = createSdk();
    const before = JSON.stringify(sdk.getDsl());

    const error = await sdk.editor.add({ type: 'unknown-type' } as any).catch((e) => e);

    expect(error).toBeInstanceOf(DslValidationError);
    expect(error.errors[0].kind).toBe('structure');
    expect(JSON.stringify(sdk.getDsl())).toBe(before);
  });

  test('destroy 后可以重复调用', () => {
    const sdk = createSdk();
    sdk.destroy();
    expect(() => sdk.destroy()).not.toThrow();
  });
});
