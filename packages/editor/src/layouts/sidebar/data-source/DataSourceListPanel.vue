<template>
  <TMagicScrollbar class="data-source-list-panel m-editor-dep-list-panel">
    <div class="search-wrapper">
      <SearchInput @search="filterTextChangeHandler"></SearchInput>
      <TMagicButton type="primary" size="small" @click="addHandler">新增</TMagicButton>
    </div>

    <!-- 数据源列表 -->
    <TMagicTree
      ref="tree"
      class="magic-editor-layer-tree"
      node-key="id"
      empty-text="暂无代码块"
      default-expand-all
      :expand-on-click-node="false"
      :data="list"
      :highlight-current="true"
      @node-click="clickHandler"
    >
      <template #default="{ data }">
        <div :id="data.id" class="list-container">
          <div class="list-item">
            <Icon v-if="data.type === 'code'" class="codeIcon" :icon="Coin"></Icon>
            <Icon v-if="data.type === 'node'" class="compIcon" :icon="Aim"></Icon>
            <span class="name" :class="{ code: data.type === 'code', hook: data.type === 'key' }"
              >{{ data.name }}（{{ data.id }}）</span
            >
            <!-- 右侧工具栏 -->
            <div class="right-tool" v-if="data.type === 'code'">
              <TMagicTooltip effect="dark" content="编辑" placement="bottom">
                <Icon class="edit-icon" :icon="Edit" @click.stop="editHandler(`${data.id}`)"></Icon>
              </TMagicTooltip>
              <TMagicTooltip effect="dark" content="删除" placement="bottom">
                <Icon :icon="Close" class="edit-icon" @click.stop="removeHandler(`${data.id}`)"></Icon>
              </TMagicTooltip>
              <slot name="data-source-panel-tool" :id="data.id" :data="data.codeBlockContent"></slot>
            </div>
          </div>
        </div>
      </template>
    </TMagicTree>

    <DataSourceConfigPanel
      ref="editDialog"
      :values="dataSourceValues"
      :title="typeof dataSourceValues.id !== 'undefined' ? `编辑${dataSourceValues.title}` : '新增'"
      @submit="submitDataSourceHandler"
    ></DataSourceConfigPanel>
  </TMagicScrollbar>
</template>

<script setup lang="ts" name="MEditorDataSourceListPanel">
import { computed, inject, ref } from 'vue';
import { Aim, Close, Coin, Edit } from '@element-plus/icons-vue';

import { TMagicButton, tMagicMessageBox, TMagicScrollbar, TMagicTooltip, TMagicTree } from '@tmagic/design';
import { DataSourceSchema, Id } from '@tmagic/schema';

import Icon from '@editor/components/Icon.vue';
import SearchInput from '@editor/components/SearchInput.vue';
import type { Services } from '@editor/type';

import DataSourceConfigPanel from './DataSourceConfigPanel.vue';

defineOptions({
  name: 'MEditorDataSourceListPanel',
});

const services = inject<Partial<Services>>('services', {});
const { dataSourceService, depService, editorService } = inject<Services>('services') || {};

const list = computed(() =>
  Object.values(depService?.targets['data-source'] || {}).map((target) => ({
    id: target.id,
    name: target.name,
    type: 'code',
    children: Object.entries(target.deps).map(([id, dep]) => ({
      name: dep.name,
      type: 'node',
      id,
      children: dep.keys.map((key) => ({ name: key, id: key, type: 'key' })),
    })),
  })),
);

const editDialog = ref<InstanceType<typeof DataSourceConfigPanel>>();

const dataSourceValues = ref<Record<string, any>>({});

const addHandler = () => {
  if (!editDialog.value) return;

  dataSourceValues.value = {};

  editDialog.value.show();
};

const editHandler = (id: string) => {
  if (!editDialog.value || !services) return;

  dataSourceValues.value = {
    ...dataSourceService?.getDataSourceById(id),
  };

  editDialog.value.show();
};

const removeHandler = async (id: string) => {
  await tMagicMessageBox.confirm('确定删除?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });

  dataSourceService?.remove(id);
};

const submitDataSourceHandler = (value: DataSourceSchema) => {
  if (!services) return;

  if (value.id) {
    dataSourceService?.update(value);
  } else {
    dataSourceService?.add(value);
  }

  editDialog.value?.hide();
};

const tree = ref<InstanceType<typeof TMagicTree>>();

const filterTextChangeHandler = (val: string) => {
  tree.value?.filter(val);
};

// 选中组件
const selectComp = (compId: Id) => {
  const stage = editorService?.get('stage');
  editorService?.select(compId);
  stage?.select(compId);
};

const clickHandler = (data: any, node: any) => {
  if (data.type === 'node') {
    selectComp(data.id);
  } else if (data.type === 'key') {
    selectComp(node.parent.data.id);
  }
};
</script>
