import { describe, expect, test } from 'vitest';

import { NodeType } from '@tmagic/core';

import props from '@editor/services/props';

test('createId', async () => {
  const id = await props.createId('text');

  expect(id.startsWith('text')).toBeTruthy();
});

describe('setNewItemId', () => {
  test('普通', () => {
    const config = {
      id: 1,
      type: 'text',
    };
    // 将组件与组件的子元素配置中的id都设置成一个新的ID
    props.setNewItemId(config);
    expect(config.id === 1).toBeFalsy();
  });

  test('items', () => {
    const config = {
      id: 1,
      type: NodeType.PAGE,
      items: [
        {
          type: 'text',
          id: 2,
        },
      ],
    };
    props.setNewItemId(config);
    expect(config.id === 1).toBeFalsy();
    expect(config.items[0].id === 2).toBeFalsy();
  });
});

test('getDefaultValue', async () => {
  const value = await props.getDefaultPropsValue('text');
  expect(value.type).toBe('text');
});

describe('props service - 配置/值', () => {
  test('setPropsConfigs / getPropsConfigs / hasPropsConfig', async () => {
    props.setPropsConfigs({
      'my-comp': [{ name: 'text', type: 'text' } as any],
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(props.hasPropsConfig('my-comp')).toBe(true);
    const configs = props.getPropsConfigs();
    expect(configs['my-comp']).toBeDefined();
  });

  test('setPropsValues / getPropsValues / hasPropsValue', async () => {
    props.setPropsValues({
      'my-comp-v': { type: 'my-comp-v', text: 'init' } as any,
    });
    await new Promise((r) => setTimeout(r, 30));
    expect(props.hasPropsValue('my-comp-v')).toBe(true);
    expect(props.getPropsValues()['my-comp-v']).toBeDefined();
  });

  test('getDefaultPropsValue 容器类型带 items', async () => {
    const value: any = await props.getDefaultPropsValue('page');
    expect(value.items).toEqual([]);
  });

  test('setPropsValue 函数式', async () => {
    await props.setPropsValue('fn-comp', () => ({ type: 'fn-comp', text: 'fn' }) as any);
    await new Promise((r) => setTimeout(r, 30));
    expect(props.getPropsValues()['fn-comp']).toBeDefined();
  });

  test('area 走 button 配置', async () => {
    props.setPropsValues({ button: { type: 'button', style: { backgroundColor: '#fff' } } as any });
    await new Promise((r) => setTimeout(r, 30));
    const value = (await props.getPropsValue('area')) as any;
    expect(value.className).toBe('action-area');
  });

  test('getPropsConfig area 走 button', async () => {
    props.setPropsConfigs({ button: [{ name: 'btn', type: 'text' } as any] });
    await new Promise((r) => setTimeout(r, 30));
    const cfg = await props.getPropsConfig('area');
    expect(Array.isArray(cfg)).toBe(true);
  });

  test('setDisabledDataSource / setDisabledCodeBlock', () => {
    props.setDisabledDataSource(true);
    expect(props.getDisabledDataSource()).toBe(true);
    props.setDisabledDataSource(false);

    props.setDisabledCodeBlock(true);
    expect(props.getDisabledCodeBlock()).toBe(true);
    props.setDisabledCodeBlock(false);
  });

  test('resetState 清空配置/值', async () => {
    props.setPropsValues({ x: { type: 'x' } as any });
    await new Promise((r) => setTimeout(r, 30));
    props.resetState();
    expect(props.hasPropsValue('x')).toBe(false);
  });
});
