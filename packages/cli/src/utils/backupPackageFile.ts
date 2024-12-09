import fs from 'fs';
import path from 'path';

export const backupFile = (runtimeSource: string, file: string) => {
  const filePath = path.join(runtimeSource, file);

  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, `${filePath}.bak`);
  }
};

export const backupPnpmLock = (runtimeSource: string) => backupFile(runtimeSource, 'pnpm-lock.yaml');
export const backupYarnLock = (runtimeSource: string) => backupFile(runtimeSource, 'yarn-lock.json');
export const backupNpmLock = (runtimeSource: string) => backupFile(runtimeSource, 'package-lock.json');
export const backupPackageJson = (runtimeSource: string) => backupFile(runtimeSource, 'package.json');

export const backupLock = (runtimeSource: string, npmType: string) => {
  if (npmType === 'pnpm') {
    backupPnpmLock(runtimeSource);
  } else if (npmType === 'yarn') {
    backupYarnLock(runtimeSource);
  }
  if (npmType === 'npm') {
    backupNpmLock(runtimeSource);
  }
};

export const restoreFile = (runtimeSource: string, file: string) => {
  const filePath = path.join(runtimeSource, file);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    fs.renameSync(`${filePath}.bak`, filePath);
  }
};

export const restorePnpmLock = (runtimeSource: string) => restoreFile(runtimeSource, 'pnpm-lock.yaml');
export const restoreYarnLock = (runtimeSource: string) => restoreFile(runtimeSource, 'yarn-lock.json');
export const restoreNpmLock = (runtimeSource: string) => restoreFile(runtimeSource, 'package-lock.json');
export const restorePackageJson = (runtimeSource: string) => restoreFile(runtimeSource, 'package.json');

export const restoreLock = (runtimeSource: string, npmType: string) => {
  if (npmType === 'pnpm') {
    restorePnpmLock(runtimeSource);
  } else if (npmType === 'yarn') {
    restoreYarnLock(runtimeSource);
  }
  if (npmType === 'npm') {
    restoreNpmLock(runtimeSource);
  }
};
