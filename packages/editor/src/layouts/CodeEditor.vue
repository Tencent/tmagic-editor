<template>
  <div class="magic-code-editor">
    <Teleport to="body" :disabled="!fullScreen">
      <div :class="{ 'magic-code-editor-wrapper': true, 'full-screen': fullScreen }" :style="{ height: computeHeight }">
        <TMagicButton
          v-if="!disabledFullScreen"
          class="magic-code-editor-full-screen-icon"
          circle
          size="small"
          @click="fullScreenHandler"
          ><MIcon :icon="FullScreen"></MIcon
        ></TMagicButton>
        <div ref="codeEditor" class="magic-code-editor-content"></div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { FullScreen } from '@element-plus/icons-vue';
import { throttle } from 'lodash-es';
import serialize from 'serialize-javascript';

import { TMagicButton } from '@tmagic/design';

import MIcon from '@editor/components/Icon.vue';
import { getEditorConfig } from '@editor/utils/config';
import monaco from '@editor/utils/monaco-editor';

defineOptions({
  name: 'MEditorCodeEditor',
});

const props = withDefaults(
  defineProps<{
    initValues?: any;
    modifiedValues?: any;
    type?: 'diff';
    language?: string;
    options?: monaco.editor.IStandaloneEditorConstructionOptions;
    height?: string;
    autoSave?: boolean;
    parse?: boolean;
    disabledFullScreen?: boolean;
    autosize?: {
      minRows?: number;
      maxRows?: number;
    };
    editorCustomType?: string;
  }>(),
  {
    initValues: '',
    autoSave: true,
    language: 'javascript',
    options: () => ({
      tabSize: 2,
    }),
    parse: false,
    disabledFullScreen: false,
  },
);

const emit = defineEmits(['initd', 'save']);

const autoHeight = ref<string>('');
let cachedExtraHeight: number | null = null;

const computeHeight = computed(() => {
  if (fullScreen.value) {
    return '100%';
  }

  if (props.height) {
    return props.height;
  }

  if (props.autosize) {
    return autoHeight.value;
  }

  return '100%';
});

const calculateExtraHeight = (): number => {
  let extraHeight = 10; // 默认值

  if (vsEditor && codeEditorEl.value) {
    try {
      // 获取编辑器容器的总高度和内容区域高度
      const editorElement = codeEditorEl.value.querySelector('.monaco-editor');
      const scrollableElement = codeEditorEl.value.querySelector('.monaco-scrollable-element');

      if (editorElement && scrollableElement) {
        const editorRect = editorElement.getBoundingClientRect();
        const scrollableRect = scrollableElement.getBoundingClientRect();

        // 计算编辑器的边框、内边距等额外高度
        extraHeight = Math.max(editorRect.height - scrollableRect.height, 0);

        // 如果无法获取到有效的差值，使用编辑器配置中的相关选项
        if (extraHeight === 0) {
          const editorOptions = vsEditor.getOptions();
          const scrollBeyondLastLine = editorOptions.get(monaco.editor.EditorOption.scrollBeyondLastLine);
          const padding = editorOptions.get(monaco.editor.EditorOption.padding);
          const lineHeight = editorOptions.get(monaco.editor.EditorOption.lineHeight) || 20;

          extraHeight = (scrollBeyondLastLine ? lineHeight : 0) + (padding?.top || 0) + (padding?.bottom || 0) + 10; // 基础边距
        }
      }
    } catch (error) {
      // 如果获取失败，保持默认值
      console.warn('Failed to calculate editor extra height:', error);
    }
  }

  return extraHeight;
};

const setAutoHeight = (v = '') => {
  let lines = Math.max(v.split('\n').length, props.autosize?.minRows || 1);
  if (v) {
    if (props.autosize?.maxRows) {
      lines = Math.min(lines, props.autosize.maxRows);
    }
  }

  // 获取编辑器实际行高，如果编辑器还未初始化则使用默认值
  let lineHeight = 20;
  if (vsEditor) {
    const editorOptions = vsEditor.getOptions();
    lineHeight = editorOptions.get(monaco.editor.EditorOption.lineHeight) || 20;
  }

  // 获取缓存的额外高度，如果没有缓存则计算并缓存
  if (cachedExtraHeight === null) {
    cachedExtraHeight = calculateExtraHeight();
  }

  const newHeight = `${lines * lineHeight + cachedExtraHeight}px`;

  // 只有当高度真正改变时才更新
  if (autoHeight.value !== newHeight) {
    autoHeight.value = newHeight;

    // 高度变化后需要重新布局编辑器
    nextTick(() => {
      vsEditor?.layout();

      // 确保内容在可视区域内，滚动到顶部
      if (vsEditor) {
        vsEditor.setScrollTop(0);
        vsEditor.revealLine(1);
      }
    });
  }
};

const toString = (v: string | any, language: string): string => {
  let value: string;
  if (typeof v !== 'string') {
    if (language === 'json') {
      value = JSON.stringify(v, null, 2);
    } else {
      value = serialize(v, {
        space: 2,
        unsafe: true,
      }).replace(/"(\w+)":\s/g, '$1: ');
    }
  } else {
    value = v;
  }
  if (language === 'javascript' && value.startsWith('{') && value.endsWith('}')) {
    value = `(${value})`;
  }
  return value;
};

const parseCode = (v: string | any, language: string): any => {
  if (typeof v !== 'string') {
    return v;
  }

  if (language === 'json') {
    return JSON.parse(v);
  }

  return getEditorConfig('parseDSL')(v);
};

let vsEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let vsDiffEditor: monaco.editor.IStandaloneDiffEditor | null = null;

const values = ref('');
const loading = ref(false);
const codeEditorEl = useTemplateRef<HTMLDivElement>('codeEditor');

const resizeObserver = new globalThis.ResizeObserver(
  throttle((): void => {
    vsEditor?.layout();
    vsDiffEditor?.layout();
  }, 300),
);

const setEditorValue = (v: string | any, m: string | any) => {
  values.value = toString(v, props.language.toLocaleLowerCase());

  setAutoHeight(values.value);

  if (props.type === 'diff') {
    const originalModel = monaco.editor.createModel(values.value, 'text/javascript');
    const modifiedModel = monaco.editor.createModel(toString(m, props.language), 'text/javascript');
    const position = vsDiffEditor?.getPosition();
    const result = vsDiffEditor?.setModel({
      original: originalModel,
      modified: modifiedModel,
    });
    if (position) {
      vsDiffEditor?.setPosition(position);
      vsDiffEditor?.focus();
    }
    return result;
  }
  // 保存当前光标位置
  const position = vsEditor?.getPosition();
  const result = vsEditor?.setValue(values.value);
  // 恢复光标位置
  if (position) {
    vsEditor?.setPosition(position);
    vsEditor?.focus();
  }
  return result;
};

const getEditorValue = () =>
  (props.type === 'diff' ? vsDiffEditor?.getModifiedEditor().getValue() : vsEditor?.getValue()) || '';

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.keyCode === 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
    e.preventDefault();
    e.stopPropagation();
    const newValue = getEditorValue();
    values.value = newValue;
    emit('save', props.parse ? parseCode(newValue, props.language) : newValue);
  }
};

const init = async () => {
  if (!codeEditorEl.value) return;

  if (codeEditorEl.value.clientHeight === 0) {
    await nextTick();
  }

  // 重置缓存的额外高度，因为编辑器重新初始化
  cachedExtraHeight = null;

  const options = {
    value: values.value,
    language: props.language,
    theme: 'vs-dark',
    editorCustomType: props.editorCustomType,
    ...props.options,
  };

  if (props.type === 'diff') {
    vsDiffEditor = getEditorConfig('customCreateMonacoDiffEditor')(monaco, codeEditorEl.value, options);

    // 监听diff编辑器内容变化
    vsDiffEditor.getModifiedEditor().onDidChangeModelContent(() => {
      // 如果使用 autosize，内容变化时重新计算高度
      if (props.autosize) {
        setAutoHeight(getEditorValue());
      }
    });
  } else {
    vsEditor = getEditorConfig('customCreateMonacoEditor')(monaco, codeEditorEl.value, options);

    // 监听编辑器内容变化
    vsEditor.onDidChangeModelContent(() => {
      // 如果使用 autosize，内容变化时重新计算高度
      if (props.autosize) {
        setAutoHeight(getEditorValue());
      }
    });
  }

  setEditorValue(props.initValues, props.modifiedValues);

  emit('initd', vsEditor);
  codeEditorEl.value.addEventListener('keydown', handleKeyDown);

  if (props.type !== 'diff' && props.autoSave) {
    vsEditor?.onDidBlurEditorWidget(() => {
      const newValue = getEditorValue();
      if (values.value !== newValue) {
        values.value = newValue;
        emit('save', props.parse ? parseCode(newValue, props.language) : newValue);
      }
    });
  }

  resizeObserver.observe(codeEditorEl.value);
};

watch(
  () => props.initValues,
  (v, preV) => {
    if (v !== preV) {
      setEditorValue(props.initValues, props.modifiedValues);
    }
  },
  {
    deep: true,
    immediate: true,
  },
);

watch(
  () => props.options,
  (v) => {
    vsEditor?.updateOptions(v);
    vsDiffEditor?.updateOptions(v);
  },
  {
    deep: true,
  },
);

onMounted(async () => {
  loading.value = true;

  await init();

  loading.value = false;
});

onBeforeUnmount(() => {
  resizeObserver.disconnect();

  vsEditor?.dispose();
  vsDiffEditor?.dispose();

  vsEditor = null;
  vsDiffEditor = null;

  // 重置缓存
  cachedExtraHeight = null;
});
onUnmounted(() => {
  codeEditorEl.value?.removeEventListener('keydown', handleKeyDown);
});
const fullScreen = ref(false);
const fullScreenHandler = () => {
  fullScreen.value = !fullScreen.value;
  setTimeout(() => {
    vsEditor?.focus();
    vsEditor?.layout();
    vsDiffEditor?.focus();
    vsDiffEditor?.layout();
  });
};

defineExpose({
  values,

  getEditor() {
    return vsEditor || vsDiffEditor;
  },

  getVsEditor() {
    return vsEditor;
  },

  getVsDiffEditor() {
    return vsDiffEditor;
  },

  setEditorValue,
  getEditorValue,

  focus() {
    vsEditor?.focus();
    vsDiffEditor?.focus();
  },
});
</script>
