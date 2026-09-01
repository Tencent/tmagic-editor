/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { computed } from 'vue';
// 走 @form 源码别名而非 @tmagic/form：编辑器包在单测里解析到的是 form 的构建产物
import {
  builtInFields,
  clearFields,
  collectValidatableFields,
  createHeadlessFormState,
  registerBuiltInFields,
  registerFields,
} from '@form/index';

import { NODE_CONDS_KEY } from '@tmagic/core';

import { editorFields } from '@editor/fields/headless-validation';
import { fillConfig } from '@editor/utils/props';

/**
 * 无渲染校验只遍历 config 树，看不到复合字段在组件内部渲染出来的嵌套字段。
 * 这些用例锁定嵌套配置交出来的 prop 路径——它必须与组件真实渲染出的 FormItem 路径一致，
 * 否则 async-validator 会拿着错误的路径取值，校验形同虚设。
 */
const collect = (config: any[], values: any, typeMatchValid = true) => {
  const formState = createHeadlessFormState({ config, initValues: values });
  formState.values = values;

  const fields = collectValidatableFields(
    formState,
    config,
    values,
    computed(() => typeMatchValid),
  );

  return { props: fields.map((field) => field.prop) };
};

beforeAll(() => {
  registerBuiltInFields(builtInFields);
  registerFields(editorFields);
});

afterAll(() => {
  clearFields();
});

describe('editorFields', () => {
  test('不含 Vue 组件，供 Node 侧 registerFields', () => {
    for (const [type, options] of Object.entries(editorFields)) {
      expect(Object.keys(options), type).not.toContain('component');
    }
  });
});

describe('code-select', () => {
  test('遍历内部钩子列表，路径为 <prop>.hookData.<index>.<name>', () => {
    const config = [{ type: 'code-select', name: 'created', text: '钩子' }];
    const values = {
      created: {
        hookType: 'code',
        hookData: [
          { codeType: 'code', codeId: 'c1' },
          { codeType: 'dataSourceMethod', codeId: ['ds1', 'doFetch'] },
        ],
      },
    };

    const { props } = collect(config, values);

    expect(props).toEqual([
      // typeMatchValid 会给字段自身补一条 typeMatch 规则，与渲染式一样有一个 FormItem
      'created',
      'created.hookData.0.codeType',
      // codeType 决定第二列走代码块还是数据源方法，两者共用 codeId
      'created.hookData.0.codeId',
      'created.hookData.1.codeType',
      'created.hookData.1.codeId',
    ]);
  });

  test('空值按组件的旧数据兼容改写为 { hookType, hookData }', () => {
    const config = [{ type: 'code-select', name: 'created' }];
    const values: any = { created: [] };

    collect(config, values);

    expect(values.created).toEqual({ hookType: 'code', hookData: [] });
  });

  test('嵌套在容器里时带上父级路径', () => {
    const config = [
      {
        type: 'panel',
        name: 'hooks',
        items: [{ type: 'code-select', name: 'created' }],
      },
    ];
    const values = { hooks: { created: { hookType: 'code', hookData: [{ codeType: 'code', codeId: 'c1' }] } } };

    expect(collect(config, values).props).toEqual([
      'hooks.created',
      'hooks.created.hookData.0.codeType',
      'hooks.created.hookData.0.codeId',
    ]);
  });
});

describe('display-conds', () => {
  test('展开条件列表，路径为 <prop>.<index>.cond.<index>.<name>', () => {
    const config = [{ type: 'display-conds', name: 'displayConds' }];
    const values = {
      displayConds: [
        {
          cond: [
            { field: [], op: '', value: '' },
            { field: ['a'], op: 'between', range: [] },
          ],
        },
      ],
    };

    const { props } = collect(config, values);

    expect(props).toEqual([
      'displayConds',
      'displayConds.0.cond.0.field',
      'displayConds.0.cond.0.op',
      'displayConds.0.cond.0.value',
      'displayConds.0.cond.1.field',
      'displayConds.0.cond.1.op',
      // op 为 between 时值列切到区间字段
      'displayConds.0.cond.1.range',
    ]);
  });

  test('内部 group-list 复用字段自身的 name，路径不会把 name 拼两次', () => {
    const config = [
      {
        type: 'panel',
        name: 'cond',
        items: [{ type: 'display-conds', name: 'displayConds' }],
      },
    ];
    const values = { cond: { displayConds: [{ cond: [{ field: [], op: '' }] }] } };

    expect(collect(config, values).props).toEqual([
      'cond.displayConds',
      'cond.displayConds.0.cond.0.field',
      'cond.displayConds.0.cond.0.op',
      'cond.displayConds.0.cond.0.value',
    ]);
  });
});

describe('event-select', () => {
  test('展开事件卡片与动作组，路径为 <prop>.<index>.actions.<index>.<name>', () => {
    const config = [{ type: 'event-select', name: 'events' }];
    const values = {
      events: [
        {
          name: 'click',
          actions: [{ actionType: 'comp', to: 'node_1', method: 'show' }],
        },
      ],
    };

    const { props } = collect(config, values);

    expect(props).toEqual([
      'events',
      'events.0.name',
      'events.0.actions.0.actionType',
      'events.0.actions.0.to',
      'events.0.actions.0.method',
    ]);
  });

  test('动作类型为代码 / 数据源时按 display 切换到对应字段', () => {
    const config = [{ type: 'event-select', name: 'events' }];
    const values = {
      events: [
        { name: 'click', actions: [{ actionType: 'code', codeId: '' }] },
        { name: 'click', actions: [{ actionType: 'data-source', dataSourceMethod: [] }] },
      ],
    };

    expect(collect(config, values).props).toEqual([
      'events',
      'events.0.name',
      'events.0.actions.0.actionType',
      'events.0.actions.0.codeId',
      'events.1.name',
      'events.1.actions.0.actionType',
      'events.1.actions.0.dataSourceMethod',
    ]);
  });

  test('旧数据格式（列表项没有 actions）不含校验规则，不产出字段', () => {
    const config = [{ type: 'event-select', name: 'events' }];
    const values = { events: [{ name: 'click', to: 'node_1', method: 'show' }] };

    const { props } = collect(config, values);

    // 只剩字段自身那条自动补上的 typeMatch 规则
    expect(props).toEqual(['events']);
  });
});

describe('style-setter', () => {
  const styleField = { type: 'style-setter', name: 'style' };

  test('按面板顺序遍历内部字段，路径挂在 style 下', () => {
    const values = { style: { transform: {} } };
    const { props } = collect([styleField], values);

    expect(props).toEqual([
      'style',
      'style.display',
      'style.width',
      'style.height',
      'style.overflow',
      'style.opacity',
      'style.position',
      'style.left',
      'style.top',
      'style.right',
      'style.bottom',
      'style.zIndex',
      'style.backgroundColor',
      'style.backgroundImage',
      'style.backgroundSize',
      'style.backgroundRepeat',
      'style.backgroundPosition',
      'style.fontSize',
      'style.lineHeight',
      'style.fontWeight',
      'style.color',
      'style.textAlign',
      'style.borderRadius',
      'style.transform.rotate',
      'style.transform.scale',
    ]);
  });

  test('display 为 flex 时展开主轴/辅轴/换行字段', () => {
    const { props } = collect([styleField], { style: { display: 'flex' } });

    expect(props).toEqual(
      expect.arrayContaining(['style.flexDirection', 'style.justifyContent', 'style.alignItems', 'style.flexWrap']),
    );
    expect(props.indexOf('style.flexDirection')).toBeGreaterThan(props.indexOf('style.display'));
    expect(props.indexOf('style.flexWrap')).toBeLessThan(props.indexOf('style.width'));
  });

  test('position 为 static 时不展开 left/top/right/bottom', () => {
    const { props } = collect([styleField], { style: { position: 'static' } });

    expect(props).toContain('style.position');
    expect(props).not.toContain('style.left');
    expect(props).not.toContain('style.top');
    expect(props).not.toContain('style.right');
    expect(props).not.toContain('style.bottom');
  });

  test('边框四向字段不展开（Border 子组件未把 prop 传给 MContainer）', () => {
    const { props } = collect([styleField], { style: {} });

    expect(props).not.toContain('style.borderWidth');
    expect(props).not.toContain('style.borderTopWidth');
    expect(props).not.toContain('style.marginTop');
  });
});

describe('fillConfig 通用属性表单', () => {
  test('默认注入的 tab 配置没有未知 type', () => {
    const config = fillConfig([]);
    const values = {
      type: 'text',
      id: '1',
      name: '',
      style: { transform: {} },
      events: [],
      created: { hookType: 'code', hookData: [] },
      mounted: { hookType: 'code', hookData: [] },
      display: { hookType: 'code', hookData: [] },
      [NODE_CONDS_KEY]: [],
    };

    const formState = createHeadlessFormState({ config, initValues: values });
    formState.values = values;
    // 关掉独立样式面板，让 fillConfig 注入的 style tab 走 display，从而覆盖 style-setter
    (formState as any).services = { uiService: { get: (key: string) => key !== 'showStylePanel' } };

    expect(() =>
      collectValidatableFields(
        formState,
        config,
        values,
        computed(() => true),
      ),
    ).not.toThrow();
  });

  test('显示条件 tab 按 groupList 展开条件组与组内条件', () => {
    const config = fillConfig([]);
    const values = {
      type: 'text',
      id: '1',
      name: '',
      [NODE_CONDS_KEY]: [{ cond: [{ field: [], op: '', value: '' }] }],
    };

    const { props } = collect(config, values);

    expect(props).toEqual(
      expect.arrayContaining([
        `${NODE_CONDS_KEY}.0.cond.0.field`,
        `${NODE_CONDS_KEY}.0.cond.0.op`,
        `${NODE_CONDS_KEY}.0.cond.0.value`,
      ]),
    );
    expect(props).not.toContain(`${NODE_CONDS_KEY}.${NODE_CONDS_KEY}`);
  });
});
