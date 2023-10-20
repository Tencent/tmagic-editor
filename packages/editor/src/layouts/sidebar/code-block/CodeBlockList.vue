<template>
  <TMagicTree
    ref="tree"
    class="magic-editor-layer-tree"
    node-key="id"
    empty-text="暂无代码块"
    :default-expanded-keys="expandedKeys"
    :expand-on-click-node="false"
    :data="codeList"
    :props="{
      children: 'children',
      label: 'name',
      value: 'id',
    }"
    :highlight-current="true"
    :filter-node-method="filterNode"
    @node-click="clickHandler"
  >
    <template #default="{ data }">
      <div :id="data.id" class="list-container">
        <div class="list-item">
          <CodeIcon v-if="data.type === 'code'" class="codeIcon"></CodeIcon>
          <AppManageIcon v-if="data.type === 'node'" class="compIcon"></AppManageIcon>
          <span class="name" :class="{ code: data.type === 'code', hook: data.type === 'key' }"
            >{{ data.name }} ({{ data.id }})</span
          >
          <!-- 右侧工具栏 -->
          <div class="right-tool" v-if="data.type === 'code'">
            <TMagicTooltip effect="dark" :content="editable ? '编辑' : '查看'" placement="bottom">
              <Icon :icon="editable ? Edit : View" class="edit-icon" @click.stop="editCode(data.id)"></Icon>
            </TMagicTooltip>
            <TMagicTooltip v-if="editable" effect="dark" content="删除" placement="bottom">
              <Icon :icon="Close" class="edit-icon" @click.stop="deleteCode(`${data.id}`)"></Icon>
            </TMagicTooltip>
            <slot name="code-block-panel-tool" :id="data.id" :data="data.codeBlockContent"></slot>
          </div>
        </div>
      </div>
    </template>
  </TMagicTree>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import { Close, Edit, View } from '@element-plus/icons-vue';

import { tMagicMessage, tMagicMessageBox, TMagicTooltip, TMagicTree } from '@tmagic/design';
import type { Id } from '@tmagic/schema';

import Icon from '@editor/components/Icon.vue';
import AppManageIcon from '@editor/icons/AppManageIcon.vue';
import CodeIcon from '@editor/icons/CodeIcon.vue';
import { CodeBlockListSlots, CodeDeleteErrorType, CodeDslItem, DepTargetType, Services } from '@editor/type';

defineSlots<CodeBlockListSlots>();

defineOptions({
  name: 'MEditorCodeBlockList',
});

const props = defineProps<{
  customError?: (id: Id, errorType: CodeDeleteErrorType) => any;
}>();

const emit = defineEmits<{
  edit: [id: string];
  remove: [id: string];
}>();

const { codeBlockService, depService, editorService } = inject<Services>('services') || {};

// 代码块列表
const codeList = computed(() =>
  Object.values(depService?.getTargets(DepTargetType.CODE_BLOCK) || {}).map((target) => {
    // 组件节点
    const compNodes = Object.entries(target.deps).map(([id, dep]) => ({
      name: dep.name,
      type: 'node',
      id,
      children: dep.keys.map((key) => ({ name: key, id: key, type: 'key' })),
    }));
    return {
      id: target.id,
      name: target.name,
      type: 'code',
      codeBlockContent: codeBlockService?.getCodeContentById(target.id),
      children: compNodes,
    };
  }),
);
// 默认展开组件层级的节点
const expandedKeys = computed(() => codeList.value.map((item) => item.id));
const editable = computed(() => codeBlockService?.getEditStatus());

const filterNode = (value: string, data: CodeDslItem): boolean => {
  if (!value) {
    return true;
  }
  return `${data.name}${data.id}`.toLocaleLowerCase().indexOf(value.toLocaleLowerCase()) !== -1;
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

// 编辑代码块
const editCode = (id: string) => {
  emit('edit', id);
};

const deleteCode = async (id: string) => {
  const currentCode = codeList.value.find((codeItem) => codeItem.id === id);
  const existBinds = Boolean(currentCode?.children.length);
  const undeleteableList = codeBlockService?.getUndeletableList() || [];
  if (!existBinds && !undeleteableList.includes(id)) {
    await tMagicMessageBox.confirm('确定删除该代码块吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    // 无绑定关系，且不在不可删除列表中
    emit('remove', id);
  } else {
    if (typeof props.customError === 'function') {
      props.customError(id, existBinds ? CodeDeleteErrorType.BIND : CodeDeleteErrorType.UNDELETEABLE);
    } else {
      tMagicMessage.error('代码块删除失败');
    }
  }
};

const tree = ref<InstanceType<typeof TMagicTree>>();

defineExpose({
  filter(val: string) {
    tree.value?.filter(val);
  },
});
</script>
