/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import Code from '@editor/fields/Code.vue';

vi.mock('@editor/layouts/CodeEditor.vue', () => ({
  default: defineComponent({
    name: 'CodeEditor',
    props: ['height', 'initValues', 'language', 'options', 'autosize', 'parse', 'editorCustomType'],
    emits: ['save'],
    setup(_p, { emit }) {
      return () => h('div', { class: 'fake-code-editor', onClick: () => emit('save', 'newvalue') });
    },
  }),
}));

describe('Code', () => {
  test('save 触发 change', async () => {
    const wrapper = mount(Code, {
      props: {
        config: { height: '100px', language: 'js' },
        model: { codeField: 'oldval' },
        name: 'codeField',
      } as any,
    });
    await wrapper.find('.fake-code-editor').trigger('click');
    expect(wrapper.emitted('change')?.[0]?.[0]).toBe('newvalue');
  });
});
