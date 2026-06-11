/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import * as logger from '../../src/logger';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logger', () => {
  test('log/info/warn/debug/error 透传到 console', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.log('a');
    logger.info('b');
    logger.warn('c');
    logger.debug('d');
    logger.error('e');

    expect(logSpy).toHaveBeenCalledWith('a');
    expect(logSpy).toHaveBeenCalledWith('b');
    expect(warnSpy).toHaveBeenCalledWith('c');
    expect(debugSpy).toHaveBeenCalledWith('d');
    expect(errorSpy).toHaveBeenCalledWith('e');
  });
});
