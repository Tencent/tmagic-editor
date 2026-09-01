/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { useScrollLastItemIntoView } from '@form/containers/table-group-list/useScrollLastItemIntoView';
import { mount } from '@vue/test-utils';

const settle = async () => {
  for (let i = 0; i < 6; i++) {
    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const mountHook = (itemCount: number, enabled = () => true) => {
  let scroll: ((expectedCount: number) => Promise<void>) | undefined;

  const wrapper = mount(
    defineComponent({
      setup() {
        const listRef = ref<HTMLElement | null>(null);
        const { scrollLastItemIntoView } = useScrollLastItemIntoView(listRef, enabled);
        scroll = scrollLastItemIntoView;
        return { listRef };
      },
      template: `
        <div ref="listRef" class="m-fields-group-list">
          <div v-for="i in ${itemCount}" :key="i" class="m-fields-group-list-item">
            <div class="el-card__header"></div>
          </div>
          <div class="m-fields-group-list-footer is-sticky-full"></div>
        </div>
      `,
    }),
  );

  return {
    wrapper,
    scroll: (expectedCount: number) => scroll?.(expectedCount),
    lastItem: () => wrapper.findAll('.m-fields-group-list-item').at(-1)?.element as HTMLElement,
    footer: () => wrapper.find('.m-fields-group-list-footer').element as HTMLElement,
    lastHeader: () =>
      wrapper.findAll('.m-fields-group-list-item').at(-1)?.find('.el-card__header').element as HTMLElement,
  };
};

describe('useScrollLastItemIntoView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('enabled 为 false 时不滚动', async () => {
    const scrollIntoView = vi.fn();
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);

    const { scroll } = mountHook(2, () => false);
    await scroll(2);
    await settle();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  test('列表根不存在时不滚动', async () => {
    const scrollIntoView = vi.fn();
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);

    let scroll: ((expectedCount: number) => Promise<void>) | undefined;
    mount(
      defineComponent({
        setup() {
          const listRef = ref<HTMLElement | null>(null);
          ({ scrollLastItemIntoView: scroll } = useScrollLastItemIntoView(listRef, () => true));
          return {};
        },
        template: '<div />',
      }),
    );

    await scroll?.(1);
    await settle();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  test('把最后一项瞬时滚进视口，并为吸顶标题和吸底按钮预留 scroll-margin', async () => {
    const scrollIntoView = vi.fn();
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);

    const { scroll, lastItem, footer, lastHeader } = mountHook(2);
    vi.spyOn(footer(), 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 0, 52));

    const footerStyle = document.createElement('div').style;
    footerStyle.bottom = '60px';
    const headerStyle = document.createElement('div').style;
    headerStyle.top = '65px';

    const originGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      if (el === footer()) return footerStyle;
      if (el === lastHeader()) return headerStyle;
      return originGetComputedStyle(el as Element);
    });

    await scroll(2);
    await settle();

    const last = lastItem();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest' });
    expect(scrollIntoView.mock.instances[0]).toBe(last);
    expect(last.style.scrollMarginTop).toBe('65px');
    expect(last.style.scrollMarginBottom).toBe('112px');
  });

  test('未达到 expectedCount 时不滚到旧的最后一项', async () => {
    const scrollIntoView = vi.fn();
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);

    const { wrapper, scroll, lastItem } = mountHook(1);
    const staleLast = lastItem();

    const pending = scroll(2);
    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(scrollIntoView).not.toHaveBeenCalled();

    const extra = document.createElement('div');
    extra.className = 'm-fields-group-list-item';
    wrapper.element.insertBefore(extra, wrapper.find('.m-fields-group-list-footer').element);
    await pending;
    await settle();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(extra);
    expect(scrollIntoView.mock.instances[0]).not.toBe(staleLast);
  });
});
