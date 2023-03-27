import { describe, expect, test } from 'vitest';

import * as dep from '@editor/utils/dep';

describe('dep', () => {
  test('createCodeBlockTarget', () => {
    const target = dep.createCodeBlockTarget('code_5316', {
      name: 'code',
      content: () => false,
      params: [],
    });

    expect(target.id).toBe('code_5316');
    expect(target.name).toBe('code');
    expect(target.type).toBe('code-block');

    const isTarget = target.isTarget('created', {
      hookType: 'code',
      hookData: [
        {
          codeId: 'code_5336',
          params: {
            studentName: 'lisa',
            age: 14,
          },
        },
        {
          codeId: 'code_5316',
          params: {},
        },
      ],
    });

    expect(isTarget).toBeTruthy();

    const target1 = dep.createCodeBlockTarget('1', {
      name: 'code',
      content: () => false,
      params: [],
    });

    const isTarget1 = target1.isTarget('created', {
      hookType: 'code',
      hookData: [
        {
          codeId: 'code_5316',
          params: {},
        },
      ],
    });

    expect(isTarget1).toBeFalsy();
  });
});
