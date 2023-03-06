<!-- 活动发布确认弹窗 -->
<template>
  <el-button size="small" text :icon="View" @click="buttonHandler()">发布</el-button>
  <el-dialog append-to-body title="确认以下发布信息" v-model="publishPageListVisible">
    <div class="publish-page-container">
      <el-row>请勾选需要发布的页面：</el-row>
      <el-checkbox
        class="publish-page-title"
        :indeterminate="isIndeterminate"
        v-model="checkAll"
        @change="handleCheckAllChange"
        >全选</el-checkbox
      >
      <div style="margin: 15px 0"></div>
      <el-checkbox-group v-model="checkedPages" @change="handleCheckedPagesChange">
        <el-checkbox v-for="page in pageList" :label="page" :key="page">
          <div class="publish-page-title">{{ page }}</div>
        </el-checkbox>
      </el-checkbox-group>
      <el-row class="publish-page-tip">
        <p v-if="tipVisible">* 请选择需要发布的页面</p>
      </el-row>
    </div>
    <el-row :gutter="20">
      <el-col :span="8" :push="16" class="publish-page-button-group">
        <el-button @click="handlePageCheckCancel">取消</el-button>
        <el-button type="primary" @click="handlePageCheckConfirm" :disabled="tipVisible">确认</el-button>
      </el-col>
    </el-row>
  </el-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, toRefs, watch } from 'vue';
import { useRoute } from 'vue-router';
import { View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import { editorService } from '@tmagic/editor';
import { MPage } from '@tmagic/schema';

import publishApi from '@src/api/publish';
import magicStore from '@src/store/index';
import type { ABTest, ActInfo, EditorInfo } from '@src/typings';
import { Res } from '@src/util/request';
import { serializeConfig } from '@src/util/utils';

import { publishHandler } from '../use/use-publish';

interface PageList {
  checkAll: boolean;
  isIndeterminate: boolean;
  pageList: string[];
  checkedPages: string[];
}
export default defineComponent({
  name: 'publish-page-list',
  setup() {
    const route = useRoute();
    const root = computed(() => editorService.get('root'));
    const publishPageListVisible = ref(false);
    const tipVisible = computed(() => state.checkedPages.length === 0);
    const state = reactive<PageList>({
      checkAll: true,
      isIndeterminate: false,
      pageList: [],
      checkedPages: [],
    });

    const handleCheckAllChange = (val: string[]) => {
      state.checkedPages = val ? [...state.pageList] : [];
      state.isIndeterminate = false;
    };
    const handleCheckedPagesChange = (value: string[]) => {
      const checkedCount = value.length;
      state.checkAll = checkedCount === state.pageList.length;
      state.isIndeterminate = checkedCount > 0 && checkedCount < state.pageList.length;
    };
    const handlePageCheckCancel = () => {
      getPageName();
      state.checkAll = true;
      state.isIndeterminate = false;
      publishPageListVisible.value = false;
    };
    const handlePageCheckConfirm = async () => {
      const root = computed(() => editorService.get('root'));
      const rootInfo = root.value as EditorInfo;
      const rootInfoString = serializeConfig(rootInfo);
      const res: Res = await publishApi.publishPage({
        data: {
          actId: Number(route.params.actId),
          publishPages: state.checkedPages,
          rootInfo: rootInfoString,
        },
      });
      if (res.ret === 0) {
        ElMessage.success({
          message: res.msg,
          type: 'success',
        });
        publishPageListVisible.value = false;
      } else {
        ElMessage.error(res.msg);
      }
    };
    const getPageName = () => {
      // 从magic-editor root 拿到最新的页面名字
      state.pageList = [];
      root.value?.items.forEach((item: MPage) => {
        state.pageList.push(item.name as string);
      });
      const actInfo = magicStore.get('actInfo') as ActInfo;
      actInfo?.abTest?.forEach((ABTestItem: ABTest) => {
        state.pageList.push(ABTestItem.name);
      });
      state.checkedPages = [...state.pageList];
    };

    watch(publishPageListVisible, (visible: boolean) => {
      if (visible) {
        getPageName();
      }
    });

    return {
      View,
      publishPageListVisible,
      tipVisible,
      ...toRefs(state),
      handleCheckAllChange,
      handleCheckedPagesChange,
      handlePageCheckCancel,
      handlePageCheckConfirm,

      async buttonHandler() {
        const isSave = await publishHandler();
        if (isSave) {
          publishPageListVisible.value = true;
        }
      },
    };
  },
});
</script>

<style scoped>
.publish-page-title {
  margin: 15px 0;
}
.publish-page-container {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 15px;
  border-radius: 4px;
}
.publish-page-button-group {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}
</style>
