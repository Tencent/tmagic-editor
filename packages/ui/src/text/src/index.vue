<script lang="ts">
import { computed, defineComponent, getCurrentInstance, h, inject, PropType } from 'vue';

import { MComponentInstance, MText, MTextInstance } from '../../../src/types';
import useApp from '../../useApp';

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<MText>,
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
    const vm: MTextInstance = getCurrentInstance()?.proxy as MTextInstance;
    const hoc: MComponentInstance = inject('hoc');
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
      return h('div', { class: className }, [this.$slots?.default?.() || '']);
    }
    return h('div', {
      class: className,
      ...(this.displayText ? { innerHTML: this.displayText } : {}),
    });
  },
});
</script>
