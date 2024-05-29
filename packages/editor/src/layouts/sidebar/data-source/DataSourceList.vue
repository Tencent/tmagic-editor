<template>
  <Tree :data="list" :node-status-map="nodeStatusMap" @node-click="clickHandler">
    <template #tree-node-label="{ data }">
      <div
        :class="{
          ds: data.type === 'ds',
          hook: data.type === 'key',
          disabled: data.type === 'key' || data.type === 'ds',
        }"
      >
        {{ data.name }} {{ data.key ? `(${data.key})` : '' }}
      </div>
    </template>
    <template #tree-node-tool="{ data }">
      <TMagicTooltip v-if="data.type === 'ds'" effect="dark" :content="editable ? '编辑' : '查看'" placement="bottom">
        <Icon :icon="editable ? Edit : View" class="edit-icon" @click.stop="editHandler(`${data.key}`)"></Icon>
      </TMagicTooltip>
      <TMagicTooltip v-if="data.type === 'ds' && editable" effect="dark" content="删除" placement="bottom">
        <Icon :icon="Close" class="edit-icon" @click.stop="removeHandler(`${data.key}`)"></Icon>
      </TMagicTooltip>
      <slot name="data-source-panel-tool" :data="data"></slot>
    </template>
  </Tree>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { Close, Edit, View } from '@element-plus/icons-vue';

import { DepTargetType } from '@tmagic/dep';
import { tMagicMessageBox, TMagicTooltip } from '@tmagic/design';
import { DepData, Id, MNode } from '@tmagic/schema';

import Icon from '@editor/components/Icon.vue';
import Tree from '@editor/components/Tree.vue';
import { useFilter } from '@editor/hooks/use-filter';
import { useNodeStatus } from '@editor/hooks/use-node-status';
import type { DataSourceListSlots, Services } from '@editor/type';

defineSlots<DataSourceListSlots>();

defineOptions({
  name: 'MEditorDataSourceList',
});

const emit = defineEmits<{
  edit: [id: string];
  remove: [id: string];
}>();

const { depService, editorService, dataSourceService } = inject<Services>('services') || {};

const editable = computed(() => dataSourceService?.get('editable') ?? true);

const dataSources = computed(() => dataSourceService?.get('dataSources') || []);

const dsDep = computed(() => depService?.getTargets(DepTargetType.DATA_SOURCE) || {});
const dsMethodDep = computed(() => depService?.getTargets(DepTargetType.DATA_SOURCE_METHOD) || {});
const dsCondDep = computed(() => depService?.getTargets(DepTargetType.DATA_SOURCE_COND) || {});

const getKeyTreeConfig = (dep: DepData[string], type?: string, parentKey?: Id) =>
  dep.keys.map((key) => ({
    name: key,
    id: `${parentKey}_${key}`,
    type: 'key',
    isMethod: type === 'method',
    isCond: type === 'cond',
  }));

const getNodeTreeConfig = (id: string, dep: DepData[string], type?: string, parentKey?: Id) => ({
  name: dep.name,
  type: 'node',
  id: `${parentKey}_${id}`,
  key: id,
  items: getKeyTreeConfig(dep, type, `${parentKey}_${id}`),
});

/**
 * 生成tree中依赖节点的数据
 * @param items 节点
 * @param deps 依赖
 * @param type 依赖类型
 */
const mergeChildren = (dsId: Id, pageItems: any[], deps: DepData, type?: string) => {
  Object.entries(deps).forEach(([id, dep]) => {
    // 按页面分类显示
    const page = pageItems.find((page) => page.key === dep.data?.pageId);

    // 已经生成过的节点
    const nodeItem = page?.items.find((item: any) => item.key === id);
    // 节点存在，则追加依赖的key
    if (nodeItem) {
      nodeItem.items = nodeItem.items.concat(getKeyTreeConfig(dep, type, nodeItem.key));
    } else {
      // 节点不存在，则生成
      page?.items.push(getNodeTreeConfig(id, dep, type, page.id));
    }
  });
};

const list = computed(() =>
  dataSources.value.map((ds) => {
    const dsDeps = dsDep.value[ds.id]?.deps || {};
    const dsMethodDeps = dsMethodDep.value[ds.id]?.deps || {};
    const dsCondDeps = dsCondDep.value[ds.id]?.deps || {};

    const items =
      editorService?.get('root')?.items.map((page) => ({
        name: page.devconfig?.tabName || page.name,
        type: 'node',
        id: `${ds.id}_${page.id}`,
        key: page.id,
        items: [],
      })) || [];

    // 数据源依赖分为三种类型：key/node、method、cond，是分开存储，这里将其合并展示
    mergeChildren(ds.id, items, dsDeps);
    mergeChildren(ds.id, items, dsMethodDeps, 'method');
    mergeChildren(ds.id, items, dsCondDeps, 'cond');

    return {
      id: ds.id,
      key: ds.id,
      name: ds.title,
      type: 'ds',
      // 只有一个页面不显示页面分类
      items: items.length > 1 ? items.filter((page) => page.items.length) : items[0]?.items || [],
    };
  }),
);

const filterNode = (value: string, data: MNode): boolean => {
  if (!value) {
    return true;
  }
  return `${data.name}${data.id}`.toLocaleLowerCase().includes(value.toLocaleLowerCase());
};

const { nodeStatusMap } = useNodeStatus(list);
const { filterTextChangeHandler } = useFilter(list, nodeStatusMap, filterNode);

const editHandler = (id: string) => {
  emit('edit', id);
};

const removeHandler = async (id: string) => {
  await tMagicMessageBox.confirm('确定删除?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });

  emit('remove', id);
};

// 选中组件
const selectComp = (compId: Id) => {
  const stage = editorService?.get('stage');
  editorService?.select(compId);
  stage?.select(compId);
};

const clickHandler = (event: MouseEvent, data: any) => {
  if (data.type === 'node') {
    selectComp(data.key);
  }
};

defineExpose({
  filter: filterTextChangeHandler,
});
</script>
