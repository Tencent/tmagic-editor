import type { MNode } from '@tmagic/core';

export interface IteratorItemSchema {
  items: MNode[];
  condResult: boolean;
  style: {
    [key: string]: any;
  };
}
