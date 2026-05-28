<template>
  <TMagicPopover popper-class="m-editor-history-list-popover" placement="bottom" trigger="click" :width="660">
    <div class="m-editor-history-list">
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
          />
        </component>
      </TMagicTabs>
    </div>

    <template #reference>
      <TMagicTooltip effect="dark" placement="bottom" content="历史记录">
        <TMagicButton size="small" link>
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
 * 各 tab 的内容拆分为独立的 SFC（PageTab / DataSourceTab / CodeBlockTab），
 * 共享的描述生成与折叠状态在 composables.ts 中维护。
 */
import { markRaw, ref } from 'vue';
import { Clock } from '@element-plus/icons-vue';

import { getDesignConfig, TMagicButton, TMagicPopover, TMagicTabs, TMagicTooltip } from '@tmagic/design';

import MIcon from '@editor/components/Icon.vue';
import { useServices } from '@editor/hooks/use-services';

import CodeBlockTab from './CodeBlockTab.vue';
import { useHistoryList } from './composables';
import DataSourceTab from './DataSourceTab.vue';
import PageTab from './PageTab.vue';

defineOptions({
  name: 'MEditorHistoryListPanel',
});

const ClockIcon = markRaw(Clock);
const activeTab = ref<'page' | 'data-source' | 'code-block'>('page');

const tabPaneComponent = getDesignConfig('components')?.tabPane;

const { editorService, dataSourceService, codeBlockService } = useServices();

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
</script>
