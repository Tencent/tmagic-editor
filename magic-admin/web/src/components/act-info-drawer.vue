<!-- 活动配置抽屉页 -->
<template>
  <el-button ref="showActInfo" size="small" text :icon="Setting" @click="buttonHandler()">活动配置</el-button>
  <teleport to="body">
    <el-drawer
      ref="actDrawer"
      custom-class="magic-editor-app-drawer"
      title="活动配置"
      v-model="appDrawerVisibility"
      :direction="direction"
      size="600px"
    >
      <m-form
        size="small"
        ref="configForm"
        :init-values="values"
        :config="config"
        @change="configChangeHandler"
      ></m-form>
    </el-drawer>
  </teleport>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref, watch } from 'vue';
import { Setting } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import { drawerFormConfig } from '@src/config/drawer-config';
import magicStore from '@src/store/index';
import type { PageInfo } from '@src/typings';

export default defineComponent({
  name: 'act-info-drawer',
  setup() {
    const configForm = ref<any>();
    const appDrawerVisibility = ref(false);
    const pagesName = ref<string[]>([]);
    const pages = computed<PageInfo[]>(() => magicStore.get('pages'));
    const drawerForm = drawerFormConfig(pagesName);
    const config = ref(drawerForm);
    const configChangeHandler = async function () {
      try {
        const values = await configForm.value.submitForm();
        magicStore.set('actInfo', values);
      } catch (e: any) {
        ElMessage({
          type: 'error',
          duration: 10000,
          showClose: true,
          message: e.message,
          dangerouslyUseHTMLString: true,
        });
      }
    };
    const buttonHandler = () => {
      appDrawerVisibility.value = true;
    };

    watch(appDrawerVisibility, (visible: boolean) => {
      if (visible) {
        nextTick(() => configForm.value);
        pages.value.forEach((page) => {
          pagesName.value.push(page.pageName);
        });
      }
    });

    return {
      Setting,
      appDrawerVisibility,
      direction: 'rtl',
      config,
      configForm,
      values: computed(() => magicStore.get('actInfo')),
      configChangeHandler,
      buttonHandler,
    };
  },
});
</script>

<style lang="scss">
.magic-editor-app-drawer {
  // 解决element-ui的bug：https://github.com/ElemeFE/element/issues/18448
  &:focus {
    outline: none !important;
    box-shadow: none !important;
  }
  *:focus {
    outline: none !important;
    box-shadow: none !important;
  }
  .el-drawer {
    overflow-y: scroll;
    &::-webkit-scrollbar {
      width: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: #d8d8d8;
      border-radius: 10px;
    }
    &::-webkit-scrollbar-track-piece {
      background: transparent;
    }
    &:focus {
      outline-color: #ffffff;
    }
  }
  &__form {
    min-height: 100%;
    padding: 0 10px;

    .el-form-item {
      margin-bottom: 10px;
    }

    .el-form-item__error {
      padding: 0;
    }

    .tool-bar {
      border-top: 1px solid #d8dee8;
      background-color: #f8fbff;
      height: 40px;
      padding: 6px;
      text-align: right;
    }
  }
}
</style>
