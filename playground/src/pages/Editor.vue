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
      :auto-scroll-into-view="true"
    ></m-editor>

    <el-dialog v-model="previewVisible" destroy-on-close :width="375" custom-class="pre-viewer" title="预览">
      <iframe
        v-if="previewVisible"
        width="100%"
        height="817"
        :src="`${VITE_RUNTIME_PATH}/page.html?localPreview=1&page=${editor?.editorService.get('page').id}`"
      ></iframe>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, toRaw } from 'vue';
import {
  Coin,
  Connection,
  Document,
  FolderOpened,
  Grid,
  PictureFilled,
  SwitchButton,
  Tickets,
} from '@element-plus/icons';
import { ElMessage, ElMessageBox } from 'element-plus';
import serialize from 'serialize-javascript';

import type { MenuBarData, MoveableOptions, TMagicEditor } from '@tmagic/editor';
import { Id, NodeType } from '@tmagic/schema';
import StageCore from '@tmagic/stage';
import { asyncLoadJs } from '@tmagic/utils';

import config from '../config';

const { VITE_RUNTIME_PATH } = import.meta.env;

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

    const save = () => {
      localStorage.setItem(
        'magicUiConfig',
        serialize(toRaw(value.value), {
          space: 2,
          unsafe: true,
        }).replace(/"(\w+)":\s/g, '$1: '),
      );
      editor.value?.editorService.resetModifiedNodeId();
    };

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
          handler: async () => {
            if (editor.value && editor.value.editorService.get<Map<Id, Id>>('modifiedNodeIds').size > 0) {
              try {
                await ElMessageBox.confirm('有修改未保存，是否先保存再预览', '提示', {
                  confirmButtonText: '保存并预览',
                  cancelButtonText: '预览',
                  type: 'warning',
                });
                save();
                ElMessage.success('保存成功');
              } catch (e) {
                console.error(e);
              }
            }
            previewVisible.value = true;
          },
        },
        {
          type: 'button',
          text: '保存',
          icon: Coin,
          handler: () => {
            save();
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

    asyncLoadJs(`${VITE_RUNTIME_PATH}/assets/config.js`).then(() => {
      propsConfigs.value = (globalThis as any).magicPresetConfigs;
    });
    asyncLoadJs(`${VITE_RUNTIME_PATH}/assets/value.js`).then(() => {
      propsValues.value = (globalThis as any).magicPresetValues;
    });
    asyncLoadJs(`${VITE_RUNTIME_PATH}/assets/event.js`).then(() => {
      eventMethodList.value = (globalThis as any).magicPresetEvents;
    });

    save();

    return {
      VITE_RUNTIME_PATH,

      editor,
      menu,
      value,
      defaultSelected,
      propsValues,
      propsConfigs,
      eventMethodList,

      previewVisible,

      runtimeUrl: `${VITE_RUNTIME_PATH}/playground.html`,

      componentGroupList: ref([
        {
          title: '示例容器',
          items: [
            {
              icon: FolderOpened,
              text: '组',
              type: 'container',
            },
            {
              icon: FolderOpened,
              text: '蒙层',
              type: 'overlay',
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
            {
              icon: PictureFilled,
              text: '图片',
              type: 'img',
            },
            {
              icon: Grid,
              text: '二维码',
              type: 'qrcode',
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
        options.rotatable = !isPage;

        return options;
      },
    };
  },
});
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
}
</style>
