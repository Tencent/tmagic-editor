import { defineComponent, h, inject, type PropType, provide } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import { Id, IS_DSL_NODE_KEY, MComponent } from '@tmagic/core';
import { useComponent, useComponentStatus, useNode, type UserRenderFunction } from '@tmagic/vue-runtime-help';

export default defineComponent({
  name: 'tmagic-container-item',

  props: {
    config: {
      type: Object as PropType<Omit<MComponent, 'id'>>,
      required: true,
    },
    index: Number,
    iteratorIndex: {
      type: Array as PropType<number[]>,
      default: () => [],
    },
    iteratorContainerId: {
      type: Array as PropType<Id[]>,
      default: () => [],
    },
    pageFragmentContainerId: {
      type: [String, Number] as PropType<Id>,
      default: '',
    },
  },

  setup(props) {
    const userRender = inject<UserRenderFunction>(
      'userRender',
      ({ h, type, props = {}, attrs = {}, style, className, on }) => {
        const options: Record<string, any> = {
          ...props,
          ...attrs,
          style,
          class: className,
        };
        if (on) {
          for (const [key, handler] of Object.entries(on)) {
            options[`on${key[0].toLocaleUpperCase()}${key.substring(1)}`] = handler;
          }
        }
        return h(type, options);
      },
    );

    const app = inject<TMagicApp>('app');
    const node = useNode(props);

    const componentStatusStore = useComponentStatus(props);

    provide('componentStatusStore', componentStatusStore);

    const { style, className } = componentStatusStore;

    return () => {
      if (props.config.visible === false) return null;
      if (props.config.condResult === false) return null;

      if (typeof props.config.display === 'function' && props.config.display({ app, node }) === false) {
        return null;
      }

      return userRender({
        h,
        config: props.config,
        type: useComponent({ componentType: props.config.type, app }),
        style: style.value,
        className: className.value,
        props: {
          config: { ...props.config, [IS_DSL_NODE_KEY]: true },
          containerIndex: props.index,
          iteratorIndex: props.iteratorIndex,
          iteratorContainerId: props.iteratorContainerId,
          pageFragmentContainerId: props.pageFragmentContainerId,
        },
        attrs: {
          'data-tmagic-id': props.config.id,
          'data-tmagic-iterator-index': props.iteratorIndex.join(',') || undefined,
          'data-tmagic-iterator-container-id': props.iteratorContainerId.join(',') || undefined,
          'data-tmagic-container-index': props.index,
          'data-tmagic-page-fragment-container-id': props.pageFragmentContainerId || undefined,
        },
      });
    };
  },
});
