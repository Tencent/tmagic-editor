/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import { useCodeBlockEdit } from '@editor/hooks/use-code-block-edit';

const showMock = vi.fn();
const hideMock = vi.fn();

vi.mock('@editor/components/CodeBlockEditor.vue', () => ({
  default: defineComponent({
    name: 'CodeBlockEditorStub',
    setup(_, { expose }) {
      expose({ show: showMock, hide: hideMock });
      return () => h('div');
    },
  }),
}));

vi.mock('@tmagic/design', () => ({
  tMagicMessage: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mountHook = (codeBlockService: any) => {
  let captured: any;
  const comp = defineComponent({
    setup() {
      captured = useCodeBlockEdit(codeBlockService);
      return () => h(CodeBlockEditor as any, { ref: 'codeBlockEditor' });
    },
  });
  mount(comp);
  return captured;
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('useCodeBlockEdit', () => {
  test('createCodeBlock 设置默认配置并取得新 id', async () => {
    const codeBlockService: any = {
      getUniqueId: vi.fn(async () => 'id-1'),
    };
    const hook = mountHook(codeBlockService);
    await hook.createCodeBlock();
    await nextTick();
    expect(hook.codeId.value).toBe('id-1');
    expect(hook.codeConfig.value?.name).toBe('');
    expect(showMock).toHaveBeenCalled();
  });

  test('editCode - 找不到代码块时弹出错误', async () => {
    const codeBlockService: any = {
      getCodeContentById: vi.fn(async () => null),
    };
    const hook = mountHook(codeBlockService);
    await hook.editCode('xxx');
    const { tMagicMessage } = await import('@tmagic/design');
    expect(tMagicMessage.error).toHaveBeenCalledWith('获取代码块内容失败');
    expect(showMock).not.toHaveBeenCalled();
  });

  test('editCode - content 为字符串时直接使用', async () => {
    const codeBlockService: any = {
      getCodeContentById: vi.fn(async () => ({ name: 'a', content: 'hello' })),
    };
    const hook = mountHook(codeBlockService);
    await hook.editCode('id1');
    await nextTick();
    expect(hook.codeConfig.value?.content).toBe('hello');
    expect(showMock).toHaveBeenCalled();
  });

  test('editCode - content 为函数时转 toString', async () => {
    const fn = () => 1;
    const codeBlockService: any = {
      getCodeContentById: vi.fn(async () => ({ name: 'a', content: fn })),
    };
    const hook = mountHook(codeBlockService);
    await hook.editCode('id1');
    expect(hook.codeConfig.value?.content).toBe(fn.toString());
  });

  test('editCode - content 为空字符串时不会出错', async () => {
    const codeBlockService: any = {
      getCodeContentById: vi.fn(async () => ({ name: 'a', content: '' })),
    };
    const hook = mountHook(codeBlockService);
    await hook.editCode('id1');
    expect(hook.codeConfig.value?.content).toBe('');
  });

  test('deleteCode 调用 deleteCodeDslByIds', async () => {
    const deleteCodeDslByIds = vi.fn();
    const hook = mountHook({ deleteCodeDslByIds });
    await hook.deleteCode('k');
    expect(deleteCodeDslByIds).toHaveBeenCalledWith(['k']);
  });

  test('submitCodeBlockHandler - 没有 codeId 时跳过', async () => {
    const setCodeDslById = vi.fn();
    const hook = mountHook({ setCodeDslById });
    await hook.submitCodeBlockHandler({ name: 'a' } as any);
    expect(setCodeDslById).not.toHaveBeenCalled();
  });

  test('submitCodeBlockHandler - 提交后隐藏编辑器', async () => {
    const setCodeDslById = vi.fn();
    const hook = mountHook({ setCodeDslById });
    hook.codeId.value = 'id1';
    await hook.submitCodeBlockHandler({ name: 'b' } as any);
    expect(setCodeDslById).toHaveBeenCalledWith('id1', { name: 'b' });
    expect(hideMock).toHaveBeenCalled();
  });
});
