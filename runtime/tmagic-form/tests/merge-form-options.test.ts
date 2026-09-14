/**
 * formPlugin.install 会 setConfig 整对象替换。
 * mergeFormInstallOptions 把宿主 $MAGIC_FORM 与 formOptions 浅合并。
 */
import { describe, expect, it, vi } from 'vitest';

import { mergeFormInstallOptions } from '../src/mergeFormOptions';

describe('mergeFormInstallOptions', () => {
  const hostRequest = vi.fn();
  const hostFields = { select: { component: { name: 'HostSelect' } } };
  const host = { request: hostRequest, flat: true, fields: hostFields };

  it('无 formOptions 时原样带回宿主配置，避免二次安装清空', () => {
    expect(mergeFormInstallOptions(host)).toEqual(host);
    expect(mergeFormInstallOptions(host, {})).toEqual(host);
  });

  it('formOptions 只覆盖传入的键，保留宿主其余配置', () => {
    const request = vi.fn();

    expect(mergeFormInstallOptions(host, { request })).toEqual({
      request,
      flat: true,
      fields: hostFields,
    });
  });

  it('没有宿主配置时只使用 formOptions', () => {
    const request = vi.fn();

    expect(mergeFormInstallOptions(undefined, { request })).toEqual({ request });
    expect(mergeFormInstallOptions(undefined)).toEqual({});
  });
});
