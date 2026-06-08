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

    <TMagicDialog
      v-model="previewVisible"
      close-onClick-modal
      destroy-on-close
      class="pre-viewer"
      title="预览"
      :width="stageRect?.width"
    >
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
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, toRaw } from 'vue';
import { debounce } from 'lodash-es';

import type { MApp, MContainer, MNode } from '@tmagic/core';
import type { DatasourceTypeOption } from '@tmagic/editor';
import {
  editorService,
  historyService,
  propsService,
  serializeConfig,
  TMagicDialog,
  TMagicEditor,
  tMagicMessage,
} from '@tmagic/editor';

import DeviceGroup from '../components/DeviceGroup.vue';
import componentGroupList from '../configs/componentGroupList';
import dsl from '../configs/dsl';

import { useEditorContentMenuData } from './composables/use-editor-content-menu-data';
import { useEditorMenu } from './composables/use-editor-menu';
import { useEditorMoveableOptions } from './composables/use-editor-moveable-options';
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

const { moveableOptions } = useEditorMoveableOptions(editor);

const save = () => {
  localStorage.setItem('magicDSL', serializeConfig(toRaw(value.value)));
  editor.value?.editorService.resetModifiedNodeId();
  // 标记当前历史记录为已保存，从 IndexedDB 恢复时会把游标定位到此处。
  historyService.markSaved();
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

// 把当前历史记录持久化到 IndexedDB（按 DSL app id 隔离）。
// 注意：beforeunload / pagehide 阶段无法 await 异步 IndexedDB 事务，能写多少算多少。
const persistHistory = () => {
  historyService.saveToIndexedDB().catch((error) => console.error('持久化历史记录失败', error));
};

// 历史变更后防抖持久化：页面 / 数据源 / 代码块任一栈变化都及时写入 IndexedDB。
// 仅靠 beforeunload/pagehide 的异步写入不可靠（事务可能来不及提交），会导致刷新后最近一次
// 编辑（尤其是本次会话新增的代码块 / 数据源历史）丢失，这里改为变更即落库以保证恢复完整。
const schedulePersist = debounce(persistHistory, 500);

// 进入页面时从 IndexedDB 恢复历史记录，并对齐到当前激活页，保证 undo/redo 作用于正在编辑的页面。
const restoreHistory = async () => {
  try {
    const snapshot = await historyService.restoreFromIndexedDB();
    if (!snapshot) return;
    const page = editorService.get('page');
    if (page) historyService.changePage(page);
  } catch (error) {
    console.error('恢复历史记录失败', error);
  }
};

onMounted(() => {
  restoreHistory();
  historyService.on('change', schedulePersist);
  historyService.on('code-block-history-change', schedulePersist);
  historyService.on('data-source-history-change', schedulePersist);
  window.addEventListener('beforeunload', persistHistory);
  window.addEventListener('pagehide', persistHistory);
});

onBeforeUnmount(() => {
  schedulePersist.cancel();
  persistHistory();
  historyService.off('change', schedulePersist);
  historyService.off('code-block-history-change', schedulePersist);
  historyService.off('data-source-history-change', schedulePersist);
  window.removeEventListener('beforeunload', persistHistory);
  window.removeEventListener('pagehide', persistHistory);
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
