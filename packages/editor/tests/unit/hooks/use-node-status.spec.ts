/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { computed, nextTick, ref } from 'vue';

import { useNodeStatus } from '@editor/hooks/use-node-status';

describe('useNodeStatus', () => {
  test('初始化生成节点状态', () => {
    const data = ref<any[]>([{ id: '1', items: [{ id: '2' }] }]);
    const { nodeStatusMap } = useNodeStatus(computed(() => data.value));
    expect(nodeStatusMap.value.has('1')).toBe(true);
    expect(nodeStatusMap.value.has('2')).toBe(true);
    expect(nodeStatusMap.value.get('1')).toMatchObject({ visible: true, expand: false });
  });

  test('数据变化时复用旧状态', async () => {
    const data = ref<any[]>([{ id: '1' }]);
    const { nodeStatusMap } = useNodeStatus(computed(() => data.value));
    nodeStatusMap.value.get('1').selected = true;

    data.value = [{ id: '1' }, { id: '2' }];
    await nextTick();
    expect(nodeStatusMap.value.get('1').selected).toBe(true);
    expect(nodeStatusMap.value.has('2')).toBe(true);
  });

  test('空数据时为空 Map', () => {
    const data = ref<any[]>([]);
    const { nodeStatusMap } = useNodeStatus(computed(() => data.value));
    expect(nodeStatusMap.value.size).toBe(0);
  });
});
