<script lang="ts">
import { computed, defineComponent, getCurrentInstance, h, inject, PropType } from 'vue';

import type { MComponent } from '@tmagic/schema';

import useApp from '../useApp';

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<MComponent>,
      default: () => ({}),
    },

    model: {
      type: Object,
      default: () => ({}),
    },

    vars: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    useApp(props);
    const vm = getCurrentInstance()?.proxy;
    const hoc: any = inject('hoc');
    const displayText = computed(() => {
      let text = props.config?.text || '';
      const { vars } = props;
      if (hoc?.disabled && props.config?.disabledText) {
        text = props.config.disabledText;
      }
      if (typeof text === 'function') {
        return text.bind(vm)(vm, { model: props.model });
      }
      if (Object.prototype.toString.call(vars) === '[object Object]') {
        let tmp: string = text;
        Object.entries(vars).forEach(([key, value]) => {
          tmp = tmp.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        return tmp;
      }
      return text || '';
    });

    return {
      displayText,
    };
  },

  render() {
    const className = this.config?.multiple ? 'magic-ui-text' : 'magic-ui-text magic-ui-text--single-line';
    if (typeof this.$slots?.default === 'function') {
      return h('p', { class: className }, [this.$slots?.default?.() || '']);
    }
    return h('p', {
      class: className,
      domProps: {
        innerHTML: this.displayText,
      },
    });
  },
});
</script>
