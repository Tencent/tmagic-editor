<template>
  <TMagicOptionGroup v-for="(group, index) in options" :key="index" :label="group.label" :disabled="group.disabled">
    <component
      v-for="(item, index) in group.options"
      :is="uiComponent"
      :key="index"
      :label="item.label || item.text"
      :value="item.value"
      :disabled="item.disabled"
    >
    </component>
  </TMagicOptionGroup>
</template>

<script lang="ts" setup>
import { getConfig, TMagicOptionGroup } from '@tmagic/design';

import { SelectGroupOption } from '../schema';

defineOptions({
  name: 'MFormSelectOptionGroups',
});

defineProps<{
  options: SelectGroupOption[];
}>();

const uiComponent = getConfig('components')?.option.component || 'el-option';
</script>
