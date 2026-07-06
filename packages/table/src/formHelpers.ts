import type { ContainerChangeEventData } from '@tmagic/form';
import { setValueByKeyPath } from '@tmagic/utils';

export const applyInlineEditChange = (target: any, eventData: ContainerChangeEventData) => {
  if (eventData.changeRecords?.length) {
    for (const record of eventData.changeRecords) {
      if (record.propPath) {
        setValueByKeyPath(record.propPath, record.value, target);
      }
    }
  }
};
