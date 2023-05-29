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
} from './types';

export default {
  components: {
    badge: {
      component: 'el-badge',
      props: (props: BadgeProps) => props,
    },

    autocomplete: {
      component: 'el-autocomplete',
      props: (props: AutocompleteProps) => props,
    },

    button: {
      component: 'el-button',
      props: (props: ButtonProps) => props,
    },

    card: {
      component: 'el-card',
      props: (props: CardProps) => props,
    },

    cascader: {
      component: 'el-cascader',
      props: (props: CascaderProps) => props,
    },

    checkbox: {
      component: 'el-checkbox',
      props: (props: CheckboxProps) => props,
    },

    checkboxGroup: {
      component: 'el-checkbox-group',
      props: (props: CheckboxGroupProps) => props,
    },

    col: {
      component: 'el-col',
      props: (props: ColProps) => props,
    },

    collapse: {
      component: 'el-collapse',
      props: (props: CollapseProps) => props,
    },

    collapseItem: {
      component: 'el-collapse-item',
      props: (props: CollapseItemProps) => props,
    },

    colorPicker: {
      component: 'el-color-picker',
      props: (props: ColorPickerProps) => props,
    },

    datePicker: {
      component: 'el-date-picker',
      props: (props: DatePickerProps) => props,
    },

    dialog: {
      component: 'el-dialog',
      props: (props: DialogProps) => props,
    },

    divider: {
      component: 'el-divider',
      props: (props: DividerProps) => props,
    },

    drawer: {
      component: 'el-drawer',
      props: (props: DrawerProps) => props,
    },

    dropdown: {
      component: 'el-dropdown',
      props: (props: DropdownProps) => props,
    },

    dropdownItem: {
      component: 'dropdown-item',
      props: (props: DropdownItemProps) => props,
    },

    dropdownMenu: {
      component: 'dropdown-menu',
      props: () => ({}),
    },

    form: {
      component: 'el-form',
      props: (props: FormProps) => props,
    },

    formItem: {
      component: 'el-form-item',
      props: (props: FormItemProps) => props,
    },

    icon: {
      component: 'el-icon',
      props: () => ({}),
    },

    input: {
      component: 'el-input',
      props: (props: InputProps) => props,
    },

    inputNumber: {
      component: 'el-input-number',
      props: (props: InputNumberProps) => props,
    },

    option: {
      component: 'el-option',
      props: (props: OptionProps) => props,
    },

    optionGroup: {
      component: 'el-option-group',
      props: (props: OptionGroupProps) => props,
    },

    pagination: {
      component: 'el-pagination',
      props: (props: PaginationProps) => props,
    },

    popover: {
      component: 'el-popover',
      props: (props: PopoverProps) => props,
    },

    radio: {
      component: 'el-radio',
      props: (props: RadioProps) => props,
    },

    radioButton: {
      component: 'el-radio-button',
      props: (props: RadioButtonProps) => props,
    },

    radioGroup: {
      component: 'el-radio-group',
      props: (props: RadioGroupProps) => props,
    },

    row: {
      component: 'el-row',
      props: () => ({}),
    },

    scrollbar: {
      component: 'el-scrollbar',
      props: () => ({}),
    },

    select: {
      component: 'el-select',
      props: (props: SelectProps) => props,
    },

    step: {
      component: 'el-step',
      props: (props: StepProps) => props,
    },

    steps: {
      component: 'el-steps',
      props: (props: StepsProps) => props,
    },

    switch: {
      component: 'el-switch',
      props: (props: SwitchProps) => props,
    },

    table: {
      component: 'el-table',
      props: (props: TableProps) => props,
    },

    tableColumn: {
      component: 'el-table-column',
      props: (props: TableColumnProps) => props,
    },

    tabPane: {
      component: 'el-tab-pane',
      props: (props: TabPaneProps) => props,
    },

    tabs: {
      component: 'el-tabs',
      props: (props: TabsProps) => props,
    },

    tag: {
      component: 'el-tag',
      props: (props: TagProps) => props,
    },

    timePicker: {
      component: 'el-time-picker',
      props: (props: TimePickerProps) => props,
    },

    tooltip: {
      component: 'el-tooltip',
      props: (props: TooltipProps) => props,
    },

    tree: {
      component: 'el-tree',
      props: (props: TreeProps) => props,
    },

    upload: {
      component: 'el-upload',
      props: (props: UploadProps) => props,
    },
  },
};
