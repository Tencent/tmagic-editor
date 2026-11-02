import { beforeEach, describe, expect, test } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import type { MApp } from '@tmagic/core';
import Core, { NodeType } from '@tmagic/core';

import { useDsl } from '../src';

const createDsl = () =>
  ({
    type: NodeType.ROOT,
    id: 'app',
    items: [
      {
        type: NodeType.PAGE,
        id: 'p1',
        items: [{ id: 'pfc', type: 'page-fragment-container' }],
      },
      {
        type: NodeType.PAGE_FRAGMENT,
        id: 'f1',
        items: [{ id: 'text_in_f1', type: 'text' }],
      },
    ],
  }) as unknown as MApp;

const createApp = () => new Core({ config: createDsl(), platform: 'editor' });

const createChild = (pageFragmentContainerId?: string) =>
  defineComponent({
    setup() {
      const { pageConfig } = useDsl(undefined as any, pageFragmentContainerId);

      return () =>
        h(
          'div',
          (pageConfig.value?.items || []).map((item) => h('span', { id: item.id })),
        );
    },
  });

const render = (app: Core, pageFragmentContainerId?: string) =>
  mount(createChild(pageFragmentContainerId), {
    global: {
      provide: { app },
    },
  });

describe('useDsl 页面片', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('未关联页面片时渲染为空', () => {
    const app = createApp();
    const wrapper = render(app, 'pfc');

    expect(wrapper.find('span').exists()).toBe(false);
  });

  test('关联页面片后页面片内容会渲染出来', async () => {
    const app = createApp();
    const wrapper = render(app, 'pfc');

    app.setPageFragment({ id: 'pfc', type: 'page-fragment-container', pageFragmentId: 'f1' });
    await nextTick();

    expect(wrapper.find('#text_in_f1').exists()).toBe(true);
  });

  test('取消关联后页面片内容消失', async () => {
    const app = createApp();
    const wrapper = render(app, 'pfc');

    app.setPageFragment({ id: 'pfc', type: 'page-fragment-container', pageFragmentId: 'f1' });
    await nextTick();
    expect(wrapper.find('#text_in_f1').exists()).toBe(true);

    app.setPageFragment({ id: 'pfc', type: 'page-fragment-container', pageFragmentId: '' });
    await nextTick();

    expect(wrapper.find('span').exists()).toBe(false);
  });
});
