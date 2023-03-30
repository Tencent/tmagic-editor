import { App } from 'vue';

import { setConfig } from './config';
import { PluginOptions, TMagicMessage, TMagicMessageBox } from './type';

export * from './type';
export * from './config';

/* eslint-disable @typescript-eslint/no-unused-vars */
export { default as TMagicButton } from './Button.vue';
export { default as TMagicCard } from './Card.vue';
export { default as TMagicCascader } from './Cascader.vue';
export { default as TMagicCheckbox } from './Checkbox.vue';
export { default as TMagicCheckboxGroup } from './CheckboxGroup.vue';
export { default as TMagicCol } from './Col.vue';
export { default as TMagicCollapse } from './Collapse.vue';
export { default as TMagicCollapseItem } from './CollapseItem.vue';
export { default as TMagicColorPicker } from './ColorPicker.vue';
export { default as TMagicDatePicker } from './DatePicker.vue';
export { default as TMagicDialog } from './Dialog.vue';
export { default as TMagicDivider } from './Divider.vue';
export { default as TMagicDrawer } from './Drawer.vue';
export { default as TMagicDropdown } from './Dropdown.vue';
export { default as TMagicDropdownItem } from './DropdownItem.vue';
export { default as TMagicDropdownMenu } from './DropdownMenu.vue';
export { default as TMagicForm } from './Form.vue';
export { default as TMagicFormItem } from './FormItem.vue';
export { default as TMagicIcon } from './Icon.vue';
export { default as TMagicInput } from './Input.vue';
export { default as TMagicInputNumber } from './InputNumber.vue';
export { default as TMagicOption } from './Option.vue';
export { default as TMagicOptionGroup } from './OptionGroup.vue';
export { default as TMagicPagination } from './Pagination.vue';
export { default as TMagicPopover } from './Popover.vue';
export { default as TMagicRadio } from './Radio.vue';
export { default as TMagicRadioGroup } from './RadioGroup.vue';
export { default as TMagicRow } from './Row.vue';
export { default as TMagicScrollbar } from './Scrollbar.vue';
export { default as TMagicSelect } from './Select.vue';
export { default as TMagicStep } from './Step.vue';
export { default as TMagicSteps } from './Steps.vue';
export { default as TMagicSwitch } from './Switch.vue';
export { default as TMagicTable } from './Table.vue';
export { default as TMagicTableColumn } from './TableColumn.vue';
export { default as TMagicTabPane } from './TabPane.vue';
export { default as TMagicTabs } from './Tabs.vue';
export { default as TMagicTag } from './Tag.vue';
export { default as TMagicTimePicker } from './TimePicker.vue';
export { default as TMagicTooltip } from './Tooltip.vue';
export { default as TMagicTree } from './Tree.vue';
export { default as TMagicUpload } from './Upload.vue';

export const tMagicMessage = {
  error: (msg: string) => {
    console.error(msg);
  },
  success: (msg: string) => {
    console.log(msg);
  },
  warning: (msg: string) => {
    console.warn(msg);
  },
  info: (msg: string) => {
    console.info(msg);
  },
  closeAll: (msg: string) => {},
} as unknown as TMagicMessage;

export const tMagicMessageBox = {
  alert: (msg: string) => {
    console.log(msg);
  },
  confirm: (msg: string) => {
    console.log(msg);
  },
  close: (msg: string) => {
    console.log(msg);
  },
} as unknown as TMagicMessageBox;

export default {
  install(app: App, options: PluginOptions) {
    if (options.message) {
      tMagicMessage.error = options.message?.error;
      tMagicMessage.success = options.message?.success;
      tMagicMessage.warning = options.message?.warning;
      tMagicMessage.info = options.message?.info;
      tMagicMessage.closeAll = options.message?.closeAll;
    }

    if (options.messageBox) {
      tMagicMessageBox.alert = options.messageBox?.alert;
      tMagicMessageBox.confirm = options.messageBox?.confirm;
      tMagicMessageBox.prompt = options.messageBox?.prompt;
      tMagicMessageBox.close = options.messageBox?.close;
    }

    app.config.globalProperties.$MAGIC_DESIGN = options;
    setConfig(options);
  },
};
