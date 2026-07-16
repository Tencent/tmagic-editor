let cached: Promise<typeof import('monaco-editor')> | undefined;

// 是否为 Monaco 内部抛出的取消错误（Canceled）
// 销毁编辑器时，WordHighlighter 内部挂起的 Delayer 会被取消，
// 取消时 reject 出的 Canceled 错误没有 catch，会变成 "Uncaught (in promise) Canceled"，
// 该错误本身无害，这里做一次性、全局的兜底处理，仅吞掉这类取消错误。
const isMonacoCanceledError = (reason: any): boolean => {
  if (!reason) return false;
  if (reason instanceof Error) {
    return reason.name === 'Canceled' || reason.message === 'Canceled';
  }
  return reason === 'Canceled';
};

let canceledRejectionHandlerInstalled = false;
const installCanceledRejectionHandler = () => {
  if (canceledRejectionHandlerInstalled || typeof globalThis.addEventListener !== 'function') return;
  canceledRejectionHandlerInstalled = true;

  globalThis.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (isMonacoCanceledError(event.reason)) {
      // 阻止其冒泡到控制台，避免无意义的报错噪音
      event.preventDefault();
    }
  });
};

export default () => {
  if (!cached) {
    installCanceledRejectionHandler();

    cached = Promise.all([import('emmet-monaco-es'), import('monaco-editor')]).then(([emmet, monaco]) => {
      const { emmetHTML, emmetCSS } = emmet;
      emmetHTML(monaco);
      emmetCSS(monaco, ['css', 'scss']);

      return monaco;
    });
  }

  return cached;
};
