export default class Flexible {
  public designWidth = 375;
  private tid: NodeJS.Timeout | undefined;

  constructor(options?: { designWidth?: number }) {
    if (globalThis.document.readyState === 'complete') {
      this.setBodyFontSize();
    } else {
      globalThis.document.addEventListener('DOMContentLoaded', this.setBodyFontSize, false);
    }

    globalThis.addEventListener('resize', this.resizeHandler, false);
    globalThis.addEventListener('pageshow', this.pageshowHandler, false);

    if (typeof options?.designWidth !== 'undefined') {
      this.setDesignWidth(options.designWidth);
    }
  }

  public destroy() {
    globalThis.document.removeEventListener('DOMContentLoaded', this.setBodyFontSize, false);
    globalThis.removeEventListener('resize', this.resizeHandler, false);
    globalThis.removeEventListener('pageshow', this.pageshowHandler, false);
  }

  public setDesignWidth(width: number) {
    this.designWidth = width;
    this.refreshRem();
  }

  public setBodyFontSize() {
    globalThis.document.body.style.fontSize = '.12rem';
  }

  public refreshRem() {
    const { width } = document.documentElement.getBoundingClientRect();
    const fontSize = width / (this.designWidth / 100);
    globalThis.document.documentElement.style.fontSize = `${fontSize}px`;
    globalThis.document.documentElement.style.fontSize = `${this.correctRem(fontSize)}px`;
  }

  /**
   * 纠正由于文字缩放导致的字体大小计算不正确问题
   * @param {number} fontSize
   * @returns {number}
   */
  public correctRem(fontSize: number) {
    const { document } = globalThis;
    const d = document.createElement('div');
    d.style.cssText = 'width:1rem;height:0;overflow:hidden;position:absolute;z-index:-1;visibility:hidden;';
    document.documentElement.appendChild(d);
    const dw = d.offsetWidth;
    document.documentElement.removeChild(d);
    if (Math.abs(dw - fontSize) > 1) {
      return fontSize ** 2 / dw;
    }
    return fontSize;
  }

  private resizeHandler = () => {
    clearTimeout(this.tid);
    this.tid = setTimeout(() => {
      this.refreshRem();
    }, 300);
  };

  private pageshowHandler = (e: PageTransitionEvent) => {
    if (e.persisted) {
      this.resizeHandler();
    }
  };
}
