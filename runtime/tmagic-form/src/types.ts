import type { Ref } from 'vue';

import type { FormConfig, MForm, StageCore } from '@tmagic/editor';

export interface AppProps {
  stage: StageCore;
  fillConfig: (config: FormConfig, mForm: Ref<InstanceType<typeof MForm>>) => FormConfig;
}
