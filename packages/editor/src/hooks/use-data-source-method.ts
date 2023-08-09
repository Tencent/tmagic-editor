import { nextTick, ref } from 'vue';
import { cloneDeep } from 'lodash-es';

import { tMagicMessage } from '@tmagic/design';
import type { CodeBlockContent, DataSourceSchema } from '@tmagic/schema';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import { getConfig } from '@editor/utils/config';

export const useDataSourceMethod = () => {
  const codeConfig = ref<CodeBlockContent>();
  const codeBlockEditor = ref<InstanceType<typeof CodeBlockEditor>>();

  const dataSource = ref<DataSourceSchema>();
  const dataSourceMethod = ref('');

  return {
    codeConfig,
    codeBlockEditor,

    createCode: async (model: DataSourceSchema) => {
      codeConfig.value = {
        name: '',
        content: `({ params, dataSource, app }) => {\n  // place your code here\n}`,
        params: [],
      };

      await nextTick();

      dataSource.value = model;
      dataSourceMethod.value = '';

      codeBlockEditor.value?.show();
    },

    editCode: async (model: DataSourceSchema, methodName: string) => {
      const method = model.methods?.find((method) => method.name === methodName);

      if (!method) {
        tMagicMessage.error('获取数据源方法失败');
        return;
      }

      let codeContent = method.content;

      if (typeof codeContent !== 'string') {
        codeContent = codeContent.toString();
      }

      codeConfig.value = {
        ...cloneDeep(method),
        content: codeContent,
      };

      await nextTick();

      dataSource.value = model;
      dataSourceMethod.value = methodName;

      codeBlockEditor.value?.show();
    },

    deleteCode: async (model: DataSourceSchema, methodName: string) => {
      if (!model.methods) return;

      const index = model.methods.findIndex((method) => method.name === methodName);

      if (index === -1) {
        return;
      }

      model.methods.splice(index, 1);
    },

    submitCode: (values: CodeBlockContent) => {
      if (!dataSource.value) return;

      if (!dataSource.value.methods) {
        dataSource.value.methods = [];
      }

      if (values.content) {
        // 在保存的时候转换代码内容
        const parseDSL = getConfig('parseDSL');
        if (typeof values.content === 'string') {
          values.content = parseDSL<(...args: any[]) => any>(values.content);
        }
      }

      if (dataSourceMethod.value) {
        const index = dataSource.value.methods.findIndex((method) => method.name === dataSourceMethod.value);
        dataSource.value.methods.splice(index, 1, values);
      } else {
        dataSource.value.methods.push(values);
      }

      codeBlockEditor.value?.hide();
    },
  };
};
