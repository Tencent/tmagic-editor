import { isEmpty } from 'lodash-es';

import { CodeBlockContent, HookType, Id } from '@tmagic/schema';

import { Target } from '@editor/services/dep';
import type { HookData } from '@editor/type';

export const createCodeBlockTarget = (id: Id, codeBlock: CodeBlockContent) =>
  new Target({
    type: 'code-block',
    id,
    name: codeBlock.name,
    isTarget: (key: string | number, value: any) => {
      if (value?.hookType === HookType.CODE && !isEmpty(value.hookData)) {
        const index = value.hookData.findIndex((item: HookData) => item.codeId === id);
        return Boolean(index > -1);
      }

      return false;
    },
  });
