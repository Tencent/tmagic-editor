export const asyncLoadJs = (() => {
  // 正在加载或加载成功的存入此Map中
  const documentMap = new Map();

  return (url: string, crossOrigin?: string, document = globalThis.document) => {
    let loaded = documentMap.get(document);
    if (!loaded) {
      loaded = new Map();
      documentMap.set(document, loaded);
    }

    // 正在加载或已经加载成功的，直接返回
    if (loaded.get(url)) return loaded.get(url);

    const load = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      if (crossOrigin) {
        script.crossOrigin = crossOrigin;
      }
      script.src = url;
      document.body.appendChild(script);
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        reject(new Error('加载失败'));
      };
      setTimeout(() => {
        reject(new Error('timeout'));
      }, 60 * 1000);
    }).catch((err) => {
      // 加载失败的，从map中移除，第二次加载时，可以再次执行加载
      loaded.delete(url);
      throw err;
    });

    loaded.set(url, load);
    return loaded.get(url);
  };
})();

export const asyncLoadCss = (() => {
  // 正在加载或加载成功的存入此Map中
  const documentMap = new Map();

  return (url: string, document = globalThis.document) => {
    let loaded = documentMap.get(document);
    if (!loaded) {
      loaded = new Map();
      documentMap.set(document, loaded);
    }

    // 正在加载或已经加载成功的，直接返回
    if (loaded.get(url)) return loaded.get(url);

    const load = new Promise<void>((resolve, reject) => {
      const node = document.createElement('link');
      node.rel = 'stylesheet';
      node.href = url;
      document.head.appendChild(node);
      node.onload = () => {
        resolve();
      };
      node.onerror = () => {
        reject(new Error('加载失败'));
      };
      setTimeout(() => {
        reject(new Error('timeout'));
      }, 60 * 1000);
    }).catch((err) => {
      // 加载失败的，从map中移除，第二次加载时，可以再次执行加载
      loaded.delete(url);
      throw err;
    });

    loaded.set(url, load);
    return loaded.get(url);
  };
})();

export const addClassName = (el: Element, doc: Document, className: string) => {
  const oldEl = doc.querySelector(`.${className}`);
  if (oldEl && oldEl !== el) removeClassName(oldEl, className);
  if (!el.classList.contains(className)) el.classList.add(className);
};

export const removeClassName = (el: Element, ...className: string[]) => {
  el.classList.remove(...className);
};

export const removeClassNameByClassName = (doc: Document, className: string) => {
  const el: HTMLElement | null = doc.querySelector(`.${className}`);
  el?.classList.remove(className);
  return el;
};

export const injectStyle = (doc: Document, style: string) => {
  const styleEl = doc.createElement('style');
  styleEl.innerHTML = style;
  doc.head.appendChild(styleEl);
  return styleEl;
};

export const createDiv = ({ className, cssText }: { className: string; cssText: string }) => {
  const el = globalThis.document.createElement('div');
  el.className = className;
  el.style.cssText = cssText;
  return el;
};

export const getDocument = () => globalThis.document;

export const calcValueByFontsize = (doc: Document | undefined, value: number) => {
  if (!doc) return value;
  const { fontSize } = doc.documentElement.style;

  if (fontSize) {
    const times = globalThis.parseFloat(fontSize) / 100;
    return Number((value / times).toFixed(2));
  }

  return value;
};
