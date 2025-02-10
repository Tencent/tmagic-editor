import { computed } from 'vue';

import { Protocol } from '@editor/services/storage';
import { Services } from '@editor/type';

export const useStylePanel = (services?: Services) => {
  const showStylePanelStorageKey = 'props-panel-show-style-panel';
  const showStylePanelStorageValue = services?.storageService.getItem(showStylePanelStorageKey, {
    protocol: Protocol.BOOLEAN,
  });

  if (typeof showStylePanelStorageValue === 'boolean') {
    services?.uiService.set('showStylePanel', showStylePanelStorageValue);
  }

  const showStylePanel = computed(
    () => showStylePanelToggleButton.value && (services?.uiService.get('showStylePanel') ?? true),
  );

  const showStylePanelToggleButton = computed(
    () => !(services && services.uiService.get('frameworkRect').width < 1280),
  );

  const showStylePanelHandler = () => {
    services?.uiService.set('showStylePanel', true);
    services?.storageService.setItem(showStylePanelStorageKey, true, { protocol: Protocol.BOOLEAN });
  };

  const closeStylePanelHandler = () => {
    services?.uiService.set('showStylePanel', false);
    services?.storageService.setItem(showStylePanelStorageKey, false, { protocol: Protocol.BOOLEAN });
  };

  return {
    showStylePanel,
    showStylePanelToggleButton,
    showStylePanelHandler,
    closeStylePanelHandler,
  };
};
