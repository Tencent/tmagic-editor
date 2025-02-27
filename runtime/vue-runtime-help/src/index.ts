import { h } from 'vue-demi';

import type { MComponent } from '@tmagic/core';

export * from './hooks/use-editor-dsl';
export * from './hooks/use-dsl';
export * from './hooks/use-app';
export { useComponent } from './hooks/use-component';

export interface userRenderFunctionOptions {
  h: typeof h;
  type: Parameters<typeof h>[0];
  props: any;
  attrs: any;
  className: string | string[];
  style: any;
  config: MComponent;
}

export type UserRenderFunction = (options: userRenderFunctionOptions) => any;
