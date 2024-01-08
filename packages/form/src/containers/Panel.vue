<template>
  <TMagicCard
    v-if="items && items.length"
    class="box-card m-form-panel"
    :body-style="{ display: expand ? 'block' : 'none' }"
  >
    <template #header>
      <div style="width: 100%; display: flex; align-items: center">
        <TMagicButton style="padding: 0" link :icon="expand ? CaretBottom : CaretRight" @click="expand = !expand">
        </TMagicButton>
        <span v-if="config && config.extra" v-html="config.extra" class="m-form-tip"></span>
        <slot name="header">{{ filter(config.title) }}</slot>
      </div>
    </template>

    <div>
      <slot></slot>

      <div v-if="config.schematic" style="display: flex">
        <div style="flex: 1">
          <Container
            v-for="(item, index) in items"
            :key="item[mForm?.keyProp || '__key'] ?? index"
            :config="item"
            :model="name ? model[name] : model"
            :lastValues="name ? lastValues[name] : lastValues"
            :is-compare="isCompare"
            :prop="prop"
            :size="size"
            :disabled="disabled"
            :label-width="config.labelWidth || labelWidth"
            @change="changeHandler"
            @addDiffCount="onAddDiffCount()"
          ></Container>
        </div>

        <img class="m-form-schematic" :src="config.schematic" />
      </div>

      <template v-else>
        <Container
          v-for="(item, index) in items"
          :key="item[mForm?.keyProp || '__key'] ?? index"
          :config="item"
          :model="name ? model[name] : model"
          :lastValues="name ? lastValues[name] : lastValues"
          :is-compare="isCompare"
          :prop="prop"
          :size="size"
          :disabled="disabled"
          :label-width="config.labelWidth || labelWidth"
          @change="changeHandler"
          @addDiffCount="onAddDiffCount()"
        ></Container>
      </template>
    </div>
  </TMagicCard>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { CaretBottom, CaretRight } from '@element-plus/icons-vue';

import { TMagicButton, TMagicCard } from '@tmagic/design';

import { FormState, PanelConfig } from '../schema';
import { filterFunction } from '../utils/form';

import Container from './Container.vue';

defineOptions({
  name: 'MFormPanel',
});

const props = defineProps<{
  model: any;
  lastValues?: any;
  isCompare?: boolean;
  config: PanelConfig;
  name?: string;
  labelWidth?: string;
  prop?: string;
  size?: string;
  disabled?: boolean;
}>();

const emit = defineEmits(['change', 'addDiffCount']);

const mForm = inject<FormState | undefined>('mForm');

const expand = ref(props.config.expand !== false);

const items = computed(() => props.config.items);

const filter = (config: any) => filterFunction(mForm, config, props);

const changeHandler = () => emit('change', props.model);
const onAddDiffCount = () => emit('addDiffCount');
</script>
