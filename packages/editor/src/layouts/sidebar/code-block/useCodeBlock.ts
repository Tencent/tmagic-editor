import { reactive } from 'vue';

import { CodeBlockConfig } from '../../../type';
interface State {
  /** 是否展示代码块编辑区 */
  isShowCodeBlockEditor: boolean;
  /** 代码块配置 */
  codeConfig: CodeBlockConfig | null;
}

const state = reactive<State>({
  isShowCodeBlockEditor: false,
  codeConfig: null,
});

const getUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// 关闭代码块面板
const closePanel = () => (state.isShowCodeBlockEditor = false);

// 新增代码块
const createCodeBlock = () => {
  // todo 如果已有代码块打开，需要先保存关闭
  closePanel();
  state.isShowCodeBlockEditor = true;
  state.codeConfig = {
    id: getUniqueId(),
    name: '代码块',
    content: `(app) => {\n  // place your code here\n}`,
  };
};

export default () => ({
  state,
  closePanel,
  createCodeBlock,
});
