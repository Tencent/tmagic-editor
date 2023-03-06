<template>
  <m-editor
    ref="editor"
    :menu="menu"
    :runtime-url="runtimeUrl"
    :component-group-list="componentList"
    :modelValue="uiConfigs"
    :props-values="magicPresetValues"
    :props-configs="magicPresetConfigs"
    :event-method-list="magicPresetEvents"
    :default-selected="editorDefaultSelected"
    :moveable-options="moveableOptions"
  ></m-editor>
</template>

<script lang="ts">
import { Component, computed, defineComponent, markRaw, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Edit, FolderOpened, SwitchButton, Tickets } from '@element-plus/icons-vue';

import type { MoveableOptions } from '@tmagic/editor';
import { ComponentGroup } from '@tmagic/editor';
import { NodeType } from '@tmagic/schema';
import { CustomizeMoveableOptionsCallbackConfig } from '@tmagic/stage';
import { asyncLoadJs } from '@tmagic/utils';

import editorApi from '@src/api/editor';
import magicStore from '@src/store/index';
import { topMenu } from '@src/use/use-menu';
import { initConfigByActId } from '@src/use/use-publish';

const icons: Record<string, Component> = {
  'folder-opened': markRaw(FolderOpened),
  tickets: markRaw(Tickets),
  'switch-button': markRaw(SwitchButton),
};

export default defineComponent({
  name: 'App',

  setup() {
    const route = useRoute();
    const editor = ref();

    const uiConfigs = computed(() => magicStore.get('uiConfigs'));
    const editorDefaultSelected = computed(() => magicStore.get('editorDefaultSelected'));
    const componentList = ref<ComponentGroup[]>([]);

    const magicPresetValues = ref<Record<string, any>>({});
    const magicPresetConfigs = ref<Record<string, any>>({});
    const magicPresetEvents = ref<Record<string, any>>({});
    // 获取编辑器左侧组件树
    const getComponentList = async () => {
      const { data: list } = await editorApi.getComponentList();
      if (!list) return;
      componentList.value = list.map((item) => ({
        ...item,
        items: item.items.map((item) => ({
          ...item,
          icon: (typeof item.icon === 'string' ? icons[item.icon] : item.icon) || Edit,
        })),
      }));
    };
    // 根据活动id获取活动配置
    const getActById = async () => {
      await initConfigByActId({ actId: Number(route.params.actId) });
    };

    asyncLoadJs('/static/vue3/entry/config/index.umd.cjs').then(() => {
      magicPresetConfigs.value = (window as any).magicPresetConfigs;
    });
    asyncLoadJs('/static/vue3/entry/value/index.umd.cjs').then(() => {
      magicPresetValues.value = (window as any).magicPresetValues;
    });
    asyncLoadJs('/static/vue3/entry/event/index.umd.cjs').then(() => {
      magicPresetEvents.value = (window as any).magicPresetEvents;
    });

    getComponentList();
    getActById();

    return {
      editor,
      componentList,
      menu: topMenu(),
      uiConfigs,
      runtimeUrl: '/static/vue3/runtime/playground/index.html',
      magicPresetValues,
      magicPresetConfigs,
      magicPresetEvents,
      editorDefaultSelected,
      moveableOptions: (config?: CustomizeMoveableOptionsCallbackConfig): MoveableOptions => {
        const options: MoveableOptions = {};

        const id = config?.targetElId;
        if (!id || !editor.value) return options;

        const node = editor.value.editorService.getNodeById(id);

        if (!node) return options;

        const isPage = node.type === NodeType.PAGE;

        options.draggable = !isPage;
        options.resizable = !isPage;

        return options;
      },
    };
  },
});
</script>
<style lang="scss">
#app {
  width: 100%;
  height: 100%;
  display: flex;
}

.m-editor {
  flex: 1;
  height: 100%;
}
</style>
