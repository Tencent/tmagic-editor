/**
 * `useRuntime` 读取宿主 `$MAGIC_FORM`，合并后再交给 formPlugin。
 */
import { describe, expect, it, vi } from 'vitest';

import { useRuntime } from '../src/index';

const { formPluginMock, createAppMock, appUseMock, getCurrentInstanceMock } = vi.hoisted(() => {
  const appUseMock = vi.fn();
  return {
    formPluginMock: { install: vi.fn() },
    createAppMock: vi.fn(() => ({ use: appUseMock, mount: vi.fn() })),
    appUseMock,
    getCurrentInstanceMock: vi.fn(),
  };
});

vi.mock('vue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue')>()),
  createApp: createAppMock,
  onBeforeUnmount: vi.fn(),
  getCurrentInstance: getCurrentInstanceMock,
}));

vi.mock('@tmagic/editor', () => ({
  formPlugin: formPluginMock,
  createForm: (config: unknown) => config,
  editorService: { usePlugin: vi.fn(), removeAllPlugins: vi.fn() },
  propsService: { usePlugin: vi.fn(), removeAllPlugins: vi.fn() },
  uiService: { set: vi.fn(), get: vi.fn() },
  injectStyle: vi.fn(),
  Layout: { RELATIVE: 'relative' },
}));

vi.mock('../src/App.vue', () => ({ default: { name: 'App' } }));

const stage = { renderer: { getDocument: () => undefined } } as any;

const hostRequest = vi.fn();
const hostFormOptions = { request: hostRequest, flat: true, extra: 'keep' };

const withHostForm = () => {
  getCurrentInstanceMock.mockReturnValue({
    appContext: { config: { globalProperties: { $MAGIC_FORM: hostFormOptions } } },
  });
};

describe('useRuntime — formOptions', () => {
  it('setup 中能读到宿主 $MAGIC_FORM 时，默认安装不会清空 request / flat', () => {
    withHostForm();

    useRuntime().render(stage);

    expect(appUseMock).toHaveBeenCalledWith(formPluginMock, hostFormOptions);
  });

  it('formOptions 覆盖 request，保留宿主 flat 等其余键', () => {
    withHostForm();
    const request = vi.fn();

    useRuntime({ formOptions: { request } }).render(stage);

    expect(appUseMock).toHaveBeenCalledWith(formPluginMock, {
      request,
      flat: true,
      extra: 'keep',
    });
  });

  it('不在 setup 中调用时，只透传 formOptions', () => {
    getCurrentInstanceMock.mockReturnValue(null);
    const request = vi.fn();

    useRuntime({ formOptions: { request } }).render(stage);

    expect(appUseMock).toHaveBeenCalledWith(formPluginMock, { request });
  });
});
