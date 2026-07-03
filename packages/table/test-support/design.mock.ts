/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { vi } from 'vitest';
import { defineComponent, h } from 'vue';

export const tableRefMethods = {
  toggleRowSelection: vi.fn(),
  toggleRowExpansion: vi.fn(),
  clearSelection: vi.fn(),
};

export const tMagicMessage = {
  success: vi.fn(),
  error: vi.fn(),
};

export const createDesignMock = () => ({
  TMagicTable: defineComponent({
    name: 'TMagicTable',
    props: {
      data: { type: Array, default: () => [] },
      columns: { type: Array, default: () => [] },
      loading: Boolean,
      showHeader: Boolean,
      bodyHeight: [String, Number],
      defaultExpandAll: Boolean,
      border: Boolean,
      rowKey: String,
      emptyText: String,
      spanMethod: Function,
    },
    emits: ['sort-change', 'select', 'select-all', 'selection-change', 'cell-click', 'expand-change'],
    setup(props, { expose }) {
      expose(tableRefMethods);
      return () =>
        h(
          'div',
          { class: 'tmagic-table-stub' },
          (props.data as any[]).flatMap((row, $index) =>
            (props.columns as any[]).map((col, colIndex) => {
              if (!col.cell) return null;
              return h('div', { class: `cell-${colIndex}`, key: `${$index}-${colIndex}` }, [col.cell({ row, $index })]);
            }),
          ),
        );
    },
  }),
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    props: ['link', 'type', 'size', 'disabled', 'icon'],
    emits: ['click'],
    setup(props, { slots, emit }) {
      return () =>
        h(
          'button',
          {
            class: ['tmagic-button-stub', props.type, props.disabled ? 'is-disabled' : ''].filter(Boolean),
            disabled: props.disabled,
            onClick: () => emit('click'),
          },
          slots.default?.(),
        );
    },
  }),
  TMagicTooltip: defineComponent({
    name: 'TMagicTooltip',
    props: ['placement', 'disabled', 'content'],
    setup(_props, { slots }) {
      return () => h('div', { class: 'tmagic-tooltip-stub' }, [slots.default?.(), slots.content?.()]);
    },
  }),
  TMagicTag: defineComponent({
    name: 'TMagicTag',
    props: ['type'],
    setup(props, { slots }) {
      return () => h('span', { class: ['tmagic-tag-stub', props.type].filter(Boolean) }, slots.default?.());
    },
  }),
  TMagicPopover: defineComponent({
    name: 'TMagicPopover',
    props: ['placement', 'width', 'trigger', 'destroyOnClose'],
    setup(_props, { slots }) {
      return () => h('div', { class: 'tmagic-popover-stub' }, [slots.reference?.(), slots.default?.()]);
    },
  }),
  TMagicPopconfirm: defineComponent({
    name: 'TMagicPopconfirm',
    props: ['title', 'placement', 'width'],
    emits: ['confirm', 'cancel'],
    setup(props, { slots }) {
      return () => h('div', { class: 'tmagic-popconfirm-stub' }, [props.title, slots.reference?.()]);
    },
  }),
  tMagicMessage,
});

export const createFormMock = () => ({
  MForm: defineComponent({
    name: 'MForm',
    props: ['config', 'initValues', 'labelWidth'],
    emits: ['change'],
    setup(props) {
      return () => h('form', { class: 'mform-stub' }, JSON.stringify(props.initValues ?? {}));
    },
  }),
  datetimeFormatter: (value: string) => `fmt:${value}`,
});
