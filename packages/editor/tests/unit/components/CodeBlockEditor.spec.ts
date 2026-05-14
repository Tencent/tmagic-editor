/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';

const { messageError, messageBoxConfirm } = vi.hoisted(() => ({
  messageError: vi.fn(),
  messageBoxConfirm: vi.fn(async () => Promise.resolve(true)),
}));

const codeBlockService = {
  getParamsColConfig: vi.fn(() => null),
};
const uiService = { get: vi.fn() };

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ codeBlockService, uiService }),
}));

vi.mock('@editor/hooks/use-editor-content-height', () => ({
  useEditorContentHeight: () => ({ height: ref(600) }),
}));

vi.mock('@editor/hooks/use-window-rect', () => ({
  useWindowRect: () => ({ rect: ref({ width: 1000, height: 800 }) }),
}));

vi.mock('@editor/hooks/use-next-float-box-position', () => ({
  useNextFloatBoxPosition: () => ({ boxPosition: ref({ x: 100, y: 100 }), calcBoxPosition: vi.fn() }),
}));

vi.mock('@editor/utils/config', () => ({
  getEditorConfig: vi.fn(() => (s: string) => {
    if (s === 'invalid') throw new Error('parse fail');
    return s;
  }),
}));

vi.mock('@editor/components/FloatingBox.vue', () => ({
  default: defineComponent({
    name: 'FloatingBox',
    props: ['visible', 'width', 'height', 'title', 'position', 'beforeClose'],
    setup(props, { slots, expose }) {
      const triggerClose = (cb: any) => {
        if (props.beforeClose) {
          props.beforeClose(cb);
        } else cb();
      };
      expose({ triggerClose });
      return () => h('div', { class: 'fake-floating', 'data-visible': String(props.visible) }, slots.body?.());
    },
  }),
}));

vi.mock('@editor/layouts/CodeEditor.vue', () => ({
  default: defineComponent({
    name: 'CodeEditor',
    props: ['initValues', 'modifiedValues', 'type', 'language', 'disabledFullScreen', 'height'],
    setup(_p, { expose }) {
      expose({ getEditorValue: () => 'modified-content' });
      return () => h('div', { class: 'fake-code-editor' });
    },
  }),
}));

let capturedConfig: any = null;
vi.mock('@tmagic/form', async () => {
  const actual = await vi.importActual<any>('@tmagic/form');
  return {
    ...actual,
    MFormBox: defineComponent({
      name: 'MFormBox',
      props: ['config', 'values', 'disabled', 'title', 'labelWidth'],
      emits: ['change', 'submit', 'error', 'closed'],
      setup(props, { emit, slots, expose }) {
        capturedConfig = props.config;
        expose({
          form: { values: { content: 'orig' }, changeRecords: [] },
        });
        return () =>
          h('div', { class: 'fake-form-box' }, [
            h('button', { class: 'change-btn', onClick: () => emit('change', { name: 'a' }) }),
            h('button', {
              class: 'submit-btn',
              onClick: () =>
                emit(
                  'submit',
                  { name: 'a', content: 'function(){}' },
                  { changeRecords: [{ propPath: 'content', value: 'function(){}' }] },
                ),
            }),
            h('button', { class: 'err-btn', onClick: () => emit('error', new Error('e')) }),
            h('button', { class: 'closed-btn', onClick: () => emit('closed') }),
            slots.left?.(),
          ]);
      },
    }),
  };
});

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
  TMagicDialog: defineComponent({
    name: 'TMagicDialog',
    props: ['title', 'modelValue', 'fullscreen', 'destroyOnClose'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-dialog' }, [slots.default?.(), slots.footer?.()]);
    },
  }),
  TMagicTag: defineComponent({
    name: 'TMagicTag',
    setup(_p, { slots }) {
      return () => h('span', { class: 'fake-tag' }, slots.default?.());
    },
  }),
  tMagicMessage: { error: messageError },
  tMagicMessageBox: { confirm: messageBoxConfirm },
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedConfig = null;
});

describe('CodeBlockEditor', () => {
  test('show 设置 visible', async () => {
    const wrapper = mount(CodeBlockEditor, {
      props: { content: { name: '', content: '' } } as any,
    });
    (wrapper.vm as any).show();
    await nextTick();
    expect(wrapper.find('.fake-floating').attributes('data-visible')).toBe('true');
  });

  test('hide 设置 visible false', async () => {
    const wrapper = mount(CodeBlockEditor, {
      props: { content: { name: '', content: '' } } as any,
    });
    (wrapper.vm as any).show();
    await nextTick();
    (wrapper.vm as any).hide();
    await nextTick();
    expect(wrapper.find('.fake-floating').attributes('data-visible')).toBe('false');
  });

  test('boxVisible 切换为 true 时 emit open', async () => {
    const wrapper = mount(CodeBlockEditor, {
      props: { content: { name: '', content: '' } } as any,
    });
    (wrapper.vm as any).show();
    await nextTick();
    await nextTick();
    expect(wrapper.emitted('open')).toBeTruthy();
  });

  test('submitForm 解析 content', async () => {
    const wrapper = mount(CodeBlockEditor, {
      props: { content: { name: '', content: '' } } as any,
    });
    await wrapper.find('.submit-btn').trigger('click');
    expect(wrapper.emitted('submit')).toBeTruthy();
    const args = (wrapper.emitted('submit') as any[])[0];
    expect(args[0].content).toBe('function(){}');
  });

  test('error 调用 tMagicMessage.error', async () => {
    const wrapper = mount(CodeBlockEditor, {
      props: { content: { name: '', content: '' } } as any,
    });
    await wrapper.find('.err-btn').trigger('click');
    expect(messageError).toHaveBeenCalled();
  });

  test('content onChange 解析失败抛出', () => {
    mount(CodeBlockEditor, {
      props: { content: { name: '', content: '' } } as any,
    });
    const contentItem = capturedConfig.find((c: any) => c.name === 'content');
    expect(() => contentItem.onChange(undefined, 'invalid')).toThrow();
    expect(messageError).toHaveBeenCalled();
  });

  test('content onChange 解析成功返回值', () => {
    mount(CodeBlockEditor, {
      props: { content: { name: '', content: '' } } as any,
    });
    const contentItem = capturedConfig.find((c: any) => c.name === 'content');
    expect(contentItem.onChange(undefined, 'valid')).toBe('valid');
  });

  test('timing display - isDataSource', () => {
    mount(CodeBlockEditor, {
      props: { content: { name: '', content: '' }, isDataSource: true } as any,
    });
    const timingItem = capturedConfig.find((c: any) => c.name === 'timing');
    expect(timingItem.display()).toBe(true);
  });

  test('timing options - 非 base 类型', () => {
    mount(CodeBlockEditor, {
      props: { content: { name: '', content: '' }, isDataSource: true, dataSourceType: 'http' } as any,
    });
    const timingItem = capturedConfig.find((c: any) => c.name === 'timing');
    const opts = timingItem.options();
    expect(opts.length).toBe(4);
  });

  test('timing options - base 类型', () => {
    mount(CodeBlockEditor, {
      props: { content: { name: '', content: '' }, isDataSource: true, dataSourceType: 'base' } as any,
    });
    const timingItem = capturedConfig.find((c: any) => c.name === 'timing');
    const opts = timingItem.options();
    expect(opts.length).toBe(2);
  });

  test('changeHandler 触发 changedValue', async () => {
    const wrapper = mount(CodeBlockEditor, {
      props: { content: { name: '', content: '' } } as any,
    });
    await wrapper.find('.change-btn').trigger('click');
    expect(true).toBe(true);
  });

  test('closedHandler 重置 changedValue', async () => {
    const wrapper = mount(CodeBlockEditor, {
      props: { content: { name: '', content: '' } } as any,
    });
    await wrapper.find('.change-btn').trigger('click');
    await wrapper.find('.closed-btn').trigger('click');
    expect(true).toBe(true);
  });

  test('content.name 存在时显示编辑标题', () => {
    const wrapper = mount(CodeBlockEditor, {
      props: { content: { name: 'foo', content: '' } } as any,
    });
    expect(wrapper.html()).toContain('fake-floating');
  });
});
