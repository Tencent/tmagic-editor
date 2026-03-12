let cached: Promise<typeof import('monaco-editor')> | undefined;

export default () => {
  if (!cached) {
    cached = Promise.all([import('emmet-monaco-es'), import('monaco-editor')]).then(([emmet, monaco]) => {
      const { emmetHTML, emmetCSS } = emmet;
      emmetHTML(monaco);
      emmetCSS(monaco, ['css', 'scss']);

      return monaco;
    });
  }

  return cached;
};
