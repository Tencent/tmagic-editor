<template>
  <el-card
    v-if="items && items.length"
    class="box-card m-form-panel"
    :body-style="{ display: expand ? 'block' : 'none' }"
  >
    <template #header>
      <div class="clearfix">
        <a href="javascript:" style="width: 100%; display: block" @click="expand = !expand">
          <el-icon><caret-bottom v-if="expand" /><caret-right v-else /></el-icon> {{ filter(config.title) }}
          <span v-if="config && config.extra" v-html="config.extra" class="m-form-tip"></span>
        </a>
      </div>
    </template>

    <div>
      <slot></slot>

      <div v-if="config.schematic" style="display: flex">
        <div style="flex: 1">
          <m-form-container
            v-for="(item, index) in items"
            :key="item[mForm?.keyProp || '__key'] ?? index"
            :config="item"
            :model="name ? model[name] : model"
            :prop="prop"
            :size="size"
            :label-width="config.labelWidth || labelWidth"
            @change="changeHandler"
          ></m-form-container>
        </div>

        <img class="m-form-schematic" :src="config.schematic" />
      </div>

      <template v-else>
        <m-form-container
          v-for="(item, index) in items"
          :key="item[mForm?.keyProp || '__key'] ?? index"
          :config="item"
          :model="name ? model[name] : model"
          :prop="prop"
          :size="size"
          :label-width="config.labelWidth || labelWidth"
          @change="changeHandler"
        ></m-form-container>
      </template>
    </div>
  </el-card>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, ref } from 'vue';
import { CaretBottom, CaretRight } from '@element-plus/icons-vue';

import { FormState, PanelConfig } from '../schema';
import { filterFunction } from '../utils/form';

export default defineComponent({
  name: 'm-form-panel',

  components: { CaretBottom, CaretRight },

  props: {
    labelWidth: String,

    model: {
      type: Object,
      default: () => ({}),
    },

    config: {
      type: Object as PropType<PanelConfig>,
      default: () => ({}),
    },

    prop: String,

    size: String,

    name: String,
  },

  emits: ['change'],

  setup(props, { emit }) {
    const mForm = inject<FormState | undefined>('mForm');

    const expand = ref(props.config.expand !== false);

    const items = computed(() => props.config.items);

    const filter = (config: any) => filterFunction(mForm, config, props);

    const changeHandler = () => emit('change', props.model);

    return {
      mForm,
      expand,
      items,
      filter,
      changeHandler,
    };
  },
});
</script>
