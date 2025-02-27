import { defineComponent, h, inject, type PropType } from 'vue-demi';

import type TMagicApp from '@tmagic/core';
import { Id, IS_DSL_NODE_KEY, MComponent, toLine } from '@tmagic/core';
import { useComponent, type UserRenderFunction } from '@tmagic/vue-runtime-help';

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<MComponent>,
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
  },

  setup(props) {
    const userRender = inject<UserRenderFunction>('userRender', ({ h, type, props, attrs, style, className }) =>
      h(type, { ...props, ...attrs, style, class: className }),
    );

    const app = inject<TMagicApp>('app');

    return () =>
      userRender({
        h,
        config: props.config,
        type: useComponent({ componentType: props.config.type, app }),
        style: app?.transformStyle(props.config.style || {}),
        className: props.config.className
          ? `${props.config.className} magic-ui-${toLine(props.config.type)}`
          : `magic-ui-${toLine(props.config.type)}`,
        props: {
          config: { ...props.config, [IS_DSL_NODE_KEY]: true },
          containerIndex: props.index,
          iteratorIndex: props.iteratorIndex,
          iteratorContainerId: props.iteratorContainerId,
        },
        attrs: {
          'data-tmagic-id': props.config.id,
          'data-tmagic-iterator-index': props.iteratorIndex,
          'data-tmagic-iterator-container-id': props.iteratorContainerId,
          'data-container-index': props.index,
        },
      });
  },
});
