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
          v-bind="
            tabPaneComponent?.props({ name: 'page', label: `${pageName} (${pageGroups.length})`, lazy: true }) || {}
          "
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
          v-bind="
            tabPaneComponent?.props({
              name: 'data-source',
              label: `${dataSourceName} (${dataSourceGroups.length})`,
              lazy: true,
            }) || {}
          "
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
          v-bind="
            tabPaneComponent?.props({
              name: 'code-block',
              label: `${codeBlockName} (${codeBlockGroups.length})`,
              lazy: true,
            }) || {}
          "
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
          v-bind="tabPaneComponent?.props({ name: tab.name, label: resolveTabLabel(tab), lazy: true }) || {}"
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
import { computed, inject, markRaw, ref, watch } from 'vue';
import { Clock, Close } from '@element-plus/icons-vue';

import { getDesignConfig, TMagicButton, tMagicMessage, TMagicPopover, TMagicTabs, TMagicTooltip } from '@tmagic/design';
import type { FormState } from '@tmagic/form';

import MIcon from '@editor/components/Icon.vue';
import { useServices } from '@editor/hooks/use-services';
import type {
  BaseStepValue,
  CodeBlockStepValue,
  DataSourceStepValue,
  HistoryBucketConfig,
  HistoryListExtraTab,
} from '@editor/type';

import BucketTab from './BucketTab.vue';
import { confirmHistoryAction, describeStep, isSingleDiffStepRevertable } from './composables';
import PageTab from './PageTab.vue';
import { useHistoryList } from './useHistoryList';
import { useHistoryRevert } from './useHistoryRevert';

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

const services = useServices();
const { editorService, dataSourceService, codeBlockService, historyService, propsService, stageOverlayService } =
  services;

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
const getPropsPanelFormState = inject<(() => FormState | undefined) | undefined>('getPropsPanelFormState', undefined);

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
const pageMarker = computed(() => historyService.getMarker('page', editorService.get('page')?.id));

/**
 * 各历史类型的展示名称（页面 / 数据源 / 代码块），由 historyService.state.stepNames 配置，
 * 业务方可通过 historyService.setStepName / registerStepType 覆盖。基于 reactive state 派生，配置变更后自动刷新。
 */
const pageName = computed(() => historyService.getStepName('page'));
const dataSourceName = computed(() => historyService.getStepName('dataSource'));
const codeBlockName = computed(() => historyService.getStepName('codeBlock'));

/** 代码块 step 仅 update（前后 content 都存在）时可查看差异。 */
const isStepDiffable = (step: BaseStepValue) => Boolean(step.diff?.[0]?.oldSchema && step.diff?.[0]?.newSchema);

/**
 * 数据源 / 代码块两类 bucket 历史的整体渲染配置：把 title / prefix 与各自的描述、
 * 可差异、可回滚判定收敛为单一对象整体注入 BucketTab，组件内部按需读取。
 * title / 描述回退名取自可配置的展示名称，故用 computed 使其随 stepNames 变更刷新。
 */
// 数据源/代码块不做相邻合并，每组恒为单步，省略 describeGroup，由 toRowGroup 回退到 describeStep。
const dataSourceConfig = computed<HistoryBucketConfig<DataSourceStepValue>>(() => ({
  title: dataSourceName.value,
  prefix: 'ds',
  describeStep: (step: DataSourceStepValue): string =>
    describeStep(step, (schema) => schema?.title, dataSourceName.value),
  isStepDiffable,
  isStepRevertable: isSingleDiffStepRevertable,
}));

const codeBlockConfig = computed<HistoryBucketConfig<CodeBlockStepValue>>(() => ({
  title: codeBlockName.value,
  prefix: 'cb',
  describeStep: (step: CodeBlockStepValue): string =>
    describeStep(step, (content) => content?.name, codeBlockName.value),
  isStepDiffable,
  isStepRevertable: isSingleDiffStepRevertable,
}));

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
  const step = historyService.getStepList('page', editorService.get('page')?.id)[index]?.step;
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

/**
 * 「单步回滚」与「查看差异」的完整逻辑收敛到 useHistoryRevert，面板与业务方共用：
 * 二者均由 useHistoryRevert 内部按需动态挂载 HistoryDiffDialog，
 * 业务方亦可直接 import useHistoryRevert(options, services) 调用，无需自行挂载任何弹窗。
 */
const { onPageRevert, onDataSourceRevert, onCodeBlockRevert, onPageDiff, onDataSourceDiff, onCodeBlockDiff } =
  useHistoryRevert({ extendState: extendFormState, getPropsPanelFormState }, services);

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
    await confirmHistoryAction(
      '确定清空当前页面的历史记录吗？清空后将无法撤销/重做之前的操作，本地保存的记录也会一并删除。',
    )
  ) {
    historyService.clear('page', editorService.get('page')?.id);
    await syncIndexedDB();
  }
};

const onDataSourceClear = async () => {
  if (
    await confirmHistoryAction(
      '确定清空数据源的历史记录吗？清空后将无法撤销/重做之前的操作，本地保存的记录也会一并删除。',
    )
  ) {
    historyService.clear('dataSource');
    await syncIndexedDB();
  }
};

const onCodeBlockClear = async () => {
  if (
    await confirmHistoryAction(
      '确定清空代码块的历史记录吗？清空后将无法撤销/重做之前的操作，本地保存的记录也会一并删除。',
    )
  ) {
    historyService.clear('codeBlock');
    await syncIndexedDB();
  }
};
</script>
