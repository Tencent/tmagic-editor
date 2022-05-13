<template>
  <a v-if="config.href && !disabled" target="_blank" :href="href" :style="config.css || {}">{{ displayText }}</a>
  <span v-else-if="config.href && disabled" :style="config.disabledCss || {}">{{ displayText }}</span>
  <div v-else class="m-fields-link">
    <el-button text type="primary" @click="editHandler">点击编辑</el-button>
    <m-form-dialog
      ref="editor"
      :title="config.formTitle || '编辑扩展配置'"
      :width="config.formWidth"
      :values="formValue"
      :config="formConfig"
      :parentValues="values"
      :fullscreen="config.fullscreen"
      @submit="action"
    ></m-form-dialog>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, ref } from 'vue';

import FormDialog from '../FormDialog.vue';
import { FormState, LinkConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

export default defineComponent({
  name: 'm-fields-link',

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<LinkConfig>,
      required: true,
    },
  },

  emits: ['change'],

  setup(props, { emit }) {
    useAddField(props.prop);

    const formValue = ref({});
    const editor = ref<InstanceType<typeof FormDialog>>();
    const mForm = inject<FormState | undefined>('mForm');

    const href = computed(() => {
      if (typeof props.config.href === 'function' && props.model) {
        return props.config.href(props.model);
      }
      return props.config.href || props.model?.[props.name];
    });

    const init = () => {
      formValue.value = props.model?.[props.name] || {};
    };

    return {
      // ref
      formValue,
      editor,

      // computed methods
      href,

      formConfig: computed(() => {
        if (typeof props.config.form === 'function') {
          return props.config.form(mForm, {
            model: props.model || {},
            values: props.values || {},
          });
        }
        return props.config.form;
      }),

      disable: computed(() => {
        if (typeof props.config.disabled !== 'undefined') {
          return props.config.disabled;
        }
        return !href.value;
      }),

      displayText: computed(() => {
        if (typeof props.config.displayText === 'function') {
          return props.config.displayText(mForm, { model: props.model || {} });
        }
        if (props.config.displayText) {
          return props.config.displayText;
        }
        return '跳转';
      }),

      // methods
      init,

      editHandler: () => {
        init();
        editor.value && (editor.value.dialogVisible = true);
      },

      action: (data: any) => {
        if (props.model) {
          props.model[props.name] = data;
          formValue.value = data;
          emit('change', props.model[props.name]);
        }
        editor.value && (editor.value.dialogVisible = false);
      },
    };
  },
});
</script>
