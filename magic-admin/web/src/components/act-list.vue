<!-- 活动列表 -->
<template>
  <div>
    <el-card class="box-card" shadow="always">
      <template #header>
        <el-row :gutter="20">
          <el-col :span="2"><span>活动列表</span></el-col>
          <el-col :span="1">
            <el-button id="create" type="primary" @click="newHandler" size="small"> 新建活动 </el-button>
          </el-col>
          <el-col :span="3" :offset="9">
            <!-- 活动状态选项框 -->
            <el-select
              v-model="query.where.actStatus"
              placeholder="请选择状态"
              size="small"
              style="width: 100%"
              @change="actStatusChangeHandle"
            >
              <el-option label="全部活动" :value="-1"> </el-option>
              <el-option v-for="(value, index) in actStatus" :key="index" :label="value" :value="index"> </el-option>
            </el-select>
          </el-col>
          <el-col :span="6">
            <!-- 活动搜索框 -->
            <el-input
              v-model="query.where.search"
              placeholder="输入活动ID，活动名称，加密ID，创建人查询.."
              @change="searchChangeHandler"
              size="small"
            ></el-input>
          </el-col>
          <el-col :span="3">
            <el-input
              v-model="query.where.pageTitle"
              placeholder="页面标题"
              @change="pageTitleChangeHandler"
              size="small"
            ></el-input>
          </el-col>
        </el-row>
      </template>

      <m-table :data="tableData.res" :config="columns" @sort-change="sortChange" />

      <div class="bottom clearfix" style="margin-top: 10px; text-align: right">
        <el-pagination
          v-if="tableData.res?.total > 12"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="query.pgIndex + 1"
          :page-size="query.pgSize"
          :total="tableData.res.total"
          layout="total, sizes, prev, pager, next, jumper"
        >
        </el-pagination>
      </div>
    </el-card>

    <form-dialog
      title="新建活动"
      :visible="formDialogVisible"
      :values="actValues"
      :action="action"
      :config="formConfig"
      @afterAction="afterAction"
      @close="closeFormDialogHandler"
    ></form-dialog>
  </div>
</template>

<script lang="ts">
import { reactive, ref, toRefs } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { defineComponent, onMounted, watch } from '@vue/runtime-core';
import { ElMessage } from 'element-plus';
import Cookies from 'js-cookie';

import actApi, { ActListItem, ActListQuery, ActListRes, CopyInfo, OrderItem } from '@src/api/act';
import FormDialog from '@src/components/form-dialog.vue';
import MTable from '@src/components/table.vue';
import { getActListFormConfig } from '@src/config/act-list-config';
import { BlankActFormConfig } from '@src/config/blank-act-config';
import { ActStatus } from '@src/config/status';
import type { ActFormValue, ColumnItem } from '@src/typings';
import { status } from '@src/use/use-status';
import { Res } from '@src/util/request';
import { datetimeFormatter } from '@src/util/utils';

export default defineComponent({
  name: 'act-list',
  components: { FormDialog, MTable },

  setup() {
    const actStatus = [...status.actStatus];
    const pageStatus = [...status.pageStatus];
    const router = useRouter();
    const route = useRoute();
    const userName = Cookies.get('userName') ?? '';
    const query = reactive<ActListQuery>({
      where: {
        onlySelf: route.params.type === 'my',
        search: route.params.query,
        pageTitle: '',
        actStatus: route.params.status ? parseInt(route.params.status as string, 10) : ActStatus.ALL,
      },
      orderBy: [{ columnName: 'actId', direction: 'descending' }],
      pgIndex: +route.params.page,
      pgSize: 10,
      userName,
    });
    const actValues = reactive<{ data: ActFormValue }>({
      data: {
        operator: '',
        actBeginTime: '',
        actEndTime: '',
      },
    });
    const tableData = reactive<{ res: ActListRes }>({
      res: { data: [], fetch: false, errorMsg: '', total: 0 },
    });
    const formDialogVisible = ref<boolean>(false);
    // 更新活动列表
    const getActs = async () => {
      const res = await actApi.getList({
        data: query,
      });
      res?.fetch
        ? (tableData.res = res)
        : ElMessage({
            message: res?.errorMsg || '拉取活动列表失败',
            type: 'error',
            duration: 5000,
            showClose: true,
          });
    };
    const pageStatusFormatter = (v: string | number) => {
      if (typeof v === 'number') {
        return pageStatus[v];
      }
      return '';
    };
    const actStatusFormatter = (v: string | number) => {
      if (typeof v === 'number') {
        return actStatus[v];
      }
      return '';
    };
    const copyActHandler = async (row: ActListItem) => {
      if (row.operator !== userName) {
        ElMessage.error('复制失败!不是这个活动的创建人不能复制');
        return;
      }
      const copyInfo: CopyInfo = {
        actId: row.actId,
        userName: userName || '',
      };
      const res = await actApi.copyAct({ data: copyInfo });
      if (res?.ret === 0) {
        ElMessage.success(res.msg || '复制成功');
      } else {
        ElMessage.error(res?.msg || '复制失败');
      }
    };
    const copyActAfterHandler = async () => {
      await getActs();
    };
    const columns: ColumnItem[] = getActListFormConfig(
      pageStatusFormatter,
      actStatusFormatter,
      router,
      copyActHandler,
      copyActAfterHandler,
    );

    onMounted(async () => {
      await getActs();
      // 创建活动状态弹出创建活动对话框
      if (route.query.create) newHandler();
    });

    // 根据路由初始化查询字符串
    watch(
      () => route.path,
      async () => {
        const { type, page, query: queryStr, status } = route.params;
        tableData.res.fetch = false;
        query.where.onlySelf = type === 'my';
        query.pgIndex = +page;
        query.where.search = queryStr || '';
        query.where.actStatus = status ? parseInt(status as string, 10) : ActStatus.ALL;
        await getActs();
      },
    );

    // 活动查询
    const searchChangeHandler = () => {
      router.push(`/act/${route.params.type}/0/${query.where.actStatus}/${query.where.search}`);
    };

    // 翻页
    const handleCurrentChange = (val: number) => {
      router.push(`/act/${route.params.type}/${val - 1}/${query.where.actStatus}/${query.where.search}`);
    };

    // 活动状态筛选
    const actStatusChangeHandle = async (val: number) => {
      router.push(`/act/${route.params.type}/0/${val}/${query.where.search}`);
    };

    // 按页面标题查询
    const pageTitleChangeHandler = async () => {
      tableData.res.fetch = false;
      query.pgIndex = 0;
      await getActs();
    };

    // 排序
    const sortChange = async (column: { prop: string; order: string }) => {
      tableData.res.fetch = false;
      const orderItem: OrderItem = {
        columnName: column.prop,
        direction: column.order,
      };
      query.orderBy = [orderItem];
      await getActs();
    };

    // 页面容量变化
    const handleSizeChange = async (val: number) => {
      tableData.res.fetch = false;
      query.pgSize = val;
      await getActs();
    };

    // 创建新活动
    const newHandler = () => {
      actValues.data = {
        operator: userName || '',
        actBeginTime: datetimeFormatter(new Date()),
        actEndTime: datetimeFormatter(new Date()),
      };
      formDialogVisible.value = true;
    };

    const afterAction = (res: Res<{ actId: number }>) => {
      const { actId } = res.data as any;
      router.push(`/editor/${actId}`);
    };

    const closeFormDialogHandler = () => {
      formDialogVisible.value = false;
    };

    return {
      actStatus,
      columns,
      query,
      tableData,
      actValues: toRefs(actValues).data,
      formDialogVisible,
      formConfig: BlankActFormConfig,
      action: actApi.saveAct,
      searchChangeHandler,
      actStatusChangeHandle,
      pageTitleChangeHandler,
      sortChange,
      handleSizeChange,
      handleCurrentChange,
      afterAction,
      closeFormDialogHandler,
      newHandler,
    };
  },
});
</script>
