<template>
  <TMagicPopover
    popper-class="m-editor-history-list-popover"
    placement="bottom"
    trigger="click"
    :visible="visible"
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
            @toggle="toggleGroup"
            @goto="onPageGoto"
            @goto-initial="onPageGotoInitial"
            @diff-step="onPageDiff"
            @revert-step="onPageRevert"
            @clear="onPageClear"
          />
        </component>

        <component
          v-if="!disabledDataSource"
          :is="tabPaneComponent?.component || 'el-tab-pane'"
          v-bind="tabPaneComponent?.props({ name: 'data-source', label: `数据源 (${dataSourceGroups.length})` }) || {}"
        >
          <BucketTab
            title="数据源"
            prefix="ds"
            :buckets="dataSourceGroupsByTarget"
            :expanded="expanded"
            :describe-group="describeDataSourceGroup"
            :describe-step="describeDataSourceStep"
            :is-step-diffable="isDataSourceStepDiffable"
            :is-step-revertable="isDataSourceStepRevertable"
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
            title="代码块"
            prefix="cb"
            :buckets="codeBlockGroupsByTarget"
            :expanded="expanded"
            :describe-group="describeCodeBlockGroup"
            :describe-step="describeCodeBlockStep"
            :is-step-diffable="isCodeBlockStepDiffable"
            :is-step-revertable="isCodeBlockStepRevertable"
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

  <HistoryDiffDialog
    ref="diffDialog"
    :extend-state="extendFormState"
    :on-confirm="onConfirmRevert"
    @close="onDiffDialogClose"
  />
</template>

<script lang="ts" setup>
/**
 * 历史记录面板：在顶部 NavMenu 上点击图标打开 popover，分三个 tab：
 * - 页面：当前活动页面的历史栈，连续修改同一节点的多步会被合并成一组
 * - 数据源：以 dataSource.id 分组，每组内部相邻的连续 update 自动合并
 * - 代码块：同上，按 codeBlock.id 分组并合并相邻 update
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
import { computed, inject, markRaw, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { Clock, Close } from '@element-plus/icons-vue';

import {
  getDesignConfig,
  TMagicButton,
  tMagicMessageBox,
  TMagicPopover,
  TMagicTabs,
  TMagicTooltip,
} from '@tmagic/design';
import type { FormState } from '@tmagic/form';

import MIcon from '@editor/components/Icon.vue';
import { useServices } from '@editor/hooks/use-services';
import type { CodeBlockStepValue, DataSourceStepValue, DiffDialogPayload, HistoryListExtraTab } from '@editor/type';

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

/** 面板显隐受控：reference 图标点击切换，右上角关闭按钮置为 false。 */
const visible = ref(false);

const tabPaneComponent = getDesignConfig('components')?.tabPane;

/**
 * 业务方自定义的扩展 tab，由 Editor 顶层通过 `historyListExtraTabs` 注入。
 * 追加在内置「页面 / 数据源 / 代码块」三个 tab 之后，未提供时为空数组。
 */
const extraTabs = inject<HistoryListExtraTab[]>('historyListExtraTabs', []);

/** label 支持字符串或函数，函数形式便于展示动态数量等内容。 */
const resolveTabLabel = (tab: HistoryListExtraTab) => (typeof tab.label === 'function' ? tab.label() : tab.label);

const { editorService, dataSourceService, codeBlockService, historyService, propsService } = useServices();

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

/** 数据源 step 仅 update（前后 schema 都存在）时可查看差异。 */
const isDataSourceStepDiffable = (step: DataSourceStepValue) => Boolean(step.oldSchema && step.newSchema);

/** 代码块 step 仅 update（前后 content 都存在）时可查看差异。 */
const isCodeBlockStepDiffable = (step: CodeBlockStepValue) => Boolean(step.oldContent && step.newContent);

/** 把"目标 step 索引"翻译成"目标 cursor"（已应用步骤数量）。 */
const indexToCursor = (index: number) => index + 1;

const onPageGoto = (index: number) => {
  editorService.gotoPageStep(indexToCursor(index));
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

/**
 * 构造页面 step 的差异弹窗入参：仅 update 单节点修改可对比，传入旧/新节点。
 * 节点类型 `type` 优先取 newNode.type，再回退 oldNode.type。
 * `currentValue` 取自 editorService 中该节点当前实际值，用于支持「与当前对比」。
 * 无可对比内容（如多节点 / add / remove）时返回 null。
 */
const buildPageDiffPayload = (index: number): DiffDialogPayload | null => {
  const groups = historyService.getPageHistoryGroups();
  for (const group of groups) {
    const entry = group.steps.find((s) => s.index === index);
    if (!entry) continue;
    const item = entry.step.updatedItems?.[0];
    if (!item?.oldNode || !item?.newNode) return null;
    const type = (item.newNode.type as string) || (item.oldNode.type as string) || '';
    const nodeId = item.newNode.id ?? item.oldNode.id;
    const currentNode = nodeId !== undefined ? editorService.getNodeById(nodeId) : null;
    return {
      category: 'node',
      type,
      lastValue: item.oldNode as Record<string, any>,
      value: item.newNode as Record<string, any>,
      currentValue: (currentNode as Record<string, any>) || null,
      targetLabel: (item.newNode.name as string) || (item.oldNode.name as string) || type,
      id: nodeId,
    };
  }
  return null;
};

/**
 * 在指定分组列表中按 id / index 查找命中的 step，命中后交由 build 构造差异弹窗入参。
 * 用于统一数据源、代码块两类历史的查找逻辑。
 */
const findGroupStep = <G extends { id: string | number; steps: { index: number; step: any }[] }>(
  groups: G[],
  id: string | number,
  index: number,
  build: (_step: G['steps'][number]['step']) => DiffDialogPayload | null,
): DiffDialogPayload | null => {
  for (const group of groups) {
    if (group.id !== id) continue;
    const entry = group.steps.find((s) => s.index === index);
    if (!entry) continue;
    return build(entry.step);
  }
  return null;
};

const buildDataSourceDiffPayload = (id: string | number, index: number): DiffDialogPayload | null =>
  findGroupStep(historyService.getDataSourceHistoryGroups(), id, index, ({ oldSchema, newSchema }) => {
    if (!oldSchema || !newSchema) return null;
    const currentSchema = dataSourceService.getDataSourceById(`${id}`);
    return {
      category: 'data-source',
      type: newSchema.type || oldSchema.type || 'base',
      lastValue: oldSchema as Record<string, any>,
      value: newSchema as Record<string, any>,
      currentValue: (currentSchema as Record<string, any>) || null,
      targetLabel: newSchema.title || oldSchema.title || `${id}`,
      id,
    };
  });

const buildCodeBlockDiffPayload = (id: string | number, index: number): DiffDialogPayload | null =>
  findGroupStep(historyService.getCodeBlockHistoryGroups(), id, index, ({ oldContent, newContent }) => {
    if (!oldContent || !newContent) return null;
    const currentContent = codeBlockService.getCodeContentById(id);
    return {
      category: 'code-block',
      lastValue: oldContent as Record<string, any>,
      value: newContent as Record<string, any>,
      currentValue: (currentContent as Record<string, any>) || null,
      targetLabel: newContent.name || oldContent.name || `${id}`,
      id,
    };
  });

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

const onConfirmRevert = shallowRef();

/**
 * 「回滚」入口：把目标历史步骤的修改作为一次新操作反向应用（类 git revert），
 * 不破坏原有栈结构。各 service 内部完成反向 + 入栈，并自带描述用于面板展示。
 *
 * 交互：先弹出该步骤的差异弹窗供用户确认，点击「确定回滚」后再真正执行回滚；
 * 对没有可对比内容的步骤（如 add / remove / 多节点更新）则直接回滚。
 */
const onPageRevert = (index: number) => {
  const payload = buildPageDiffPayload(index);
  onConfirmRevert.value = () => editorService.revertPageStep(index);
  if (payload) {
    diffDialogRef.value?.open({ ...payload });
  } else {
    onConfirmRevert.value();
  }
};

const onDataSourceRevert = (id: string | number, index: number) => {
  const payload = buildDataSourceDiffPayload(id, index);
  onConfirmRevert.value = () => dataSourceService.revert(id, index);
  if (payload) {
    diffDialogRef.value?.open({ ...payload });
  } else {
    onConfirmRevert.value();
  }
};

const onCodeBlockRevert = (id: string | number, index: number) => {
  const payload = buildCodeBlockDiffPayload(id, index);
  onConfirmRevert.value = () => codeBlockService.revert(id, index);
  if (payload) {
    diffDialogRef.value?.open({ ...payload });
  } else {
    onConfirmRevert.value();
  }
};

const onDiffDialogClose = () => {
  onConfirmRevert.value = undefined;
};

/**
 * 「清空历史记录」入口：先弹出二次确认，确认后清空对应类别的历史栈。
 * 仅删除撤销/重做记录，不会改动当前 DSL / 数据源 / 代码块本身。
 * 用户取消（confirm reject）时静默忽略。
 */
const confirmClear = async (message: string): Promise<boolean> => {
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
    await confirmClear('确定清空当前页面的历史记录吗？清空后将无法撤销/重做之前的操作，本地保存的记录也会一并删除。')
  ) {
    historyService.clearPage();
    await syncIndexedDB();
  }
};

const onDataSourceClear = async () => {
  if (await confirmClear('确定清空数据源的历史记录吗？清空后将无法撤销/重做之前的操作，本地保存的记录也会一并删除。')) {
    historyService.clearDataSource();
    await syncIndexedDB();
  }
};

const onCodeBlockClear = async () => {
  if (await confirmClear('确定清空代码块的历史记录吗？清空后将无法撤销/重做之前的操作，本地保存的记录也会一并删除。')) {
    historyService.clearCodeBlock();
    await syncIndexedDB();
  }
};
</script>
