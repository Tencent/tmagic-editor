import { nextTick, type Ref, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { Coin, Connection, Document } from '@element-plus/icons-vue';

import type { MApp } from '@tmagic/core';
import { type MenuBarData, tMagicMessage, tMagicMessageBox } from '@tmagic/editor';

import AdapterSelect from '../../components/AdapterSelect.vue';
import DeviceGroup from '../../components/DeviceGroup.vue';
import { uaMap } from '../../const';

export const useEditorMenu = (value: Ref<MApp | undefined>, save: () => void) => {
  const router = useRouter();

  const deviceGroup = shallowRef<InstanceType<typeof DeviceGroup>>();
  const iframe = shallowRef<HTMLIFrameElement>();
  const previewVisible = ref(false);

  /**
   * 校验是否存在配置错误的组件：存在则弹出错误提示（列出问题组件）并返回 false 阻止保存。
   * 依赖编辑器 enablePropsFormValidate 能力集中记录的 invalidNodeIds。
   */
  const checkInvalidNodes = (services?: any): boolean => {
    const invalidNodeIds: Map<any, any> | undefined = services?.editorService.getInvalidNodeIds?.();
    if (!invalidNodeIds || invalidNodeIds.size === 0) {
      return true;
    }

    // 按页面分组，提示信息需指明问题组件所属页面
    const pageMap = new Map<string, string[]>();
    [...invalidNodeIds.keys()].forEach((id) => {
      const info = services?.editorService.getNodeInfo?.(id);
      const page = info?.page;
      const pageKey = page?.name ? `${page.name}(${page.id})` : '未知页面';
      const node = info?.node;
      const nodeName = node?.name ? `${node.name}(${id})` : `${id}`;
      if (!pageMap.has(pageKey)) pageMap.set(pageKey, []);
      pageMap.get(pageKey)!.push(nodeName);
    });

    const details = [...pageMap.entries()]
      .map(([pageName, nodeNames]) => `【${pageName}】${nodeNames.join('、')}`)
      .join('；');

    tMagicMessage.error(`以下组件存在配置校验错误，请修复后再保存：${details}`);
    return false;
  };

  const menu: MenuBarData = {
    left: [
      {
        type: 'text',
        text: '魔方',
      },
      {
        type: 'component',
        component: AdapterSelect,
      },
    ],
    center: ['delete', 'undo', 'redo', 'history-list', 'guides', 'rule', 'zoom'],
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
              // 存在校验错误时中断保存（预览仍使用当前内存中的 DSL）
              if (checkInvalidNodes(services)) {
                save();
                tMagicMessage.success('保存成功');
              }
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
        handler: (services) => {
          if (!checkInvalidNodes(services)) return;
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

  return {
    menu,
    deviceGroup,
    iframe,
    previewVisible,
    save,
  };
};
