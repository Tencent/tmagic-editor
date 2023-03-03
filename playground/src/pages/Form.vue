<template>
  <div style="width: 100%; overflow-y: auto">
    <nav-menu :data="menu"></nav-menu>
    <div class="diff-form">
      <div>开启表单对比功能</div>
      <m-form
        ref="form"
        :config="diffFormConfig"
        :is-compare="true"
        :init-values="currentVersion"
        :last-values="lastVersion"
        size="small"
        height="100%"
      ></m-form>
    </div>
    <div class="title">表单字段展示</div>
    <div class="form-content">
      <m-form ref="form" :config="config" :init-values="initValue" size="small" height="100%"></m-form>
      <magic-code-editor class="code-editor-content" :init-values="config" @save="change"></magic-code-editor>
    </div>
  </div>

  <el-dialog v-model="resultVisible" title="result" append-to-body>
    <pre><code class="language-javascript hljs" v-html="result"></code></pre>
  </el-dialog>
</template>

<script lang="ts" setup>
import { markRaw, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Coin } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import { MenuButton } from '@tmagic/editor';
import { MForm } from '@tmagic/form';

import NavMenu from '../components/NavMenu.vue';

const router = useRouter();

const resultVisible = ref(false);
const result = ref('');
const form = ref<InstanceType<typeof MForm>>();

const diffFormConfig = ref([
  {
    type: 'tab',
    items: [
      {
        title: 'tab1',
        labelWidth: '80px',
        items: [
          {
            name: 'text1',
            text: '文本字段1',
          },
          {
            name: 'text2',
            text: '文本字段2',
          },
          {
            type: 'number',
            text: '计数器',
            name: 'number',
          },
        ],
      },
      {
        title: 'tab2',
        labelWidth: '80px',
        items: [
          {
            type: 'colorPicker',
            text: '取色器',
            name: 'colorPicker',
          },
        ],
      },
    ],
  },
]);

const currentVersion = ref({
  text1: '当前版本的文本内容',
  text2: '你好',
  number: 10,
  colorPicker: '#ffffff',
});

const lastVersion = ref({
  text1: '上一版本的文本内容',
  text2: '你好',
  number: 12,
  colorPicker: '#000000',
});

const config = ref([
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
    legend: '分组',
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
]);

const initValue = ref({
  text: '文本',
  number: 10,
  fieldset: {
    select: 1,
  },
  table: [
    { id: 1, name: 'a' },
    { id: 2, name: 'b' },
  ],
});

const menu: MenuButton[] = [
  {
    type: 'button',
    text: 'Editor Playground',
    handler: () => router.push('/'),
  },
  {
    type: 'button',
    text: 'Table Playground',
    handler: () => router.push('table'),
  },
  {
    type: 'button',
    text: '提交',
    icon: markRaw(Coin),
    handler: () => {
      submit();
    },
  },
];

async function submit() {
  try {
    const values = await form.value?.submitForm();
    resultVisible.value = true;
    result.value = JSON.stringify(values, null, 2);
  } catch (e: any) {
    console.error(e);
    ElMessage.error({
      duration: 10000,
      showClose: true,
      message: e.message,
      dangerouslyUseHTMLString: true,
    });
  }
}

function change(value: string) {
  try {
    // eslint-disable-next-line no-eval
    config.value = eval(value);
    ElMessage.success('更新成功');
  } catch (e: any) {
    ElMessage.error(e.message);
  }
}
</script>

<style lang="scss">
.diff-form {
  width: 500px;
  margin: 20px 0 0 50px;
}
.title {
  margin: 20px 0 0 50px;
}
.form-content {
  display: flex;
  height: 800px;

  .code-editor-content,
  .m-form {
    width: 50%;
  }

  .m-form {
    padding: 20px;
    overflow-y: auto;
    overflow-x: hidden;
  }
}
</style>
