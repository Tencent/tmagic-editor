<template>
  <el-scrollbar>
    <el-collapse class="ui-component-panel" :model-value="collapseValue">
      <el-input
        prefix-icon="el-icon-search"
        placeholder="输入关键字进行过滤"
        class="search-input"
        size="small"
        clearable
        v-model="searchText"
      />
      <template v-for="(group, index) in list">
        <el-collapse-item v-if="group.items && group.items.length" :key="index" :name="index">
          <template #title><i class="el-icon-s-grid"></i>{{ group.title }}</template>
          <div class="component-item" v-for="item in group.items" :key="item.type" @click="appendComponent(item)">
            <m-icon :icon="item.icon"></m-icon>

            <el-tooltip effect="dark" placement="bottom" :content="item.text">
              <span>{{ item.text }}</span>
            </el-tooltip>
          </div>
        </el-collapse-item>
      </template>
    </el-collapse>
  </el-scrollbar>
</template>

<script lang="ts">
import { computed, defineComponent, inject, ref } from 'vue';

import MIcon from '@editor/components/Icon.vue';
import type { ComponentGroup, ComponentItem, Services } from '@editor/type';

export default defineComponent({
  name: 'ui-component-panel',

  components: { MIcon },

  setup() {
    const searchText = ref('');
    const services = inject<Services>('services');
    const list = computed(() =>
      services?.componentListService.getList().map((group: ComponentGroup) => ({
        ...group,
        items: group.items.filter((item: ComponentItem) => item.text.includes(searchText.value)),
      })),
    );
    const collapseValue = computed(() =>
      Array(list.value?.length)
        .fill(1)
        .map((x, i) => i),
    );

    return {
      searchText,
      collapseValue,
      list,

      appendComponent({ text, type, ...config }: ComponentItem): void {
        services?.editorService.add({
          name: text,
          type,
          ...config,
        });
      },
    };
  },
});
</script>
