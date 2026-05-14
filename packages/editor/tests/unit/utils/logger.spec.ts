/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import * as logger from '@editor/utils/logger';

describe('logger', () => {
  let prev: string | undefined;
  beforeEach(() => {
    prev = process.env.NODE_ENV;
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    process.env.NODE_ENV = prev;
    vi.restoreAllMocks();
  });

  test('NODE_ENV=development 时所有方法走 console', () => {
    process.env.NODE_ENV = 'development';
    logger.log('a');
    logger.info('a');
    logger.warn('a');
    logger.debug('a');
    logger.error('a');
    expect(console.log as any).toHaveBeenCalled();
    expect(console.info as any).toHaveBeenCalled();
    expect(console.warn as any).toHaveBeenCalled();
    expect(console.debug as any).toHaveBeenCalled();
    expect(console.error as any).toHaveBeenCalled();
  });

  test('生产环境无输出', () => {
    process.env.NODE_ENV = 'production';
    logger.log('a');
    logger.info('a');
    logger.warn('a');
    logger.debug('a');
    logger.error('a');
    expect(console.log as any).not.toHaveBeenCalled();
    expect(console.info as any).not.toHaveBeenCalled();
    expect(console.warn as any).not.toHaveBeenCalled();
    expect(console.debug as any).not.toHaveBeenCalled();
    expect(console.error as any).not.toHaveBeenCalled();
  });
});
