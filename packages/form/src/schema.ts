import type { FormItemConfig } from '@tmagic/form-schema';

export * from '@tmagic/form-schema';

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
