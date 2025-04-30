import type { FormConfig } from './base';

export * from './base';
export * from './editor';

export const defineFormConfig = <T = FormConfig>(config: T): T => config;
