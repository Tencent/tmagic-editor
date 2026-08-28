import { markRaw } from 'vue';

import { appendValidateSuggestion } from '@tmagic/design/headless';
import { defineFormItem, type FormConfig } from '@tmagic/form/headless';
import type { StyleSchema } from '@tmagic/schema';

import type { validateDataSourceFieldSelect } from '@editor/utils/type-match-rules';

import BackgroundPosition from './components/BackgroundPosition.vue';
import {
  AlignItemsCenter,
  AlignItemsFlexEnd,
  AlignItemsFlexStart,
  AlignItemsSpaceAround,
  AlignItemsSpaceBetween,
} from './icons/align-items';
import { BackgroundNoRepeat, BackgroundRepeat, BackgroundRepeatX, BackgroundRepeatY } from './icons/background-repeat';
import { DisplayBlock, DisplayFlex, DisplayInline, DisplayInlineBlock, DisplayNone } from './icons/display';
import {
  FlexDirectionColumn,
  FlexDirectionColumnReverse,
  FlexDirectionRow,
  FlexDirectionRowReverse,
} from './icons/flex-direction';
import {
  JustifyContentCenter,
  JustifyContentFlexEnd,
  JustifyContentFlexStart,
  JustifyContentSpaceAround,
  JustifyContentSpaceBetween,
} from './icons/justify-content';
import { AlignCenter, AlignLeft, AlignRight } from './icons/text-align';

/**
 * 「布局」面板配置。
 *
 * `theme` 需要由调用方从 `useTheme()` 解析后传入：magic-admin 主题下换行只能用普通
 * radio，其余主题用 button。
 */
export const createLayoutConfig = (theme: string): FormConfig => [
  defineFormItem({
    name: 'display',
    text: '模式',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '90px',
    iconSize: '24px',
    options: [
      {
        value: 'inline',
        icon: markRaw(DisplayInline),
        tooltip: '内联布局 inline',
      },
      {
        value: 'flex',
        icon: markRaw(DisplayFlex),
        tooltip: '弹性布局 flex',
      },
      {
        value: 'block',
        icon: markRaw(DisplayBlock),
        tooltip: '块级布局 block',
      },
      {
        value: 'inline-block',
        icon: markRaw(DisplayInlineBlock),
        tooltip: '内联块布局 inline-block',
      },
      {
        value: 'none',
        icon: markRaw(DisplayNone),
        tooltip: '隐藏 none',
      },
    ],
  }),
  defineFormItem({
    name: 'flexDirection',
    text: '主轴方向',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '90px',
    iconSize: '24px',
    options: [
      { value: 'row', icon: markRaw(FlexDirectionRow), tooltip: '水平方向 起点在左侧 row' },
      {
        value: 'row-reverse',
        icon: markRaw(FlexDirectionRowReverse),
        tooltip: '水平方向 起点在右侧 row-reverse',
      },
      {
        value: 'column',
        icon: markRaw(FlexDirectionColumn),
        tooltip: '垂直方向 起点在上沿 column',
      },
      {
        value: 'column-reverse',
        icon: markRaw(FlexDirectionColumnReverse),
        tooltip: '垂直方向 起点在下沿 column-reverse',
      },
    ],
    display: (_mForm, { model }: { model: Record<any, any> }) => model.display === 'flex',
  }),
  defineFormItem({
    name: 'justifyContent',
    text: '主轴对齐',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '90px',
    iconSize: '24px',
    options: [
      { value: 'flex-start', icon: markRaw(JustifyContentFlexStart), tooltip: '左对齐 flex-start' },
      { value: 'flex-end', icon: markRaw(JustifyContentFlexEnd), tooltip: '右对齐 flex-end' },
      { value: 'center', icon: markRaw(JustifyContentCenter), tooltip: '居中 center' },
      {
        value: 'space-between',
        icon: markRaw(JustifyContentSpaceBetween),
        tooltip: '两端对齐 space-between',
      },
      {
        value: 'space-around',
        icon: markRaw(JustifyContentSpaceAround),
        tooltip: '横向平分 space-around',
      },
    ],
    display: (_mForm, { model }: { model: Record<any, any> }) => model.display === 'flex',
  }),
  defineFormItem({
    name: 'alignItems',
    text: '辅轴对齐',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '90px',
    iconSize: '24px',
    options: [
      { value: 'flex-start', icon: markRaw(AlignItemsFlexStart), tooltip: '左对齐 flex-start' },
      { value: 'flex-end', icon: markRaw(AlignItemsFlexEnd), tooltip: '右对齐 flex-end' },
      { value: 'center', icon: markRaw(AlignItemsCenter), tooltip: '居中 center' },
      {
        value: 'space-between',
        icon: markRaw(AlignItemsSpaceBetween),
        tooltip: '两端对齐 space-between',
      },
      {
        value: 'space-around',
        icon: markRaw(AlignItemsSpaceAround),
        tooltip: '横向平分 space-around',
      },
    ],
    display: (_mForm, { model }: { model: Record<any, any> }) => model.display === 'flex',
  }),
  defineFormItem({
    name: 'flexWrap',
    text: '换行',
    type: 'radioGroup',
    childType: theme !== 'magic-admin' ? 'button' : 'default',
    labelWidth: '90px',
    iconSize: '24px',
    options: [
      { value: 'nowrap', text: '不换行', tooltip: '不换行 nowrap' },
      { value: 'wrap', text: '正换行', tooltip: '第一行在上方 wrap' },
      { value: 'wrap-reverse', text: '逆换行', tooltip: '第一行在下方 wrap-reverse' },
    ],
    display: (_mForm, { model }: { model: Record<any, any> }) => model.display === 'flex',
  }),
  defineFormItem({
    type: 'row',
    items: [
      {
        name: 'width',
        text: '宽度（px）',
        labelWidth: '90px',
        type: 'data-source-field-select',
        fieldConfig: {
          type: 'text',
        },
      },
    ],
  }),
  defineFormItem({
    type: 'row',
    items: [
      {
        name: 'height',
        text: '高度（px）',
        labelWidth: '90px',
        type: 'data-source-field-select',
        fieldConfig: {
          type: 'text',
        },
      },
    ],
  }),
  defineFormItem({
    type: 'row',
    items: [
      {
        type: 'data-source-field-select',
        text: 'overflow',
        name: 'overflow',
        labelWidth: '90px',
        checkStrictly: false,
        dataSourceFieldType: ['string'],
        fieldConfig: {
          type: 'select',
          clearable: true,
          allowCreate: true,
          options: [
            { text: 'visible', value: 'visible' },
            { text: 'hidden', value: 'hidden' },
            { text: 'clip', value: 'clip' },
            { text: 'scroll', value: 'scroll' },
            { text: 'auto', value: 'auto' },
            { text: 'overlay', value: 'overlay' },
            { text: 'initial', value: 'initial' },
          ],
        },
      },
    ],
  }),
  defineFormItem({
    type: 'row',
    items: [
      {
        type: 'data-source-field-select',
        text: '透明度（%）',
        name: 'opacity',
        labelWidth: '90px',
        dataSourceFieldType: ['string', 'number'],
        fieldConfig: {
          type: 'text',
        },
      },
    ],
  }),
];

const positionText: Record<string, string> = {
  static: '不定位',
  relative: '相对定位',
  absolute: '绝对定位',
  fixed: '固定定位',
  sticky: '粘性定位',
};

/**
 * 「位置」面板配置。
 *
 * `values` 是当前 style 的 model：left/top/right/bottom 的 display 在求值时读取
 * `values.position`，所以必须传入响应式对象本身，不能先解构。
 */
export const createPositionConfig = (values: Partial<StyleSchema>): FormConfig => [
  defineFormItem({
    name: 'position',
    text: '定位',
    labelWidth: '68px',
    type: 'data-source-field-select',
    fieldConfig: {
      type: 'select',
      options: Object.keys(positionText).map((item) => ({
        value: item,
        text: `${item}(${positionText[item]})`,
      })),
    },
  }),
  defineFormItem({
    type: 'row',
    labelWidth: '68px',
    display: () => values.position !== 'static',
    items: [
      {
        name: 'left',
        type: 'data-source-field-select',
        text: 'left',
        fieldConfig: {
          type: 'text',
        },
        rules: [
          {
            typeMatch: true,
            message: appendValidateSuggestion('left 应为字符串', '请参考以下示例值："10"'),
          },
        ],
      },
      {
        name: 'top',
        type: 'data-source-field-select',
        text: 'top',
        fieldConfig: {
          type: 'text',
        },
        rules: [
          {
            typeMatch: true,
            message: appendValidateSuggestion('top 应为字符串', '请参考以下示例值："10"'),
          },
        ],
      },
    ],
  }),
  defineFormItem({
    type: 'row',
    labelWidth: '68px',
    display: () => values.position !== 'static',
    items: [
      {
        name: 'right',
        type: 'data-source-field-select',
        text: 'right',
        fieldConfig: {
          type: 'text',
        },
        rules: [
          {
            typeMatch: true,
            message: appendValidateSuggestion('right 应为字符串', '请参考以下示例值："10"'),
          },
        ],
      },
      {
        name: 'bottom',
        type: 'data-source-field-select',
        text: 'bottom',
        fieldConfig: {
          type: 'text',
        },
        rules: [
          {
            typeMatch: true,
            message: appendValidateSuggestion('bottom 应为字符串', '请参考以下示例值："10"'),
          },
        ],
      },
    ],
  }),
  defineFormItem({
    labelWidth: '68px',
    name: 'zIndex',
    text: 'zIndex',
    type: 'data-source-field-select',
    fieldConfig: {
      type: 'text',
    },
    rules: [
      {
        typeMatch: true,
        message: appendValidateSuggestion('zIndex 应为数字', '请参考以下示例值：10'),
      },
    ],
  }),
];

/**
 * 「背景」面板配置。
 *
 * 校验文案由 `@tmagic/design` 的 `appendValidateSuggestion` 生成，必须延迟到调用时
 * 才执行，不能在模块顶层求值：本模块会被大量组件间接引入，而 design 层在部分场景下
 * 才可用。
 */
export const createBackgroundConfig = (): FormConfig => [
  defineFormItem({
    name: 'backgroundColor',
    text: '背景色',
    labelWidth: '68px',
    type: 'data-source-field-select',
    fieldConfig: {
      type: 'colorPicker',
    },
    rules: [
      {
        typeMatch: true,
        message: appendValidateSuggestion('背景色应为字符串', '请参考以下示例值："#000000"'),
      },
    ],
  }),
  defineFormItem({
    name: 'backgroundImage',
    text: '背景图',
    labelWidth: '68px',
    type: 'data-source-field-select',
    fieldConfig: {
      type: 'img-upload',
    } as any,
  }),
  defineFormItem({
    name: 'backgroundSize',
    text: '背景尺寸',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '68px',
    options: [
      { value: 'auto', text: '默认', tooltip: '默认 auto' },
      { value: 'contain', text: '等比填充', tooltip: '等比填充 contain' },
      { value: 'cover', text: '等比覆盖', tooltip: '等比覆盖 cover' },
    ],
    rules: [
      {
        typeMatch: false,
      },
      {
        validator: ({ value, callback }) => {
          if (value === '' || value === null || value === undefined) {
            return callback();
          }

          const keywords = ['auto', 'cover', 'contain', 'inherit', 'initial', 'revert', 'unset'];
          // 单值：关键字 或 长度/百分比
          const lengthPercent = /^-?\d+(\.\d+)?(px|em|rem|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc|%)$/;
          const singleValue = (v: string) => keywords.includes(v) || lengthPercent.test(v);

          const str = String(value).trim();
          const parts = str.split(/\s+/);

          // cover / contain 不能与其他值组合
          if (parts.length > 1 && (parts.includes('cover') || parts.includes('contain'))) {
            return callback('cover/contain 不能与其他值组合');
          }

          // 多值最多两个
          if (parts.length > 2) {
            return callback('backgroundSize 最多支持两个值');
          }

          // 关键字 auto 在多值场景中允许与其他长度/百分比组合
          if (parts.every((part) => singleValue(part))) {
            return callback();
          }

          return callback('backgroundSize 值不合法');
        },
      },
    ],
  }),
  defineFormItem({
    name: 'backgroundRepeat',
    text: '重复显示',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '68px',
    options: [
      { value: 'no-repeat', icon: markRaw(BackgroundNoRepeat), tooltip: '不重复 no-repeat' },
      { value: 'repeat-x', icon: markRaw(BackgroundRepeatX), tooltip: '水平方向重复 repeat-x' },
      { value: 'repeat-y', icon: markRaw(BackgroundRepeatY), tooltip: '垂直方向重复 repeat-y' },
      {
        value: 'repeat',
        icon: markRaw(BackgroundRepeat),
        tooltip: '垂直和水平方向重复 repeat',
      },
    ],
  }),
  defineFormItem({
    name: 'backgroundPosition',
    text: '背景定位',
    type: 'component',
    component: BackgroundPosition,
    labelWidth: '68px',
  }),
];

/**
 * 「文字」面板配置。
 *
 * 字重校验依赖编辑器服务（数据源/代码块），由调用方把 `type-match-rules` 的
 * `validateDataSourceFieldSelect` 传进来：本模块只描述配置，不直接引用服务层，
 * 否则会把整条服务依赖链拖进所有引用方。
 */
export const createFontConfig = (validateDataSourceField: typeof validateDataSourceFieldSelect): FormConfig => [
  defineFormItem({
    type: 'row',
    items: [
      {
        labelWidth: '68px',
        name: 'fontSize',
        text: '字号',
        type: 'data-source-field-select',
        fieldConfig: {
          type: 'text',
        },
        rules: [
          {
            typeMatch: true,
            message: appendValidateSuggestion('字号应为字符串或数字', '请参考以下示例值：24 或 "24"'),
          },
        ],
      },
      {
        labelWidth: '68px',
        name: 'lineHeight',
        text: '行高',
        type: 'data-source-field-select',
        fieldConfig: {
          type: 'text',
        },
      },
    ],
  }),
  defineFormItem({
    name: 'fontWeight',
    text: '字重',
    labelWidth: '68px',
    type: 'data-source-field-select',
    dataSourceFieldType: ['string', 'number'],
    fieldConfig: {
      type: 'select',
      allowCreate: true,
      options: ['normal', 'bold']
        .concat(
          Array(7)
            .fill(1)
            .map((x, i) => `${i + 1}00`),
        )
        .map((item) => ({
          value: item,
          text: item,
        })),
    },
    rules: [
      {
        typeMatch: false,
      },
      {
        validator: ({ value, callback }, { config, model, prop }, mForm) => {
          if (value === '' || value === null || value === undefined) {
            return callback();
          }

          const result = validateDataSourceField(
            value,
            {
              fieldType: 'data-source-field-select',
              mForm,
              props: { config, model, prop },
            },
            {
              // 字重允许 string（含可创建项）与 number（如 700）
              validatePlainValue: (plainValue) => {
                if (typeof plainValue === 'string' || (typeof plainValue === 'number' && !Number.isNaN(plainValue))) {
                  return undefined;
                }
                return '字重应为字符串或数字';
              },
            },
          );

          if (result && typeof (result as Promise<string | undefined>).then === 'function') {
            (result as Promise<string | undefined>).then(
              (error) => callback(error),
              (error) => callback(error),
            );
            return;
          }

          return callback(result);
        },
      },
    ],
  }),
  defineFormItem({
    labelWidth: '68px',
    name: 'color',
    text: '颜色',
    type: 'data-source-field-select',
    fieldConfig: {
      type: 'colorPicker',
    },
    rules: [
      {
        typeMatch: true,
        message: appendValidateSuggestion('颜色应为字符串', '请参考以下示例值："#000000"'),
      },
    ],
  }),
  defineFormItem({
    name: 'textAlign',
    text: '对齐',
    type: 'radioGroup',
    childType: 'button',
    labelWidth: '68px',
    options: [
      { value: 'left', icon: markRaw(AlignLeft), tooltip: '左对齐 row', text: '左对齐' },
      { value: 'center', icon: markRaw(AlignCenter), tooltip: '居中对齐 center', text: '居中对齐' },
      { value: 'right', icon: markRaw(AlignRight), tooltip: '右对齐 right', text: '右对齐' },
    ],
  }),
];

/** 「边框与圆角」面板中圆角部分的配置，边框四向配置见 `createBorderDirectionConfig`。 */
export const borderRadiusConfig = defineFormItem({
  labelWidth: '68px',
  name: 'borderRadius',
  text: '圆角',
  type: 'data-source-field-select',
  fieldConfig: {
    type: 'text',
  },
});

/** 「变形」面板配置。 */
export const transformConfig = defineFormItem({
  name: 'transform',
  items: [
    {
      name: 'rotate',
      text: '旋转角度',
      labelWidth: '68px',
      type: 'data-source-field-select',
      checkStrictly: false,
      dataSourceFieldType: ['string', 'number'],
      fieldConfig: {
        type: 'text',
      },
    },
    {
      name: 'scale',
      text: '缩放',
      labelWidth: '68px',
      type: 'data-source-field-select',
      checkStrictly: false,
      dataSourceFieldType: ['string', 'number'],
      fieldConfig: {
        type: 'text',
      },
    },
  ],
});

/**
 * 把 6 个样式面板里会向父表单注册 FormItem 的配置按 `Index.vue` 的面板顺序拼成一份。
 *
 * 给无渲染校验的嵌套配置用：组件侧仍按面板各自渲染，这份合成配置只描述「父表单上
 * 实际会出现哪些字段」。以下两处与组件一致、不纳入：
 * - Layout 里的 Box（margin/padding）是裸 input，没有 MContainer；
 * - Border 子组件的四向边框 MContainer 没传 `:prop`（路径从父表单脱落，本轮不修）。
 *
 * `theme` 只影响 flexWrap 的 UI `childType`，不影响校验字段。
 */
export const createStyleSetterConfig = (
  values: Partial<StyleSchema>,
  theme: string,
  validateDataSourceField: typeof validateDataSourceFieldSelect,
): FormConfig => [
  ...createLayoutConfig(theme),
  ...createPositionConfig(values),
  ...createBackgroundConfig(),
  ...createFontConfig(validateDataSourceField),
  borderRadiusConfig,
  transformConfig,
];

/**
 * 边框配置，按当前选中的方向拼字段名。
 *
 * `direction` 取 ''(四向) / 'Top' / 'Right' / 'Bottom' / 'Left'，空串对应
 * `borderWidth` 这类不带方向的字段。
 */
export const createBorderDirectionConfig = (direction: string) =>
  defineFormItem({
    items: [
      {
        name: `border${direction}Width`,
        text: '边框宽度',
        labelWidth: '68px',
        type: 'data-source-field-select',
        fieldConfig: {
          type: 'text',
        },
      },
      {
        name: `border${direction}Color`,
        text: '边框颜色',
        labelWidth: '68px',
        type: 'data-source-field-select',
        fieldConfig: {
          type: 'colorPicker',
        },
      },
      {
        name: `border${direction}Style`,
        text: '边框样式',
        labelWidth: '68px',
        type: 'data-source-field-select',
        fieldConfig: {
          type: 'select',
          options: ['solid', 'dashed', 'dotted'].map((item) => ({
            value: item,
            text: item,
          })),
        },
      },
    ],
  });
