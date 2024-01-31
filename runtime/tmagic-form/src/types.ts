import type { Ref } from 'vue';

import { type FormConfig, MForm } from '@tmagic/form';
import type StageCore from '@tmagic/stage';

export interface AppProps {
  stage: StageCore;
  fillConfig: (config: FormConfig, mForm: Ref<InstanceType<typeof MForm>>) => FormConfig;
}
