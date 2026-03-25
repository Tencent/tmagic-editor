import { ref } from 'vue';

import { asyncLoadJs } from '@tmagic/editor';

const { VITE_ENTRY_PATH } = import.meta.env;

export const useEditorRes = () => {
  const propsValues = ref<Record<string, any>>({});
  const propsConfigs = ref<Record<string, any>>({});
  const eventMethodList = ref<Record<string, any>>({});
  const datasourceConfigs = ref<Record<string, any>>({});
  const datasourceValues = ref<Record<string, any>>({});

  const datasourceEventMethodList = ref<Record<string, any>>({
    base: {
      events: [],
      methods: [],
    },
  });

  asyncLoadJs(`${VITE_ENTRY_PATH}/config/index.umd.cjs`).then(() => {
    propsConfigs.value = (globalThis as any).magicPresetConfigs;
  });
  asyncLoadJs(`${VITE_ENTRY_PATH}/value/index.umd.cjs`).then(() => {
    propsValues.value = (globalThis as any).magicPresetValues;
  });
  asyncLoadJs(`${VITE_ENTRY_PATH}/event/index.umd.cjs`).then(() => {
    eventMethodList.value = (globalThis as any).magicPresetEvents;
  });
  asyncLoadJs(`${VITE_ENTRY_PATH}/ds-config/index.umd.cjs`).then(() => {
    datasourceConfigs.value = (globalThis as any).magicPresetDsConfigs;
  });
  asyncLoadJs(`${VITE_ENTRY_PATH}/ds-value/index.umd.cjs`).then(() => {
    datasourceValues.value = (globalThis as any).magicPresetDsValues;
  });

  return {
    propsValues,
    propsConfigs,
    eventMethodList,
    datasourceConfigs,
    datasourceValues,
    datasourceEventMethodList,
  };
};
