import type { FormInstallOptions } from '@tmagic/editor';

/**
 * formPlugin.install 会 setConfig 整对象替换。
 * 把宿主 `$MAGIC_FORM` 与画布 `formOptions` 浅合并后再装，避免清空 request / flat 等。
 */
export const mergeFormInstallOptions = (
  host: FormInstallOptions | undefined,
  formOptions: FormInstallOptions = {},
): FormInstallOptions => ({ ...(host ?? {}), ...formOptions });
