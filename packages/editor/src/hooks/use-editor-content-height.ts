import { computed, inject, ref, watchEffect } from 'vue';

import type { Services } from '@editor/type';

export const useEditorContentHeight = () => {
  const services = inject<Services>('services');
  const frameworkHeight = computed(() => services?.uiService.get('frameworkRect').height || 0);
  const navMenuHeight = computed(() => services?.uiService.get('navMenuRect').height || 0);
  const editorContentHeight = computed(() => frameworkHeight.value - navMenuHeight.value);

  const height = ref(0);
  watchEffect(() => {
    if (height.value > 0) return;
    height.value = editorContentHeight.value;
  });

  return {
    height,
  };
};
