<template>
  <m-editor
    :menu="menu"
    :runtime-url="runtimeUrl"
    :component-group-list="componentList"
    :modelValue="uiConfigs"
    :props-values="magicPresetValues"
    :props-configs="magicPresetConfigs"
    :event-method-list="magicPresetEvents"
    :default-selected="editorDefaultSelected"
  ></m-editor>
</template>

<script lang="ts">
import { Component, computed, defineComponent, markRaw, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Edit, FolderOpened, SwitchButton, Tickets } from '@element-plus/icons';

import { ComponentGroup } from '@tmagic/editor';
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

    asyncLoadJs('/runtime/vue3/assets/config.js').then(() => {
      magicPresetConfigs.value = (window as any).magicPresetConfigs;
    });
    asyncLoadJs('/runtime/vue3/assets/value.js').then(() => {
      magicPresetValues.value = (window as any).magicPresetValues;
    });
    asyncLoadJs('/runtime/vue3/assets/event.js').then(() => {
      magicPresetEvents.value = (window as any).magicPresetEvents;
    });

    getComponentList();
    getActById();

    return {
      componentList,
      menu: topMenu(),
      uiConfigs,
      runtimeUrl: '/runtime/vue3/playground.html',
      magicPresetValues,
      magicPresetConfigs,
      magicPresetEvents,
      editorDefaultSelected,
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
