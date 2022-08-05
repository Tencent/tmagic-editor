<template>
  <el-scrollbar>
    <slot name="component-list-panel-header"></slot>

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
          <div
            class="component-item"
            v-for="item in group.items"
            draggable="true"
            :key="item.type"
            @click="appendComponent(item)"
            @dragstart="dragstartHandler(item, $event)"
            @dragend="dragendHandler"
            @drag="dragHandler"
          >
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
import serialize from 'serialize-javascript';

import type StageCore from '@tmagic/stage';
import { removeClassNameByClassName } from '@tmagic/utils';

import MIcon from '../../components/Icon.vue';
import type { ComponentGroup, ComponentItem, Services, StageOptions } from '../../type';

export default defineComponent({
  name: 'ui-component-panel',

  components: { MIcon },

  setup() {
    const searchText = ref('');
    const services = inject<Services>('services');
    const stageOptions = inject<StageOptions>('stageOptions');

    const stage = computed(() => services?.editorService.get<StageCore>('stage'));
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

    let timeout: NodeJS.Timeout | undefined;
    let clientX: number;
    let clientY: number;

    return {
      searchText,
      collapseValue,
      list,

      appendComponent({ text, type, data = {} }: ComponentItem): void {
        services?.editorService.add({
          name: text,
          type,
          ...data,
        });
      },

      dragstartHandler({ text, type, data = {} }: ComponentItem, e: DragEvent) {
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData(
            'data',
            serialize({
              name: text,
              type,
              ...data,
            }).replace(/"(\w+)":\s/g, '$1: '),
          );
        }
      },

      dragendHandler() {
        if (timeout) {
          globalThis.clearTimeout(timeout);
          timeout = undefined;
        }
        const doc = stage.value?.renderer.contentWindow?.document;
        if (doc && stageOptions) {
          removeClassNameByClassName(doc, stageOptions.containerHighlightClassName);
        }
        clientX = 0;
        clientY = 0;
      },

      dragHandler(e: DragEvent) {
        if (e.clientX !== clientX || e.clientY !== clientY) {
          clientX = e.clientX;
          clientY = e.clientY;
          if (timeout) {
            globalThis.clearTimeout(timeout);
            timeout = undefined;
          }
          return;
        }

        if (timeout || !stage.value) return;

        timeout = stage.value.getAddContainerHighlightClassNameTimeout(e);
      },
    };
  },
});
</script>
