<template>
  <TMagicOptionGroup v-for="(group, index) in options" :key="index" :label="group.label" :disabled="group.disabled">
    <TMagicOption
      v-for="(item, index) in group.options"
      :key="index"
      :label="item.label"
      :value="item.value"
      :disabled="item.disabled"
    >
    </TMagicOption>
  </TMagicOptionGroup>
</template>

<script lang="ts" setup>
import { TMagicOption, TMagicOptionGroup } from '@tmagic/design';

import { SelectGroupOption } from '../schema';

defineProps<{
  options: SelectGroupOption[];
}>();
</script>
