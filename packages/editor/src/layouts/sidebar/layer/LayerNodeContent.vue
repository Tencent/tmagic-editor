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

import { stripValidateSuggestion, TMagicTooltip } from '@tmagic/design';

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

/**
 * 去掉单条校验文案中的「修改建议」部分。
 *
 * 错误文案可能是多条错误以 `<br>` 拼接的 HTML，每条本身形如 `主文案\n\n建议`。
 * 组件树 tooltip 仅展示错误描述，不展示修改建议（建议仅在错误汇总面板展示），
 * 故先按 `<br>` 拆分，每段用 `stripValidateSuggestion` 截断建议后再拼回。
 */
const stripSuggestion = (text?: string): string =>
  String(text ?? '')
    .split(/<br\s*\/?>/i)
    .map((segment) => stripValidateSuggestion(segment))
    .join('<br>');

/** 合并属性表单与样式表单的错误文案（去掉建议，本身可能仍是含 <br> 的 HTML） */
const errorMessage = computed(() =>
  [stripSuggestion(invalidInfo.value?.props), stripSuggestion(invalidInfo.value?.style)].filter(Boolean).join('<br>'),
);
</script>
