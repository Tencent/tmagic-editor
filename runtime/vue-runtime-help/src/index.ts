import { h } from 'vue';

import type { Id, MComponent, StyleSchema } from '@tmagic/core';

export * from './hooks/use-editor-dsl';
export * from './hooks/use-dsl';
export * from './hooks/use-app';
export * from './hooks/use-component-status';
export { useComponent } from './hooks/use-component';

export interface UserRenderFunctionOptions {
  h: typeof h;
  type: Parameters<typeof h>[0];
  props?: {
    [key: string]: any;
  };
  attrs?: {
    [key: string]: any;
  };
  className?: string | string[];
  style?: StyleSchema;
  config: Omit<MComponent, 'id'>;
  on?: {
    [key: string]: (...args: any[]) => any;
  };
  directives?: { name: string; value: any; modifiers: any }[];
}

export type UserRenderFunction = (options: UserRenderFunctionOptions) => any;

export interface ComponentProps<T extends Omit<MComponent, 'id'> = MComponent> {
  config: T;
  iteratorIndex?: number[];
  iteratorContainerId?: Id[];
  containerIndex?: number;
  pageFragmentContainerId?: Id;
  model?: any;
  disabled?: boolean;
}
