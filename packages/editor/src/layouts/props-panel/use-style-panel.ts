import { computed, type Ref, watch } from 'vue';

import { Protocol } from '@editor/services/storage';
import { Services } from '@editor/type';
import { MIN_CENTER_COLUMN_WIDTH, RIGHT_COLUMN_WIDTH_STORAGE_KEY } from '@editor/utils/const';

export const useStylePanel = (
  { uiService, storageService }: Pick<Services, 'uiService' | 'storageService'>,
  propsPanelWidth: Ref<number>,
) => {
  const showStylePanelStorageKey = 'props-panel-show-style-panel';
  const showStylePanelStorageValue = storageService.getItem(showStylePanelStorageKey, {
    protocol: Protocol.BOOLEAN,
  });

  if (typeof showStylePanelStorageValue === 'boolean') {
    uiService.set('showStylePanel', showStylePanelStorageValue);
  }

  const showStylePanel = computed(() => showStylePanelToggleButton.value && (uiService.get('showStylePanel') ?? true));

  const showStylePanelToggleButton = computed(() => uiService.get('frameworkRect').width >= 1280);

  watch(
    () => uiService.get('frameworkRect').width,
    () => {
      if (uiService.get('columnWidth').right < propsPanelWidth.value) {
        toggleStylePanel(false);
      }
    },
  );

  const toggleStylePanel = (showStylePanel: boolean) => {
    uiService.set('showStylePanel', showStylePanel);
    storageService.setItem(showStylePanelStorageKey, showStylePanel, { protocol: Protocol.BOOLEAN });

    const columnWidth = {
      ...uiService.get('columnWidth'),
    };

    if (showStylePanel) {
      columnWidth.right += propsPanelWidth.value;
      columnWidth.center -= propsPanelWidth.value;
    } else {
      columnWidth.right -= propsPanelWidth.value;
      columnWidth.center += propsPanelWidth.value;
    }

    if (columnWidth.center < 0) {
      columnWidth.right = columnWidth.right + columnWidth.center - MIN_CENTER_COLUMN_WIDTH;
      columnWidth.center = MIN_CENTER_COLUMN_WIDTH;

      propsPanelWidth.value = columnWidth.right / 2;
    }

    storageService.setItem(RIGHT_COLUMN_WIDTH_STORAGE_KEY, columnWidth.right, { protocol: Protocol.NUMBER });
    uiService.set('columnWidth', columnWidth);
  };

  return {
    showStylePanel,
    showStylePanelToggleButton,
    toggleStylePanel,
  };
};
