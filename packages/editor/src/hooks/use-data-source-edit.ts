import { computed, ref } from 'vue';

import type { DataSourceSchema } from '@tmagic/schema';

import DataSourceConfigPanel from '@editor/layouts/sidebar/data-source/DataSourceConfigPanel.vue';
import type { DataSourceService } from '@editor/services/dataSource';

export const useDataSourceEdit = (dataSourceService?: DataSourceService) => {
  const dialogTitle = ref('');
  const editDialog = ref<InstanceType<typeof DataSourceConfigPanel>>();
  const dataSourceValues = ref<Record<string, any>>({});

  const editable = computed(() => dataSourceService?.get('editable') ?? true);

  const editHandler = (id: string) => {
    if (!editDialog.value) return;

    dataSourceValues.value = {
      ...dataSourceService?.getDataSourceById(id),
    };

    dialogTitle.value = `编辑${dataSourceValues.value.title || ''}`;

    editDialog.value.show();
  };

  const submitDataSourceHandler = (value: DataSourceSchema) => {
    if (value.id) {
      dataSourceService?.update(value);
    } else {
      dataSourceService?.add(value);
    }

    editDialog.value?.hide();
  };

  return {
    dialogTitle,
    editDialog,
    dataSourceValues,
    editable,

    editHandler,
    submitDataSourceHandler,
  };
};
