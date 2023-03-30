import {
  ElDrawer,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElIcon,
  ElMessageBox,
  ElPagination,
  ElPopover,
  ElScrollbar,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTree,
} from 'element-plus';
import {
  Button as TButton,
  Card as TCard,
  Cascader as TCascader,
  Checkbox as TCheckbox,
  CheckboxGroup as TCheckboxGroup,
  Col as TCol,
  Collapse as TCollapse,
  CollapsePanel as TCollapsePanel,
  ColorPicker as TColorPicker,
  Dialog as TDialog,
  Divider as TDivider,
  Form as TForm,
  FormItem as TFormItem,
  InputNumber as TInputNumber,
  MessagePlugin,
  Option as TOption,
  OptionGroup as TOptionGroup,
  Radio as TRadio,
  RadioGroup as TRadioGroup,
  Row as TRow,
  Select as TSelect,
  StepItem as TStepItem,
  Steps as TSteps,
  Switch as TSwitch,
  Tag as TTag,
  TimePicker as TTimePicker,
  Tooltip as TTooltip,
  Upload as TUpload,
} from 'tdesign-vue-next';

import DatePicker from './DatePicker.vue';
import Input from './Input.vue';

const adapter: any = {
  message: MessagePlugin,
  messageBox: ElMessageBox,
  components: {
    button: {
      component: TButton,
      props: (props: any) => ({
        theme: props.type,
        size: props.size === 'default' ? 'medium' : props.size,
        icon: props.icon,
        variant: props.text ? 'text' : 'base',
      }),
    },

    card: {
      component: TCard,
      props: (props: any) => ({
        shadow: props.shadow !== 'never',
        hoverShadow: props.shadow === 'hover',
        header: props.header,
      }),
    },

    cascader: {
      component: TCascader,
      props: (props: any) => ({
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
      component: TCheckbox,
      props: (props: any) => ({
        modelValue: props.modelValue,
        label: props.label,
        value: props.value,
        disabled: props.disabled,
      }),
    },

    checkboxGroup: {
      component: TCheckboxGroup,
      props: (props: any) => ({
        modelValue: props.modelValue,
        label: props.label,
        disabled: props.disabled,
      }),
    },

    col: {
      component: TCol,
      props: (props: any) => ({
        span: props.span,
      }),
    },

    collapse: {
      component: TCollapse,
      props: (props: any) => ({
        value: props.modelValue,
        expandIconPlacement: 'right',
      }),
    },

    collapseItem: {
      component: TCollapsePanel,
      props: (props: any) => ({
        value: props.name,
        header: props.title,
        disabled: props.disabled,
      }),
    },

    colorPicker: {
      component: TColorPicker,
      props: (props: any) => ({
        modelValue: props.modelValue,
        disabled: props.disabled,
        size: props.size === 'default' ? 'medium' : props.size,
        enableAlpha: props.showAlpha,
        formate: props.showAlpha ? 'RGBA' : 'RGB',
      }),
    },

    datePicker: {
      component: DatePicker,
      props: (props: any) => props,
    },

    dialog: {
      component: TDialog,
      props: (props: any) => ({
        visible: props.modelValue,
        attach: props.appendToBody ? 'body' : '',
        header: props.title,
        width: props.width,
        mode: props.fullscreen ? 'full-screen' : 'modal',
        closeOnOverlayClick: props.closeOnClickModal,
      }),
    },

    divider: {
      component: TDivider,
      props: (props: any) => ({
        layout: props.direction,
        content: props.contentPosition,
      }),
    },

    drawer: {
      component: ElDrawer,
      props: (props: any) => props,
    },

    dropdown: {
      component: ElDropdown,
      props: (props: any) => props,
    },

    dropdownItem: {
      component: ElDropdownItem,
      props: (props: any) => props,
    },

    dropdownMenu: {
      component: ElDropdownMenu,
      props: (props: any) => props,
    },

    form: {
      component: TForm,
      props: (props: any) => ({
        data: props.model,
        labelWidth: props.labelWidth,
        disabled: props.disabled,
        labelAlign: props.labelPosition,
        layout: props.inline ? 'inline' : 'vertical',
      }),
    },

    formItem: {
      component: TFormItem,
      props: (props: any) => ({
        labelWidth: props.labelWidth,
        name: props.prop,
        rules: props.rules,
      }),
    },

    icon: {
      component: ElIcon,
      props: (props: any) => props,
    },

    input: {
      component: Input,
      props: (props: any) => props,
    },

    inputNumber: {
      component: TInputNumber,
      props: (props: any) => ({
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
      props: (props: any) => ({
        value: props.value,
        label: props.label,
        disabled: props.disabled,
      }),
    },

    optionGroup: {
      component: TOptionGroup,
      props: (props: any) => props,
    },

    pagination: {
      component: ElPagination,
      props: (props: any) => props,
    },

    popover: {
      component: ElPopover,
      props: (props: any) => props,
    },

    radio: {
      component: TRadio,
      props: (props: any) => ({
        label: props.label,
      }),
    },

    radioGroup: {
      component: TRadioGroup,
      props: (props: any) => ({
        modelValue: props.modelValue,
        disabled: props.disabled,
        size: props.size === 'default' ? 'medium' : props.size,
      }),
    },

    row: {
      component: TRow,
    },

    scrollbar: {
      component: ElScrollbar,
      props: (props: any) => props,
    },

    select: {
      component: TSelect,
      props: (props: any) => ({
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
      props: (props: any) => ({
        title: props.props,
        value: props.status,
      }),
    },

    steps: {
      component: TSteps,
      props: (props: any) => ({
        current: props.active,
      }),
    },

    switch: {
      component: TSwitch,
      props: (props: any) => ({
        modelValue: props.modelValue,
        disabled: props.disabled,
        label: props.label,
        customValue: [props.activeValue ?? true, props.inactiveValue ?? false],
        size: props.size === 'default' ? 'medium' : props.size,
      }),
    },

    table: {
      component: ElTable,
      props: (props: any) => props,
    },

    tableColumn: {
      component: ElTableColumn,
      props: (props: any) => props,
    },

    tabPane: {
      component: ElTabPane,
      props: (props: any) => props,
    },

    tabs: {
      component: ElTabs,
      props: (props: any) => props,
    },

    tag: {
      component: TTag,
      props: (props: any) => ({
        theme: props.type ? props.type : 'default',
      }),
    },

    timePicker: {
      component: TTimePicker,
      props: (props: any) => ({
        modelValue: props.modelValue,
        disabled: props.disabled,
        size: props.size === 'default' ? 'medium' : props.size,
        placeholder: props.placeholder,
      }),
    },

    tooltip: {
      component: TTooltip,
      props: (props: any) => ({
        placement: props.placement,
        content: props.content,
      }),
    },

    tree: {
      component: ElTree,
      props: (props: any) => props,
    },

    upload: {
      component: TUpload,
      props: (props: any) => ({
        action: props.action,
        disabled: props.disabled,
        autoUpload: props.autoUpload,
      }),
    },
  },
};

export default adapter;
