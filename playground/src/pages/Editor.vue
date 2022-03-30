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
      :component-group-list="componentGroupList"
      :default-selected="defaultSelected"
      :moveable-options="moveableOptions"
    ></m-editor>

    <el-dialog v-model="previewVisible" destroy-on-close :width="375" custom-class="pre-viewer" title="预览">
      <iframe
        v-if="previewVisible"
        width="100%"
        height="817"
        :src="`${RUNTIME_PATH}/page.html?localPreview=1&page=${editor?.editorService.get('page').id}`"
      ></iframe>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, toRaw } from 'vue';
import { Coin, Connection, Document, FolderOpened, SwitchButton, Tickets } from '@element-plus/icons';
import { ElMessage } from 'element-plus';
import serialize from 'serialize-javascript';

import type { MenuBarData, MoveableOptions, TMagicEditor } from '@tmagic/editor';
import { NodeType } from '@tmagic/schema';
import StageCore from '@tmagic/stage';
import { asyncLoadJs } from '@tmagic/utils';

import config from '../config';

const RUNTIME_PATH = '/tmagic-editor/playground/runtime/vue3';

export default defineComponent({
  name: 'EditorApp',

  setup() {
    const editor = ref<InstanceType<typeof TMagicEditor>>();
    const previewVisible = ref(false);
    const value = ref(config);
    const defaultSelected = ref(config.items[0].id);
    const propsValues = ref<Record<string, any>>({});
    const propsConfigs = ref<Record<string, any>>({});
    const eventMethodList = ref<Record<string, any>>({});
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
          text: '预览',
          icon: Connection,
          handler: () => {
            previewVisible.value = true;
          },
        },
        {
          type: 'button',
          text: '保存',
          icon: Coin,
          handler: (service) => {
            localStorage.setItem(
              'magicUiConfig',
              serialize(toRaw(value.value), {
                space: 2,
                unsafe: true,
              }).replace(/"(\w+)":\s/g, '$1: '),
            );
            service?.editorService.resetModifiedNodeId();
            ElMessage.success('保存成功');
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

    asyncLoadJs(`${RUNTIME_PATH}/assets/config.js`).then(() => {
      propsConfigs.value = (globalThis as any).magicPresetConfigs;
    });
    asyncLoadJs(`${RUNTIME_PATH}/assets/value.js`).then(() => {
      propsValues.value = (globalThis as any).magicPresetValues;
    });
    asyncLoadJs(`${RUNTIME_PATH}/assets/event.js`).then(() => {
      eventMethodList.value = (globalThis as any).magicPresetEvents;
    });

    return {
      RUNTIME_PATH,

      editor,
      menu,
      value,
      defaultSelected,
      propsValues,
      propsConfigs,
      eventMethodList,

      previewVisible,

      runtimeUrl: `${RUNTIME_PATH}/playground.html`,

      componentGroupList: ref([
        {
          title: '示例容器',
          items: [
            {
              icon: FolderOpened,
              text: '组',
              type: 'container',
            },
          ],
        },
        {
          title: '示例组件',
          items: [
            {
              icon: Tickets,
              text: '文本',
              type: 'text',
            },
            {
              icon: SwitchButton,
              text: '按钮',
              type: 'button',
            },
          ],
        },
      ]),

      moveableOptions: (core?: StageCore): MoveableOptions => {
        const options: MoveableOptions = {};
        const id = core?.dr?.target?.id;

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
}
</style>
