import { describe, expect, test } from 'vitest';
import path from 'node:path';

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
