import { emmetCSS, emmetHTML } from 'emmet-monaco-es';
import * as monaco from 'monaco-editor';

// 注册emmet插件
emmetHTML(monaco);
emmetCSS(monaco, ['css', 'scss']);

export default monaco;
