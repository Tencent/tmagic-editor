<template>
  <div>
    <el-dialog
      v-model="dialogVisible"
      custom-class="m-form-dialog"
      top="20px"
      :title="title"
      :appendToBody="true"
      :width="width"
      :fullscreen="fullscreen"
      :close-on-click-modal="false"
      @close="closeHandler"
    >
      <div class="m-dialog-body" :style="`max-height: ${bodyHeight}; overflow-y: auto; overflow-x: hidden;`">
        <m-form
          v-model="stepActive"
          ref="form"
          :size="size"
          :config="config"
          :init-values="values"
          :label-width="labelWidth"
          @change="changeHandler"
        ></m-form>
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
              <el-button @click="cancel" size="small">取 消</el-button>
              <el-button v-if="hasStep && stepActive > 1" type="info" size="small" @click="preStep">上一步</el-button>
              <el-button v-if="hasStep && stepCount > stepActive" type="info" size="small" @click="nextStep"
                >下一步</el-button
              >
              <el-button v-else type="primary" size="small" :loading="saveFetch" @click="save">{{
                confirmText
              }}</el-button>
            </slot>
          </el-col>
        </el-row>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue';

import Form from './Form.vue';
import { FormConfig, StepConfig } from './schema';

export default defineComponent({
  name: 'm-form-dialog',

  props: {
    values: {
      type: Object,
      default: () => ({}),
    },

    width: [Number, String],

    fullscreen: Boolean,

    title: String,

    config: {
      type: Array as PropType<FormConfig>,
      required: true,
      default: () => [],
    },

    labelWidth: [Number, String],

    size: String as PropType<'small' | 'default' | 'large'>,

    confirmText: {
      type: String,
      default: '确定',
    },
  },

  emits: ['close', 'submit', 'error', 'change'],

  setup(props, { emit }) {
    const form = ref<InstanceType<typeof Form>>();
    const dialogVisible = ref(false);
    const saveFetch = ref(false);
    const stepActive = ref(1);
    const bodyHeight = ref(`${document.body.clientHeight - 194}px`);

    const stepCount = computed(() => {
      const { length } = props.config;
      for (let index = 0; index < length; index++) {
        if (props.config[index].type === 'step') {
          return (props.config[index] as StepConfig).items.length;
        }
      }
      return 0;
    });

    const hasStep = computed(() => {
      const { length } = props.config;
      for (let index = 0; index < length; index++) {
        if (props.config[index].type === 'step') {
          return true;
        }
      }

      return false;
    });

    const cancel = () => {
      dialogVisible.value = false;
    };

    const closeHandler = () => {
      stepActive.value = 1;
      emit('close');
    };

    const save = async () => {
      try {
        const values = await form.value?.submitForm();
        emit('submit', values);
      } catch (e) {
        emit('error', e);
      }
    };

    const preStep = () => {
      stepActive.value -= 1;
    };

    const nextStep = () => {
      stepActive.value += 1;
    };

    const changeHandler = (value: any) => {
      emit('change', value);
    };

    return {
      form,
      saveFetch,
      stepActive,
      dialogVisible,
      bodyHeight,
      stepCount,
      hasStep,
      cancel,
      closeHandler,
      save,
      preStep,
      nextStep,
      changeHandler,
    };
  },
});
</script>
