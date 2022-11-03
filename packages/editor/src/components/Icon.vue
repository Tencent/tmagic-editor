<template>
  <TMagicIcon v-if="!icon" class="magic-editor-icon"><Edit></Edit></TMagicIcon>
  <TMagicIcon v-else-if="typeof icon === 'string' && icon.startsWith('http')" class="magic-editor-icon"
    ><img :src="icon"
  /></TMagicIcon>
  <i v-else-if="typeof icon === 'string'" class="magic-editor-icon" :class="icon"></i>
  <TMagicIcon v-else class="magic-editor-icon"><component :is="toRaw(icon)"></component></TMagicIcon>
</template>

<script lang="ts" setup name="MEditorIcon">
import { toRaw } from 'vue';
import { Edit } from '@element-plus/icons-vue';

import { TMagicIcon } from '@tmagic/design';

defineProps<{
  icon?: any;
}>();
</script>
