import type { InjectionKey } from 'vue';

import type { FormItemConfig } from '@tmagic/form-schema';

export * from '@tmagic/form-schema';

/**
 * 对比模式相关配置，由 `MForm` 通过 `provide` 注入，
 * 所有层级的 Container（含嵌套在 fieldset / panel 等容器组件内部的 Container）通过 `inject` 获取，
 * 无需逐层透传 prop。
 */
export interface FormDiffConfig {
  /**
   * 自定义"是否展示对比内容"的判断函数（仅在对比模式下生效）。
   *
   * - 不传：使用默认逻辑 `!isEqual(curValue, lastValue)`；
   * - 传函数：完全以函数返回值为准，返回 `true` 才展示前后两份对比内容。
   */
  showDiff?: (_data: { curValue: any; lastValue: any; config: FormItemConfig }) => boolean;
  /**
   * 自定义「自接管对比」的字段类型（仅在对比模式下生效）。
   *
   * - 传数组：在内置类型基础上「追加」这些类型；
   * - 传函数：入参为内置类型数组，返回值作为「最终」完整类型列表（可完全替换内置项）。
   */
  selfDiffFieldTypes?: string[] | ((_defaultTypes: string[]) => string[]);
}

export const FORM_DIFF_CONFIG_KEY: InjectionKey<FormDiffConfig> = Symbol('mFormDiffConfig');

export interface ValidateError {
  message: string;
  field: string;
}

export interface ChangeRecord {
  propPath?: string;
  value: any;
}

export interface ContainerChangeEventData {
  modifyKey?: string;
  changeRecords?: ChangeRecord[];
}

/** 自定义 label slot 的作用域参数 */
export interface FormLabelSlotProps {
  /** 当前表单项配置 */
  config: FormItemConfig;
  /** 经处理后的类型 */
  type: string;
  /** 经 filterFunction 处理后的 label 文案 */
  text?: string;
  /** 完整字段路径（包含父级前缀） */
  prop: string;
  /** 经 filterFunction 处理后的最终禁用状态 */
  disabled?: boolean;
}

/** Form / Container 暴露的具名 slot 定义 */
export interface FormSlots {
  label(_props: FormLabelSlotProps): any;
}
