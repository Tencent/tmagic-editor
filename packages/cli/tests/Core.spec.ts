import path from 'node:path';

import { describe, expect, test } from 'vitest';

import Core from '../src/Core';

describe('Core', () => {
  test('instance', () => {
    const core = new Core({
      packages: [],
      source: './a',
      temp: './b',
    });
    expect(core).toBeInstanceOf(Core);

    expect(core.dir.temp()).toBe(path.join(process.cwd(), './a/b'));
  });
});
