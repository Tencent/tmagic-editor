/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { ref } from 'vue';

import { useNextFloatBoxPosition } from '@editor/hooks/use-next-float-box-position';

describe('useNextFloatBoxPosition', () => {
  const makeUiService = () =>
    ({
      get: (k: string) => {
        if (k === 'columnWidth') return { left: 200 };
        if (k === 'navMenuRect') return { top: 10, height: 50 };
        return undefined;
      },
    }) as any;

  test('未传 parent 时使用 columnWidth.left', () => {
    const { boxPosition, calcBoxPosition } = useNextFloatBoxPosition(makeUiService());
    calcBoxPosition();
    expect(boxPosition.value).toEqual({ left: 200, top: 60 });
  });

  test('parent 存在时使用其右侧坐标', () => {
    const fakeEl = { getBoundingClientRect: () => ({ left: 30, width: 70 }) } as any;
    const parent = ref<HTMLDivElement | null>(fakeEl);
    const { boxPosition, calcBoxPosition } = useNextFloatBoxPosition(makeUiService(), parent);
    calcBoxPosition();
    expect(boxPosition.value).toEqual({ left: 100, top: 60 });
  });

  test('parent 为空 ref 时回退 columnWidth', () => {
    const parent = ref<HTMLDivElement | null>(null);
    const { boxPosition, calcBoxPosition } = useNextFloatBoxPosition(makeUiService(), parent);
    calcBoxPosition();
    expect(boxPosition.value).toEqual({ left: 200, top: 60 });
  });

  test('columnWidth.left 缺失回退 0', () => {
    const ui = {
      get: (k: string) => {
        if (k === 'columnWidth') return {};
        if (k === 'navMenuRect') return { top: 0, height: 0 };
        return undefined;
      },
    } as any;
    const { boxPosition, calcBoxPosition } = useNextFloatBoxPosition(ui);
    calcBoxPosition();
    expect(boxPosition.value).toEqual({ left: 0, top: 0 });
  });
});
