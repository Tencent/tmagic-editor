import type { FormConfig, FormItemConfig } from './base';

export * from './base';
export * from './editor';

export const defineFormConfig = <T = never>(config: FormConfig<T>): FormConfig<T> => config;

export const defineFormItem = <T = never>(config: FormItemConfig<T>): FormItemConfig<T> => config;
