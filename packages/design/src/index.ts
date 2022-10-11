import { App } from 'vue';

import { getConfig, setConfig } from './config';
import { PluginOptions, TMagicMessage } from './type';

export * from './type';

/* eslint-disable @typescript-eslint/no-unused-vars */
export { default as TMagicButton } from './Button.vue';
export { default as TMagicCard } from './Card.vue';
export { default as TMagicCascader } from './Cascader.vue';
export { default as TMagicCheckbox } from './Checkbox.vue';
export { default as TMagicCheckboxGroup } from './CheckboxGroup.vue';
export { default as TMagicCol } from './Col.vue';
export { default as TMagicColorPicker } from './ColorPicker.vue';
export { default as TMagicDatePicker } from './DatePicker.vue';
export { default as TMagicDialog } from './Dialog.vue';
export { default as TMagicForm } from './Form.vue';
export { default as TMagicFormItem } from './FormItem.vue';
export { default as TMagicIcon } from './Icon.vue';
export { default as TMagicInput } from './Input.vue';
export { default as TMagicInputNumber } from './InputNumber.vue';
export { default as TMagicOption } from './Option.vue';
export { default as TMagicOptionGroup } from './OptionGroup.vue';
export { default as TMagicPagination } from './Pagination.vue';
export { default as TMagicRadio } from './Radio.vue';
export { default as TMagicRadioGroup } from './RadioGroup.vue';
export { default as TMagicRow } from './Row.vue';
export { default as TMagicSelect } from './Select.vue';
export { default as TMagicStep } from './Step.vue';
export { default as TMagicSteps } from './Steps.vue';
export { default as TMagicSwitch } from './Switch.vue';
export { default as TMagicTable } from './Table.vue';
export { default as TMagicTableColumn } from './TableColumn.vue';
export { default as TMagicTabPane } from './TabPane.vue';
export { default as TMagicTabs } from './Tabs.vue';
export { default as TMagicTimePicker } from './TimePicker.vue';
export { default as TMagicTooltip } from './Tooltip.vue';
export { default as TMagicUpload } from './Upload.vue';

export const tMagicMessage: TMagicMessage = getConfig('message') as TMagicMessage;

export default {
  install(app: App, options: PluginOptions) {
    app.config.globalProperties.$MAGIC_FORM = options;
    setConfig(options);
  },
};
