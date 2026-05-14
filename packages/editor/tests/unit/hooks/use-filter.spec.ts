/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';

import { useFilter } from '@editor/hooks/use-filter';

const buildStatusMap = (ids: string[]) => {
  const map = new Map<string, any>();
  ids.forEach((id) => {
    map.set(id, { visible: true, expand: false, selected: false, draggable: false });
  });
  return ref(map);
};

describe('useFilter', () => {
  test('数据为空时直接返回', () => {
    const data = ref<any[]>([]);
    const map = ref<Map<string, any> | undefined>(new Map());
    const filterMethod = vi.fn(() => false);
    const { filterTextChangeHandler } = useFilter(data, map, filterMethod);
    filterTextChangeHandler('foo');
    expect(filterMethod).not.toHaveBeenCalled();
  });

  test('字符串数组中任一项匹配则节点可见', () => {
    const data = ref<any[]>([{ id: '1', name: 'a', items: [{ id: '2', name: 'b' }] }]);
    const map = buildStatusMap(['1', '2']);
    const filterMethod = (text: string, node: any) => node.name === text;
    const { filterTextChangeHandler } = useFilter(data, map as any, filterMethod);
    filterTextChangeHandler(['b']);
    expect(map.value.get('2').visible).toBe(true);
    expect(map.value.get('1').visible).toBe(true);
  });

  test('未匹配时节点不可见', () => {
    const data = ref<any[]>([{ id: '1', name: 'a' }]);
    const map = buildStatusMap(['1']);
    const filterMethod = () => false;
    const { filterTextChangeHandler } = useFilter(data, map as any, filterMethod);
    filterTextChangeHandler('zzz');
    expect(map.value.get('1').visible).toBe(false);
  });

  test('空字符串数组时所有节点可见', () => {
    const data = ref<any[]>([{ id: '1', name: 'a' }]);
    const map = buildStatusMap(['1']);
    const { filterTextChangeHandler } = useFilter(data, map as any, () => false);
    filterTextChangeHandler([]);
    expect(map.value.get('1').visible).toBe(true);
  });

  test('nodeStatusMap 为 undefined 时不会更新', () => {
    const data = ref<any[]>([{ id: '1', name: 'a' }]);
    const map = ref<Map<string, any> | undefined>(undefined);
    const { filterTextChangeHandler } = useFilter(data, map as any, () => true);
    expect(() => filterTextChangeHandler('a')).not.toThrow();
  });
});
