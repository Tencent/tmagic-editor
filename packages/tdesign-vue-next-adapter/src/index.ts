import { h } from 'vue';
import {
  Badge as TBadge,
  Button as TButton,
  Card as TCard,
  Cascader as TCascader,
  CheckboxGroup as TCheckboxGroup,
  Col as TCol,
  Collapse as TCollapse,
  CollapsePanel as TCollapsePanel,
  ColorPicker as TColorPicker,
  DialogPlugin,
  Divider as TDivider,
  Drawer as TDrawer,
  Dropdown as TDropdown,
  DropdownItem as TDropdownItem,
  Form as TForm,
  FormItem as TFormItem,
  InputNumber as TInputNumber,
  MessagePlugin,
  Option as TOption,
  OptionGroup as TOptionGroup,
  Pagination as TPagination,
  RadioGroup as TRadioGroup,
  Row as TRow,
  Select as TSelect,
  StepItem as TStepItem,
  Steps as TSteps,
  Switch as TSwitch,
  TabPanel as TTabPanel,
  Tabs as TTabs,
  Tag as TTag,
  TimePicker as TTimePicker,
  Tooltip as TTooltip,
  Upload as TUpload,
} from 'tdesign-vue-next';

import type {
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
  DrawerProps,
  DropdownItemProps,
  DropdownProps,
  FormItemProps,
  FormProps,
  IconProps,
  InputNumberProps,
  InputProps,
  OptionGroupProps,
  OptionProps,
  PaginationProps,
  RadioButtonProps,
  RadioGroupProps,
  RadioProps,
  SelectProps,
  StepProps,
  StepsProps,
  SwitchProps,
  TableProps,
  TabPaneProps,
  TabsProps,
  TagProps,
  TimePickerProps,
  TooltipProps,
  UploadProps,
} from '@tmagic/design';

import Checkbox from './Checkbox.vue';
import DatePicker from './DatePicker.vue';
import Dialog from './Dialog.vue';
import Icon from './Icon.vue';
import Input from './Input.vue';
import Radio from './Radio.vue';
import RadioButton from './RadioButton.vue';
import Scrollbar from './Scrollbar.vue';
import Table from './Table.vue';

const adapter: any = {
  message: MessagePlugin,
  messageBox: {
    alert: (msg: string) => {
      DialogPlugin.alert({
        body: msg,
      });
    },
    confirm: (msg: string) => {
      DialogPlugin.confirm({
        body: msg,
      });
    },
    close: (msg: string) => {
      console.log(msg);
    },
  },
  components: {
    badge: {
      component: TBadge,
      props: (props: BadgeProps) => ({
        count: props.value,
        dot: props.isDot,
        maxCount: props.max,
      }),
    },

    button: {
      component: TButton,
      props: (props: ButtonProps) => ({
        theme: props.type,
        size: props.size === 'default' ? 'medium' : props.size,
        icon: () => (props.icon ? h(Icon, null, { default: () => h(props.icon) }) : null),
        variant: props.link || props.text ? 'text' : 'base',
        shape: props.circle ? 'circle' : 'rectangle',
      }),
    },

    card: {
      component: TCard,
      props: (props: CardProps) => ({
        shadow: props.shadow !== 'never',
        hoverShadow: props.shadow === 'hover',
        header: props.header,
      }),
    },

    cascader: {
      component: TCascader,
      props: (props: CascaderProps) => ({
        modelValue: props.modelValue,
        placeholder: props.placeholder,
        disabled: props.disabled,
        clearable: props.clearable,
        filterable: props.filterable,
        options: props.options,
        size: props.size === 'default' ? 'medium' : props.size,
        trigger: props.props.expandTrigger,
        multiple: props.props.multiple,
        checkStrictly: props.props.checkStrictly,
        valueType: typeof props.props.emitPath === 'undefined' || props.props.emitPath === true ? 'full' : 'single',
        lazy: props.props.lazy,
      }),
    },

    checkbox: {
      component: Checkbox,
      props: (props: CheckboxProps) => props,
    },

    checkboxGroup: {
      component: TCheckboxGroup,
      props: (props: CheckboxGroupProps) => ({
        modelValue: props.modelValue,
        label: props.label,
        disabled: props.disabled,
      }),
    },

    col: {
      component: TCol,
      props: (props: ColProps) => ({
        span: props.span ? props.span / 2 : 12,
      }),
    },

    collapse: {
      component: TCollapse,
      props: (props: CollapseProps) => ({
        modelValue: props.modelValue,
        expandIconPlacement: 'right',
      }),
    },

    collapseItem: {
      component: TCollapsePanel,
      props: (props: CollapseItemProps) => ({
        value: props.name,
        header: props.title,
        disabled: props.disabled,
      }),
    },

    colorPicker: {
      component: TColorPicker,
      props: (props: ColorPickerProps) => ({
        modelValue: props.modelValue,
        disabled: props.disabled,
        size: props.size === 'default' ? 'medium' : props.size,
        enableAlpha: props.showAlpha,
        formate: props.showAlpha ? 'RGBA' : 'RGB',
      }),
    },

    datePicker: {
      component: DatePicker,
      props: (props: DatePickerProps) => props,
    },

    dialog: {
      component: Dialog,
      props: (props: DialogProps) => props,
    },

    divider: {
      component: TDivider,
      props: (props: any) => ({
        layout: props.direction,
        content: props.contentPosition,
      }),
    },

    drawer: {
      component: TDrawer,
      props: (props: DrawerProps) => ({
        visible: props.modelValue,
        size: typeof props.size === 'number' ? `${props.size}px` : props.size,
        closeOnEscKeydown: props.closeOnPressEscape,
        closeOnOverlayClick: props.closeOnClickModal,
        attach: props.appendToBody ? 'body' : undefined,
        placement: {
          rtl: 'right',
          ltr: 'left',
          ttb: 'top',
          bt: 'bottom',
        }[props.direction as string],
      }),
    },

    dropdown: {
      component: TDropdown,
      props: (props: DropdownProps) => ({
        maxHeight: props.maxHeight,
        disabled: props.disable,
        direction: props.placement,
        trigger: props.trigger,
        hideAfterItemClick: props.hideOnClick,
        popupProps: {
          overlayClassName: props.popperClass,
          ...(props.popperOptions || {}),
        },
      }),
    },

    dropdownItem: {
      component: TDropdownItem,
      props: (props: DropdownItemProps) => ({
        disabled: props.disabled,
        divider: props.divided,
        prefixIcon: props.icon && (() => h(props.icon)),
        onClick: props.command?.(),
      }),
    },

    dropdownMenu: {
      component: TDropdown,
      props: () => ({}),
    },

    form: {
      component: TForm,
      props: (props: FormProps) => ({
        data: props.model,
        labelWidth: props.labelWidth,
        disabled: props.disabled,
        labelAlign: props.labelPosition,
        layout: props.inline ? 'inline' : 'vertical',
      }),
    },

    formItem: {
      component: TFormItem,
      props: (props: FormItemProps) => ({
        labelWidth: props.labelWidth,
        name: props.prop,
        rules: props.rules,
        help: props.extra,
      }),
    },

    icon: {
      component: Icon,
      props: (props: IconProps) => props,
    },

    input: {
      component: Input,
      props: (props: InputProps) => props,
    },

    inputNumber: {
      component: TInputNumber,
      props: (props: InputNumberProps) => ({
        modelValue: props.modelValue,
        align: props.controlsPosition,
        disabled: props.disabled,
        placeholder: props.placeholder,
        step: props.step,
        min: props.min,
        max: props.max,
        size: props.size === 'default' ? 'medium' : props.size,
      }),
    },

    option: {
      component: TOption,
      props: (props: OptionProps) => ({
        value: props.value,
        label: props.label,
        disabled: props.disabled,
      }),
    },

    optionGroup: {
      component: TOptionGroup,
      props: (props: OptionGroupProps) => props,
    },

    pagination: {
      component: TPagination,
      props: (props: PaginationProps) => ({
        current: props.curPage,
        pageSizeOptions: props.pageSizes,
        pageSize: props.pagesize,
        total: props.total,
      }),
    },

    radio: {
      component: Radio,
      props: (props: RadioProps) => props,
    },

    radioButton: {
      component: RadioButton,
      props: (props: RadioButtonProps) => props,
    },

    radioGroup: {
      component: TRadioGroup,
      props: (props: RadioGroupProps) => ({
        modelValue: props.modelValue,
        disabled: props.disabled,
        size: props.size === 'default' ? 'medium' : props.size,
      }),
    },

    row: {
      component: TRow,
    },

    scrollbar: {
      component: Scrollbar,
      props: () => ({}),
    },

    select: {
      component: TSelect,
      props: (props: SelectProps) => ({
        modelValue: props.modelValue,
        clearable: props.clearable,
        filterable: props.filterable,
        disabled: props.disabled,
        placeholder: props.placeholder,
        multiple: props.multiple,
        valueType: props.valueKey,
        remoteMethod: props.onSearch,
        size: props.size === 'default' ? 'medium' : props.size,
        popupProps: {
          overlayClassName: props.popperClass,
        },
      }),
    },

    step: {
      component: TStepItem,
      props: (props: StepProps) => ({
        title: props.props,
        value: props.status,
      }),
    },

    steps: {
      component: TSteps,
      props: (props: StepsProps) => ({
        current: props.active,
      }),
    },

    switch: {
      component: TSwitch,
      props: (props: SwitchProps) => ({
        modelValue: props.modelValue,
        disabled: props.disabled,
        label: props.label,
        customValue: [props.activeValue ?? true, props.inactiveValue ?? false],
        size: props.size === 'default' ? 'medium' : props.size,
      }),
    },

    table: {
      component: Table,
      props: (props: TableProps) => props,
    },

    tabPane: {
      component: TTabPanel,
      props: (props: TabPaneProps) => ({
        label: props.label,
        value: props.name,
      }),
    },

    tabs: {
      component: TTabs,
      props: (props: TabsProps) => ({
        addable: props.editable,
        theme: props.type === 'card' ? 'card' : 'normal',
        placement: props.tabPosition,
        value: props.modelValue,
      }),
    },

    tag: {
      component: TTag,
      props: (props: TagProps) => ({
        theme: props.type ? props.type : 'default',
      }),
    },

    timePicker: {
      component: TTimePicker,
      props: (props: TimePickerProps) => ({
        modelValue: props.modelValue,
        disabled: props.disabled,
        size: props.size === 'default' ? 'medium' : props.size,
        placeholder: props.placeholder,
      }),
    },

    tooltip: {
      component: TTooltip,
      props: (props: TooltipProps) => ({
        ...props,
        placement: props.placement,
        content: props.content,
      }),
    },

    upload: {
      component: TUpload,
      props: (props: UploadProps) => ({
        action: props.action,
        disabled: props.disabled,
        autoUpload: props.autoUpload,
      }),
    },
  },
};

export default adapter;
