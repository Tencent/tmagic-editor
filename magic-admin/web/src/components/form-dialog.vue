<!-- 新建活动对话框 -->
<template>
  <el-dialog
    custom-class="m-dialog"
    top="10%"
    :title="title"
    :model-value="dialogVisible"
    :appendToBody="true"
    :close-on-click-modal="false"
    :before-close="closeHandler"
  >
    <div class="m-dialog-body" :style="`max-height: ${bodyHeight}; overflow-y: auto; overflow-x: hidden;`">
      <m-form v-if="dialogVisible" ref="form" :config="config" :init-values="formInitValues"></m-form>
      <slot></slot>
    </div>

    <template #footer>
      <el-row class="dialog-footer">
        <el-col :span="12" style="text-align: left">
          <div style="min-height: 1px">
            <slot name="left"></slot>
          </div>
        </el-col>
        <el-col :span="12">
          <slot name="footer">
            <el-button @click="$emit('close')" size="small">取 消</el-button>
            <el-button type="primary" size="small" :loading="saveFetch" @click="save">确定</el-button>
          </slot>
        </el-col>
      </el-row>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue';
import { ElMessage } from 'element-plus';

import { MForm } from '@tmagic/form';

import type { ActFormValue, FormConfigItem } from '@src/typings';
import { Res } from '@src/util/request';

export default defineComponent({
  name: 'm-form-dialog',
  props: {
    values: {
      type: Object as PropType<ActFormValue>,
      default: () => ({}),
    },
    title: String,
    config: {
      type: Array as PropType<FormConfigItem[]>,
      default: () => [],
    },
    visible: {
      type: Boolean,
      default: () => false,
    },
    action: {
      type: Function as PropType<(options: { data: any }) => Res>,
    },
  },

  emits: ['afterAction', 'close'],

  setup(props, { emit }) {
    const form = ref<InstanceType<typeof MForm>>();
    const saveFetch = ref(false);
    const dialogVisible = computed(() => props.visible);
    const formInitValues = computed(() => props.values);
    // 关闭对话框
    const closeHandler = () => {
      emit('close');
      form.value?.resetForm();
    };

    // 保存活动
    const save = async () => {
      if (saveFetch.value) {
        return;
      }
      saveFetch.value = true;
      try {
        const values = await form.value?.submitForm();
        if (!values) {
          emit('close');
          return;
        }
        const res = await props.action?.({ data: values });
        if (res) {
          if (res.ret === 0) {
            ElMessage.success(res.msg || '保存成功');
            emit('close');
            emit('afterAction', res);
          } else {
            ElMessage({
              type: 'error',
              duration: 10000,
              showClose: true,
              dangerouslyUseHTMLString: true,
              message: res.msg || '保存失败',
            });
          }
        } else {
          emit('close');
        }
      } catch (e) {
        ElMessage({
          type: 'error',
          duration: 10000,
          showClose: true,
          message: (e as Error).message,
          dangerouslyUseHTMLString: true,
        });
      }
      saveFetch.value = false;
    };

    return {
      dialogVisible,
      saveFetch,
      form,
      formInitValues,
      bodyHeight: ref(`${document.body.clientHeight - 194}px`),
      closeHandler,
      save,
    };
  },
});
</script>

<style>
.m-dialog .el-dialog__body {
  padding: 0 !important;
}

.m-dialog .m-dialog-body {
  padding: 0 20px;
}
.el-table .m-form-item .el-form-item {
  margin-bottom: 0;
}
</style>
