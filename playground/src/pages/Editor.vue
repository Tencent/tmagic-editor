<template>
  <div class="editor-app">
    <TMagicEditor
      v-model="value"
      ref="editor"
      :menu="menu"
      :runtime-url="runtimeUrl"
      :props-configs="propsConfigs"
      :props-values="propsValues"
      :event-method-list="eventMethodList"
      :datasource-event-method-list="datasourceEventMethodList"
      :datasource-configs="datasourceConfigs"
      :datasource-values="datasourceValues"
      :component-group-list="componentGroupList"
      :datasource-list="datasourceList"
      :default-selected="defaultSelected"
      :moveable-options="moveableOptions"
      :auto-scroll-into-view="true"
      :stage-rect="stageRect"
      :layerContentMenu="contentMenuData"
      :stageContentMenu="contentMenuData"
      @props-submit-error="propsSubmitErrorHandler"
    >
      <template #workspace-content>
        <DeviceGroup ref="deviceGroup" v-model="stageRect"></DeviceGroup>
      </template>
    </TMagicEditor>

    <TMagicDialog v-model="previewVisible" destroy-on-close class="pre-viewer" title="预览" :width="stageRect?.width">
      <iframe
        v-if="previewVisible"
        ref="iframe"
        width="100%"
        style="border: none"
        :height="stageRect?.height"
        :src="previewUrl"
      ></iframe>
    </TMagicDialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, shallowRef, toRaw } from 'vue';
import serialize from 'serialize-javascript';

import type { MApp, MContainer, MNode } from '@tmagic/core';
import { NodeType } from '@tmagic/core';
import type { CustomizeMoveableOptionsCallbackConfig, DatasourceTypeOption, MoveableOptions } from '@tmagic/editor';
import { editorService, propsService, TMagicDialog, TMagicEditor, tMagicMessage } from '@tmagic/editor';

import DeviceGroup from '../components/DeviceGroup.vue';
import componentGroupList from '../configs/componentGroupList';
import dsl from '../configs/dsl';

import { useEditorContentMenuData } from './composables/use-editor-content-menu-data';
import { useEditorMenu } from './composables/use-editor-menu';
import { useEditorRes } from './composables/use-editor-res';

const { VITE_RUNTIME_PATH } = import.meta.env;

const datasourceList: DatasourceTypeOption[] = [];
const runtimeUrl = `${VITE_RUNTIME_PATH}/playground/index.html`;

const { propsValues, propsConfigs, eventMethodList, datasourceConfigs, datasourceValues, datasourceEventMethodList } =
  useEditorRes();
const { contentMenuData } = useEditorContentMenuData();

const editor = shallowRef<InstanceType<typeof TMagicEditor>>();
const value = ref<MApp>(dsl);
const defaultSelected = ref(dsl.items[0].id);

const stageRect = ref({
  width: 375,
  height: 817,
});

const previewUrl = computed(
  () => `${VITE_RUNTIME_PATH}/page/index.html?localPreview=1&page=${editor.value?.editorService.get('page')?.id}`,
);

const moveableOptions = (config?: CustomizeMoveableOptionsCallbackConfig): MoveableOptions => {
  const options: MoveableOptions = {};

  if (!editor.value) return options;

  const page = editor.value.editorService.get('page');

  const ids = config?.targetElIds || [];
  let isPage = page && ids.includes(`${page.id}`);

  if (!isPage) {
    const id = config?.targetElId;
    if (id) {
      const node = editor.value.editorService.getNodeById(id);
      isPage = node?.type === NodeType.PAGE;
    }
  }

  options.draggable = !isPage;
  options.resizable = !isPage;
  options.rotatable = !isPage;

  // 双击后在弹层中编辑时，根组件不能拖拽
  if (config?.targetEl?.parentElement?.classList.contains('tmagic-editor-sub-stage-wrap')) {
    options.draggable = false;
    options.resizable = false;
    options.rotatable = false;
  }

  return options;
};

const save = () => {
  localStorage.setItem(
    'magicDSL',
    serialize(toRaw(value.value), {
      space: 2,
      unsafe: true,
    }).replace(/"(\w+)":\s/g, '$1: '),
  );
  editor.value?.editorService.resetModifiedNodeId();
};

const { menu, deviceGroup, iframe, previewVisible } = useEditorMenu(value, save);

try {
  // eslint-disable-next-line no-eval
  const magicDSL = eval(`(${localStorage.getItem('magicDSL')})`);
  if (!magicDSL) {
    save();
  } else {
    value.value = magicDSL;
  }
} catch (e) {
  console.error(e);
  save();
}

editorService.usePlugin({
  beforeDoAdd: (config: MNode, parent: MContainer) => {
    if (config.type === 'overlay') {
      config.style = {
        ...config.style,
        left: 0,
        top: 0,
      };

      return [config, editorService.get('page') as MContainer];
    }

    return [config, parent];
  },
});

propsService.usePlugin({
  beforeFillConfig: (config) => [config, '100px'],
});

onBeforeUnmount(() => {
  editorService.removeAllPlugins();
});

const propsSubmitErrorHandler = async (e: any) => {
  console.error(e);
  tMagicMessage.closeAll();
  tMagicMessage.error(e.message);
};
</script>

<style lang="scss">
html {
  overflow: hidden;
}
#app {
  width: 100%;
  height: 100%;
  display: flex;
}

.editor-app {
  width: 100%;
  height: 100%;

  .m-editor {
    flex: 1;
    height: 100%;
  }

  .el-overlay-dialog {
    display: flex;
  }

  .pre-viewer {
    margin: auto;

    .el-dialog__body {
      padding: 0;
    }
  }

  .menu-left {
    .menu-item-text {
      margin-left: 10px;
    }
  }
}
</style>
