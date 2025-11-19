<template>
  <span style="display: inline-flex; align-items: center">
    <span v-html="type === 'checkbox' && !useLabel ? '' : text" :title="labelTitle"></span>
    <TMagicTooltip v-if="tip && (type !== 'checkbox' || useLabel)" placement="top">
      <TMagicIcon style="margin-left: 5px; display: flex"><warning-filled /></TMagicIcon>
      <template #content>
        <div v-html="tip"></div>
      </template>
    </TMagicTooltip>
  </span>
</template>

<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue';

import { TMagicIcon, TMagicTooltip } from '@tmagic/design';

defineProps<{
  tip?: string;
  type?: string;
  useLabel?: boolean;
  text?: string;
  labelTitle?: string;
}>();
</script>
