import type { FormConfig } from '@tmagic/form';

import checkbox from './checkbox';
import display from './display';
import number from './number';
import switchConfig from './switch';
import text from './text';

const configs: Record<string, FormConfig> = {
  text,
  checkbox,
  display,
  number,
  switch: switchConfig,
};

export default configs;
