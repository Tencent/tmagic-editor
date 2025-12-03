import { computed, h, Ref, ref, unref } from 'vue';
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
  LoadingDirective,
  MessagePlugin,
  Option as TOption,
  OptionGroup as TOptionGroup,
  RadioGroup as TRadioGroup,
  Row as TRow,
  Select as TSelect,
  StepItem as TStepItem,
  Steps as TSteps,
  Switch as TSwitch,
  TabPanel as TTabPanel,
  Tag as TTag,
  TimePicker as TTimePicker,
  Tooltip as TTooltip,
  Upload as TUpload,
} from 'tdesign-vue-next';

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
  PopconfirmProps,
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

import AutoComplete from './AutoComplete.vue';
import Checkbox from './Checkbox.vue';
import DatePicker from './DatePicker.vue';
import Dialog from './Dialog.vue';
import Icon from './Icon.vue';
import Input from './Input.vue';
import Pagination from './Pagination.vue';
import Popconfirm from './Popconfirm.vue';
import Radio from './Radio.vue';
import RadioButton from './RadioButton.vue';
import Scrollbar from './Scrollbar.vue';
import Table from './Table.vue';
import Tabs from './Tabs.vue';

const messageBox = (options: {
  type?: 'info' | 'success' | 'warning' | 'error';
  message?: string;
  dangerouslyUseHTMLString?: boolean;
  duration?: number;
}) =>
  MessagePlugin(options.type || 'info', {
    duration: options.duration || 3000,
    content: options.message,
  });

messageBox.success = MessagePlugin.success;
messageBox.error = MessagePlugin.error;
messageBox.warning = MessagePlugin.warning;
messageBox.info = MessagePlugin.info;

const zIndex = ref(0);
const DEFAULT_INITIAL_Z_INDEX = 2500;

const useZIndex = (zIndexOverrides?: Ref<number>) => {
  const zIndexInjection = zIndexOverrides;
  const initialZIndex = computed(() => {
    const zIndexFromInjection = unref(zIndexInjection);
    return zIndexFromInjection ?? DEFAULT_INITIAL_Z_INDEX;
  });
  const currentZIndex = computed(() => initialZIndex.value + zIndex.value);

  const nextZIndex = () => {
    zIndex.value += 1;
    return currentZIndex.value;
  };

  return {
    initialZIndex,
    currentZIndex,
    nextZIndex,
  };
};

const adapter: any = {
  adapterType: 'tdesign-vue-next',
  message: messageBox,
  messageBox: {
    alert: (msg: string, title?: string) => {
      return new Promise((resolve, reject) => {
        const dia = DialogPlugin.alert({
          header: title,
          body: msg,
          onConfirm: (e) => {
            dia.hide();
            resolve(e);
          },
          onClose: (e) => {
            dia.hide();
            reject(e);
          },
        });
      });
    },
    confirm: (msg: string, title?: string) => {
      return new Promise((resolve, reject) => {
        const dia = DialogPlugin.confirm({
          header: title,
          body: msg,
          onConfirm: (e) => {
            dia.hide();
            resolve(e);
          },
          onClose: (e) => {
            dia.hide();
            reject(e);
          },
        });
      });
    },
    close: (msg: string) => {
      console.log(msg);
    },
  },
  components: {
    autocomplete: {
      component: AutoComplete,
      props: (props: AutocompleteProps) => props,
    },
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
        theme: props.type ? props.type : 'default',
        size: props.size === 'default' ? 'medium' : props.size,
        icon: props.icon ? () => h(Icon, null, { default: () => h(props.icon) }) : undefined,
        variant: props.link || props.text ? 'text' : props.variant || 'base',
        shape: props.circle ? 'circle' : 'rectangle',
      }),
    },

    card: {
      component: TCard,
      props: (props: CardProps) => ({
        shadow: props.shadow !== 'never',
        hoverShadow: props.shadow === 'hover',
        header: props.header,
        bodyStyle: props.bodyStyle,
        headerBordered: true,
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
        help: props.extra ? () => h('div', { innerHTML: props.extra }) : undefined,
        labelAlign: props.labelPosition,
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
      component: Pagination,
      props: (props: PaginationProps) => props,
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
        remoteMethod: props.onSearch,
        creatable: props.allowCreate,
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
      component: Tabs,
      props: (props: TabsProps) => props,
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
        placement: props.placement?.replace(/\B([A-Z])/g, '-$1').toLowerCase(),
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

    popconfirm: {
      component: Popconfirm,
      props: (props: PopconfirmProps) => props,
    },
  },
  loading: LoadingDirective,
  useZIndex,
};

export default adapter;
