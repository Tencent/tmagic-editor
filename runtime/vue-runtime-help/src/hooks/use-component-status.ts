import { computed, inject, onScopeDispose, ref, shallowReactive, watchEffect } from 'vue-demi';

import type TMagicCore from '@tmagic/core';
import { type MComponent, type StyleSchema, toLine } from '@tmagic/core';

export interface StatusData {
  style?: StyleSchema;
  className?: string;
  [key: string]: any;
}

export const useComponentStatus = (props: { config: Omit<MComponent, 'id'> }) => {
  const app = inject<TMagicCore>('app');

  const status = ref('default');
  const styleStatusMap = new Map<string, StyleSchema>();
  const classStatusMap = new Map<string, string>();
  const statusMap = new Map<string, Omit<StatusData, 'style' | 'className'>>();

  const setStatus = (value: string) => {
    status.value = value;
  };

  const registerStatus = (type: string, { style, className, ...data }: StatusData) => {
    if (style) {
      styleStatusMap.set(type, style);
    }

    if (className) {
      classStatusMap.set(type, className);
    }

    statusMap.set(type, shallowReactive(data));
  };

  watchEffect(() => {
    registerStatus('default', {
      style: props.config.style,
      className: props.config.className,
    });
  });

  onScopeDispose(() => {
    statusMap.clear();
  });

  return {
    status: computed(() => status.value),

    style: computed(() => {
      const type = status.value || 'default';
      const defaultStyle = styleStatusMap.get('default') || {};
      const statusStyle = styleStatusMap.get(type);

      let style = app?.transformStyle(defaultStyle) || {};

      if (type !== 'default' && statusStyle) {
        style = Object.keys(statusStyle).reduce((obj, key) => {
          const value = statusStyle[key];
          if (value === null || typeof value === 'undefined' || isNaN(value) || value === '') {
            return {
              ...obj,
              [key]: statusStyle[key],
            };
          }
          return { ...obj };
        }, style);
      }

      if (props.config.displayHidden) {
        style.display = 'none';
      }

      if (typeof props.config.condResult !== 'undefined' && props.config.displayRenderModel === 'mount') {
        if (props.config.condResult === false) {
          style.display = 'none';
        }
      }

      return style;
    }),

    className: computed(() => {
      const type = status.value || 'default';
      const className = classStatusMap.get(type) ?? '';

      const list = [];

      if (props.config.type) {
        list.push(`magic-ui-${toLine(props.config.type)}`);
      }

      if (props.config.layout) {
        list.push(`magic-layout-${props.config.layout}`);
      }

      if (className) {
        list.push(className);
      }

      return list.join(' ');
    }),

    setStatus,

    registerStatus,
  };
};
