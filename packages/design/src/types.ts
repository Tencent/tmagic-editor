import { ComputedRef, DefineComponent, Directive, Ref } from 'vue';

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
  size?: FieldSize;
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
  link?: boolean;
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
  /** 弹出内容的自定义类名 */
  popperClass?: string;
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
  rows?: number;
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
  visible?: boolean | null;
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

export interface Components {
  badge: {
    component: DefineComponent<BadgeProps, {}, any> | string;
    props: (props: BadgeProps) => BadgeProps;
  };

  autocomplete: {
    component: DefineComponent<AutocompleteProps, {}, any> | string;
    props: (props: AutocompleteProps) => AutocompleteProps;
  };

  button: {
    component: DefineComponent<ButtonProps, {}, any> | string;
    props: (props: ButtonProps) => ButtonProps;
  };

  card: {
    component: DefineComponent<CardProps, {}, any> | string;
    props: (props: CardProps) => CardProps;
  };

  cascader: {
    component: DefineComponent<CascaderProps, {}, any> | string;
    props: (props: CascaderProps) => CascaderProps;
  };

  checkbox: {
    component: DefineComponent<CheckboxProps, {}, any> | string;
    props: (props: CheckboxProps) => CheckboxProps;
  };

  checkboxGroup: {
    component: DefineComponent<CheckboxGroupProps, {}, any> | string;
    props: (props: CheckboxGroupProps) => CheckboxGroupProps;
  };

  col: {
    component: DefineComponent<ColProps, {}, any> | string;
    props: (props: ColProps) => ColProps;
  };

  collapse: {
    component: DefineComponent<CollapseProps, {}, any> | string;
    props: (props: CollapseProps) => CollapseProps;
  };

  collapseItem: {
    component: DefineComponent<CollapseItemProps, {}, any> | string;
    props: (props: CollapseItemProps) => CollapseItemProps;
  };

  colorPicker: {
    component: DefineComponent<ColorPickerProps, {}, any> | string;
    props: (props: ColorPickerProps) => ColorPickerProps;
  };

  datePicker: {
    component: DefineComponent<DatePickerProps, {}, any> | string;
    props: (props: DatePickerProps) => DatePickerProps;
  };

  dialog: {
    component: DefineComponent<DialogProps, {}, any> | string;
    props: (props: DialogProps) => DialogProps;
  };

  divider: {
    component: DefineComponent<DividerProps, {}, any> | string;
    props: (props: DividerProps) => DividerProps;
  };

  drawer: {
    component:
      | DefineComponent<
          DrawerProps,
          {
            handleClose: () => void;
          },
          any
        >
      | string;
    props: (props: DrawerProps) => DrawerProps;
  };

  dropdown: {
    component: DefineComponent<DropdownProps, {}, any> | string;
    props: (props: DropdownProps) => DropdownProps;
  };

  dropdownItem: {
    component: DefineComponent<DropdownItemProps, {}, any> | string;
    props: (props: DropdownItemProps) => DropdownItemProps;
  };

  dropdownMenu: {
    component: DefineComponent<{}, {}, any> | string;
    props: () => {};
  };

  form: {
    component: DefineComponent<FormProps, {}, any> | string;
    props: (props: FormProps) => FormProps;
  };

  formItem: {
    component: DefineComponent<FormItemProps, {}, any> | string;
    props: (props: FormItemProps) => FormItemProps;
  };

  icon: {
    component: DefineComponent<{}, {}, any> | string;
    props: () => {};
  };

  input: {
    component:
      | DefineComponent<
          InputProps,
          {
            instance: any;
            getInput: () => HTMLInputElement | undefined;
            getTextarea: () => HTMLTextAreaElement | undefined;
          },
          any
        >
      | string;
    props: (props: InputProps) => InputProps;
  };

  inputNumber: {
    component: DefineComponent<InputNumberProps, {}, any> | string;
    props: (props: InputNumberProps) => InputNumberProps;
  };

  option: {
    component: DefineComponent<OptionProps, {}, any> | string;
    props: (props: OptionProps) => OptionProps;
  };

  optionGroup: {
    component: DefineComponent<OptionGroupProps, {}, any> | string;
    props: (props: OptionGroupProps) => OptionGroupProps;
  };

  pagination: {
    component: DefineComponent<PaginationProps, {}, any> | string;
    props: (props: PaginationProps) => PaginationProps;
  };

  popover: {
    component: DefineComponent<PopoverProps, {}, any> | string;
    props: (props: PopoverProps) => PopoverProps;
  };

  radio: {
    component: DefineComponent<RadioProps, {}, any> | string;
    props: (props: RadioProps) => RadioProps;
  };

  radioButton: {
    component: DefineComponent<RadioButtonProps, {}, any> | string;
    props: (props: RadioButtonProps) => RadioButtonProps;
  };

  radioGroup: {
    component: DefineComponent<RadioGroupProps, {}, any> | string;
    props: (props: RadioGroupProps) => RadioGroupProps;
  };

  row: {
    component: DefineComponent<{}, {}, any> | string;
    props: () => {};
  };

  scrollbar: {
    component: DefineComponent<{}, {}, any> | string;
    props: () => {};
  };

  select: {
    component:
      | DefineComponent<
          SelectProps,
          {
            scrollbarWrap: HTMLDivElement | undefined;
            setQuery: (v: string) => void;
            setPreviousQuery: (v: string) => void;
            setSelectedLabel: (v: string) => void;
            setSelected: () => void;
          },
          any
        >
      | string;
    props: (props: SelectProps) => SelectProps;
  };

  step: {
    component: DefineComponent<StepProps, {}, any> | string;
    props: (props: StepProps) => StepProps;
  };

  steps: {
    component: DefineComponent<StepsProps, {}, any> | string;
    props: (props: StepsProps) => StepsProps;
  };

  switch: {
    component: DefineComponent<SwitchProps, {}, any> | string;
    props: (props: SwitchProps) => SwitchProps;
  };

  table: {
    component:
      | DefineComponent<
          TableProps,
          {
            instance: any;
            $el: HTMLDivElement | undefined;
            clearSelection: (...args: any[]) => void;
            toggleRowSelection: (...args: any[]) => void;
            toggleRowExpansion: (...args: any[]) => void;
          },
          any
        >
      | string;
    props: (props: TableProps) => TableProps;
  };

  tableColumn: {
    component: DefineComponent<TableColumnProps, {}, any> | string;
    props: (props: TableColumnProps) => TableColumnProps;
  };

  tabPane: {
    component: DefineComponent<TabPaneProps, {}, any> | string;
    props: (props: TabPaneProps) => TabPaneProps;
  };

  tabs: {
    component: DefineComponent<TabsProps, {}, any> | string;
    props: (props: TabsProps) => TabsProps;
  };

  tag: {
    component: DefineComponent<TagProps, {}, any> | string;
    props: (props: TagProps) => TagProps;
  };

  timePicker: {
    component: DefineComponent<TimePickerProps, {}, any> | string;
    props: (props: TimePickerProps) => TimePickerProps;
  };

  tooltip: {
    component: DefineComponent<TooltipProps, {}, any> | string;
    props: (props: TooltipProps) => TooltipProps;
  };

  tree: {
    component:
      | DefineComponent<
          TreeProps,
          {
            getData: () => TreeProps['data'];
            getStore: () => any;
            filter: (...args: any[]) => any;
            getNode: (...args: any[]) => any;
            setCheckedKeys: (...args: any[]) => any;
            setCurrentKey: (...args: any[]) => any;
          },
          any
        >
      | string;
    props: (props: TreeProps) => TreeProps;
  };

  upload: {
    component:
      | DefineComponent<
          UploadProps,
          {
            clearFiles: (...args: any[]) => any;
          },
          any
        >
      | string;
    props: (props: UploadProps) => UploadProps;
  };
}

export interface PluginOptions {
  message?: TMagicMessage;
  messageBox?: TMagicMessageBox;
  components?: Components;
  loading?: Directive<ElementLoading, LoadingBinding>;
  useZIndex?: (zIndexOverrides?: Ref<number>) => {
    initialZIndex: ComputedRef<number>;
    currentZIndex: ComputedRef<number>;
    nextZIndex: () => number;
  };
  [key: string]: any;
}
