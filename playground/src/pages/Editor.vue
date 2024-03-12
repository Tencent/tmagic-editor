<template>
  <div class="editor-app">
    <m-editor
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
      @props-submit-error="propsSubmitErrorHandler"
    >
      <template #workspace-content>
        <DeviceGroup ref="deviceGroup" v-model="stageRect"></DeviceGroup>
      </template>
    </m-editor>

    <TMagicDialog
      v-model="previewVisible"
      destroy-on-close
      class="pre-viewer"
      title="预览"
      :width="stageRect && stageRect.width"
    >
      <iframe
        v-if="previewVisible"
        ref="iframe"
        width="100%"
        style="border: none"
        :height="stageRect && stageRect.height"
        :src="previewUrl"
      ></iframe>
    </TMagicDialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, toRaw } from 'vue';
import { useRouter } from 'vue-router';
import { Coin, Connection, Document } from '@element-plus/icons-vue';
import serialize from 'serialize-javascript';

import { TMagicDialog, tMagicMessage, tMagicMessageBox } from '@tmagic/design';
import { DatasourceTypeOption, editorService, MenuBarData, MoveableOptions, TMagicEditor } from '@tmagic/editor';
import type { MContainer, MNode } from '@tmagic/schema';
import { NodeType } from '@tmagic/schema';
import type { CustomizeMoveableOptionsCallbackConfig } from '@tmagic/stage';
import { asyncLoadJs } from '@tmagic/utils';

import DeviceGroup from '../components/DeviceGroup.vue';
import componentGroupList from '../configs/componentGroupList';
import dsl from '../configs/dsl';
import { uaMap } from '../const';

const { VITE_RUNTIME_PATH, VITE_ENTRY_PATH } = import.meta.env;

const datasourceList: DatasourceTypeOption[] = [];
const runtimeUrl = `${VITE_RUNTIME_PATH}/playground/index.html`;
const router = useRouter();
const editor = ref<InstanceType<typeof TMagicEditor>>();
const deviceGroup = ref<InstanceType<typeof DeviceGroup>>();
const iframe = ref<HTMLIFrameElement>();
const previewVisible = ref(false);
const value = ref(dsl);
const defaultSelected = ref(dsl.items[0].id);
const propsValues = ref<Record<string, any>>({});
const propsConfigs = ref<Record<string, any>>({});
const eventMethodList = ref<Record<string, any>>({});
const datasourceEventMethodList = ref<Record<string, any>>({
  base: {
    events: [],
    methods: [],
  },
});
const datasourceConfigs = ref<Record<string, any>>({});
const datasourceValues = ref<Record<string, any>>({});
const stageRect = ref({
  width: 375,
  height: 817,
});

const previewUrl = computed(
  () => `${VITE_RUNTIME_PATH}/page/index.html?localPreview=1&page=${editor.value?.editorService.get('page')?.id}`,
);

const menu: MenuBarData = {
  left: [
    {
      type: 'text',
      text: '魔方',
    },
  ],
  center: ['delete', 'undo', 'redo', 'guides', 'rule', 'zoom'],
  right: [
    {
      type: 'button',
      text: 'Form Playground',
      handler: () => router.push('form'),
    },
    {
      type: 'button',
      text: 'Form Editor Playground',
      handler: () => router.push('form-editor'),
    },
    {
      type: 'button',
      text: 'Table Playground',
      handler: () => router.push('table'),
    },
    '/',
    {
      type: 'button',
      text: '预览',
      icon: Connection,
      handler: async (services) => {
        if (services?.editorService.get('modifiedNodeIds').size > 0) {
          try {
            await tMagicMessageBox.confirm('有修改未保存，是否先保存再预览', '提示', {
              confirmButtonText: '保存并预览',
              cancelButtonText: '预览',
              type: 'warning',
            });
            save();
            tMagicMessage.success('保存成功');
          } catch (e) {
            console.error(e);
          }
        }
        previewVisible.value = true;

        await nextTick();

        if (!iframe.value?.contentWindow || !deviceGroup.value?.viewerDevice) return;
        Object.defineProperty(iframe.value.contentWindow.navigator, 'userAgent', {
          value: uaMap[deviceGroup.value.viewerDevice],
          writable: true,
        });
      },
    },
    {
      type: 'button',
      text: '保存',
      icon: Coin,
      handler: () => {
        save();
        tMagicMessage.success('保存成功');
      },
    },
    '/',
    {
      type: 'button',
      icon: Document,
      tooltip: '源码',
      handler: (service) => service?.uiService.set('showSrc', !service?.uiService.get('showSrc')),
    },
  ],
};

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

asyncLoadJs(`${VITE_ENTRY_PATH}/config/index.umd.cjs`).then(() => {
  propsConfigs.value = (globalThis as any).magicPresetConfigs;
});
asyncLoadJs(`${VITE_ENTRY_PATH}/value/index.umd.cjs`).then(() => {
  propsValues.value = (globalThis as any).magicPresetValues;
});
asyncLoadJs(`${VITE_ENTRY_PATH}/event/index.umd.cjs`).then(() => {
  eventMethodList.value = (globalThis as any).magicPresetEvents;
});
asyncLoadJs(`${VITE_ENTRY_PATH}/ds-config/index.umd.cjs`).then(() => {
  datasourceConfigs.value = (globalThis as any).magicPresetDsConfigs;
});
asyncLoadJs(`${VITE_ENTRY_PATH}/ds-value/index.umd.cjs`).then(() => {
  datasourceValues.value = (globalThis as any).magicPresetDsValues;
});

save();

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
