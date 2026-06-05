/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import codeBlockService from '@editor/services/codeBlock';
import historyService from '@editor/services/history';
import storageService, { Protocol } from '@editor/services/storage';
import { CODE_DRAFT_STORAGE_KEY } from '@editor/type';
import { setEditorConfig } from '@editor/utils/config';
import { COPY_CODE_STORAGE_KEY } from '@editor/utils/editor';

vi.mock('@editor/services/editor', () => ({
  default: {
    getNodeById: vi.fn((id: string) => ({ id, code: 'code1' })),
  },
}));

beforeAll(() => {
  setEditorConfig({
    // eslint-disable-next-line no-new-func
    parseDSL: ((str: string) => new Function(`return ${str}`)()) as any,
  } as any);
});

beforeEach(() => {
  codeBlockService.resetState();
  historyService.reset();
  globalThis.localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('CodeBlockService - 基础', () => {
  test('setCodeDsl / getCodeDsl 保存并触发事件', async () => {
    const fn = vi.fn();
    codeBlockService.on('code-dsl-change', fn);
    await codeBlockService.setCodeDsl({ a: { name: 'a', content: 'x' } } as any);
    expect(codeBlockService.getCodeDsl()).toEqual({ a: { name: 'a', content: 'x' } });
    expect(fn).toHaveBeenCalled();
    codeBlockService.off('code-dsl-change', fn);
  });

  test('getCodeContentById - 没有 dsl 或 id 返回 null', () => {
    expect(codeBlockService.getCodeContentById('')).toBeNull();
    expect(codeBlockService.getCodeContentById('any')).toBeNull();
  });

  test('getCodeContentById - 取得现有内容', async () => {
    await codeBlockService.setCodeDsl({ x: { name: 'X' } } as any);
    expect(codeBlockService.getCodeContentById('x')).toEqual({ name: 'X' });
    expect(codeBlockService.getCodeContentById('y')).toBeNull();
  });

  test('setCodeDslByIdSync - 没有 dsl 时抛错', () => {
    expect(() => codeBlockService.setCodeDslByIdSync('id', {} as any)).toThrow('dsl中没有codeBlocks');
  });

  test('setCodeDslByIdSync - 已存在且 force=false 时跳过', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'A' } } as any);
    codeBlockService.setCodeDslByIdSync('a', { name: 'NEW' } as any, false);
    expect(codeBlockService.getCodeContentById('a')?.name).toBe('A');
  });

  test('setCodeDslByIdSync - content 为字符串时被 parseDSL 转换', async () => {
    await codeBlockService.setCodeDsl({} as any);
    codeBlockService.setCodeDslByIdSync('a', { name: 'A', content: '() => 42' } as any);
    const item = codeBlockService.getCodeContentById('a') as any;
    expect(typeof item.content).toBe('function');
    expect(item.content()).toBe(42);
  });

  test('setCodeDslByIdSync - 触发 addOrUpdate 事件', async () => {
    await codeBlockService.setCodeDsl({} as any);
    const fn = vi.fn();
    codeBlockService.on('addOrUpdate', fn);
    codeBlockService.setCodeDslByIdSync('id', { name: 'a' } as any);
    expect(fn).toHaveBeenCalledWith('id', expect.any(Object));
    codeBlockService.off('addOrUpdate', fn);
  });

  test('getCodeDslByIds 仅返回指定 ids', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'a' }, b: { name: 'b' } } as any);
    expect(codeBlockService.getCodeDslByIds(['a'])).toEqual({ a: { name: 'a' } });
  });

  test('编辑状态 / combineIds / undeletableList', async () => {
    expect(codeBlockService.getEditStatus()).toBe(true);
    await codeBlockService.setEditStatus(false);
    expect(codeBlockService.getEditStatus()).toBe(false);

    await codeBlockService.setCombineIds(['a', 'b']);
    expect(codeBlockService.getCombineIds()).toEqual(['a', 'b']);

    await codeBlockService.setUndeleteableList(['x']);
    expect(codeBlockService.getUndeletableList()).toEqual(['x']);
  });

  test('代码草稿 set/get/remove', () => {
    codeBlockService.setCodeDraft('id', 'draft');
    expect(globalThis.localStorage.getItem(`${CODE_DRAFT_STORAGE_KEY}_id`)).toBe('draft');
    expect(codeBlockService.getCodeDraft('id')).toBe('draft');
    codeBlockService.removeCodeDraft('id');
    expect(codeBlockService.getCodeDraft('id')).toBeNull();
  });

  test('deleteCodeDslByIds 删除并触发 remove 事件', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'a' }, b: { name: 'b' } } as any);
    const fn = vi.fn();
    codeBlockService.on('remove', fn);
    await codeBlockService.deleteCodeDslByIds(['a', 'b']);
    expect(codeBlockService.getCodeDsl()).toEqual({});
    expect(fn).toHaveBeenCalledTimes(2);
    codeBlockService.off('remove', fn);
  });

  test('deleteCodeDslByIds - dsl 为空时直接返回', async () => {
    await expect(codeBlockService.deleteCodeDslByIds(['x'])).resolves.toBeUndefined();
  });

  test('paramsColConfig set/get', () => {
    const cfg = { type: 'row', items: [] } as any;
    codeBlockService.setParamsColConfig(cfg);
    expect(codeBlockService.getParamsColConfig()).toEqual(cfg);
  });

  test('getUniqueId 在重复时再次取', async () => {
    let count = 0;
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      count += 1;
      return count === 1 ? 0.111111111 : 0.222222222;
    });
    await codeBlockService.setCodeDsl({ code_1111: { name: 'x' } } as any);
    const id = await codeBlockService.getUniqueId();
    expect(id.startsWith('code_')).toBe(true);
    expect(id).not.toBe('code_1111');
    random.mockRestore();
  });

  test('paste - 不覆盖现有 id', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'A' } } as any);
    storageService.setItem(
      COPY_CODE_STORAGE_KEY,
      { a: { name: 'OTHER' }, b: { name: 'B' } },
      { protocol: Protocol.OBJECT },
    );

    codeBlockService.paste();
    expect(codeBlockService.getCodeContentById('a')?.name).toBe('A');
    expect(codeBlockService.getCodeContentById('b')?.name).toBe('B');
  });

  test('copyWithRelated - 没有 collectorOptions 时仅写空对象', () => {
    codeBlockService.copyWithRelated([]);
    const stored = storageService.getItem(COPY_CODE_STORAGE_KEY, { protocol: Protocol.OBJECT });
    expect(stored).toEqual({});
  });

  test('destroy 清空 listeners 与 plugin', () => {
    const fn = vi.fn();
    codeBlockService.on('addOrUpdate', fn);
    codeBlockService.destroy();
    codeBlockService.emit('addOrUpdate', 'a');
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('CodeBlockService - 历史记录接入', () => {
  test('setCodeDslByIdSync - 新增时入历史（oldContent=null）', async () => {
    await codeBlockService.setCodeDsl({} as any);
    codeBlockService.setCodeDslByIdSync('new_code', { name: 'A' } as any);

    expect(historyService.canUndoCodeBlock('new_code')).toBe(true);
    const step = historyService.undoCodeBlock('new_code');
    expect(step?.oldContent).toBeNull();
    expect(step?.newContent).toEqual(expect.objectContaining({ name: 'A' }));
  });

  test('setCodeDslByIdSync - 更新时入历史（oldContent / newContent 都非空）', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'A' } } as any);
    codeBlockService.setCodeDslByIdSync('a', { name: 'A2' } as any);

    const step = historyService.undoCodeBlock('a');
    expect(step?.oldContent).toEqual({ name: 'A' });
    expect(step?.newContent).toEqual(expect.objectContaining({ name: 'A2' }));
  });

  test('setCodeDslByIdSync - force=false 已存在时不入历史', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'A' } } as any);
    codeBlockService.setCodeDslByIdSync('a', { name: 'A2' } as any, false);
    expect(historyService.canUndoCodeBlock('a')).toBe(false);
  });

  test('deleteCodeDslByIds - 删除已存在的代码块入历史（newContent=null）', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'A' }, b: { name: 'B' } } as any);
    await codeBlockService.deleteCodeDslByIds(['a']);

    const step = historyService.undoCodeBlock('a');
    expect(step?.oldContent).toEqual({ name: 'A' });
    expect(step?.newContent).toBeNull();
  });

  test('deleteCodeDslByIds - 删除不存在的 id 不入历史', async () => {
    await codeBlockService.setCodeDsl({} as any);
    await codeBlockService.deleteCodeDslByIds(['ghost']);
    expect(historyService.canUndoCodeBlock('ghost')).toBe(false);
  });

  test('setCodeDslByIdSync - 携带 changeRecords 时写入历史 step', async () => {
    historyService.reset();
    await codeBlockService.setCodeDsl({ a: { name: 'A' } } as any);
    codeBlockService.setCodeDslByIdSync('a', { name: 'A2' } as any, true, {
      changeRecords: [{ propPath: 'name', value: 'A2' }],
    });

    const step = historyService.undoCodeBlock('a');
    expect(step?.changeRecords).toEqual([{ propPath: 'name', value: 'A2' }]);
  });

  test('setCodeDslByIdSync - 不传 changeRecords 时 step.changeRecords 为 undefined', async () => {
    historyService.reset();
    await codeBlockService.setCodeDsl({ a: { name: 'A' } } as any);
    codeBlockService.setCodeDslByIdSync('a', { name: 'A2' } as any);

    const step = historyService.undoCodeBlock('a');
    expect(step?.changeRecords).toBeUndefined();
  });
});

describe('CodeBlockService - *AndGetHistoryId', () => {
  const lastStepUuid = (id: string) => {
    const list = historyService.getCodeBlockStepList(id);
    return list[list.length - 1]?.step.uuid;
  };

  test('setCodeDslByIdSyncAndGetHistoryId 返回本次写入历史记录的 uuid', async () => {
    await codeBlockService.setCodeDsl({} as any);

    const historyId = codeBlockService.setCodeDslByIdSyncAndGetHistoryId('a', { name: 'A' } as any);
    expect(typeof historyId).toBe('string');
    expect(historyId).toBe(lastStepUuid('a'));
    // 与默认行为一致：内容仍被写入
    expect(codeBlockService.getCodeContentById('a')?.name).toBe('A');
  });

  test('setCodeDslByIdSyncAndGetHistoryId - force=false 已存在时返回 null', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'A' } } as any);
    const historyId = codeBlockService.setCodeDslByIdSyncAndGetHistoryId('a', { name: 'NEW' } as any, false);
    expect(historyId).toBeNull();
  });

  test('setCodeDslByIdSyncAndGetHistoryId - doNotPushHistory 时返回 null', async () => {
    await codeBlockService.setCodeDsl({} as any);
    const historyId = codeBlockService.setCodeDslByIdSyncAndGetHistoryId('a', { name: 'A' } as any, true, {
      doNotPushHistory: true,
    });
    expect(historyId).toBeNull();
  });

  test('setCodeDslByIdAndGetHistoryId（async）返回本次写入历史记录的 uuid', async () => {
    await codeBlockService.setCodeDsl({} as any);

    const historyId = await codeBlockService.setCodeDslByIdAndGetHistoryId('a', { name: 'A' } as any);
    expect(typeof historyId).toBe('string');
    expect(historyId).toBe(lastStepUuid('a'));
  });

  test('deleteCodeDslByIdsAndGetHistoryId 返回每条删除记录的 uuid 数组', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'A' }, b: { name: 'B' } } as any);

    const historyIds = await codeBlockService.deleteCodeDslByIdsAndGetHistoryId(['a', 'b']);
    expect(Array.isArray(historyIds)).toBe(true);
    expect(historyIds).toHaveLength(2);
    expect(historyIds[0]).toBe(lastStepUuid('a'));
    expect(historyIds[1]).toBe(lastStepUuid('b'));
  });

  test('deleteCodeDslByIdsAndGetHistoryId - 不存在的 id 不计入返回数组', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'A' } } as any);

    const historyIds = await codeBlockService.deleteCodeDslByIdsAndGetHistoryId(['a', 'ghost']);
    expect(historyIds).toHaveLength(1);
    expect(historyIds[0]).toBe(lastStepUuid('a'));
  });

  test('deleteCodeDslByIdsAndGetHistoryId - 全部不存在时返回空数组', async () => {
    await codeBlockService.setCodeDsl({} as any);
    const historyIds = await codeBlockService.deleteCodeDslByIdsAndGetHistoryId(['ghost']);
    expect(historyIds).toEqual([]);
  });
});

describe('CodeBlockService - revertById', () => {
  test('通过 uuid 回滚新增（删除代码块内容）', async () => {
    await codeBlockService.setCodeDsl({} as any);
    const uuid = codeBlockService.setCodeDslByIdSyncAndGetHistoryId('a', { name: 'A' } as any);
    expect(typeof uuid).toBe('string');
    expect(codeBlockService.getCodeContentById('a')?.name).toBe('A');

    const reverted = await codeBlockService.revertById(uuid!);
    expect(reverted).not.toBeNull();
    expect(codeBlockService.getCodeContentById('a')).toBeNull();
  });

  test('按 uuid 能定位到对应 (id, index)', async () => {
    await codeBlockService.setCodeDsl({} as any);
    const uuid = codeBlockService.setCodeDslByIdSyncAndGetHistoryId('a', { name: 'A' } as any);

    const location = historyService.findCodeBlockStepLocationByUuid(uuid!);
    expect(location).toEqual({ id: 'a', index: 0 });
  });

  test('找不到 uuid 时返回 null', async () => {
    await codeBlockService.setCodeDsl({} as any);
    codeBlockService.setCodeDslByIdSyncAndGetHistoryId('a', { name: 'A' } as any);

    await expect(codeBlockService.revertById('not-exist')).resolves.toBeNull();
    await expect(codeBlockService.revertById('')).resolves.toBeNull();
  });
});

describe('CodeBlockService - undo / redo', () => {
  test('undo / redo - 新增场景：撤销=删除，重做=再写回', async () => {
    await codeBlockService.setCodeDsl({} as any);
    codeBlockService.setCodeDslByIdSync('a', { name: 'A' } as any);

    await codeBlockService.undo('a');
    expect(codeBlockService.getCodeContentById('a')).toBeNull();

    await codeBlockService.redo('a');
    expect(codeBlockService.getCodeContentById('a')?.name).toBe('A');
  });

  test('undo / redo - 删除场景：撤销=还原内容，重做=再删除', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'A' } } as any);
    historyService.reset();

    await codeBlockService.deleteCodeDslByIds(['a']);
    expect(codeBlockService.getCodeContentById('a')).toBeNull();

    await codeBlockService.undo('a');
    expect(codeBlockService.getCodeContentById('a')?.name).toBe('A');

    await codeBlockService.redo('a');
    expect(codeBlockService.getCodeContentById('a')).toBeNull();
  });

  test('undo / redo - 更新场景（无 changeRecords）：整内容替换', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'A' } } as any);
    historyService.reset();

    codeBlockService.setCodeDslByIdSync('a', { name: 'A2' } as any);
    expect(codeBlockService.getCodeContentById('a')?.name).toBe('A2');

    await codeBlockService.undo('a');
    expect(codeBlockService.getCodeContentById('a')?.name).toBe('A');

    await codeBlockService.redo('a');
    expect(codeBlockService.getCodeContentById('a')?.name).toBe('A2');
  });

  test('undo / redo - 更新场景（带 changeRecords）：按 propPath 局部 patch，不冲掉同节点其它字段', async () => {
    await codeBlockService.setCodeDsl({
      a: { name: 'A', desc: 'origin' },
    } as any);
    historyService.reset();

    // form 端仅改 name
    codeBlockService.setCodeDslByIdSync('a', { name: 'A2', desc: 'origin' } as any, true, {
      changeRecords: [{ propPath: 'name', value: 'A2' }],
    });

    // 中间外部同步改了 desc（不入历史）
    codeBlockService.setCodeDslByIdSync('a', { desc: 'changed-by-other' } as any, true, {
      doNotPushHistory: true,
    });

    // undo 只回滚 name
    await codeBlockService.undo('a');
    const after = codeBlockService.getCodeContentById('a') as any;
    expect(after?.name).toBe('A');
    expect(after?.desc).toBe('changed-by-other');

    // redo 只重做 name
    await codeBlockService.redo('a');
    const redo = codeBlockService.getCodeContentById('a') as any;
    expect(redo?.name).toBe('A2');
    expect(redo?.desc).toBe('changed-by-other');
  });

  test('undo / redo - 通过 addOrUpdate / remove 事件触发，依赖收集链路保留', async () => {
    const addOrUpdateFn = vi.fn();
    const removeFn = vi.fn();
    codeBlockService.on('addOrUpdate', addOrUpdateFn);
    codeBlockService.on('remove', removeFn);

    await codeBlockService.setCodeDsl({} as any);
    codeBlockService.setCodeDslByIdSync('a', { name: 'A' } as any);
    addOrUpdateFn.mockClear();

    // 撤销新增 → 触发 remove 事件，initService 中的 codeBlockRemoveHandler 会移除 dep target
    await codeBlockService.undo('a');
    expect(removeFn).toHaveBeenCalledWith('a');

    // 重做新增 → 触发 addOrUpdate 事件，initService 会重新 addTarget
    await codeBlockService.redo('a');
    expect(addOrUpdateFn).toHaveBeenCalled();

    codeBlockService.off('addOrUpdate', addOrUpdateFn);
    codeBlockService.off('remove', removeFn);
  });

  test('undo / redo - 写回时不会再次入历史栈', async () => {
    await codeBlockService.setCodeDsl({ a: { name: 'A' } } as any);
    historyService.reset();

    codeBlockService.setCodeDslByIdSync('a', { name: 'A2' } as any);
    expect(historyService.canUndoCodeBlock('a')).toBe(true);

    await codeBlockService.undo('a');
    expect(historyService.canRedoCodeBlock('a')).toBe(true);

    await codeBlockService.redo('a');
    expect(historyService.canRedoCodeBlock('a')).toBe(false);
    expect(historyService.canUndoCodeBlock('a')).toBe(true);
  });

  test('canUndo / canRedo 委托给 historyService', async () => {
    expect(codeBlockService.canUndo('ghost')).toBe(false);
    expect(codeBlockService.canRedo('ghost')).toBe(false);

    await codeBlockService.setCodeDsl({} as any);
    codeBlockService.setCodeDslByIdSync('a', { name: 'A' } as any);
    expect(codeBlockService.canUndo('a')).toBe(true);
    expect(codeBlockService.canRedo('a')).toBe(false);

    await codeBlockService.undo('a');
    expect(codeBlockService.canUndo('a')).toBe(false);
    expect(codeBlockService.canRedo('a')).toBe(true);
  });

  test('undo / redo - 栈不存在或已无可操作时返回 null', async () => {
    await expect(codeBlockService.undo('ghost')).resolves.toBeNull();
    await expect(codeBlockService.redo('ghost')).resolves.toBeNull();
  });
});
