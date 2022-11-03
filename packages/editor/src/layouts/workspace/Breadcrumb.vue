<template>
  <div v-if="nodes.length === 1" class="m-editor-breadcrumb">
    <template v-for="(item, index) in path" :key="item.id">
      <TMagicButton text :disabled="item.id === node?.id" @click="select(item)">{{ item.name }}</TMagicButton
      ><span v-if="index < path.length - 1">/</span>
    </template>
  </div>
</template>

<script setup lang="ts" name="MEditorBreadcrumb">
import { computed, inject } from 'vue';

import { TMagicButton } from '@tmagic/design';
import type { MApp, MNode } from '@tmagic/schema';
import type StageCore from '@tmagic/stage';
import { getNodePath } from '@tmagic/utils';

import type { Services } from '../../type';

const services = inject<Services>('services');
const editorService = services?.editorService;

const node = computed(() => editorService?.get<MNode>('node'));
const nodes = computed(() => editorService?.get<MNode[]>('nodes') || []);
const root = computed(() => editorService?.get<MApp>('root'));
const path = computed(() => getNodePath(node.value?.id || '', root.value?.items || []));

const select = async (node: MNode) => {
  await editorService?.select(node);
  editorService?.get<StageCore>('stage')?.select(node.id);
};
</script>
