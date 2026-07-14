<template>
  <span class="m-editor-layer-node-content" :class="{ 'is-invalid': hasError }">
    <span class="m-editor-layer-node-label">{{ label }}</span>
    <TMagicTooltip v-if="hasError" placement="top">
      <template #content>
        <span v-html="errorMessage"></span>
      </template>
      <MIcon class="m-editor-layer-node-error-icon" :icon="WarningFilled"></MIcon>
    </TMagicTooltip>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { WarningFilled } from '@element-plus/icons-vue';

import { TMagicTooltip } from '@tmagic/design';

import MIcon from '@editor/components/Icon.vue';
import { useServices } from '@editor/hooks/use-services';
import type { TreeNodeData } from '@editor/type';

defineOptions({
  name: 'MEditorLayerNodeContent',
});

const props = defineProps<{
  data: TreeNodeData;
}>();

const { editorService } = useServices();

const label = computed(() => `${props.data.name} (${props.data.id})`);

/** 读取集中存储的校验错误状态，建立响应式依赖 */
const invalidInfo = computed(() => editorService.get('invalidNodeIds').get(props.data.id));

const hasError = computed(() => Boolean(invalidInfo.value?.props || invalidInfo.value?.style));

/** 合并属性表单与样式表单的错误文案（本身可能已是含 <br> 的 HTML） */
const errorMessage = computed(() => [invalidInfo.value?.props, invalidInfo.value?.style].filter(Boolean).join('<br>'));
</script>
