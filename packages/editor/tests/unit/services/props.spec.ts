import { describe, expect, test } from 'vitest';

import { NodeType } from '@tmagic/schema';

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
