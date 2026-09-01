/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

import MagicForm, { MForm } from '@form/index';

const mountForm = (config: any[], initValues: any = {}, extra: any = {}) =>
  mount(MForm, {
    global: { plugins: [ElementPlus as any, MagicForm as any] },
    props: { config, initValues, ...extra },
  });

/** 新增后的滚动要等列表 DOM 连续两帧不变，这里多等几帧让它走完 */
const settleScroll = async () => {
  for (let i = 0; i < 6; i++) {
    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const waitFor = async (predicate: () => boolean, timeout = 1000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline && !predicate()) {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
  return predicate();
};

describe('GroupList container', () => {
  test('空数据时显示暂无数据', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'group-list',
          name: 'list',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { list: [] },
    );
    await nextTick();
    expect(wrapper.text()).toContain('暂无数据');
  });

  test('addable 为 false 但列表为空时仍展示「新增」按钮', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'group-list',
          name: 'list',
          titlePrefix: 'mounted',
          addable: false,
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { list: [] },
    );
    await nextTick();
    expect(wrapper.text()).toContain('暂无mounted数据');
    expect(wrapper.text()).toContain('新增mounted');
  });

  test('addable 函数返回 false 时空列表也不展示「新增」按钮', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'group-list',
          name: 'list',
          titlePrefix: 'mounted',
          addable: () => false,
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { list: [] },
    );
    await nextTick();
    expect(wrapper.text()).not.toContain('新增mounted');
  });

  test('未配置 addable 时空列表仍展示「新增」按钮', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'group-list',
          name: 'list',
          titlePrefix: 'mounted',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { list: [] },
    );
    await nextTick();
    expect(wrapper.text()).toContain('新增mounted');
  });

  test('有数据时渲染列表项', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'group-list',
          name: 'list',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { list: [{ text: 'a' }, { text: 'b' }] },
    );
    await nextTick();
    expect(wrapper.findAllComponents({ name: 'MFormGroupList' })).toHaveLength(1);
    expect(wrapper.findAll('.m-fields-group-list-item .el-card__header').length).toBeGreaterThan(0);
  });

  test('extra 字段渲染 HTML', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'group-list',
          name: 'list',
          extra: '<em>tip</em>',
          items: [{ name: 'text', type: 'text' }],
        },
      ],
      { list: [] },
    );
    await nextTick();
    expect(wrapper.html()).toContain('<em>tip</em>');
  });

  describe('对比模式', () => {
    const compareConfig = [
      {
        type: 'group-list',
        name: 'list',
        copyable: true,
        movable: true,
        items: [{ name: 'text', type: 'text', text: 'text' }],
      },
    ];

    test('非对比模式渲染底部操作栏与复制/移动按钮', async () => {
      const wrapper = mountForm(compareConfig, { list: [{ text: 'a' }, { text: 'b' }] });
      await nextTick();
      expect(wrapper.find('.m-fields-group-list-footer').exists()).toBe(true);
      expect(wrapper.text()).toContain('复制');
      expect(wrapper.text()).toContain('上移');
    });

    test('每项只有一个删除按钮，且位于上移下移之后', async () => {
      const wrapper = mountForm(compareConfig, { list: [{ text: 'a' }, { text: 'b' }] });
      await nextTick();

      const actions = wrapper.findAll('.m-fields-group-list-item-actions');
      expect(actions).toHaveLength(2);
      actions.forEach((action) => {
        expect(action.findAll('.delete-button')).toHaveLength(1);
        const html = action.html();
        expect(html.indexOf('下移')).toBeLessThan(html.indexOf('delete-button'));
      });
    });

    test('对比模式按较长一侧对齐，已删除的项仍渲染', async () => {
      const wrapper = mountForm(
        compareConfig,
        { list: [] },
        { isCompare: true, lastValues: { list: [{ text: 'old' }] } },
      );
      await nextTick();
      await nextTick();

      expect(wrapper.find('.el-table__empty-block').exists()).toBe(false);
      expect(wrapper.findAll('.m-fields-group-list-item').length).toBe(1);
      const item = wrapper.findComponent({ name: 'MFormGroupListItem' });
      expect(item.props('lastValues')).toEqual({ text: 'old' });
      expect(item.props('model')).toEqual({});
    });

    test('对比模式隐藏底部操作栏与复制/移动/删除按钮，且不触发 ElOnlyChild 警告', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const wrapper = mountForm(
        compareConfig,
        { list: [{ text: 'a' }, { text: 'b' }] },
        {
          isCompare: true,
          lastValues: { list: [{ text: 'a' }] },
        },
      );
      await nextTick();
      await nextTick();
      expect(wrapper.find('.m-fields-group-list-footer').exists()).toBe(false);
      expect(wrapper.find('.delete-button').exists()).toBe(false);
      expect(wrapper.text()).not.toContain('复制');
      expect(wrapper.text()).not.toContain('上移');
      expect(wrapper.text()).not.toContain('下移');
      expect(
        warn.mock.calls.some((args) => args.some((arg) => String(arg?.message ?? arg).includes('ElOnlyChild'))),
      ).toBe(false);
      warn.mockRestore();
    });
  });

  describe('labelPosition 透传', () => {
    const getFormItemLabelPosition = (wrapper: ReturnType<typeof mountForm>, prop: string) => {
      const item = wrapper.findAllComponents({ name: 'TMFormItem' }).find((w) => w.props('prop') === prop);
      return item?.props('labelPosition');
    };

    test('group-list 的 labelPosition 透传到子表单项', async () => {
      const wrapper = mountForm(
        [
          {
            type: 'group-list',
            name: 'list',
            labelPosition: 'left',
            labelWidth: '80px',
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { list: [{ text: 'a' }] },
      );
      await nextTick();

      expect(getFormItemLabelPosition(wrapper, 'list.0.text')).toBe('left');
    });

    test('子项自身的 labelPosition 优先于 group-list', async () => {
      const wrapper = mountForm(
        [
          {
            type: 'group-list',
            name: 'list',
            labelPosition: 'left',
            items: [
              { name: 'text', type: 'text', text: 'text' },
              { name: 'title', type: 'text', text: 'title', labelPosition: 'top' },
            ],
          },
        ],
        { list: [{ text: 'a', title: 'b' }] },
      );
      await nextTick();

      expect(getFormItemLabelPosition(wrapper, 'list.0.text')).toBe('left');
      expect(getFormItemLabelPosition(wrapper, 'list.0.title')).toBe('top');
    });
  });

  describe('新增后滚动', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('未开启 scrollLastItemIntoView 时点击新增不滚动', async () => {
      const scrollIntoView = vi.fn();
      vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);

      const wrapper = mountForm(
        [
          {
            type: 'group-list',
            name: 'list',
            titlePrefix: '项',
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { list: [{ text: 'a' }] },
      );
      await nextTick();

      const addButton = wrapper.findAll('button').find((btn) => btn.text().includes('新增'));
      await addButton?.trigger('click');
      await settleScroll();

      expect(wrapper.findAll('.m-fields-group-list-item').length).toBeGreaterThanOrEqual(2);
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    test('table 形态即使开启 scrollLastItemIntoView 也不滚动', async () => {
      const scrollIntoView = vi.fn();
      vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);

      const wrapper = mountForm(
        [
          {
            type: 'table',
            name: 'list',
            titlePrefix: '项',
            scrollLastItemIntoView: true,
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { list: [{ text: 'a' }] },
      );
      await nextTick();

      const addButton = wrapper.findAll('button').find((btn) => btn.text().includes('新增一行'));
      await addButton?.trigger('click');
      await settleScroll();

      expect((wrapper.vm as any).values.list).toHaveLength(2);
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    test('点击新增后把最后一项顶部滚进视口', async () => {
      const scrollIntoView = vi.fn();
      vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);

      const wrapper = mountForm(
        [
          {
            type: 'group-list',
            name: 'list',
            titlePrefix: '项',
            scrollLastItemIntoView: true,
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { list: [{ text: 'a' }] },
      );
      await nextTick();

      const addButton = wrapper.findAll('button').find((btn) => btn.text().includes('新增'));
      await addButton?.trigger('click');
      await settleScroll();

      const items = wrapper.findAll('.m-fields-group-list-item');
      expect(items.length).toBeGreaterThanOrEqual(2);
      const last = items[items.length - 1].element as HTMLElement;
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest' });
      expect(scrollIntoView.mock.instances[0]).toBe(last);
    });

    test('滚动时为吸底新增按钮预留 scroll-margin，嵌套列表含外层按钮占位', async () => {
      const scrollIntoView = vi.fn();
      vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);

      const wrapper = mountForm(
        [
          {
            type: 'group-list',
            name: 'groups',
            titlePrefix: '事件',
            addButtonConfig: { sticky: true, text: '添加事件' },
            items: [
              {
                type: 'group-list',
                name: 'actions',
                titlePrefix: '动作',
                scrollLastItemIntoView: true,
                addButtonConfig: { sticky: true, text: '新增动作' },
                items: [{ name: 'text', type: 'text', text: 'text' }],
              },
            ],
          },
        ],
        { groups: [{ actions: [{ text: 'a' }] }] },
      );
      await nextTick();

      const nestedFooter = wrapper.find(
        '.m-fields-group-list-item .m-fields-group-list > .m-fields-group-list-footer.is-sticky-full',
      ).element as HTMLElement;
      vi.spyOn(nestedFooter, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 0, 52));

      // 嵌套 footer 的 bottom 是给外层吸底按钮留的位，样式表算不出来，这里直接给一个
      const nestedFooterStyle = document.createElement('div').style;
      nestedFooterStyle.bottom = '60px';

      const originGetComputedStyle = window.getComputedStyle.bind(window);
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el) =>
        el === nestedFooter ? nestedFooterStyle : originGetComputedStyle(el as Element),
      );

      const addButton = wrapper.findAll('button').find((btn) => btn.text().includes('新增动作'));
      await addButton?.trigger('click');
      await settleScroll();

      const last = wrapper.findAll('.m-fields-group-list-item .m-fields-group-list-item').at(-1)
        ?.element as HTMLElement;
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest' });
      expect(last.style.scrollMarginBottom).toBe('112px');
    });

    test('宿主异步写回时等新项渲染出来再滚，不滚到旧的最后一项', async () => {
      const scrollIntoView = vi.fn();
      vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);

      const wrapper = mountForm(
        [
          {
            type: 'group-list',
            name: 'list',
            titlePrefix: '项',
            scrollLastItemIntoView: true,
            // 容器配置带 onChange 时 Container 会 await，新项要过几十毫秒才写回渲染出来
            onChange: async (_mForm: any, v: any) => {
              await new Promise((resolve) => setTimeout(resolve, 30));
              return v;
            },
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { list: [{ text: 'a' }] },
      );
      await nextTick();

      const staleLast = wrapper.find('.m-fields-group-list-item').element;

      const addButton = wrapper.findAll('button').find((btn) => btn.text().includes('新增'));
      await addButton?.trigger('click');
      await waitFor(() => scrollIntoView.mock.calls.length > 0);

      const items = wrapper.findAll('.m-fields-group-list-item');
      expect(items).toHaveLength(2);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView.mock.instances[0]).toBe(items[1].element);
      expect(scrollIntoView.mock.instances[0]).not.toBe(staleLast);
    });

    test('列表 DOM 还在重绘时不滚动，等稳定后再滚', async () => {
      const scrollIntoView = vi.fn();
      vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);

      const wrapper = mountForm(
        [
          {
            type: 'group-list',
            name: 'list',
            titlePrefix: '项',
            scrollLastItemIntoView: true,
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { list: [{ text: 'a' }] },
      );
      await nextTick();

      const addButton = wrapper.findAll('button').find((btn) => btn.text().includes('新增'));
      await addButton?.trigger('click');
      // 模拟宿主在 change 之后又追加一项（属性面板回写表单值会重绘列表）
      await nextTick();
      (wrapper.vm as any).values.list.push({ text: 'c' });
      await settleScroll();

      const items = wrapper.findAll('.m-fields-group-list-item');
      const last = items[items.length - 1].element as HTMLElement;
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView.mock.instances[0]).toBe(last);
    });

    test('嵌套 sticky 的 footer 叠在外层吸底按钮之上', async () => {
      const wrapper = mountForm(
        [
          {
            type: 'group-list',
            name: 'groups',
            titlePrefix: '条件组',
            addButtonConfig: { sticky: true, text: '新增条件组', props: { type: 'primary', plain: true, text: false } },
            items: [
              {
                type: 'group-list',
                name: 'cond',
                titlePrefix: '条件',
                addButtonConfig: {
                  sticky: true,
                  text: '新增条件',
                  props: { type: 'primary', plain: true, text: false },
                },
                items: [{ name: 'text', type: 'text', text: 'text' }],
              },
            ],
          },
        ],
        { groups: [{ cond: [{ text: 'a' }] }] },
      );
      await nextTick();

      const footers = wrapper.findAll('.m-fields-group-list-footer.is-sticky-full');
      expect(footers.length).toBeGreaterThanOrEqual(2);
      expect(wrapper.text()).toContain('新增条件');
      expect(wrapper.text()).toContain('新增条件组');
    });

    test('addButtonConfig.sticky 时 footer 带 is-sticky-full', async () => {
      const wrapper = mountForm(
        [
          {
            type: 'group-list',
            name: 'list',
            addButtonConfig: { sticky: true, text: '添加', props: { type: 'primary', plain: true, text: false } },
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { list: [{ text: 'a' }] },
      );
      await nextTick();
      expect(wrapper.find('.m-fields-group-list-footer.is-sticky-full').exists()).toBe(true);
      expect(wrapper.text()).toContain('添加');
    });
  });
});
