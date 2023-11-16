import { describe, expect, test } from 'vitest';

import Target from '../src/Target';

describe('Target', () => {
  test('instance', () => {
    const target = new Target({
      isTarget: () => true,
      id: 'target',
    });
    expect(target).toBeInstanceOf(Target);
  });

  test('default target type', () => {
    const defaultTarget = new Target({
      isTarget: () => true,
      id: 'default',
      type: 'default',
    });
    const target = new Target({
      isTarget: () => true,
      id: 'target',
      type: 'target',
    });
    expect(defaultTarget.type).toBe('default');
    expect(target.type).toBe('target');
  });
});
