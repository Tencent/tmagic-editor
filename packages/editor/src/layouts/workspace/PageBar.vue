<template>
  <PageBarScrollContainer>
    <div
      v-for="item in (root && root.items) || []"
      class="m-editor-page-bar-item"
      :key="item.key"
      :class="{ active: page?.id === item.id }"
      @click="switchPage(item)"
    >
      <div class="m-editor-page-bar-title">
        <slot name="page-bar-title" :page="item">
          <el-tooltip effect="dark" placement="top-start" :content="item.name">
            <span>{{ item.name }}</span>
          </el-tooltip>
        </slot>
      </div>

      <el-popover popper-class="page-bar-popover" placement="top" :width="160" trigger="hover">
        <div>
          <slot name="page-bar-popover" :page="item">
            <tool-button
              :data="{
                type: 'button',
                text: '复制',
                icon: DocumentCopy,
                handler: () => copy(item),
              }"
            ></tool-button>
            <tool-button
              :data="{
                type: 'button',
                text: '删除',
                icon: Delete,
                handler: () => remove(item),
              }"
            ></tool-button>
          </slot>
        </div>
        <template #reference>
          <el-icon class="m-editor-page-bar-menu-icon">
            <caret-bottom></caret-bottom>
          </el-icon>
        </template>
      </el-popover>
    </div>
  </PageBarScrollContainer>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { CaretBottom, Delete, DocumentCopy } from '@element-plus/icons-vue';

import type { MApp, MPage } from '@tmagic/schema';

import ToolButton from '../../components/ToolButton.vue';
import type { Services } from '../../type';

import PageBarScrollContainer from './PageBarScrollContainer.vue';

const services = inject<Services>('services');
const editorService = services?.editorService;

const root = computed(() => editorService?.get<MApp>('root'));

const page = computed(() => editorService?.get('page'));

const switchPage = (page: MPage) => {
  editorService?.select(page);
};

const copy = (node: MPage) => {
  node && editorService?.copy(node);
  editorService?.paste({
    left: 0,
    top: 0,
  });
};

const remove = (node: MPage) => {
  editorService?.remove(node);
};
</script>
