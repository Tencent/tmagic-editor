<template>
  <div ref="codeEditor" class="magic-code-editor"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import serialize from 'serialize-javascript';

import { asyncLoadJs } from '@tmagic/utils';

const initEditor = () => {
  if ((globalThis as any).monaco) {
    Promise.resolve((globalThis as any).monaco);
  }

  return asyncLoadJs(`https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/loader.min.js`).then(() => {
    (globalThis as any).require.config({
      paths: { vs: `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs` },
    });
    return new Promise((resolve) => {
      (globalThis as any).require(['vs/editor/editor.main'], () => {
        resolve((globalThis as any).monaco);
      });
    });
  });
};

const toString = (v: any, language: string): string => {
  let value = '';
  if (typeof v !== 'string') {
    value = serialize(v, {
      space: 2,
      unsafe: true,
    }).replace(/"(\w+)":\s/g, '$1: ');
  } else {
    value = v;
  }
  if (language === 'javascript' && value.startsWith('{') && value.endsWith('}')) {
    value = `(${value})`;
  }
  return value;
};

export default defineComponent({
  name: 'magic-code-editor',

  props: {
    initValues: {
      type: [String, Object],
    },

    modifiedValues: {
      type: [String, Object],
    },

    type: {
      type: [String],
      default: () => '',
    },

    language: {
      type: [String],
      default: () => 'javascript',
    },
  },

  emits: ['inited', 'save'],

  setup(props, { emit }) {
    let vsEditor: any = null;
    const values = ref('');
    const loading = ref(false);
    const codeEditor = ref<HTMLDivElement>();

    const setEditorValue = (v: any, m: any) => {
      values.value = toString(v, props.language);

      if (props.type === 'diff') {
        const originalModel = (globalThis as any).monaco.editor.createModel(values.value, 'text/javascript');
        const modifiedModel = (globalThis as any).monaco.editor.createModel(
          toString(m, props.language),
          'text/javascript',
        );

        return vsEditor.setModel({
          original: originalModel,
          modified: modifiedModel,
        });
      }

      return vsEditor.setValue?.(values.value);
    };

    const resizeHandler = () => {
      vsEditor?.layout();
    };

    const getEditorValue = () => vsEditor.getValue?.() || '';

    const init = async () => {
      if (!codeEditor.value) return;

      vsEditor = (globalThis as any).monaco.editor[props.type === 'diff' ? 'createDiffEditor' : 'create'](
        codeEditor.value,
        {
          value: values.value,
          language: props.language,
          tabSize: 2,
          theme: 'vs-dark',
          fontFamily: 'dm, Menlo, Monaco, "Courier New", monospace',
          fontSize: 15,
          formatOnPaste: true,
        },
      );

      setEditorValue(props.initValues, props.modifiedValues);

      loading.value = false;

      emit('inited', vsEditor);

      codeEditor.value.addEventListener('keydown', (e) => {
        if (e.keyCode === 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
          e.preventDefault();
          emit('save', getEditorValue());
        }
      });

      if (props.type !== 'diff') {
        vsEditor.onDidBlurEditorWidget(() => {
          emit('save', getEditorValue());
        });
      }

      globalThis.addEventListener('resize', resizeHandler);
    };

    watch(
      () => props.initValues,
      (v, preV) => {
        if (vsEditor && v !== preV) {
          setEditorValue(props.initValues, props.modifiedValues);
        }
      },
      {
        deep: true,
        immediate: true,
      },
    );

    onMounted(async () => {
      loading.value = true;

      await initEditor();
      if (!(globalThis as any).monaco) {
        const interval = setInterval(() => {
          if ((globalThis as any).monaco) {
            clearInterval(interval);
            init();
          }
        }, 300);
      } else {
        init();
      }
    });

    onUnmounted(() => {
      globalThis.removeEventListener('resize', resizeHandler);
    });

    return {
      values,
      loading,
      codeEditor,

      getEditor() {
        return vsEditor;
      },

      setEditorValue,

      focus() {
        vsEditor.focus();
      },
    };
  },
});
</script>
