import { computed } from 'vue';

import { Protocol } from '@editor/services/storage';
import { Services } from '@editor/type';

export const useStylePanel = ({ uiService, storageService }: Pick<Services, 'uiService' | 'storageService'>) => {
  const showStylePanelStorageKey = 'props-panel-show-style-panel';
  const showStylePanelStorageValue = storageService.getItem(showStylePanelStorageKey, {
    protocol: Protocol.BOOLEAN,
  });

  if (typeof showStylePanelStorageValue === 'boolean') {
    uiService.set('showStylePanel', showStylePanelStorageValue);
  }

  const showStylePanel = computed(() => showStylePanelToggleButton.value && (uiService.get('showStylePanel') ?? true));

  const showStylePanelToggleButton = computed(() => uiService.get('frameworkRect').width >= 1280);

  const showStylePanelHandler = () => {
    uiService.set('showStylePanel', true);
    storageService.setItem(showStylePanelStorageKey, true, { protocol: Protocol.BOOLEAN });
  };

  const closeStylePanelHandler = () => {
    uiService.set('showStylePanel', false);
    storageService.setItem(showStylePanelStorageKey, false, { protocol: Protocol.BOOLEAN });
  };

  return {
    showStylePanel,
    showStylePanelToggleButton,
    showStylePanelHandler,
    closeStylePanelHandler,
  };
};
