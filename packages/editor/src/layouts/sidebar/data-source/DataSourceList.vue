<template>
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
            <TMagicTooltip effect="dark" :content="editable ? '编辑' : '查看'" placement="bottom">
              <Icon :icon="editable ? Edit : View" class="edit-icon" @click.stop="editHandler(`${data.id}`)"></Icon>
            </TMagicTooltip>
            <TMagicTooltip v-if="editable" effect="dark" content="删除" placement="bottom">
              <Icon :icon="Close" class="edit-icon" @click.stop="removeHandler(`${data.id}`)"></Icon>
            </TMagicTooltip>
            <slot name="data-source-panel-tool" :id="data.id" :data="data.codeBlockContent"></slot>
          </div>
        </div>
      </div>
    </template>
  </TMagicTree>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import { Aim, Close, Coin, Edit, View } from '@element-plus/icons-vue';

import { tMagicMessageBox, TMagicTooltip, TMagicTree } from '@tmagic/design';
import { Id } from '@tmagic/schema';

import Icon from '@editor/components/Icon.vue';
import type { Services } from '@editor/type';

defineOptions({
  name: 'MEditorDataSourceList',
});

const emit = defineEmits<{
  edit: [id: string];
  remove: [id: string];
}>();

const { depService, editorService, dataSourceService } = inject<Services>('services') || {};

const editable = computed(() => dataSourceService?.get('editable') ?? true);

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

const clickHandler = (data: any, node: any) => {
  if (data.type === 'node') {
    selectComp(data.id);
  } else if (data.type === 'key') {
    selectComp(node.parent.data.id);
  }
};

const tree = ref<InstanceType<typeof TMagicTree>>();

defineExpose({
  filter(val: string) {
    debugger;
    tree.value?.filter(val);
  },
});
</script>
