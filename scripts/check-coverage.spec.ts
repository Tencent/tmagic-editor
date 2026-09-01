import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, test } from 'vitest';

const cli = fileURLToPath(new URL('./check-coverage.mjs', import.meta.url));

const spawnCli = (args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

describe('scripts/check-coverage.mjs', () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true });
    tmpDirs.length = 0;
  });

  const writeSummary = (root: string, summary: Record<string, unknown>) => {
    const dir = path.join(root, 'coverage');
    fs.mkdirSync(dir, { recursive: true });
    const summaryPath = path.join(dir, 'coverage-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary));
    return summaryPath;
  };

  test('缺少 coverage-summary.json 时失败', () => {
    const result = spawnCli(['--root', os.tmpdir(), '--summary', 'not-exist.json']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Missing');
  });

  test('非门禁文件即使没有覆盖率也通过', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-gate-'));
    tmpDirs.push(root);
    writeSummary(root, { total: { lines: { pct: 90 } } });

    const result = spawnCli([
      '--root',
      root,
      '--files',
      'AGENTS.md,packages/design/src/Button.vue,playground/src/main.ts',
    ]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  test('变更源码 lines < 85% 时失败', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-gate-'));
    tmpDirs.push(root);
    const abs = path.join(root, 'packages/editor/src/Editor.vue');
    writeSummary(root, {
      [abs]: { lines: { pct: 58.46 } },
    });

    const result = spawnCli(['--root', root, '--files', 'packages/editor/src/Editor.vue']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Coverage gate failed (lines < 85%):');
    expect(result.stderr).toContain('packages/editor/src/Editor.vue: 58.46%');
  });

  test('变更源码达到 85% 时通过', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-gate-'));
    tmpDirs.push(root);
    const abs = path.join(root, 'packages/core/src/App.ts');
    writeSummary(root, {
      [abs]: { lines: { pct: 85 } },
    });

    const result = spawnCli(['--root', root, '--files', 'packages/core/src/App.ts']);

    expect(result.status).toBe(0);
  });

  test('新文件不在 summary 中视为 0%', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-gate-'));
    tmpDirs.push(root);
    writeSummary(root, { total: { lines: { pct: 90 } } });

    const result = spawnCli(['--root', root, '--files', 'packages/utils/src/brand-new.ts']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('packages/utils/src/brand-new.ts: 0%');
  });

  test('未传 --files 时从 git 工作区收集变更', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-gate-'));
    tmpDirs.push(root);
    spawnSync('git', ['init'], { cwd: root, encoding: 'utf8' });
    fs.mkdirSync(path.join(root, 'packages/core/src'), { recursive: true });
    const rel = 'packages/core/src/App.ts';
    fs.writeFileSync(path.join(root, rel), 'export {}\n');
    writeSummary(root, {
      [path.join(root, rel)]: { lines: { pct: 90 } },
    });

    const result = spawnCli(['--root', root]);

    expect(result.status).toBe(0);
  });

  test('已提交文件不参与逐文件门禁', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-gate-'));
    tmpDirs.push(root);
    spawnSync('git', ['init'], { cwd: root, encoding: 'utf8' });
    fs.mkdirSync(path.join(root, 'packages/editor/src'), { recursive: true });
    const rel = 'packages/editor/src/Editor.vue';
    fs.writeFileSync(path.join(root, rel), 'export {}\n');
    spawnSync('git', ['add', rel], { cwd: root, encoding: 'utf8' });
    spawnSync('git', ['-c', 'user.email=test@tmagic.local', '-c', 'user.name=test', 'commit', '-m', 'init'], {
      cwd: root,
      encoding: 'utf8',
    });
    writeSummary(root, {
      [path.join(root, rel)]: { lines: { pct: 58.46 } },
    });

    const result = spawnCli(['--root', root]);

    expect(result.status).toBe(0);
  });
});
