<template>
  <div style="width: 100%">
    <nav-menu :data="menu"></nav-menu>
    <div class="table-content">
      <m-table class="left-panel" :columns="columns" :data="data" :show-header="true"></m-table>
      <el-tabs class="right-panel" modelValue="columns">
        <el-tab-pane label="columns" name="columns">
          <magic-code-editor class="code-editor-content" :init-values="columns" @save="change"></magic-code-editor>
        </el-tab-pane>
        <el-tab-pane label="data" name="data">
          <magic-code-editor class="code-editor-content" :init-values="data" @save="changeData"></magic-code-editor>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { tMagicMessage } from '@tmagic/design';
import { MenuButton } from '@tmagic/editor';

import NavMenu from '../components/NavMenu.vue';

const router = useRouter();

const columns = ref([
  {
    type: 'expand',
    prop: 'b',
    table: [
      {
        prop: 'a',
        label: '1',
      },
    ],
  },
  {
    prop: 'a',
    label: '1231',
  },
]);

const data = ref([
  {
    a: 'a1',
    b: [
      {
        a: 1,
      },
    ],
  },
]);

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
    text: 'Form Playground',
    handler: () => router.push('form'),
  },
];

function change(value: string) {
  try {
    // eslint-disable-next-line no-eval
    columns.value = eval(value);
    tMagicMessage.success('更新成功');
  } catch (e: any) {
    tMagicMessage.error(e.message);
  }
}

function changeData(value: string) {
  try {
    // eslint-disable-next-line no-eval
    data.value = eval(value);
    tMagicMessage.success('更新成功');
  } catch (e: any) {
    tMagicMessage.error(e.message);
  }
}
</script>

<style lang="scss">
.table-content {
  display: flex;
  height: calc(100% - 35px);

  .right-panel,
  .left-panel {
    width: 50%;
  }

  .code-editor-content {
    height: calc(100vh - 100px);
  }
}
</style>
