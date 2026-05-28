<template>
  <TMagicPopover popper-class="m-editor-history-list-popover" placement="bottom" trigger="click" :width="660">
    <div class="m-editor-history-list">
      <TMagicTabs v-model="activeTab" class="m-editor-history-list-tabs">
        <component
          :is="tabPaneComponent?.component || 'el-tab-pane'"
          v-bind="tabPaneComponent?.props({ name: 'page', label: `页面 (${pageGroups.length})` }) || {}"
        >
          <PageTab :list="pageGroupsDisplay" :expanded="expanded" @toggle="toggleGroup" />
        </component>

        <component
          :is="tabPaneComponent?.component || 'el-tab-pane'"
          v-bind="tabPaneComponent?.props({ name: 'data-source', label: `数据源 (${dataSourceGroups.length})` }) || {}"
        >
          <DataSourceTab :buckets="dataSourceGroupsByTarget" :expanded="expanded" @toggle="toggleGroup" />
        </component>

        <component
          :is="tabPaneComponent?.component || 'el-tab-pane'"
          v-bind="tabPaneComponent?.props({ name: 'code-block', label: `代码块 (${codeBlockGroups.length})` }) || {}"
        >
          <CodeBlockTab :buckets="codeBlockGroupsByTarget" :expanded="expanded" @toggle="toggleGroup" />
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
 * 数据通过 historyService 暴露的聚合 API 读取，UI 仅用于只读展示。
 *
 * 各 tab 的内容拆分为独立的 SFC（PageTab / DataSourceTab / CodeBlockTab），
 * 共享的描述生成与折叠状态在 composables.ts 中维护。
 */
import { markRaw, ref } from 'vue';
import { Clock } from '@element-plus/icons-vue';

import { getDesignConfig, TMagicButton, TMagicPopover, TMagicTabs, TMagicTooltip } from '@tmagic/design';

import MIcon from '@editor/components/Icon.vue';

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
</script>
