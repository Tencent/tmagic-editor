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
          />
        </component>

        <component
          :is="tabPaneComponent?.component || 'el-tab-pane'"
          v-bind="tabPaneComponent?.props({ name: 'data-source', label: `数据源 (${dataSourceGroups.length})` }) || {}"
        >
          <DataSourceTab
            :buckets="dataSourceGroupsByTarget"
            :expanded="expanded"
            @toggle="toggleGroup"
            @goto="onDataSourceGoto"
            @goto-initial="onDataSourceGotoInitial"
            @diff-step="onDataSourceDiff"
            @revert-step="onDataSourceRevert"
          />
        </component>

        <component
          :is="tabPaneComponent?.component || 'el-tab-pane'"
          v-bind="tabPaneComponent?.props({ name: 'code-block', label: `代码块 (${codeBlockGroups.length})` }) || {}"
        >
          <CodeBlockTab
            :buckets="codeBlockGroupsByTarget"
            :expanded="expanded"
            @toggle="toggleGroup"
            @goto="onCodeBlockGoto"
            @goto-initial="onCodeBlockGotoInitial"
            @diff-step="onCodeBlockDiff"
            @revert-step="onCodeBlockRevert"
          />
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
 * 各 tab 的内容拆分为独立的 SFC（PageTab / DataSourceTab / CodeBlockTab），
 * 共享的描述生成与折叠状态在 composables.ts 中维护。
 */
import { inject, markRaw, ref, useTemplateRef } from 'vue';
import { Clock, Close } from '@element-plus/icons-vue';

import { getDesignConfig, TMagicButton, TMagicPopover, TMagicTabs, TMagicTooltip } from '@tmagic/design';
import type { FormState } from '@tmagic/form';

import MIcon from '@editor/components/Icon.vue';
import { useServices } from '@editor/hooks/use-services';

import CodeBlockTab from './CodeBlockTab.vue';
import { useHistoryList } from './composables';
import DataSourceTab from './DataSourceTab.vue';
import HistoryDiffDialog from './HistoryDiffDialog.vue';
import PageTab from './PageTab.vue';

defineOptions({
  name: 'MEditorHistoryListPanel',
});

const ClockIcon = markRaw(Clock);
const CloseIcon = markRaw(Close);
const activeTab = ref<'page' | 'data-source' | 'code-block'>('page');

/** 面板显隐受控：reference 图标点击切换，右上角关闭按钮置为 false。 */
const visible = ref(false);

const tabPaneComponent = getDesignConfig('components')?.tabPane;

const { editorService, dataSourceService, codeBlockService, historyService } = useServices();

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

/**
 * 「回滚」入口：把目标历史步骤的修改作为一次新操作反向应用（类 git revert），
 * 不破坏原有栈结构。各 service 内部完成反向 + 入栈，并自带描述用于面板展示。
 */
const onPageRevert = (index: number) => {
  editorService.revertPageStep(index);
};

const onDataSourceRevert = (id: string | number, index: number) => {
  dataSourceService.revert(id, index);
};

const onCodeBlockRevert = (id: string | number, index: number) => {
  codeBlockService.revert(id, index);
};

const diffDialogRef = useTemplateRef<InstanceType<typeof HistoryDiffDialog>>('diffDialog');

/**
 * 页面 step 差异：仅 update 单节点修改可对比，传入旧/新节点。
 * 节点类型 `type` 优先取 newNode.type，再回退 oldNode.type。
 * `currentValue` 取自 editorService 中该节点当前实际值，用于支持「与当前对比」。
 */
const onPageDiff = (index: number) => {
  const groups = historyService.getPageHistoryGroups();
  for (const group of groups) {
    const entry = group.steps.find((s) => s.index === index);
    if (!entry) continue;
    const item = entry.step.updatedItems?.[0];
    if (!item?.oldNode || !item?.newNode) return;
    const type = (item.newNode.type as string) || (item.oldNode.type as string) || '';
    const nodeId = item.newNode.id ?? item.oldNode.id;
    const currentNode = nodeId !== undefined ? editorService.getNodeById(nodeId) : null;
    diffDialogRef.value?.open({
      category: 'node',
      type,
      lastValue: item.oldNode as Record<string, any>,
      value: item.newNode as Record<string, any>,
      currentValue: (currentNode as Record<string, any>) || null,
      targetLabel: (item.newNode.name as string) || (item.oldNode.name as string) || type,
      id: nodeId,
    });
    return;
  }
};

const onDataSourceDiff = (id: string | number, index: number) => {
  const groups = historyService.getDataSourceHistoryGroups();
  for (const group of groups) {
    if (group.id !== id) continue;
    const entry = group.steps.find((s) => s.index === index);
    if (!entry) continue;
    const { oldSchema, newSchema } = entry.step;
    if (!oldSchema || !newSchema) return;
    const currentSchema = dataSourceService.getDataSourceById(`${id}`);
    diffDialogRef.value?.open({
      category: 'data-source',
      type: newSchema.type || oldSchema.type || 'base',
      lastValue: oldSchema as Record<string, any>,
      value: newSchema as Record<string, any>,
      currentValue: (currentSchema as Record<string, any>) || null,
      targetLabel: newSchema.title || oldSchema.title || `${id}`,
      id,
    });
    return;
  }
};

const onCodeBlockDiff = (id: string | number, index: number) => {
  const groups = historyService.getCodeBlockHistoryGroups();
  for (const group of groups) {
    if (group.id !== id) continue;
    const entry = group.steps.find((s) => s.index === index);
    if (!entry) continue;
    const { oldContent, newContent } = entry.step;
    if (!oldContent || !newContent) return;
    const currentContent = codeBlockService.getCodeContentById(id);
    diffDialogRef.value?.open({
      category: 'code-block',
      lastValue: oldContent as Record<string, any>,
      value: newContent as Record<string, any>,
      currentValue: (currentContent as Record<string, any>) || null,
      targetLabel: newContent.name || oldContent.name || `${id}`,
      id,
    });
    return;
  }
};
</script>
