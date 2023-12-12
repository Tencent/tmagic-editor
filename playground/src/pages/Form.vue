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

  <TMagicDialog v-model="resultVisible" title="result" append-to-body>
    <pre><code class="language-javascript hljs" v-html="result"></code></pre>
  </TMagicDialog>
</template>

<script lang="ts" setup>
import { markRaw, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Coin } from '@element-plus/icons-vue';

import { TMagicDialog, tMagicMessage } from '@tmagic/design';
import { MenuButton } from '@tmagic/editor';
import { MForm } from '@tmagic/form';

import NavMenu from '../components/NavMenu.vue';
import formDsl from '../configs/formDsl';

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

const config = ref(formDsl);

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
    text: 'Form Editor Playground',
    handler: () => router.push('form-editor'),
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
    tMagicMessage.error(e.message);
  }
}

function change(value: string) {
  try {
    // eslint-disable-next-line no-eval
    config.value = eval(value);
    tMagicMessage.success('更新成功');
  } catch (e: any) {
    tMagicMessage.error(e.message);
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
