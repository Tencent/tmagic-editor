/**
 * 把脚本地址解析成绝对 URL。
 * 已有协议（http/https/blob/data 等）或协议相对地址原样返回；
 * 解析失败（例如非浏览器环境缺少 base）时退回原值，不阻断加载。
 */
const resolveScriptUrl = (url: string, document: Document): string => {
  if (!url) return url;
  // 已有协议或协议相对地址，浏览器会自行处理
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url) || url.startsWith('//')) return url;

  const baseURI = document?.baseURI;
  if (!baseURI || typeof URL === 'undefined') return url;

  try {
    return new URL(url, baseURI).href;
  } catch {
    return url;
  }
};

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

    // 相对路径必须解析成绝对 URL 再赋给 script.src。
    // 直接传相对路径时，浏览器按**当前文档**的 base 解析，
    // 脚本内部再动态加载的相对引用也会落到文档目录，
    // 而不是脚本自己所在的目录。并发加载两个不同目录下的脚本时，
    // 后加载的会串到前一个的目录里（issue #589）。
    const resolvedUrl = resolveScriptUrl(url, document);

    const load = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      if (crossOrigin) {
        script.crossOrigin = crossOrigin;
      }
      script.src = resolvedUrl;
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

const dslDomRelateConfig = {
  getIdFromEl: (el?: HTMLElement | SVGElement | null) => el?.dataset?.tmagicId,
  getElById: (doc?: Document, id?: string | number) => doc?.querySelector(`[data-tmagic-id="${id}"]`) as HTMLElement,
  setIdToEl: (el: HTMLElement | SVGElement, id: string | number) => {
    el.dataset.tmagicId = `${id}`;
  },
};

export const setDslDomRelateConfig = <
  K extends keyof typeof dslDomRelateConfig,
  T extends (typeof dslDomRelateConfig)[K],
>(
  name: K,
  value: T,
) => {
  dslDomRelateConfig[name] = value;
};

export const getIdFromEl = () => dslDomRelateConfig.getIdFromEl;

export const getElById = () => dslDomRelateConfig.getElById;

export const setIdToEl = () => dslDomRelateConfig.setIdToEl;
