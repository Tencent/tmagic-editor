/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import editorPlugin from '@editor/plugin';

vi.mock('@tmagic/design', () => ({
  default: { install: vi.fn() },
}));
vi.mock('@tmagic/form', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tmagic/form')>();
  return {
    ...actual,
    default: { install: vi.fn() },
    registerTypeMatchRules: vi.fn(),
  };
});
vi.mock('@tmagic/table', () => ({
  default: { install: vi.fn() },
}));

vi.mock('@editor/Editor.vue', () => ({
  default: { name: 'MEditor', render: () => null },
}));

vi.mock('@editor/fields/Code.vue', () => ({ default: { name: 'Code', render: () => null } }));
vi.mock('@editor/fields/CodeLink.vue', () => ({ default: { name: 'CodeLink', render: () => null } }));
vi.mock('@editor/fields/CodeSelect.vue', () => ({ default: { name: 'CodeSelect', render: () => null } }));
vi.mock('@editor/fields/CodeSelectCol.vue', () => ({ default: { name: 'CodeSelectCol', render: () => null } }));
vi.mock('@editor/fields/CondOpSelect.vue', () => ({ default: { name: 'CondOpSelect', render: () => null } }));
vi.mock('@editor/fields/DataSourceFields.vue', () => ({
  default: { name: 'DataSourceFields', render: () => null },
}));
vi.mock('@editor/fields/DataSourceFieldSelect/Index.vue', () => ({
  default: { name: 'DataSourceFieldSelect', render: () => null },
}));
vi.mock('@editor/fields/DataSourceInput.vue', () => ({ default: { name: 'DataSourceInput', render: () => null } }));
vi.mock('@editor/fields/DataSourceMethods.vue', () => ({
  default: { name: 'DataSourceMethods', render: () => null },
}));
vi.mock('@editor/fields/DataSourceMethodSelect.vue', () => ({
  default: { name: 'DataSourceMethodSelect', render: () => null },
}));
vi.mock('@editor/fields/DataSourceMocks.vue', () => ({ default: { name: 'DataSourceMocks', render: () => null } }));
vi.mock('@editor/fields/DataSourceSelect.vue', () => ({ default: { name: 'DataSourceSelect', render: () => null } }));
vi.mock('@editor/fields/DisplayConds.vue', () => ({ default: { name: 'DisplayConds', render: () => null } }));
vi.mock('@editor/fields/EventSelect.vue', () => ({ default: { name: 'EventSelect', render: () => null } }));
vi.mock('@editor/fields/KeyValue.vue', () => ({ default: { name: 'KeyValue', render: () => null } }));
vi.mock('@editor/fields/PageFragmentSelect.vue', () => ({
  default: { name: 'PageFragmentSelect', render: () => null },
}));
vi.mock('@editor/fields/StyleSetter/Index.vue', () => ({ default: { name: 'StyleSetter', render: () => null } }));
vi.mock('@editor/fields/UISelect.vue', () => ({ default: { name: 'UISelect', render: () => null } }));
vi.mock('@editor/layouts/CodeEditor.vue', () => ({ default: { name: 'CodeEditor', render: () => null } }));

afterEach(() => {
  vi.clearAllMocks();
});

describe('plugin install', () => {
  const buildApp = () => {
    const components: Record<string, any> = {};
    return {
      app: {
        component: vi.fn((name: string, comp: any) => {
          components[name] = comp;
        }),
        use: vi.fn(),
        config: { globalProperties: {} },
      } as any,
      components,
    };
  };

  test('install 调用 design/form/table 插件并注册全局组件', async () => {
    const { registerTypeMatchRules } = await import('@tmagic/form');
    const { editorTypeMatchRules } = await import('@editor/utils/type-match-rules');
    const { app, components } = buildApp();
    editorPlugin.install(app, { someOption: true } as any);
    expect(app.use).toHaveBeenCalledTimes(3);
    expect(registerTypeMatchRules).toHaveBeenCalledWith(editorTypeMatchRules);
    expect(Object.keys(components).length).toBeGreaterThan(10);
    expect(components.MEditor).toBeDefined();
  });

  test('install 不传 opt 时使用默认配置', () => {
    const { app } = buildApp();
    editorPlugin.install(app);
    expect(app.config.globalProperties.$TMAGIC_EDITOR).toBeDefined();
    expect(typeof app.config.globalProperties.$TMAGIC_EDITOR.parseDSL).toBe('function');
    expect(typeof app.config.globalProperties.$TMAGIC_EDITOR.customCreateMonacoEditor).toBe('function');
    expect(typeof app.config.globalProperties.$TMAGIC_EDITOR.customCreateMonacoDiffEditor).toBe('function');
  });

  test('customCreateMonacoEditor / customCreateMonacoDiffEditor 会调用 monaco API', () => {
    const { app } = buildApp();
    editorPlugin.install(app);
    const { customCreateMonacoEditor, customCreateMonacoDiffEditor } = app.config.globalProperties.$TMAGIC_EDITOR;
    const monaco = {
      editor: {
        create: vi.fn(() => 'editor'),
        createDiffEditor: vi.fn(() => 'diff-editor'),
      },
    };
    const el = document.createElement('div');
    expect(customCreateMonacoEditor(monaco, el, { theme: 'vs' })).toBe('editor');
    expect(customCreateMonacoDiffEditor(monaco, el, { readOnly: true })).toBe('diff-editor');
    expect(monaco.editor.create).toHaveBeenCalledWith(el, { theme: 'vs' });
    expect(monaco.editor.createDiffEditor).toHaveBeenCalledWith(el, { readOnly: true });
  });
});
