<template>
  <div v-if="node" class="magic-editor-content-menu">
    <div
      v-if="node.items"
      class="magic-editor-content-menu-item"
      @mouseenter="setSubVisitable(true)"
      @mouseleave="setSubVisitable(false)"
    >
      新增
    </div>
    <div v-if="node.type !== 'app'" class="magic-editor-content-menu-item" @click="() => copy(node)">复制</div>
    <div
      v-if="node.type !== 'app' && node.type !== 'page'"
      class="magic-editor-content-menu-item"
      @click="() => remove()"
    >
      删除
    </div>
    <div class="subMenu" v-show="subVisible" @mouseenter="setSubVisitable(true)" @mouseleave="setSubVisitable(false)">
      <el-scrollbar>
        <template v-if="node.type === 'tabs'">
          <div
            class="magic-editor-content-menu-item"
            @click="
              () =>
                append({
                  type: 'tab-pane',
                })
            "
          >
            标签
          </div>
        </template>
        <template v-else-if="node.items">
          <div v-for="list in componentGroupList" :key="list.title">
            <template v-for="item in list.items">
              <div class="magic-editor-content-menu-item" v-if="item" :key="item.type" @click="() => append(item)">
                {{ item.text }}
              </div>
            </template>
            <div class="separation"></div>
          </div>
        </template>
      </el-scrollbar>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, ref } from 'vue';

import type { MNode } from '@tmagic/schema';

import type { AddMNode, Services } from '@editor/type';

export default defineComponent({
  name: 'magic-editor-content-menu',

  setup() {
    const services = inject<Services>('services');
    const subVisible = ref(false);
    const node = computed(() => services?.editorService.get('node'));

    return {
      subVisible,

      node,

      componentGroupList: computed(() => services?.componentListService.getList()),

      append(config: AddMNode) {
        services?.editorService.add({
          name: config.text,
          type: config.type,
        });
      },

      remove() {
        node.value && services?.editorService.remove(node.value);
      },

      copy(node?: MNode) {
        node && services?.editorService.copy(node);
      },

      setSubVisitable(v: boolean) {
        subVisible.value = v;
      },
    };
  },
});
</script>
