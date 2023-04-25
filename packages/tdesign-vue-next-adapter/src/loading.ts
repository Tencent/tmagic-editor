import type { Directive } from 'vue';
import { LoadingInstance, LoadingPlugin } from 'tdesign-vue-next';

export type LoadingBinding = boolean;

const INSTANCE_KEY = Symbol('TdesignLoading');

export interface ElementLoading extends HTMLElement {
  [INSTANCE_KEY]?: {
    instance: LoadingInstance;
  };
}

const createInstance = (el: ElementLoading) =>
  (el[INSTANCE_KEY] = {
    instance: LoadingPlugin({
      attach: () => el,
      showOverlay: true,
      size: '20px',
    }),
  });

export const vLoading: Directive<ElementLoading, LoadingBinding> = {
  mounted(el, binding) {
    const { value } = binding;
    if (value) {
      createInstance(el);
    }
  },

  updated(el, binding) {
    const instance = el[INSTANCE_KEY];
    if (binding.oldValue !== binding.value) {
      if (binding.value && !binding.oldValue) {
        createInstance(el);
      } else {
        instance?.instance.hide();
      }
    }
  },

  unmounted(el) {
    el[INSTANCE_KEY]?.instance.hide();
  },
};
