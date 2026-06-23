import { createApp, getCurrentInstance } from 'vue';

import { tMagicMessage } from '@tmagic/design';

import type {
  ConfirmAndRevertOptions,
  CustomDiffFormOptions,
  DiffDialogPayload,
  Services,
  UseHistoryRevertOptions,
} from '@editor/type';

import { confirmHistoryAction } from './composables';

/**
 * 三类历史（页面 / 数据源 / 代码块）差异弹窗入参的构造差异，收敛为一份配置：
 * 仅「分组来源、当前值读取、类型 / 展示名提取」不同，定位 step、校验前后值、组装 payload 的流程共用。
 */
interface DiffPayloadSource {
  /** 表单类别：节点 / 数据源 / 代码块。 */
  category: DiffDialogPayload['category'];
  /** 该类别按时间正序的历史分组列表（含已撤销）。 */
  groups: () => { id?: string | number; steps: { index: number; step: { diff?: any[] } }[] }[];
  /** 读取目标当前实际值，用于「与当前对比」；不存在时返回空即禁用对比。 */
  getCurrent: (_id: string | number) => Record<string, any> | null | undefined;
  /** 由新/旧快照提取展示名（含各自的兜底，如节点回退 type、数据源 / 代码块回退 id）。 */
  resolveLabel: (_newSchema: Record<string, any>, _oldSchema: Record<string, any>, _id: string | number) => string;
  /** 由新/旧快照提取类型；代码块无 type 字段则不传。 */
  resolveType?: (_newSchema: Record<string, any>, _oldSchema: Record<string, any>) => string;
}

/**
 * 构造差异弹窗入参：仅 update（前后值都存在）可对比。
 * - 页面（无 id）：在全部分组中按 index 定位 step，目标 id 取自快照；
 * - 数据源 / 代码块（带 id）：先匹配分组 id 再按 index 定位。
 * 无可对比内容（多节点 / add / remove）或定位不到时返回 null。
 */
const buildDiffPayload = (source: DiffPayloadSource, index: number, id?: string | number): DiffDialogPayload | null => {
  for (const group of source.groups()) {
    if (id !== undefined && group.id !== id) continue;
    const step = group.steps.find((s) => s.index === index)?.step;
    if (!step) continue;
    const oldSchema = step.diff?.[0]?.oldSchema as Record<string, any> | undefined;
    const newSchema = step.diff?.[0]?.newSchema as Record<string, any> | undefined;
    if (!oldSchema || !newSchema) return null;
    const targetId = id ?? newSchema.id ?? oldSchema.id;
    const type = source.resolveType?.(newSchema, oldSchema);
    return {
      category: source.category,
      ...(type !== undefined ? { type } : {}),
      lastValue: oldSchema,
      value: newSchema,
      currentValue: (targetId !== undefined ? source.getCurrent(targetId) : null) || null,
      targetLabel: source.resolveLabel(newSchema, oldSchema, targetId),
      id: targetId,
    };
  }
  return null;
};

interface MountedDiffDialog {
  instance: {
    open: (_payload: DiffDialogPayload) => void;
    confirm: (_payload: DiffDialogPayload) => Promise<boolean>;
  };
  /** 卸载弹窗并清理容器（延迟以等待关闭过渡播放完成，避免动画被强行打断）。 */
  destroy: () => void;
}

/**
 * 按需动态 import 并挂载一个游离的 HistoryDiffDialog，返回其实例与清理函数。
 * 通过继承 appContext 复用全局组件 / 指令 / provide / 插件（Element Plus、@tmagic/form 字段组件等），
 * 弹窗组件动态 import，避免拖累其它消费者。供「确认回滚」与「查看差异」两种交互共用。
 */
const mountHistoryDiffDialog = async (
  options: Pick<UseHistoryRevertOptions, 'appContext' | 'extendState'> &
    CustomDiffFormOptions & {
      services: Pick<Services, 'editorService' | 'dataSourceService' | 'codeBlockService' | 'historyService'>;
      isConfirm?: boolean;
      onClose?: () => void;
    },
): Promise<MountedDiffDialog> => {
  const { default: historyDiffDialog } = await import('./HistoryDiffDialog.vue');

  const container = document.createElement('div');
  container.style.display = 'none';
  document.body.appendChild(container);

  const app = createApp(historyDiffDialog, {
    services: options.services,
    isConfirm: options.isConfirm,
    extendState: options.extendState,
    loadConfig: options.loadConfig,
    selfDiffFieldTypes: options.selfDiffFieldTypes,
    onClose: options.onClose,
  });
  if (options.appContext) {
    Object.assign(app._context, options.appContext);
  }

  const instance = app.mount(container) as unknown as MountedDiffDialog['instance'];

  const destroy = () => {
    setTimeout(() => {
      try {
        app.unmount();
      } catch {
        // ignore
      }
      container.parentNode?.removeChild(container);
    }, 300);
  };

  return { instance, destroy };
};

/**
 * 动态挂载一个「确认回滚」模式的 HistoryDiffDialog，等待用户确认：
 * - 用户点「确定回滚」resolve(true)，取消 / 关闭 resolve(false)；
 * - 确认流程结束后自动卸载。
 */
const confirmRevertWithDiffDialog = async (
  payload: DiffDialogPayload,
  options: Pick<UseHistoryRevertOptions, 'appContext' | 'extendState'> &
    CustomDiffFormOptions & {
      services: Pick<Services, 'editorService' | 'dataSourceService' | 'codeBlockService' | 'historyService'>;
    },
): Promise<boolean> => {
  const { instance, destroy } = await mountHistoryDiffDialog({
    ...options,
    isConfirm: true,
  });
  try {
    return await instance.confirm(payload);
  } finally {
    destroy();
  }
};

/**
 * 动态挂载一个「查看差异」模式（只读）的 HistoryDiffDialog 并打开：
 * 弹窗保持打开直到用户关闭，关闭（close 事件）后自动卸载并清理容器。
 */
const viewHistoryDiffDialog = async (
  payload: DiffDialogPayload,
  options: Pick<UseHistoryRevertOptions, 'appContext' | 'extendState'> &
    CustomDiffFormOptions & {
      services: Pick<Services, 'editorService' | 'dataSourceService' | 'codeBlockService' | 'historyService'>;
    },
): Promise<void> => {
  // onClose 在用户关闭弹窗时才触发，此时 handle.destroy 早已赋值。
  const handle: { destroy?: () => void } = {};
  const { instance, destroy } = await mountHistoryDiffDialog({
    ...options,
    isConfirm: false,
    onClose: () => handle.destroy?.(),
  });
  handle.destroy = destroy;
  instance.open(payload);
};

/**
 * 历史记录「单步回滚」与「查看差异」的完整交互流程，供历史面板与业务方共用。
 *
 * 单步回滚（类 git revert）：
 * 1. 前置校验：目标数据已被删除（update 写回目标 / 页面 remove 的原父容器缺失）时给出「回滚失败」提示并中止；
 * 2. 二次确认：可差异对比的步骤（单实体 update）弹出差异确认弹窗，其余步骤弹普通二次确认框；
 * 3. 用户确认后执行对应 service 的 revert（页面 / 数据源 / 代码块）。
 *
 * 查看差异：可差异对比的步骤动态挂载只读 HistoryDiffDialog 展示前后值差异。
 *
 * 上述弹窗均按需动态挂载 HistoryDiffDialog 实现，业务方无需自行挂载任何弹窗。
 *
 * 返回的能力分三组：
 * - 内置三类（页面 / 数据源 / 代码块）：`onPageRevert` / `onDataSourceRevert` / `onCodeBlockRevert` 单步回滚，
 *   `onPageDiff` / `onDataSourceDiff` / `onCodeBlockDiff` 查看差异，及配套的 `buildXxxDiffPayload` / `isXxxRevertTargetMissing`；
 * - 业务自有历史（如管理台「模块」）：`confirmAndRevert` / `viewDiff` 复用同一套交互流程，由业务方自行构造差异入参；
 *   即上述内置三类本质上是它们各自预置好 payload 构造与 service.revert 的特例。
 *
 * 业务方可在拿到 Editor 实例暴露的 `services` 后直接 import 调用：
 *
 * ```ts
 * import { useHistoryRevert } from '@tmagic/editor';
 *
 * const { onPageRevert, onPageDiff } = useHistoryRevert(editorRef.value); // editorRef.value 即 Editor 暴露的 services
 * await onPageRevert(index); // 弹出差异 / 二次确认弹窗后回滚
 * onPageDiff(index); // 弹出只读差异弹窗查看前后值差异
 * ```
 */
export const useHistoryRevert = (
  services: Pick<Services, 'editorService' | 'dataSourceService' | 'codeBlockService' | 'historyService'>,
  options: UseHistoryRevertOptions = {},
) => {
  const { editorService, dataSourceService, codeBlockService, historyService } = services;
  // 自动捕获调用方所在组件的 appContext（在 setup 中调用时），业务方亦可显式覆盖。
  const appContext = options.appContext ?? getCurrentInstance()?.appContext ?? null;
  const { extendState } = options;

  /** 目标数据已被删除、无法回滚时的统一提示。 */
  const showRevertTargetMissing = () => {
    tMagicMessage.error('回滚失败：该记录对应的数据已被删除');
  };

  /**
   * 「回滚」二次确认：新增 / 删除 / 多节点更新等无法做差异对比的步骤，
   * 不弹差异弹窗，改用一个普通确认框替代「确定回滚」按钮，避免点击后无任何提示直接执行。
   * 用户取消时返回 false，调用方据此中止回滚。
   */
  const confirmRevert = (): Promise<boolean> =>
    confirmHistoryAction(
      '确定回滚该步骤吗？回滚会将该操作作为一条新记录反向应用（新增将被删除、删除将被还原），不影响后续历史记录。',
    );

  /**
   * 「回滚」统一确认入口：可差异对比的步骤动态挂载 HistoryDiffDialog 走差异确认弹窗，
   * 无法对比的步骤（add / remove / 多节点更新）回退到普通二次确认框。
   * `extra` 供业务自有历史（如模块）透传自定义表单配置加载等渲染入参。
   */
  const runRevert = (payload: DiffDialogPayload | null, extra?: CustomDiffFormOptions): Promise<boolean> => {
    if (payload) {
      return confirmRevertWithDiffDialog(payload, { appContext, extendState, services, ...extra });
    }
    return confirmRevert();
  };

  const buildPageDiffPayload = (index: number): DiffDialogPayload | null =>
    buildDiffPayload(
      {
        category: 'node',
        groups: () => historyService.getHistoryGroups('page', editorService.get('page')?.id),
        getCurrent: (id) => editorService.getNodeById(id) as Record<string, any> | null,
        resolveType: (n, o) => n.type || o.type || '',
        resolveLabel: (n, o) => n.name || o.name || n.type || o.type || '',
      },
      index,
    );

  const buildDataSourceDiffPayload = (id: string | number, index: number): DiffDialogPayload | null =>
    buildDiffPayload(
      {
        category: 'data-source',
        groups: () => historyService.getHistoryGroups('dataSource'),
        getCurrent: (id) => dataSourceService.getDataSourceById(`${id}`) as Record<string, any> | null,
        resolveType: (n, o) => n.type || o.type || 'base',
        resolveLabel: (n, o, id) => n.title || o.title || `${id}`,
      },
      index,
      id,
    );

  const buildCodeBlockDiffPayload = (id: string | number, index: number): DiffDialogPayload | null =>
    buildDiffPayload(
      {
        category: 'code-block',
        groups: () => historyService.getHistoryGroups('codeBlock'),
        getCurrent: (id) => codeBlockService.getCodeContentById(id) as Record<string, any> | null,
        resolveLabel: (n, o, id) => n.name || o.name || `${id}`,
      },
      index,
      id,
    );

  /**
   * 回滚前置校验：若该历史步骤回滚所依赖的目标数据已被删除，则无法回滚。
   * - update（把旧值写回）：被修改的目标必须仍存在；
   * - 页面 remove（还原被删节点）：被删节点的原父容器必须仍存在，否则无处插回；
   * add（回滚即删除）即使目标已不在，也已达成「删除」目的，不视为失败。
   */
  const isPageRevertTargetMissing = (index: number): boolean => {
    const step = historyService.getStepList('page', editorService.get('page')?.id)[index]?.step;
    if (!step) return false;
    if (step.opType === 'update') {
      return (step.diff ?? []).some((item) => {
        const id = item.newSchema?.id ?? item.oldSchema?.id;
        return id !== undefined && !editorService.getNodeById(id, false);
      });
    }
    if (step.opType === 'remove') {
      return (step.diff ?? []).some(
        (item) => item.parentId !== undefined && !editorService.getNodeById(item.parentId, false),
      );
    }
    return false;
  };

  /** 数据源 update 步骤回滚时，对应数据源必须仍存在（已删除则无处写回旧值）。 */
  const isDataSourceRevertTargetMissing = (id: string | number, index: number): boolean => {
    const step = historyService.getStepList('dataSource', id)[index]?.step;
    return Boolean(step?.opType === 'update' && !dataSourceService.getDataSourceById(`${id}`));
  };

  /** 代码块 update 步骤回滚时，对应代码块必须仍存在（已删除则无处写回旧值）。 */
  const isCodeBlockRevertTargetMissing = (id: string | number, index: number): boolean => {
    const step = historyService.getStepList('codeBlock', id)[index]?.step;
    return Boolean(step?.opType === 'update' && !codeBlockService.getCodeContentById(id));
  };

  const onPageRevert = (index: number) => {
    if (isPageRevertTargetMissing(index)) {
      showRevertTargetMissing();
      return Promise.resolve(null);
    }
    return runRevert(buildPageDiffPayload(index)).then((result) =>
      result ? editorService.revertPageStep(index) : null,
    );
  };

  const onDataSourceRevert = (id: string | number, index: number) => {
    if (isDataSourceRevertTargetMissing(id, index)) {
      showRevertTargetMissing();
      return Promise.resolve(null);
    }
    return runRevert(buildDataSourceDiffPayload(id, index)).then((result) =>
      result ? dataSourceService.revert(id, index) : null,
    );
  };

  const onCodeBlockRevert = (id: string | number, index: number) => {
    if (isCodeBlockRevertTargetMissing(id, index)) {
      showRevertTargetMissing();
      return Promise.resolve(null);
    }
    return runRevert(buildCodeBlockDiffPayload(id, index)).then((result) =>
      result ? codeBlockService.revert(id, index) : null,
    );
  };

  /**
   * 「查看差异」：可差异对比的步骤（单实体 update）动态挂载只读 HistoryDiffDialog 展示前后值差异，
   * 无可对比内容（add / remove / 多节点更新）时不弹窗、静默返回。
   */
  const onPageDiff = (index: number): Promise<void> | void => {
    const payload = buildPageDiffPayload(index);
    if (payload) return viewHistoryDiffDialog(payload, { appContext, extendState, services });
  };

  const onDataSourceDiff = (id: string | number, index: number): Promise<void> | void => {
    const payload = buildDataSourceDiffPayload(id, index);
    if (payload) return viewHistoryDiffDialog(payload, { appContext, extendState, services });
  };

  const onCodeBlockDiff = (id: string | number, index: number): Promise<void> | void => {
    const payload = buildCodeBlockDiffPayload(id, index);
    if (payload) return viewHistoryDiffDialog(payload, { appContext, extendState, services });
  };

  /**
   * 业务自有历史（如管理台「模块」）的「单步回滚」统一入口：
   * 复用与页面/数据源/代码块一致的「目标校验 → 差异/二次确认弹窗 → 反向回滚」流程，
   * 内置三类只是它的特例（各自预置了 buildXxxDiffPayload + service.revert）。
   *
   * 用户取消或前置校验未过时返回 null，确认并执行回滚后返回 `revert()` 的结果。
   *
   * ```ts
   * await confirmAndRevert({
   *   diffPayload: oldSchema && newSchema ? { category: 'module', lastValue: oldSchema, value: newSchema, ... } : null,
   *   loadConfig: (ctx) => loadModFormConfig(modTypeId, values),
   *   selfDiffFieldTypes: ['mod-cond'],
   *   revert: () => moduleHistoryStore.revert(id, index),
   * });
   * ```
   */
  const confirmAndRevert = async <T = unknown>(revertOptions: ConfirmAndRevertOptions<T>): Promise<T | null> => {
    if (revertOptions.isTargetMissing?.()) {
      showRevertTargetMissing();
      return null;
    }
    const confirmed = await runRevert(revertOptions.diffPayload ?? null, {
      loadConfig: revertOptions.loadConfig,
      selfDiffFieldTypes: revertOptions.selfDiffFieldTypes,
    });
    if (!confirmed) return null;
    return await revertOptions.revert();
  };

  /**
   * 业务自有历史的「查看差异」统一入口：传入自行构造的差异入参即弹出只读差异弹窗，
   * 可透传 `loadConfig` / `selfDiffFieldTypes`。payload 为 null（不可对比）时静默返回。
   */
  const viewDiff = (payload: DiffDialogPayload | null, extra?: CustomDiffFormOptions): Promise<void> | void => {
    if (payload) return viewHistoryDiffDialog(payload, { appContext, extendState, services, ...extra });
  };

  return {
    onPageRevert,
    onDataSourceRevert,
    onCodeBlockRevert,
    onPageDiff,
    onDataSourceDiff,
    onCodeBlockDiff,
    buildPageDiffPayload,
    buildDataSourceDiffPayload,
    buildCodeBlockDiffPayload,
    isPageRevertTargetMissing,
    isDataSourceRevertTargetMissing,
    isCodeBlockRevertTargetMissing,
    confirmAndRevert,
    viewDiff,
  };
};
