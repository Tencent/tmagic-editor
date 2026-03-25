import { inject } from 'vue';

import type { Services } from '@editor/type';

export const useServices = () => {
  const services = inject<Services>('services');

  if (!services) {
    throw new Error('services is required');
  }

  return services;
};
