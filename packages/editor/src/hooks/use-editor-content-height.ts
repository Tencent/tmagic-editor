import { computed, ref, watch } from 'vue';

import { useServices } from './use-services';

export const useEditorContentHeight = () => {
  const { uiService } = useServices();
  const frameworkHeight = computed(() => uiService.get('frameworkRect').height);
  const navMenuHeight = computed(() => uiService.get('navMenuRect').height);
  const editorContentHeight = computed(() => frameworkHeight.value - navMenuHeight.value);

  const height = ref(0);
  watch(
    editorContentHeight,
    () => {
      if (height.value > 0 && height.value === editorContentHeight.value) return;
      height.value = editorContentHeight.value;
    },
    {
      immediate: true,
    },
  );

  return {
    height,
  };
};
