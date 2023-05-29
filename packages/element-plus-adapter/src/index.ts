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

const adapter: any = {
  message: ElMessage,
  messageBox: ElMessageBox,
  components: {
    autocomplete: {
      component: ElAutocomplete,
      props: (props: AutocompleteProps) => props,
    },

    badge: {
      component: ElBadge,
      props: (props: BadgeProps) => props,
    },

    button: {
      component: ElButton,
      props: (props: ButtonProps) => props,
    },

    card: {
      component: ElCard,
      props: (props: CardProps) => props,
    },

    cascader: {
      component: ElCascader,
      props: (props: CascaderProps) => props,
    },

    checkbox: {
      component: ElCheckbox,
      props: (props: CheckboxProps) => props,
    },

    checkboxGroup: {
      component: ElCheckboxGroup,
      props: (props: CheckboxGroupProps) => props,
    },

    col: {
      component: ElCol,
      props: (props: ColProps) => props,
    },

    collapse: {
      component: ElCollapse,
      props: (props: CollapseProps) => props,
    },

    collapseItem: {
      component: ElCollapseItem,
      props: (props: CollapseItemProps) => props,
    },

    colorPicker: {
      component: ElColorPicker,
      props: (props: ColorPickerProps) => props,
    },

    datePicker: {
      component: ElDatePicker,
      props: (props: DatePickerProps) => props,
    },

    dialog: {
      component: ElDialog,
      props: (props: DialogProps) => props,
    },

    divider: {
      component: ElDivider,
      props: (props: DividerProps) => props,
    },

    drawer: {
      component: ElDrawer,
      props: (props: DrawerProps) => props,
    },

    dropdown: {
      component: ElDropdown,
      props: (props: DropdownProps) => props,
    },

    dropdownItem: {
      component: ElDropdownItem,
      props: (props: DropdownItemProps) => props,
    },

    dropdownMenu: {
      component: ElDropdownMenu,
      props: () => ({}),
    },

    form: {
      component: ElForm,
      props: (props: FormProps) => props,
    },

    formItem: {
      component: ElFormItem,
      props: (props: FormItemProps) => props,
    },

    icon: {
      component: ElIcon,
      props: () => ({}),
    },

    input: {
      component: ElInput,
      props: (props: InputProps) => props,
    },

    inputNumber: {
      component: ElInputNumber,
      props: (props: InputNumberProps) => props,
    },

    option: {
      component: ElOption,
      props: (props: OptionProps) => props,
    },

    optionGroup: {
      component: ElOptionGroup,
      props: (props: OptionGroupProps) => props,
    },

    pagination: {
      component: ElPagination,
      props: (props: PaginationProps) => props,
    },

    popover: {
      component: ElPopover,
      props: (props: PopoverProps) => props,
    },

    radio: {
      component: ElRadio,
      props: (props: RadioProps) => props,
    },

    radioButton: {
      component: ElRadioButton,
      props: (props: RadioButtonProps) => props,
    },

    radioGroup: {
      component: ElRadioGroup,
      props: (props: RadioGroupProps) => props,
    },

    row: {
      component: ElRow,
      props: () => ({}),
    },

    scrollbar: {
      component: ElScrollbar,
      props: () => ({}),
    },

    select: {
      component: ElSelect,
      props: (props: SelectProps) => props,
    },

    step: {
      component: ElStep,
      props: (props: StepProps) => props,
    },

    steps: {
      component: ElSteps,
      props: (props: StepsProps) => props,
    },

    switch: {
      component: ElSwitch,
      props: (props: SwitchProps) => props,
    },

    table: {
      component: ElTable,
      props: (props: TableProps) => props,
    },

    tableColumn: {
      component: ElTableColumn,
      props: (props: TableColumnProps) => props,
    },

    tabPane: {
      component: ElTabPane,
      props: (props: TabPaneProps) => props,
    },

    tabs: {
      component: ElTabs,
      props: (props: TabsProps) => props,
    },

    tag: {
      component: ElTag,
      props: (props: TagProps) => props,
    },

    timePicker: {
      component: ElTimePicker,
      props: (props: TimePickerProps) => props,
    },

    tooltip: {
      component: ElTooltip,
      props: (props: TooltipProps) => props,
    },

    tree: {
      component: ElTree,
      props: (props: TreeProps) => props,
    },

    upload: {
      component: ElUpload,
      props: (props: UploadProps) => props,
    },
  },
};

export default adapter;
