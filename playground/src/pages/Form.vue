<template>
  <div style="padding: 20px">
    <m-form ref="form" :config="config" :init-values="initValue" size="small"></m-form>
    <el-button @click="submit">提交</el-button>
    <el-dialog v-model="resultVisible" title="result">
      <pre><code class="language-javascript hljs" v-html="result"></code></pre>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMessage } from 'element-plus';

import { MForm } from '@tmagic/form';

export default defineComponent({
  name: 'App',
  data() {
    return {
      resultVisible: false,
      result: '',

      config: [
        {
          text: '文本',
          name: 'text',
          tooltip: (vm: any, { model }: any) => model.text,
          extra: (vm: any, { model }: any) => `${model.text}extra`,
          rules: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
        },
        {
          type: 'checkbox',
          text: 'checkbox',
          name: 'option',
          activeValue: 1,
          inactiveValue: 0,
          defaultValue: 1,
        },
        {
          type: 'link',
          displayText: '链接',
          text: 'link',
          name: 'link',
          href: '',
          tooltip: 'element-ui',
        },
        {
          type: 'display',
          text: '展示',
          name: 'display',
          initValue: 'display',
          tooltip: 'hello',
        },
        {
          type: 'number',
          text: '计数器',
          name: 'number',
        },
        {
          type: 'textarea',
          text: '输入框',
          name: 'textarea1',
        },
        {
          type: 'datetime',
          text: '日期',
          name: 'datetime',
        },
        {
          type: 'switch',
          text: '开关',
          name: 'switch',
          filter: 'number',
          defaultValue: 1,
        },
        {
          type: 'daterange',
          text: '日期范围',
          name: 'daterange',
          // names: ['one', 'two'],
        },
        {
          type: 'time',
          text: '日期选择',
          name: 'time',
        },
        {
          type: 'colorPicker',
          text: '取色器',
          name: 'colorPicker',
        },
        {
          type: 'checkbox-group',
          text: '选项组',
          name: 'checkGroup',
          options: [
            {
              value: 1,
              text: 'one',
            },
            {
              value: 2,
              text: 'two',
            },
          ],
        },
        {
          type: 'radio-group',
          text: '单选框',
          name: 'radioGroup',
          options: [
            {
              value: 1,
              text: 'one',
            },
            {
              value: 2,
              text: 'two',
            },
          ],
        },
        {
          type: 'cascader',
          text: '级联选择',
          placeholder: 'test',
          name: 'cascader',
          options: [
            {
              value: 1,
              label: 'one',
              children: [
                {
                  value: 3,
                  label: 'three',
                  children: [
                    {
                      value: 8,
                      label: 'eight',
                    },
                  ],
                },
                {
                  value: 4,
                  label: 'four',
                },
                {
                  value: 6,
                  label: 'six',
                },
              ],
            },
            {
              value: 2,
              label: 'two',
              children: [
                {
                  value: 5,
                  label: 'five',
                },
                {
                  value: 7,
                  label: 'seven',
                },
              ],
            },
          ],
        },
        {
          type: 'dynamic-field',
          name: 'dynamic-field',
          dynamicKey: 'textarea',
          text: '动态表单',
          returnFields: () => [{ name: 'one', label: 'number', defaultValue: 'yes' }],
        },
        {
          type: 'row',
          items: [
            {
              type: 'date',
              text: '日期',
              name: 'date',
            },
            {
              type: 'checkbox',
              text: '多选框',
              name: 'checkbox',
              tooltip: '分组xxxxxxxxxxxx',
              extra: 'extra',
            },
          ],
        },
        {
          type: 'fieldset',
          name: 'fieldset',
          text: '分组',
          extra: 'extra',
          checkbox: true,
          expand: 'checkbox',
          // schematic: 'https://vfiles.gtimg.cn/vupload/20210329/9712631617027075445.png',
          items: [
            {
              type: 'select',
              text: '下拉选项',
              name: 'select',
              options: [
                { text: '选项1', value: 1 },
                { text: '选项2', value: 2 },
              ],
            },
          ],
        },
        {
          type: 'table',
          name: 'table',
          defautSort: { prop: 'name', order: 'descending' },
          extra: 'extra',
          itemExtra: (vm: any, { model }: any): any => `${model.text}itemExtra`,
          items: [
            {
              label: 'id',
              name: 'id',
              sortable: true,
              tooltip: '分组xxxxxxxxxxxx',
              rules: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
            },
            {
              label: '名称',
              name: 'name',
            },
          ],
        },
        {
          type: 'groupList',
          name: 'groupList',
          extra: '分组xxxxxxxxxxxx',
          itemExtra: (vm: any, { model }: any) => `${model.name}extra`,
          items: [
            {
              text: 'id',
              name: 'id',
              rules: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
            },
            {
              text: '名称',
              name: 'name',
            },
          ],
        },

        {
          type: 'panel',
          title: 'panel',
          extra: 'panel',
          schematic: 'https://vfiles.gtimg.cn/vupload/20210329/9712631617027075445.png',
          items: [
            {
              text: '名称',
              name: 'name',
            },
          ],
        },

        {
          type: 'step',
          items: [
            {
              name: 'step1',
              title: 'step1',
              items: [
                {
                  text: '名称',
                  name: 'name',
                },
              ],
            },
            {
              name: 'step2',
              title: 'step2',
              items: [
                {
                  text: '名称2',
                  name: 'name',
                },
              ],
            },
          ],
        },
      ],

      initValue: {
        text: '文本',
        number: 10,
        fieldset: {
          select: 1,
        },
        table: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
        ],
      },

      tableConfig: [
        {
          label: 'id',
          prop: 'id',
        },
        {
          label: 'name',
          prop: 'name',
        },
      ],
      tableData: [
        { id: 1, name: 'xx' },
        { id: 2, name: 'xx2' },
      ],
    };
  },
  methods: {
    async submit() {
      try {
        const values = await (this.$refs.form as InstanceType<typeof MForm>).submitForm();
        this.resultVisible = true;
        this.result = JSON.stringify(values, null, 2);
      } catch (e: any) {
        console.error(e);
        ElMessage.error({
          duration: 10000,
          showClose: true,
          message: e.message,
          dangerouslyUseHTMLString: true,
        });
      }
    },

    spanMethod({ rowIndex, columnIndex }: any) {
      if (columnIndex === 0) {
        if (rowIndex % 2 === 0) {
          return {
            rowspan: 2,
            colspan: 1,
          };
        }
        return {
          rowspan: 0,
          colspan: 0,
        };
      }
    },
  },
});
</script>
