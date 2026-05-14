/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import ScrollViewer from '@editor/components/ScrollViewer.vue';

const { scrollViewerInstances } = vi.hoisted(() => ({
  scrollViewerInstances: [] as any[],
}));

vi.mock('@editor/utils/scroll-viewer', () => ({
  ScrollViewer: class {
    handlers: Record<string, any[]> = {};
    setZoom = vi.fn();
    scrollTo = vi.fn();
    destroy = vi.fn();
    constructor(_opts: any) {
      scrollViewerInstances.push(this);
    }
    on(event: string, cb: any) {
      this.handlers[event] = this.handlers[event] || [];
      this.handlers[event].push(cb);
    }
    triggerScroll(data: any) {
      (this.handlers.scroll || []).forEach((cb) => cb(data));
    }
  },
}));

vi.mock('@editor/components/ScrollBar.vue', () => ({
  default: defineComponent({
    name: 'ScrollBar',
    props: ['scrollSize', 'pos', 'size', 'isHorizontal'],
    emits: ['scroll'],
    setup(props, { emit }) {
      return () =>
        h('div', {
          class: ['fake-scrollbar', props.isHorizontal ? 'h' : 'v'],
          onClick: () => emit('scroll', 50),
        });
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  scrollViewerInstances.length = 0;
});

describe('ScrollViewer', () => {
  test('挂载时创建 ScrollViewer', async () => {
    const wrapper = mount(ScrollViewer, { props: { width: 100, height: 100 } as any });
    await nextTick();
    expect(scrollViewerInstances.length).toBe(1);
    wrapper.unmount();
  });

  test('width/height 为字符串', async () => {
    const wrapper = mount(ScrollViewer, { props: { width: '100%', height: '50vh' } as any });
    await nextTick();
    expect(wrapper.html()).toContain('100%');
    wrapper.unmount();
  });

  test('滚动尺寸大于容器时显示滚动条', async () => {
    const wrapper = mount(ScrollViewer, {
      props: { width: 100, height: 100, wrapWidth: 50, wrapHeight: 50 } as any,
    });
    await nextTick();
    scrollViewerInstances[0].triggerScroll({
      scrollLeft: 10,
      scrollTop: 10,
      scrollWidth: 200,
      scrollHeight: 200,
    });
    await nextTick();
    expect(wrapper.findAll('.fake-scrollbar').length).toBe(2);
    wrapper.unmount();
  });

  test('点击垂直滚动条触发 scrollTo', async () => {
    const wrapper = mount(ScrollViewer, {
      props: { width: 100, height: 100, wrapHeight: 50 } as any,
    });
    await nextTick();
    scrollViewerInstances[0].triggerScroll({
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 50,
      scrollHeight: 200,
    });
    await nextTick();
    await wrapper.find('.fake-scrollbar.v').trigger('click');
    expect(scrollViewerInstances[0].scrollTo).toHaveBeenCalledWith({ top: 50 });
    wrapper.unmount();
  });

  test('点击水平滚动条触发 scrollTo', async () => {
    const wrapper = mount(ScrollViewer, {
      props: { width: 100, height: 100, wrapWidth: 50 } as any,
    });
    await nextTick();
    scrollViewerInstances[0].triggerScroll({
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 200,
      scrollHeight: 50,
    });
    await nextTick();
    await wrapper.find('.fake-scrollbar.h').trigger('click');
    expect(scrollViewerInstances[0].scrollTo).toHaveBeenCalledWith({ left: 50 });
    wrapper.unmount();
  });

  test('zoom 变化时调用 setZoom', async () => {
    const wrapper = mount(ScrollViewer, { props: { width: 100, height: 100, zoom: 1 } as any });
    await nextTick();
    await wrapper.setProps({ zoom: 2 });
    await nextTick();
    expect(scrollViewerInstances[0].setZoom).toHaveBeenCalledWith(2);
    wrapper.unmount();
  });

  test('卸载时 destroy', async () => {
    const wrapper = mount(ScrollViewer, { props: { width: 100, height: 100 } as any });
    await nextTick();
    const inst = scrollViewerInstances[0];
    wrapper.unmount();
    expect(inst.destroy).toHaveBeenCalled();
  });

  test('expose container', async () => {
    const wrapper = mount(ScrollViewer, { props: { width: 100, height: 100 } as any });
    await nextTick();
    expect((wrapper.vm as any).container).toBeTruthy();
    wrapper.unmount();
  });
});
