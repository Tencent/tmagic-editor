/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';

import { AbleActionEventType } from '../../src/const';
import MoveableActionsAble from '../../src/MoveableActionsAble';

describe('MoveableActionsAble', () => {
  test('render 创建操作按钮并触发 handler', () => {
    const handler = vi.fn();
    const customClick = vi.fn();
    const able = MoveableActionsAble(handler, [
      (reactFactory) => ({
        props: { className: 'custom-btn', onClick: customClick },
        children: [reactFactory.createElement('span', {}, 'x')],
      }),
    ]);

    const moveable = {
      getRect: () => ({ rotation: 0 }),
      state: { pos2: [100, 200] },
      useCSS: (_tag: string, _css: string) => 'EditableViewer',
    };
    const created: any[] = [];
    const reactMock = {
      createElement: (type: any, props: any, ...children: any[]) => {
        const el = { type, props, children };
        created.push(el);
        return el;
      },
    };

    const result = able.render(moveable as any, reactMock as any);
    expect(result.type).toBe('EditableViewer');

    const buttons = created.filter((el) => el.type === 'button');
    expect(buttons.length).toBeGreaterThanOrEqual(4);

    buttons.find((b) => b.props?.className?.includes('moveable-rerender-button'))?.props?.onClick?.();
    buttons.find((b) => b.props?.title === '选中父组件')?.props?.onClick?.();
    buttons.find((b) => b.props?.className?.includes('moveable-remove-button'))?.props?.onClick?.();
    buttons.find((b) => b.props?.className === 'custom-btn')?.props?.onClick?.(new MouseEvent('click'));

    expect(handler).toHaveBeenCalledWith(AbleActionEventType.RERENDER);
    expect(handler).toHaveBeenCalledWith(AbleActionEventType.SELECT_PARENT);
    expect(handler).toHaveBeenCalledWith(AbleActionEventType.REMOVE);
    expect(customClick).toHaveBeenCalled();
  });
});
