import { Directive } from 'vue';

export interface CascaderOption {
  /** 指定选项的值为选项对象的某个属性值 */
  value: any;
  /** 指定选项标签为选项对象的某个属性值 */
  label: string;
  /** 指定选项的子选项为选项对象的某个属性值 */
  children?: CascaderOption[];
}

export interface TMagicMessage {
  success: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
  error: (msg: string) => void;
  closeAll: () => void;
}

export type ElMessageBoxShortcutMethod = ((
  message: string,
  title: string,
  options?: any,
  appContext?: any | null,
) => Promise<any>) &
  ((message: string, options?: any, appContext?: any | null) => Promise<any>);

export interface TMagicMessageBox {
  alert: ElMessageBoxShortcutMethod;

  confirm: ElMessageBoxShortcutMethod;

  prompt: ElMessageBoxShortcutMethod;

  close(): void;
}

export type LoadingBinding = boolean;

const INSTANCE_KEY = Symbol('TdesignLoading');

export interface ElementLoading extends HTMLElement {
  [INSTANCE_KEY]?: {
    instance: any;
  };
}

export interface PluginOptions {
  message?: TMagicMessage;
  messageBox?: TMagicMessageBox;
  components?: Record<string, any>;
  loading?: Directive<ElementLoading, LoadingBinding>;
  [key: string]: any;
}

export type FieldSize = 'large' | 'default' | 'small';

export interface AutocompleteProps {
  modelValue?: string;
  placeholder?: string;
  label?: string;
  clearable?: boolean;
  disabled?: boolean;
  triggerOnFocus?: boolean;
  valueKey?: string;
  debounce?: number;
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';
  fetchSuggestions?: (queryString: string, callback: (data: any[]) => any) => void;
}

export interface BadgeProps {
  value?: string | number;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  max?: number;
  isDot?: boolean;
  hidden?: boolean;
}

export interface ButtonProps {
  type?: string;
  size?: FieldSize;
  text?: boolean;
  icon?: any;
}

export interface CardProps {
  bodyStyle?: Record<string, any>;
  shadow?: string;
  header?: string;
}

export interface CascaderProps {
  modelValue?: any;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  filterable?: boolean;
  options?: CascaderOption[];
  size?: FieldSize;
  props: {
    expandTrigger?: 'click' | 'hover';
    multiple?: boolean;
    checkStrictly?: boolean;
    emitPath?: boolean;
    lazy?: boolean;
  };
}

export interface CheckboxProps {
  modelValue?: string | number | boolean;
  value?: string | number | boolean;
  label?: any;
  trueLabel?: string | number | boolean;
  falseLabel?: string | number | boolean;
  disabled?: boolean;
  size?: FieldSize;
}

export interface CheckboxGroupProps {
  modelValue?: any[];
  label?: string;
  disabled?: boolean;
  size?: FieldSize;
}

export interface ColProps {
  span?: number;
}

export interface CollapseProps {
  modelValue?: string | string[];
  accordion?: boolean;
}

export interface CollapseItemProps {
  name?: string | number;
  title?: string;
  disabled?: boolean;
}

export interface ColorPickerProps {
  modelValue?: string;
  disabled?: boolean;
  showAlpha?: boolean;
  size?: FieldSize;
}

export interface DatePickerProps {
  type?: string;
  modelValue?: any;
  disabled?: boolean;
  placeholder?: string;
  rangeSeparator?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  format?: string;
  /** 可选，绑定值的格式。 不指定则绑定值为 Date 对象 */
  valueFormat?: string;
  /** 在范围选择器里取消两个日期面板之间的联动 */
  unlinkPanels?: boolean;
  defaultTime?: any;
  size?: FieldSize;
}

export interface DialogProps {
  modelValue?: boolean;
  appendToBody?: boolean;
  beforeClose?: any;
  title?: string;
  width?: string | number;
  fullscreen?: boolean;
  closeOnClickModal?: boolean;
  closeOnPressEscape?: boolean;
}

export interface DividerProps {
  direction?: string;
  borderStyle?: string;
  contentPosition?: string;
}

export interface DrawerProps {
  modelValue?: boolean;
  appendToBody?: boolean;
  beforeClose?: any;
  title?: string;
  size?: string | number;
  fullscreen?: boolean;
  closeOnClickModal?: boolean;
  closeOnPressEscape?: boolean;
  direction?: 'rtl' | 'ltr' | 'ttb' | 'bt';
}

export interface DropdownProps {
  type?: string;
  size?: string;
  maxHeight?: string | number;
  splitButton?: boolean;
  disable?: boolean;
  placement?: string;
  trigger?: string;
  hideOnClick?: boolean;
  showTimeout?: number;
  role?: string;
  tabindex?: number;
  popperClass?: string;
  popperOptions?: any;
}

export interface DropdownItemProps {
  command?: any;
  disabled?: boolean;
  divided?: boolean;
  icon?: any;
}

export interface FormProps {
  model?: any;
  labelWidth?: string | number;
  disabled?: boolean;
  inline?: boolean;
  labelPosition?: string;
}

export interface FormItemProps {
  prop?: string;
  labelWidth?: string | number;
  rules?: any;
}

export interface InputProps {
  modelValue?: string | number;
  clearable?: boolean;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
  size?: FieldSize;
}

export interface InputNumberProps {
  modelValue?: string | number | boolean;
  clearable?: boolean;
  controlsPosition?: string;
  disabled?: boolean;
  placeholder?: string;
  step?: number;
  min?: number;
  max?: number;
  size?: FieldSize;
}

export interface OptionProps {
  value?: any;
  label?: string;
  disabled?: boolean;
}

export interface OptionGroupProps {
  label?: string;
  disabled?: boolean;
}

export interface PaginationProps {
  layout?: string;
  hideOnSinglePage?: boolean;
  curPage?: number;
  pageSizes?: number[];
  pagesize?: number;
  total?: number;
}

export interface PopoverProps {
  placement?: string;
  width?: string | number;
  title?: string;
  trigger?: string;
  effect?: string;
  content?: string;
  disabled?: boolean;
  popperClass?: string;
}

export interface RadioProps {
  label?: string | number | boolean;
}

export interface RadioButtonProps {
  label?: string | number | boolean;
  disabled?: boolean;
  name?: string;
}

export interface RadioGroupProps {
  modelValue?: string | number | boolean;
  disabled?: boolean;
  size?: FieldSize;
}

export interface SelectProps {
  modelValue?: any;
  clearable?: boolean;
  filterable?: boolean;
  popperClass?: string;
  disabled?: boolean;
  placeholder?: string;
  remote?: boolean;
  multiple?: boolean;
  allowCreate?: boolean;
  valueKey?: string;
  remoteMethod?: any;
  loading?: boolean;
  size?: FieldSize;
  onSearch?: any;
}

export interface StepProps {
  title?: string;
  active?: number;
  props?: any;
  status?: any;
}

export interface StepsProps {
  active?: number;
  space?: number | string;
}

export interface SwitchProps {
  modelValue?: string | number | boolean;
  label?: any;
  activeValue?: string | number | boolean;
  inactiveValue?: string | number | boolean;
  disabled?: boolean;
  size?: FieldSize;
}

export interface TableProps {
  data?: any[];
  border?: boolean;
  maxHeight?: number | string;
  defaultExpandAll?: boolean;
}

export interface TableColumnProps {
  label?: string;
  align?: string;
  fixed?: string | boolean;
  width?: string | number;
}

export interface TabPaneProps {
  name?: string;
  label?: string;
  lazy?: boolean;
}

export interface TabsProps {
  type?: string;
  editable?: boolean;
  tabPosition?: string;
  modelValue?: string | number;
}

export interface TagProps {
  type?: string;
  disableTransition?: boolean;
}

export interface TimePickerProps {
  modelValue?: any;
  disabled?: boolean;
  placeholder?: string;
  size?: FieldSize;
}

export interface TooltipProps {
  placement?: string;
  disabled?: boolean;
  content?: string;
  effect?: string;
  transition?: string;
  offset?: number;
}

export interface TreeProps {
  data?: any[];
  emptyText?: string;
  nodeKey?: string;
  props?: any;
  renderAfterExpand?: boolean;
  load?: any;
  renderContent?: any;
  highlightCurrent?: boolean;
  defaultExpandAll?: boolean;
  checkOnClickNode?: boolean;
  autoExpandParent?: boolean;
  defaultExpandedKeys?: any[];
  showCheckbox?: boolean;
  checkStrictly?: boolean;
  defaultCheckedKeys?: any[];
  currentNodeKey?: string | number;
  filterNodeMethod?: (value: any, data: any, node: any) => boolean;
  accordion?: boolean;
  indent?: number;
  icon?: any;
  lazy?: boolean;
  draggable?: boolean;
  allowDrag?: (node: any) => boolean;
  allowDrop?: any;
}

export interface UploadProps {
  action?: string;
  autoUpload?: boolean;
  disabled?: boolean;
}
