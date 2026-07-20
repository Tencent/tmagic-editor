<script lang="ts">
import { defineComponent, h, PropType, vShow, withDirectives } from 'vue';

import { TMagicButton, TMagicTooltip } from '@tmagic/design';

import { disabled, formatActionText as formatter } from './actionHelpers';
import { ColumnActionConfig } from './schema';

export default defineComponent({
  name: 'MTableActionButton',

  props: {
    action: {
      type: Object as PropType<ColumnActionConfig>,
      required: true,
    },
    row: {
      type: null as unknown as PropType<any>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    btnClass: {
      type: String,
      default: 'action-btn',
    },
    visible: {
      type: Boolean,
      default: true,
    },
  },

  emits: ['click'],

  setup(props, { emit }) {
    const onClick = () => emit('click', props.action, props.row, props.index);

    return () => {
      const button = withDirectives(
        h(
          TMagicButton,
          {
            class: props.btnClass,
            link: true,
            size: 'small',
            type: props.action.buttonType || 'primary',
            icon: props.action.icon,
            disabled: disabled(props.action.disabled, props.row),
            onClick,
          },
          () => h('span', { innerHTML: formatter(props.action.text, props.row) }),
        ),
        [[vShow, props.visible]],
      );

      if (!props.action.tooltip) {
        return button;
      }

      return h(
        TMagicTooltip,
        {
          placement: props.action.tooltipPlacement || 'top',
          content: props.action.tooltip,
        },
        () => button,
      );
    };
  },
});
</script>
