import {
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

const adapter: any = {
  message: ElMessage,
  messageBox: ElMessageBox,
  components: {
    button: {
      component: ElButton,
      props: (props: any) => props,
    },

    card: {
      component: ElCard,
      props: (props: any) => props,
    },

    cascader: {
      component: ElCascader,
      props: (props: any) => props,
    },

    checkbox: {
      component: ElCheckbox,
      props: (props: any) => props,
    },

    checkboxGroup: {
      component: ElCheckboxGroup,
      props: (props: any) => props,
    },

    col: {
      component: ElCol,
      props: (props: any) => props,
    },

    collapse: {
      component: ElCollapse,
      props: (props: any) => props,
    },

    collapseItem: {
      component: ElCollapseItem,
      props: (props: any) => props,
    },

    colorPicker: {
      component: ElColorPicker,
      props: (props: any) => props,
    },

    datePicker: {
      component: ElDatePicker,
      props: (props: any) => props,
    },

    dialog: {
      component: ElDialog,
      props: (props: any) => props,
    },

    divider: {
      component: ElDivider,
      props: (props: any) => props,
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
      component: ElForm,
      props: (props: any) => props,
    },

    formItem: {
      component: ElFormItem,
      props: (props: any) => props,
    },

    icon: {
      component: ElIcon,
      props: (props: any) => props,
    },

    input: {
      component: ElInput,
      props: (props: any) => props,
    },

    inputNumber: {
      component: ElInputNumber,
      props: (props: any) => props,
    },

    option: {
      component: ElOption,
      props: (props: any) => props,
    },

    optionGroup: {
      component: ElOptionGroup,
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
      component: ElRadio,
      props: (props: any) => props,
    },

    radioGroup: {
      component: ElRadioGroup,
      props: (props: any) => props,
    },

    row: {
      component: ElRow,
      props: (props: any) => props,
    },

    scrollbar: {
      component: ElScrollbar,
      props: (props: any) => props,
    },

    select: {
      component: ElSelect,
      props: (props: any) => props,
    },

    step: {
      component: ElStep,
      props: (props: any) => props,
    },

    steps: {
      component: ElSteps,
      props: (props: any) => props,
    },

    switch: {
      component: ElSwitch,
      props: (props: any) => props,
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
      component: ElTag,
      props: (props: any) => props,
    },

    timePicker: {
      component: ElTimePicker,
      props: (props: any) => props,
    },

    tooltip: {
      component: ElTooltip,
      props: (props: any) => props,
    },

    tree: {
      component: ElTree,
      props: (props: any) => props,
    },

    upload: {
      component: ElUpload,
      props: (props: any) => props,
    },
  },
};

export default adapter;
