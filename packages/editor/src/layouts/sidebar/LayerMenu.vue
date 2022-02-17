<template>
  <div v-if="node" class="magic-editor-content-menu">
    <div
      v-if="node.items"
      class="magic-editor-content-menu-item"
      @mouseenter="setSubVisiable(true)"
      @mouseleave="setSubVisiable(false)"
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
    <div class="subMenu" v-show="subVisible" @mouseenter="setSubVisiable(true)" @mouseleave="setSubVisiable(false)">
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

        <template v-else-if="node.type === 'app'">
          <div
            class="magic-editor-content-menu-item"
            v-for="item in menu.app"
            :key="item.type"
            @click="() => append(item)"
          >
            {{ item.text }}
          </div>
        </template>

        <template v-else-if="node.items">
          <div v-for="list in menu.component" :key="list.title">
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
import { computed, defineComponent, inject, PropType, ref } from 'vue';

import type { ComponentGroup, Services } from '@editor/type';

export default defineComponent({
  name: 'magic-editor-content-menu',

  props: {
    componentGroupList: {
      type: Array as PropType<ComponentGroup[]>,
      default: () => [],
    },
  },

  setup(props) {
    const services = inject<Services>('services');
    const subVisible = ref(false);
    const node = computed(() => services?.editorService.get('node'));

    return {
      subVisible,

      node,

      menu: computed(() => ({
        app: [
          {
            type: 'page',
            text: '页面',
          },
        ],
        component: props.componentGroupList,
      })),

      append(config: any) {
        services?.editorService.add({
          name: config.text,
          type: config.type,
        });
      },

      remove() {
        node.value && services?.editorService.remove(node.value);
      },

      copy(node: any) {
        services?.editorService.copy(node);
      },

      setSubVisiable(v: any) {
        subVisible.value = v;
      },
    };
  },
});
</script>
