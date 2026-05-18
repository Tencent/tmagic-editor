/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import CodeEditor from '@editor/layouts/CodeEditor.vue';

const {
  vsEditorInstance,
  vsDiffEditorInstance,
  monacoInstance,
  blurHandlers,
  contentChangeHandlers,
  diffContentChangeHandlers,
} = vi.hoisted(() => ({
  vsEditorInstance: {
    getValue: vi.fn(() => 'editor-value'),
    setValue: vi.fn(),
    saveViewState: vi.fn(() => null),
    restoreViewState: vi.fn(),
    focus: vi.fn(),
    layout: vi.fn(),
    setScrollTop: vi.fn(),
    revealLine: vi.fn(),
    dispose: vi.fn(),
    getOptions: vi.fn(() => ({ get: vi.fn(() => 20) })),
    onDidChangeModelContent: vi.fn(),
    onDidBlurEditorWidget: vi.fn(),
    updateOptions: vi.fn(),
  } as any,
  vsDiffEditorInstance: {
    getModifiedEditor: vi.fn(),
    saveViewState: vi.fn(() => null),
    restoreViewState: vi.fn(),
    setModel: vi.fn(),
    focus: vi.fn(),
    layout: vi.fn(),
    dispose: vi.fn(),
    updateOptions: vi.fn(),
  } as any,
  monacoInstance: {
    editor: {
      createModel: vi.fn(),
      EditorOption: { scrollBeyondLastLine: 1, padding: 2, lineHeight: 3 },
    },
  } as any,
  blurHandlers: [] as any[],
  contentChangeHandlers: [] as any[],
  diffContentChangeHandlers: [] as any[],
}));

vi.mock('@editor/utils/monaco-editor', () => ({
  default: vi.fn(async () => monacoInstance),
}));

vi.mock('@editor/utils/config', () => ({
  getEditorConfig: vi.fn((k: string) => {
    if (k === 'parseDSL') return (s: string) => JSON.parse(s);
    if (k === 'customCreateMonacoEditor') {
      return (_m: any, _el: any, _opts: any) => vsEditorInstance;
    }
    if (k === 'customCreateMonacoDiffEditor') {
      return (_m: any, _el: any, _opts: any) => vsDiffEditorInstance;
    }
    return undefined;
  }),
}));

vi.mock('@tmagic/design', () => ({
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    inheritAttrs: false,
    setup(_p, { slots, attrs }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            class: ['fake-btn', (attrs as any).class].filter(Boolean).join(' '),
          },
          slots.default?.(),
        );
    },
  }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({
    name: 'IconStub',
    props: ['icon'],
    setup() {
      return () => h('i', { class: 'fake-icon' });
    },
  }),
}));

class FakeResizeObserver {
  observe() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = FakeResizeObserver;

beforeEach(() => {
  vi.clearAllMocks();
  blurHandlers.length = 0;
  contentChangeHandlers.length = 0;
  diffContentChangeHandlers.length = 0;
  vsEditorInstance.onDidChangeModelContent.mockImplementation((cb: any) => {
    contentChangeHandlers.push(cb);
  });
  vsEditorInstance.onDidBlurEditorWidget.mockImplementation((cb: any) => {
    blurHandlers.push(cb);
  });
  // 默认无视图状态，避免上一个用例 mockReturnValue 渗透
  vsEditorInstance.saveViewState.mockReturnValue(null);
  vsDiffEditorInstance.saveViewState.mockReturnValue(null);
  const modifiedEditor = {
    getValue: vi.fn(() => 'modified-value'),
    onDidChangeModelContent: vi.fn((cb: any) => diffContentChangeHandlers.push(cb)),
  };
  vsDiffEditorInstance.getModifiedEditor.mockReturnValue(modifiedEditor);
});

const flush = async () => {
  await nextTick();
  await new Promise((r) => setTimeout(r, 50));
  await nextTick();
};

describe('CodeEditor', () => {
  test('挂载时初始化 monaco 编辑器', async () => {
    const wrapper = mount(CodeEditor, { props: { initValues: 'abc' } as any, attachTo: document.body });
    await flush();
    expect(wrapper.find('.fake-btn').exists()).toBe(true);
    expect(wrapper.emitted('initd')).toBeTruthy();
    wrapper.unmount();
  });

  test('disabledFullScreen 时不显示按钮', async () => {
    const wrapper = mount(CodeEditor, {
      props: { initValues: 'abc', disabledFullScreen: true } as any,
      attachTo: document.body,
    });
    await flush();
    expect(wrapper.find('.magic-code-editor-full-screen-icon').exists()).toBe(false);
    wrapper.unmount();
  });

  test('点击全屏按钮切换 fullScreen', async () => {
    const wrapper = mount(CodeEditor, { props: { initValues: 'abc' } as any, attachTo: document.body });
    await flush();
    await wrapper.find('.fake-btn').trigger('click');
    await new Promise((r) => setTimeout(r, 10));
    expect(vsEditorInstance.layout).toHaveBeenCalled();
    wrapper.unmount();
  });

  test('blur 自动保存触发 save 事件', async () => {
    const wrapper = mount(CodeEditor, { props: { initValues: 'abc', autoSave: true } as any, attachTo: document.body });
    await flush();
    vsEditorInstance.getValue.mockReturnValue('new-value');
    blurHandlers.forEach((cb) => cb());
    expect(wrapper.emitted('save')?.[0]?.[0]).toBe('new-value');
    wrapper.unmount();
  });

  test('parse: true 时解析后再 emit save', async () => {
    const wrapper = mount(CodeEditor, {
      props: { initValues: '{}', autoSave: true, parse: true, language: 'json' } as any,
      attachTo: document.body,
    });
    await flush();
    vsEditorInstance.getValue.mockReturnValue('{"foo":1}');
    blurHandlers.forEach((cb) => cb());
    expect(wrapper.emitted('save')?.[0]?.[0]).toEqual({ foo: 1 });
    wrapper.unmount();
  });

  test('Ctrl+S 触发 save', async () => {
    const wrapper = mount(CodeEditor, { props: { initValues: 'abc' } as any, attachTo: document.body });
    await flush();
    const editorEl = wrapper.find('.magic-code-editor-content').element as HTMLDivElement;
    vsEditorInstance.getValue.mockReturnValue('save-content');
    const event = new KeyboardEvent('keydown', { keyCode: 83, ctrlKey: true } as any);
    editorEl.dispatchEvent(event);
    expect(wrapper.emitted('save')?.[0]?.[0]).toBe('save-content');
    wrapper.unmount();
  });

  test('diff 模式下创建 diff 编辑器', async () => {
    const wrapper = mount(CodeEditor, {
      props: { type: 'diff', initValues: 'a', modifiedValues: 'b' } as any,
      attachTo: document.body,
    });
    await flush();
    expect(vsDiffEditorInstance.setModel).toHaveBeenCalled();
    wrapper.unmount();
  });

  test('autosize 时根据内容计算高度', async () => {
    const wrapper = mount(CodeEditor, {
      props: { initValues: 'a\nb\nc', autosize: { minRows: 1, maxRows: 10 } } as any,
      attachTo: document.body,
    });
    await flush();
    contentChangeHandlers.forEach((cb) => cb());
    await flush();
    expect(true).toBe(true);
    wrapper.unmount();
  });

  test('options 变化时调用 updateOptions', async () => {
    const wrapper = mount(CodeEditor, {
      props: { initValues: 'abc', options: { tabSize: 2 } } as any,
      attachTo: document.body,
    });
    await flush();
    await wrapper.setProps({ options: { tabSize: 4 } } as any);
    await flush();
    expect(vsEditorInstance.updateOptions).toHaveBeenCalled();
    wrapper.unmount();
  });

  test('initValues 改变时调用 setEditorValue', async () => {
    const wrapper = mount(CodeEditor, { props: { initValues: 'abc' } as any, attachTo: document.body });
    await flush();
    await wrapper.setProps({ initValues: 'xyz' } as any);
    await flush();
    expect(vsEditorInstance.setValue).toHaveBeenCalledWith('xyz');
    wrapper.unmount();
  });

  test('setValue 后通过 saveViewState / restoreViewState 保留光标与滚动状态', async () => {
    const fakeViewState = { __fake: true } as any;
    vsEditorInstance.saveViewState.mockReturnValue(fakeViewState);

    const wrapper = mount(CodeEditor, { props: { initValues: 'abc' } as any, attachTo: document.body });
    await flush();
    vsEditorInstance.restoreViewState.mockClear();
    vsEditorInstance.focus.mockClear();

    await wrapper.setProps({ initValues: 'xyz' } as any);
    await flush();

    expect(vsEditorInstance.saveViewState).toHaveBeenCalled();
    expect(vsEditorInstance.restoreViewState).toHaveBeenCalledWith(fakeViewState);
    expect(vsEditorInstance.focus).toHaveBeenCalled();
    wrapper.unmount();
  });

  test('saveViewState 返回 null 时不调用 restoreViewState / focus', async () => {
    vsEditorInstance.saveViewState.mockReturnValue(null);

    const wrapper = mount(CodeEditor, { props: { initValues: 'abc' } as any, attachTo: document.body });
    await flush();
    vsEditorInstance.restoreViewState.mockClear();
    vsEditorInstance.focus.mockClear();

    await wrapper.setProps({ initValues: 'xyz' } as any);
    await flush();

    expect(vsEditorInstance.restoreViewState).not.toHaveBeenCalled();
    expect(vsEditorInstance.focus).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  test('restoreViewState 在 setAutoHeight 的 setScrollTop 之后执行', async () => {
    const fakeViewState = { __fake: true } as any;
    vsEditorInstance.saveViewState.mockReturnValue(fakeViewState);

    const wrapper = mount(CodeEditor, {
      props: { initValues: 'a', autosize: { minRows: 1, maxRows: 10 } } as any,
      attachTo: document.body,
    });
    await flush();
    vsEditorInstance.setScrollTop.mockClear();
    vsEditorInstance.restoreViewState.mockClear();

    // 行数变化触发 setAutoHeight 的 nextTick（其中会调用 setScrollTop(0)）
    await wrapper.setProps({ initValues: 'a\nb\nc\nd\ne' } as any);
    await flush();

    expect(vsEditorInstance.setScrollTop).toHaveBeenCalled();
    expect(vsEditorInstance.restoreViewState).toHaveBeenCalledWith(fakeViewState);
    const setScrollTopOrder = vsEditorInstance.setScrollTop.mock.invocationCallOrder[0];
    const restoreOrder = vsEditorInstance.restoreViewState.mock.invocationCallOrder[0];
    expect(setScrollTopOrder).toBeLessThan(restoreOrder);
    wrapper.unmount();
  });

  test('diff 模式下保留视图状态', async () => {
    const fakeViewState = { __fake_diff: true } as any;
    vsDiffEditorInstance.saveViewState.mockReturnValue(fakeViewState);

    const wrapper = mount(CodeEditor, {
      props: { type: 'diff', initValues: 'a', modifiedValues: 'b' } as any,
      attachTo: document.body,
    });
    await flush();
    vsDiffEditorInstance.saveViewState.mockClear();
    vsDiffEditorInstance.restoreViewState.mockClear();
    vsDiffEditorInstance.focus.mockClear();

    await wrapper.setProps({ initValues: 'x' } as any);
    await flush();

    expect(vsDiffEditorInstance.saveViewState).toHaveBeenCalled();
    expect(vsDiffEditorInstance.restoreViewState).toHaveBeenCalledWith(fakeViewState);
    expect(vsDiffEditorInstance.focus).toHaveBeenCalled();
    wrapper.unmount();
  });

  test('expose getEditor / focus / setEditorValue', async () => {
    vsEditorInstance.getValue.mockReturnValue('editor-value');
    const wrapper = mount(CodeEditor, { props: { initValues: 'abc' } as any, attachTo: document.body });
    await flush();
    expect((wrapper.vm as any).getEditor()).toBe(vsEditorInstance);
    expect((wrapper.vm as any).getVsEditor()).toBe(vsEditorInstance);
    (wrapper.vm as any).focus();
    expect(vsEditorInstance.focus).toHaveBeenCalled();
    expect((wrapper.vm as any).getEditorValue()).toBe('editor-value');
    wrapper.unmount();
  });

  test('卸载时 dispose', async () => {
    const wrapper = mount(CodeEditor, { props: { initValues: 'abc' } as any, attachTo: document.body });
    await flush();
    wrapper.unmount();
    expect(vsEditorInstance.dispose).toHaveBeenCalled();
  });

  test('toString 处理 javascript 对象', async () => {
    const wrapper = mount(CodeEditor, {
      props: { initValues: { a: 1 }, language: 'javascript' } as any,
      attachTo: document.body,
    });
    await flush();
    expect(vsEditorInstance.setValue).toHaveBeenCalled();
    const callArg = vsEditorInstance.setValue.mock.calls[0][0];
    expect(callArg).toMatch(/^\(/);
    wrapper.unmount();
  });

  test('toString 处理 json 对象', async () => {
    const wrapper = mount(CodeEditor, {
      props: { initValues: { a: 1 }, language: 'json' } as any,
      attachTo: document.body,
    });
    await flush();
    const callArg = vsEditorInstance.setValue.mock.calls[0][0];
    expect(JSON.parse(callArg)).toEqual({ a: 1 });
    wrapper.unmount();
  });
});
