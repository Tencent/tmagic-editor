<template>
  <TMagicRadioGroup size="small" v-model="viewerDevice" :class="viewerDevice" @change="deviceSelect">
    <TMagicRadioButton label="phone">Phone</TMagicRadioButton>
    <TMagicRadioButton label="pad">Pad</TMagicRadioButton>
    <TMagicRadioButton label="pc">PC</TMagicRadioButton>
  </TMagicRadioGroup>
</template>

<script lang="ts" setup>
import { computed, inject, nextTick, ref } from 'vue';

import Core from '@tmagic/core';
import { TMagicRadioButton, TMagicRadioGroup } from '@tmagic/design';
import type { Services } from '@tmagic/editor';
import { convertToNumber } from '@tmagic/utils';

import { DeviceType, uaMap } from '../const';

const services = inject<Services>('services');

const devH: Record<DeviceType, number | string> = {
  phone: 817,
  pad: 1024,
  pc: '100%',
};

const devW: Record<DeviceType, number | string> = {
  phone: 375,
  pad: 768,
  pc: '100%',
};

const getDeviceHeight = (viewerDevice: DeviceType) => devH[viewerDevice];

const getDeviceWidth = (viewerDevice: DeviceType) => devW[viewerDevice];

withDefaults(
  defineProps<{
    modelValue: {
      width: number;
      height: number;
    };
  }>(),
  {
    modelValue: () => ({
      width: 375,
      height: 817,
    }),
  },
);

const emit = defineEmits(['update:modelValue']);

const stageContainerRect = computed(() => services?.uiService.get('stageContainerRect'));

const calcFontsize = () => {
  if (!services) return;

  const iframe = services.editorService.get('stage')?.renderer.iframe;
  if (!iframe?.contentWindow) return;

  const app: Core = (iframe.contentWindow as any).appInstance;

  if (!app) return;

  app.setEnv(uaMap[viewerDevice.value]);

  if (app.env.isWeb) {
    const stageRect = services.uiService.get('stageRect');

    const stageWidth: number = convertToNumber(stageRect.width, convertToNumber(stageContainerRect.value?.width || 0));

    app.setDesignWidth(stageWidth);
  } else {
    app.setDesignWidth(375);
  }
};

const viewerDevice = ref(DeviceType.Phone);

const deviceSelect = async (device: DeviceType) => {
  const width = getDeviceWidth(device);
  const height = getDeviceHeight(device);
  emit('update:modelValue', {
    width,
    height,
  });

  await nextTick();
  calcFontsize();
};

defineExpose({
  viewerDevice,
});
</script>

<style lang="scss">
.m-editor-workspace {
  * {
    user-select: none;
  }

  .el-slider {
    position: absolute;
    bottom: 40px;
    left: 20px;
    width: 250px;
    opacity: 0.5;
    transition: opacity 1s;
  }

  .el-slider:hover {
    opacity: 1;
  }

  .el-radio-group {
    position: absolute;
    top: 10px;
    right: 40px;
    z-index: 10;
  }

  .viewer-scrollbar > .el-scrollbar__bar {
    display: none;
  }

  .select-component {
    text-align: center;
    transform: translate3d(0, -70px, 0);

    p {
      margin-top: 8px;
    }
  }

  .close-pop-button {
    position: absolute;
    left: 50%;
    transform: translate(-50%);
  }
}
</style>
