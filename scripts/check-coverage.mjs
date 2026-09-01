/**
 * 覆盖率硬门禁：新增/修改的 packages 源码 lines 覆盖率必须 ≥ 85%。
 * 范围与 vitest coverage include/exclude 对齐（不含 design / UI adapter）。
 *
 * node scripts/check-coverage.mjs [--root dir] [--summary file] [--files a,b]
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const COVERAGE_THRESHOLD = 85;

const GATED_SOURCE = new RegExp('^packages/(?!design/|element-plus-adapter/|tdesign-vue-next-adapter/)[^/]+/src/');
const SOURCE_EXT = new RegExp('\\.(vue|ts|tsx|js|jsx|mjs)$');

const defaultRun = (command, cwd) => {
  try {
    return execSync(command, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

export const isGatedSourceFile = (relPath) => {
  const normalized = relPath.replaceAll('\\', '/');
  return GATED_SOURCE.test(normalized) && SOURCE_EXT.test(normalized) && !normalized.includes('/tests/');
};

export const lookupFileCoverage = (summary, absPath) => {
  if (!summary || typeof summary !== 'object') return null;
  if (summary[absPath]) return summary[absPath];
  const normalized = absPath.replaceAll('\\', '/');
  if (summary[normalized]) return summary[normalized];
  const match = Object.keys(summary).find((key) => key.replaceAll('\\', '/') === normalized);
  return match ? summary[match] : null;
};

export const getLinesPct = (stats) => {
  const pct = stats && stats.lines ? stats.lines.pct : undefined;
  if (typeof pct === 'number' && Number.isFinite(pct)) return pct;
  return 0;
};

export const checkChangedFilesCoverage = ({ changedFiles, summary, root, threshold = COVERAGE_THRESHOLD }) => {
  const failures = [];

  for (const rel of changedFiles) {
    const normalized = rel.replaceAll('\\', '/');
    if (!isGatedSourceFile(normalized)) continue;

    const abs = path.resolve(root, normalized);
    const pct = getLinesPct(lookupFileCoverage(summary, abs));
    if (pct < threshold) {
      failures.push({ file: normalized, pct });
    }
  }

  return failures;
};

export const collectGitChangedFiles = ({ run = defaultRun, cwd } = {}) => {
  const files = new Set();
  const linesOf = (command) =>
    String(run(command, cwd) || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

  // 只检查工作区相对 HEAD 的变更，避免把已经合入分支、尚未补测的历史文件一次性卡住。
  for (const file of linesOf('git diff --name-only --diff-filter=ACMR HEAD')) files.add(file);
  for (const file of linesOf('git diff --name-only --cached --diff-filter=ACMR')) files.add(file);
  for (const file of linesOf('git ls-files --others --exclude-standard')) files.add(file);

  return [...files];
};

export const formatCoverageFailures = (failures, threshold = COVERAGE_THRESHOLD) => {
  const header = `Coverage gate failed (lines < ${threshold}%):`;
  const body = failures.map((item) => `  ${item.file}: ${item.pct}%`).join('\n');
  return body ? `${header}\n${body}` : header;
};

export const runCoverageGate = ({
  root,
  summaryPath = path.join(root, 'coverage', 'coverage-summary.json'),
  changedFiles,
  run,
  log = console,
} = {}) => {
  if (!existsSync(summaryPath)) {
    log.error(`Missing ${path.relative(root, summaryPath)}. Run pnpm coverage first.`);
    return 1;
  }

  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const files = changedFiles ?? collectGitChangedFiles({ run, cwd: root });
  const failures = checkChangedFilesCoverage({ changedFiles: files, summary, root });

  if (failures.length > 0) {
    log.error(formatCoverageFailures(failures));
    return 1;
  }

  return 0;
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const { values } = parseArgs({
    options: {
      root: { type: 'string' },
      summary: { type: 'string' },
      files: { type: 'string' },
    },
  });

  const root = path.resolve(values.root || path.dirname(fileURLToPath(import.meta.url)), values.root ? '.' : '..');
  const summaryPath = values.summary
    ? path.resolve(root, values.summary)
    : path.join(root, 'coverage', 'coverage-summary.json');
  const changedFiles = values.files
    ? values.files
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;

  process.exit(runCoverageGate({ root, summaryPath, changedFiles }));
}
