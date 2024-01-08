import {
  ElAutocomplete,
  ElBadge,
  ElButton,
  ElCard,
  ElCascader,
  ElCheckbox,
  ElCheckboxGroup,
  ElCol,
  ElCollapse,
  ElCollapseItem,
  ElColorPicker,
  ElDatePicker,
  ElDialog,
  ElDivider,
  ElDrawer,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElOptionGroup,
  ElPagination,
  ElPopover,
  ElRadio,
  ElRadioButton,
  ElRadioGroup,
  ElRow,
  ElScrollbar,
  ElSelect,
  ElStep,
  ElSteps,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTimePicker,
  ElTooltip,
  ElTree,
  ElUpload,
  useZIndex,
} from 'element-plus';

import type {
  AutocompleteProps,
  BadgeProps,
  ButtonProps,
  CardProps,
  CascaderProps,
  CheckboxGroupProps,
  CheckboxProps,
  CollapseItemProps,
  CollapseProps,
  ColorPickerProps,
  ColProps,
  DatePickerProps,
  DialogProps,
  DividerProps,
  DrawerProps,
  DropdownItemProps,
  DropdownProps,
  FormItemProps,
  FormProps,
  InputNumberProps,
  InputProps,
  OptionGroupProps,
  OptionProps,
  PaginationProps,
  PluginOptions,
  PopoverProps,
  RadioButtonProps,
  RadioGroupProps,
  RadioProps,
  SelectProps,
  StepProps,
  StepsProps,
  SwitchProps,
  TableColumnProps,
  TableProps,
  TabPaneProps,
  TabsProps,
  TagProps,
  TimePickerProps,
  TooltipProps,
  TreeProps,
  UploadProps,
} from '@tmagic/design';

const adapter: PluginOptions = {
  useZIndex,
  message: ElMessage,
  messageBox: ElMessageBox,
  components: {
    autocomplete: {
      component: ElAutocomplete as any,
      props: (props: AutocompleteProps) => props,
    },

    badge: {
      component: ElBadge as any,
      props: (props: BadgeProps) => props,
    },

    button: {
      component: ElButton as any,
      props: (props: ButtonProps) => props,
    },

    card: {
      component: ElCard as any,
      props: (props: CardProps) => props,
    },

    cascader: {
      component: ElCascader as any,
      props: (props: CascaderProps) => props,
    },

    checkbox: {
      component: ElCheckbox as any,
      props: (props: CheckboxProps) => props,
    },

    checkboxGroup: {
      component: ElCheckboxGroup as any,
      props: (props: CheckboxGroupProps) => props,
    },

    col: {
      component: ElCol as any,
      props: (props: ColProps) => props,
    },

    collapse: {
      component: ElCollapse as any,
      props: (props: CollapseProps) => props,
    },

    collapseItem: {
      component: ElCollapseItem as any,
      props: (props: CollapseItemProps) => props,
    },

    colorPicker: {
      component: ElColorPicker as any,
      props: (props: ColorPickerProps) => props,
    },

    datePicker: {
      component: ElDatePicker as any,
      props: (props: DatePickerProps) => props,
    },

    dialog: {
      component: ElDialog as any,
      props: (props: DialogProps) => props,
    },

    divider: {
      component: ElDivider as any,
      props: (props: DividerProps) => props,
    },

    drawer: {
      component: ElDrawer as any,
      props: (props: DrawerProps) => props,
    },

    dropdown: {
      component: ElDropdown as any,
      props: (props: DropdownProps) => props,
    },

    dropdownItem: {
      component: ElDropdownItem as any,
      props: (props: DropdownItemProps) => props,
    },

    dropdownMenu: {
      component: ElDropdownMenu,
      props: () => ({}),
    },

    form: {
      component: ElForm as any,
      props: (props: FormProps) => props,
    },

    formItem: {
      component: ElFormItem as any,
      props: (props: FormItemProps) => props,
    },

    icon: {
      component: ElIcon,
      props: () => ({}),
    },

    input: {
      component: ElInput as any,
      props: (props: InputProps) => props,
    },

    inputNumber: {
      component: ElInputNumber as any,
      props: (props: InputNumberProps) => props,
    },

    option: {
      component: ElOption as any,
      props: (props: OptionProps) => props,
    },

    optionGroup: {
      component: ElOptionGroup as any,
      props: (props: OptionGroupProps) => props,
    },

    pagination: {
      component: ElPagination as any,
      props: (props: PaginationProps) => props,
    },

    popover: {
      component: ElPopover as any,
      props: (props: PopoverProps) => props,
    },

    radio: {
      component: ElRadio as any,
      props: (props: RadioProps) => props,
    },

    radioButton: {
      component: ElRadioButton as any,
      props: (props: RadioButtonProps) => props,
    },

    radioGroup: {
      component: ElRadioGroup as any,
      props: (props: RadioGroupProps) => props,
    },

    row: {
      component: ElRow as any,
      props: () => ({}),
    },

    scrollbar: {
      component: ElScrollbar as any,
      props: () => ({}),
    },

    select: {
      component: ElSelect as any,
      props: (props: SelectProps) => props,
    },

    step: {
      component: ElStep as any,
      props: (props: StepProps) => props,
    },

    steps: {
      component: ElSteps as any,
      props: (props: StepsProps) => props,
    },

    switch: {
      component: ElSwitch as any,
      props: (props: SwitchProps) => props,
    },

    table: {
      component: ElTable as any,
      props: (props: TableProps) => props,
    },

    tableColumn: {
      component: ElTableColumn as any,
      props: (props: TableColumnProps) => props,
    },

    tabPane: {
      component: ElTabPane as any,
      props: (props: TabPaneProps) => props,
    },

    tabs: {
      component: ElTabs as any,
      props: (props: TabsProps) => props,
    },

    tag: {
      component: ElTag as any,
      props: (props: TagProps) => props,
    },

    timePicker: {
      component: ElTimePicker as any,
      props: (props: TimePickerProps) => props,
    },

    tooltip: {
      component: ElTooltip as any,
      props: (props: TooltipProps) => props,
    },

    tree: {
      component: ElTree as any,
      props: (props: TreeProps) => props,
    },

    upload: {
      component: ElUpload as any,
      props: (props: UploadProps) => props,
    },
  },
};

export default adapter;
