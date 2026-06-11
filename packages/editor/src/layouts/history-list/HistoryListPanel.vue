<template>
  <TMagicPopover
    popper-class="m-editor-history-list-popover"
    placement="bottom"
    trigger="click"
    v-model:visible="visible"
    :width="660"
  >
    <div class="m-editor-history-list">
      <TMagicTooltip effect="dark" placement="top" content="关闭">
        <TMagicButton class="m-editor-history-list-close" size="small" link @click="visible = false">
          <template #icon>
            <MIcon :icon="CloseIcon"></MIcon>
          </template>
        </TMagicButton>
      </TMagicTooltip>

      <TMagicTabs v-model="activeTab" class="m-editor-history-list-tabs">
        <component
          :is="tabPaneComponent?.component || 'el-tab-pane'"
          v-bind="tabPaneComponent?.props({ name: 'page', label: `页面 (${pageGroups.length})` }) || {}"
        >
          <PageTab
            :list="pageGroupsDisplay"
            :expanded="expanded"
            :marker="pageMarker"
            @toggle="toggleGroup"
            @goto="onPageGoto"
            @goto-initial="onPageGotoInitial"
            @diff-step="onPageDiff"
            @revert-step="onPageRevert"
            @select="onPageSelect"
            @clear="onPageClear"
          />
        </component>

        <component
          v-if="!disabledDataSource"
          :is="tabPaneComponent?.component || 'el-tab-pane'"
          v-bind="tabPaneComponent?.props({ name: 'data-source', label: `数据源 (${dataSourceGroups.length})` }) || {}"
        >
          <BucketTab
            :config="dataSourceConfig"
            :buckets="dataSourceGroupsByTarget"
            :expanded="expanded"
            @toggle="toggleGroup"
            @goto="onDataSourceGoto"
            @goto-initial="onDataSourceGotoInitial"
            @diff-step="onDataSourceDiff"
            @revert-step="onDataSourceRevert"
            @clear="onDataSourceClear"
          />
        </component>

        <component
          v-if="!disabledCodeBlock"
          :is="tabPaneComponent?.component || 'el-tab-pane'"
          v-bind="tabPaneComponent?.props({ name: 'code-block', label: `代码块 (${codeBlockGroups.length})` }) || {}"
        >
          <BucketTab
            :config="codeBlockConfig"
            :buckets="codeBlockGroupsByTarget"
            :expanded="expanded"
            @toggle="toggleGroup"
            @goto="onCodeBlockGoto"
            @goto-initial="onCodeBlockGotoInitial"
            @diff-step="onCodeBlockDiff"
            @revert-step="onCodeBlockRevert"
            @clear="onCodeBlockClear"
          />
        </component>

        <component
          v-for="tab in extraTabs"
          :key="tab.name"
          :is="tabPaneComponent?.component || 'el-tab-pane'"
          v-bind="tabPaneComponent?.props({ name: tab.name, label: resolveTabLabel(tab) }) || {}"
        >
          <component :is="tab.component" v-bind="tab.props || {}" v-on="tab.listeners || {}" />
        </component>
      </TMagicTabs>
    </div>

    <template #reference>
      <TMagicTooltip effect="dark" placement="bottom" content="历史记录">
        <TMagicButton size="small" link @click="visible = !visible">
          <template #icon>
            <MIcon :icon="ClockIcon"></MIcon>
          </template>
        </TMagicButton>
      </TMagicTooltip>
    </template>
  </TMagicPopover>

  <HistoryDiffDialog ref="diffDialog" :extend-state="extendFormState" />
  <HistoryDiffDialog ref="confirmDialog" :is-confirm="true" :extend-state="extendFormState" />
</template>

<script lang="ts" setup>
/**
 * 历史记录面板：在顶部 NavMenu 上点击图标打开 popover，分三个 tab：
 * - 页面：当前活动页面的历史栈，连续修改同一节点的多步会被合并成一组
 * - 数据源：以 dataSource.id 分桶，每条操作记录独立展示
 * - 代码块：同上，按 codeBlock.id 分桶，每条操作记录独立展示
 *
 * 数据通过 historyService 暴露的聚合 API 读取，UI 仅用于只读展示，
 * 同时支持点击任意一条记录跳转至该状态：
 * - 页面 tab：调用 editorService.gotoPageStep(targetCursor)
 * - 数据源 tab：调用 dataSourceService.goto(id, targetCursor)
 * - 代码块 tab：调用 codeBlockService.goto(id, targetCursor)
 *
 * 这里的 targetCursor = 用户点击的 step.index + 1，即"应用至此步完成的状态"。
 *
 * 此外每条 step 上提供"查看差异"入口（仅在前后值都存在的 update 步骤显示），
 * 点击后弹出 HistoryDiffDialog，使用 CompareForm 组件以表单形式展示新旧值差异。
 *
 * 各 tab 的内容拆分为独立的 SFC：页面用 PageTab，数据源 / 代码块复用通用的 BucketTab
 * （通过 title / prefix / describe* / isStepDiffable 注入差异）。
 * 共享的描述生成与折叠状态在 composables.ts 中维护。
 */
import { computed, inject, markRaw, ref, useTemplateRef, watch } from 'vue';
import { Clock, Close } from '@element-plus/icons-vue';

import {
  getDesignConfig,
  TMagicButton,
  tMagicMessage,
  tMagicMessageBox,
  TMagicPopover,
  TMagicTabs,
  TMagicTooltip,
} from '@tmagic/design';
import type { FormState } from '@tmagic/form';

import MIcon from '@editor/components/Icon.vue';
import { useServices } from '@editor/hooks/use-services';
import type {
  CodeBlockStepValue,
  DataSourceStepValue,
  DiffDialogPayload,
  HistoryBucketConfig,
  HistoryListExtraTab,
} from '@editor/type';

import BucketTab from './BucketTab.vue';
import {
  describeCodeBlockGroup,
  describeCodeBlockStep,
  describeDataSourceGroup,
  describeDataSourceStep,
  isCodeBlockStepRevertable,
  isDataSourceStepRevertable,
  useHistoryList,
} from './composables';
import HistoryDiffDialog from './HistoryDiffDialog.vue';
import PageTab from './PageTab.vue';

defineOptions({
  name: 'MEditorHistoryListPanel',
});

const ClockIcon = markRaw(Clock);
const CloseIcon = markRaw(Close);
const activeTab = ref<string>('page');

/**
 * 面板显隐受控：reference 图标点击切换，右上角关闭按钮置为 false。
 * 点击面板以外区域的自动收起由 TMagicPopover 通过 v-model:visible 回写完成。
 */
const visible = ref(false);

const tabPaneComponent = getDesignConfig('components')?.tabPane;

/**
 * 业务方自定义的扩展 tab，由 Editor 顶层通过 `historyListExtraTabs` 注入。
 * 追加在内置「页面 / 数据源 / 代码块」三个 tab 之后，未提供时为空数组。
 */
const extraTabs = inject<HistoryListExtraTab[]>('historyListExtraTabs', []);

/** label 支持字符串或函数，函数形式便于展示动态数量等内容。 */
const resolveTabLabel = (tab: HistoryListExtraTab) => (typeof tab.label === 'function' ? tab.label() : tab.label);

const { editorService, dataSourceService, codeBlockService, historyService, propsService, stageOverlayService } =
  useServices();

/**
 * 数据源 / 代码块功能可被业务方通过 `disabledDataSource` / `disabledCodeBlock` 禁用，
 * 禁用后对应的历史记录 tab 不再展示。若当前激活的 tab 恰好被禁用，则回退到「页面」tab。
 */
const disabledDataSource = computed(() => propsService.getDisabledDataSource());
const disabledCodeBlock = computed(() => propsService.getDisabledCodeBlock());

watch([disabledDataSource, disabledCodeBlock], ([dsDisabled, cbDisabled]) => {
  if ((activeTab.value === 'data-source' && dsDisabled) || (activeTab.value === 'code-block' && cbDisabled)) {
    activeTab.value = 'page';
  }
});

/**
 * 通过 inject 拿到 Editor 顶层注入的 `extendFormState`，转交给 HistoryDiffDialog
 * 内部的 CompareForm，使差异对比表单的 filterFunction 能拿到完整的业务上下文。
 * 未提供时为 undefined，CompareForm/MForm 会跳过 extendState 处理。
 */
const extendFormState = inject<((_state: FormState) => Record<string, any> | Promise<Record<string, any>>) | undefined>(
  'extendFormState',
  undefined,
);

const {
  expanded,
  toggleGroup,
  pageGroups,
  dataSourceGroups,
  codeBlockGroups,
  pageGroupsDisplay,
  dataSourceGroupsByTarget,
  codeBlockGroupsByTarget,
} = useHistoryList();

/**
 * 当前活动页的「加载/初始」标记记录（设置 root 时生成），透传给 PageTab 的底部初始行展示。
 * 基于 historyService 的 reactive state 派生，活动页切换或标记写入后自动刷新。
 */
const pageMarker = computed(() => historyService.getPageMarker());

/** 数据源 step 仅 update（前后 schema 都存在）时可查看差异。 */
const isDataSourceStepDiffable = (step: DataSourceStepValue) =>
  Boolean(step.diff?.[0]?.oldSchema && step.diff?.[0]?.newSchema);

/** 代码块 step 仅 update（前后 content 都存在）时可查看差异。 */
const isCodeBlockStepDiffable = (step: CodeBlockStepValue) =>
  Boolean(step.diff?.[0]?.oldSchema && step.diff?.[0]?.newSchema);

/**
 * 数据源 / 代码块两类 bucket 历史的整体渲染配置：把 title / prefix 与各自的描述、
 * 可差异、可回滚判定收敛为单一对象整体注入 BucketTab，组件内部按需读取。
 */
const dataSourceConfig: HistoryBucketConfig<DataSourceStepValue> = {
  title: '数据源',
  prefix: 'ds',
  describeGroup: describeDataSourceGroup,
  describeStep: describeDataSourceStep,
  isStepDiffable: isDataSourceStepDiffable,
  isStepRevertable: isDataSourceStepRevertable,
};

const codeBlockConfig: HistoryBucketConfig<CodeBlockStepValue> = {
  title: '代码块',
  prefix: 'cb',
  describeGroup: describeCodeBlockGroup,
  describeStep: describeCodeBlockStep,
  isStepDiffable: isCodeBlockStepDiffable,
  isStepRevertable: isCodeBlockStepRevertable,
};

/** 把"目标 step 索引"翻译成"目标 cursor"（已应用步骤数量）。 */
const indexToCursor = (index: number) => index + 1;

const onPageGoto = (index: number) => {
  editorService.gotoPageStep(indexToCursor(index));
};

/**
 * 点击页面历史记录行：选中该记录对应的画布节点。
 * - 从目标 step 的 diff 中取节点 id（优先 newSchema，回退 oldSchema），按出现顺序找到第一个当前仍存在的节点；
 * - 与图层树点击选中一致：editorService.select + 画布 / overlay 画布 select 三者联动；
 * - 该 step 涉及的节点都已不存在（如删除记录、被撤销的新增）时给出提示，不做选中。
 */
const onPageSelect = async (index: number) => {
  const step = historyService.getPageStepList()[index]?.step;
  if (!step) return;
  const targetId = (step.diff ?? [])
    .map((item) => item.newSchema?.id ?? item.oldSchema?.id)
    .find((id) => id !== undefined && id !== null && editorService.getNodeById(id, false));
  if (targetId === undefined || targetId === null) {
    tMagicMessage.warning('该记录对应的节点已不存在，无法选中');
    return;
  }
  const node = editorService.getNodeById(targetId, false);
  if (!node) return;
  await editorService.select(node);
  editorService.get('stage')?.select(targetId);
  stageOverlayService.get('stage')?.select(targetId);
};

const onDataSourceGoto = (id: string | number, index: number) => {
  dataSourceService.goto(id, indexToCursor(index));
};

const onCodeBlockGoto = (id: string | number, index: number) => {
  codeBlockService.goto(id, indexToCursor(index));
};

/**
 * "回到初始状态" = 把对应栈 cursor 移到 0（全部已撤销）。
 * 复用 service.goto*(0) 即可，所有真实 step 的反向应用由 service 层的 undo 链路完成。
 */
const onPageGotoInitial = () => {
  editorService.gotoPageStep(0);
};

const onDataSourceGotoInitial = (id: string | number) => {
  dataSourceService.goto(id, 0);
};

const onCodeBlockGotoInitial = (id: string | number) => {
  codeBlockService.goto(id, 0);
};

const diffDialogRef = useTemplateRef<InstanceType<typeof HistoryDiffDialog>>('diffDialog');
const confirmDialogRef = useTemplateRef<InstanceType<typeof HistoryDiffDialog>>('confirmDialog');

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

const buildPageDiffPayload = (index: number): DiffDialogPayload | null =>
  buildDiffPayload(
    {
      category: 'node',
      groups: () => historyService.getPageHistoryGroups(),
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
      groups: () => historyService.getDataSourceHistoryGroups(),
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
      groups: () => historyService.getCodeBlockHistoryGroups(),
      getCurrent: (id) => codeBlockService.getCodeContentById(id) as Record<string, any> | null,
      resolveLabel: (n, o, id) => n.name || o.name || `${id}`,
    },
    index,
    id,
  );

const onPageDiff = (index: number) => {
  const payload = buildPageDiffPayload(index);
  if (payload) diffDialogRef.value?.open(payload);
};

const onDataSourceDiff = (id: string | number, index: number) => {
  const payload = buildDataSourceDiffPayload(id, index);
  if (payload) diffDialogRef.value?.open(payload);
};

const onCodeBlockDiff = (id: string | number, index: number) => {
  const payload = buildCodeBlockDiffPayload(id, index);
  if (payload) diffDialogRef.value?.open(payload);
};

/**
 * 「回滚」统一入口：把目标历史步骤的修改作为一次新操作反向应用（类 git revert），
 * 不破坏原有栈结构。各 service 内部完成反向 + 入栈，并自带描述用于面板展示。
 *
 * 交互：
 * - 可差异对比的步骤（单节点 / 单实体 update）：弹出差异弹窗供用户确认，点「确定回滚」再执行；
 * - 无法对比的步骤（add / remove / 多节点更新，payload 为 null）：弹出普通二次确认框，确认后执行。
 *
 * 页面 / 数据源 / 代码块三类回滚仅「差异入参构造」与「实际 revert 调用」不同，
 * 由调用方分别传入 payload 与 revert，公共的弹窗 / 确认流程在此收敛。
 */
const runRevert = (payload: DiffDialogPayload | null): Promise<boolean> => {
  if (payload && confirmDialogRef.value) {
    return confirmDialogRef.value.confirm(payload);
  }
  return confirmRevert();
};

/**
 * 回滚前置校验：若该历史步骤回滚所依赖的目标数据已被删除，则无法回滚。
 * - update（把旧值写回）：被修改的目标必须仍存在；
 * - 页面 remove（还原被删节点）：被删节点的原父容器必须仍存在，否则无处插回；
 * add（回滚即删除）即使目标已不在，也已达成「删除」目的，不视为失败。
 *
 * 命中时弹出「回滚失败」提示并返回 true，调用方据此中止本次回滚。
 */
const isPageRevertTargetMissing = (index: number): boolean => {
  const step = historyService.getPageStepList()[index]?.step;
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
  const step = historyService.getDataSourceStepList(id)[index]?.step;
  return Boolean(step && step.opType === 'update' && !dataSourceService.getDataSourceById(`${id}`));
};

/** 代码块 update 步骤回滚时，对应代码块必须仍存在（已删除则无处写回旧值）。 */
const isCodeBlockRevertTargetMissing = (id: string | number, index: number): boolean => {
  const step = historyService.getCodeBlockStepList(id)[index]?.step;
  return Boolean(step && step.opType === 'update' && !codeBlockService.getCodeContentById(id));
};

/** 目标数据已被删除、无法回滚时的统一提示。 */
const showRevertTargetMissing = () => {
  tMagicMessage.error('回滚失败：该记录对应的数据已被删除');
};

const onPageRevert = (index: number) => {
  if (isPageRevertTargetMissing(index)) {
    showRevertTargetMissing();
    return Promise.resolve(null);
  }
  return runRevert(buildPageDiffPayload(index)).then((result) => (result ? editorService.revertPageStep(index) : null));
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
 * 「回滚」二次确认：新增 / 删除 / 多节点更新等无法做差异对比的步骤，
 * 不弹差异弹窗，改用一个普通确认框替代「确定回滚」按钮，避免点击后无任何提示直接执行。
 * 用户取消时返回 false，调用方据此中止回滚。
 */
const confirmRevert = (): Promise<boolean> =>
  confirmDialog(
    '确定回滚该步骤吗？回滚会将该操作作为一条新记录反向应用（新增将被删除、删除将被还原），不影响后续历史记录。',
  );

/**
 * 通用二次确认弹窗：清空历史 / 无法差异对比的回滚等会改变状态的操作，先弹出确认框，
 * 用户点击「确定」返回 true，取消（confirm reject）时返回 false 并静默忽略。
 */
const confirmDialog = async (message: string): Promise<boolean> => {
  try {
    await tMagicMessageBox.confirm(message, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    return true;
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    return false;
  }
};

/**
 * 把内存中（已清空对应类别后的）历史状态重新写回 IndexedDB，
 * 使本地持久化的那份与内存保持一致——即「连同本地保存的一并删除」。
 * 不支持 IndexedDB 或写入失败时静默忽略（内存清空已生效）。
 */
const syncIndexedDB = async () => {
  try {
    await historyService.saveToIndexedDB();
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    // ignore: 内存清空已生效，本地同步失败不阻塞交互
  }
};

const onPageClear = async () => {
  if (
    await confirmDialog('确定清空当前页面的历史记录吗？清空后将无法撤销/重做之前的操作，本地保存的记录也会一并删除。')
  ) {
    historyService.clearPage();
    await syncIndexedDB();
  }
};

const onDataSourceClear = async () => {
  if (
    await confirmDialog('确定清空数据源的历史记录吗？清空后将无法撤销/重做之前的操作，本地保存的记录也会一并删除。')
  ) {
    historyService.clearDataSource();
    await syncIndexedDB();
  }
};

const onCodeBlockClear = async () => {
  if (
    await confirmDialog('确定清空代码块的历史记录吗？清空后将无法撤销/重做之前的操作，本地保存的记录也会一并删除。')
  ) {
    historyService.clearCodeBlock();
    await syncIndexedDB();
  }
};
</script>
