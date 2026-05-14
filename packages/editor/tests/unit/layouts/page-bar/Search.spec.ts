/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import Search from '@editor/layouts/page-bar/Search.vue';

vi.mock('@tmagic/form', () => ({
  createForm: (cfg: any) => cfg,
  MForm: defineComponent({
    name: 'FakeMForm',
    props: ['config', 'initValues'],
    emits: ['change'],
    setup(props, { emit }) {
      return () =>
        h(
          'div',
          {
            class: 'fake-mform',
            onClick: () => emit('change', { pageType: ['page'], keyword: 'kw' }),
          },
          'mform',
        );
    },
  }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({
    name: 'FakeIcon',
    props: ['icon'],
    setup() {
      return () => h('i', { class: 'fake-icon' });
    },
  }),
}));

describe('Search.vue', () => {
  test('点击图标切换 visible，触发 search 事件', async () => {
    document.body.innerHTML = '<div class="m-editor-page-bar-tabs"></div>';
    const wrapper = mount(Search, {
      attachTo: document.body,
      props: { query: { pageType: [], keyword: '' } } as any,
    });
    await wrapper.find('.fake-icon').trigger('click');
    await nextTick();
    const form = document.querySelector('.fake-mform') as HTMLElement;
    expect(form).toBeTruthy();
    form.click();
    await nextTick();
    expect(wrapper.emitted('search')?.[0]?.[0]).toEqual({ pageType: ['page'], keyword: 'kw' });
    expect(wrapper.emitted('update:query')?.[0]?.[0]).toEqual({ pageType: ['page'], keyword: 'kw' });
  });

  test('未点击 icon 时不渲染表单', () => {
    document.body.innerHTML = '<div class="m-editor-page-bar-tabs"></div>';
    mount(Search, {
      attachTo: document.body,
      props: { query: { pageType: [], keyword: '' } } as any,
    });
    expect(document.querySelector('.fake-mform')).toBeFalsy();
  });
});
