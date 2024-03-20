<template>
  <div style="width: 100%">
    <NavMenu :data="menu"></NavMenu>
    <div class="table-content">
      <MagicTable class="left-panel" :columns="columns" :data="data" :show-header="true"></MagicTable>
      <TMagicTabs class="right-panel" modelValue="columns">
        <TMagicTabPane label="columns" name="columns">
          <TMagicCodeEditor class="code-editor-content" :init-values="columns" @save="change"></TMagicCodeEditor>
        </TMagicTabPane>
        <TMagicTabPane label="data" name="data">
          <TMagicCodeEditor class="code-editor-content" :init-values="data" @save="changeData"></TMagicCodeEditor>
        </TMagicTabPane>
      </TMagicTabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { tMagicMessage, TMagicTabPane, TMagicTabs } from '@tmagic/design';
import { MenuButton, TMagicCodeEditor } from '@tmagic/editor';
import { type ColumnConfig, MagicTable } from '@tmagic/table';

import NavMenu from '../components/NavMenu.vue';

const router = useRouter();

const columns = ref<ColumnConfig[]>([
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
