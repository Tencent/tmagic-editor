import { EventEmitter } from 'events';

interface ScrollViewerOptions {
  container: HTMLDivElement;
  target: HTMLDivElement;
  zoom: number;
  correctionScrollSize?: {
    width: number;
    height: number;
  };
}

export class ScrollViewer extends EventEmitter {
  private container: HTMLDivElement;
  private target: HTMLDivElement;
  private zoom = 1;

  private scrollLeft = 0;
  private scrollTop = 0;

  private scrollHeight = 0;
  private scrollWidth = 0;

  private width = 0;
  private height = 0;

  private translateXCorrectionValue = 0;
  private translateYCorrectionValue = 0;

  private correctionScrollSize = {
    width: 0,
    height: 0,
  };

  private resizeObserver = new ResizeObserver(() => {
    this.setSize();
    this.setScrollSize();
  });

  constructor(options: ScrollViewerOptions) {
    super();

    this.container = options.container;
    this.target = options.target;
    this.zoom = options.zoom;

    if (this.correctionScrollSize) {
      this.correctionScrollSize = {
        ...this.correctionScrollSize,
        ...options.correctionScrollSize,
      };
    }

    this.container.addEventListener('wheel', this.wheelHandler, false);

    this.setSize();
    this.setScrollSize();
    this.resizeObserver.observe(this.container);
    this.resizeObserver.observe(this.target);
  }

  public destroy() {
    this.resizeObserver.disconnect();
    this.container.removeEventListener('wheel', this.wheelHandler, false);
    this.removeAllListeners();
  }

  public setZoom(zoom: number) {
    this.zoom = zoom;
    this.setScrollSize();
  }

  public scrollTo({ left, top }: { left?: number; top?: number }) {
    if (typeof left !== 'undefined') {
      this.scrollLeft = left;
    }

    if (typeof top !== 'undefined') {
      this.scrollTop = top;
    }

    const translateX = -this.scrollLeft + this.translateXCorrectionValue;
    const translateY = -this.scrollTop + this.translateYCorrectionValue;
    this.target.style.transform = `translate(${translateX}px, ${translateY}px)`;
  }

  private wheelHandler = (event: WheelEvent) => {
    const { deltaX, deltaY, currentTarget } = event;

    if (currentTarget !== this.container) return;

    let top: number | undefined;
    if (this.scrollHeight > this.height) {
      top = this.scrollTop + this.getPos(deltaY, this.scrollTop, this.scrollHeight, this.height);
    }

    let left: number | undefined;
    if (this.scrollWidth > this.width) {
      left = this.scrollLeft + this.getPos(deltaX, this.scrollLeft, this.scrollWidth, this.width);
    }

    this.scrollTo({ left, top });
    this.emit('scroll', {
      scrollLeft: this.scrollLeft,
      scrollTop: this.scrollTop,
      scrollHeight: this.scrollHeight,
      scrollWidth: this.scrollWidth,
    });
  };

  private getPos(delta: number, scrollPos: number, scrollSize: number, size: number) {
    let pos = 0;
    if (delta < 0) {
      if (scrollPos > 0) {
        pos = Math.max(delta, -scrollPos);
      }
    } else {
      const leftPos = scrollSize - size - scrollPos;
      if (leftPos > 0) {
        pos = Math.min(delta, leftPos);
      }
    }
    return pos;
  }

  private setScrollSize = () => {
    const targetRect = this.target.getBoundingClientRect();
    this.scrollWidth = targetRect.width * this.zoom + this.correctionScrollSize.width;
    const targetMarginTop = Number(this.target.style.marginTop) || 0;
    this.scrollHeight = (targetRect.height + targetMarginTop) * this.zoom + this.correctionScrollSize.height;

    let left: number | undefined;
    let top: number | undefined;
    if (this.scrollWidth < this.width) {
      left = 0;
      this.translateXCorrectionValue = 0;
    } else {
      this.translateXCorrectionValue = (this.scrollWidth - this.width) / 2;
    }
    if (this.scrollHeight < this.height) {
      top = 0;
      this.translateYCorrectionValue = 0;
    } else {
      this.translateYCorrectionValue = (this.scrollHeight - this.height) / 2;
    }

    this.scrollTo({
      left,
      top,
    });

    this.emit('scroll', {
      scrollLeft: this.scrollLeft,
      scrollTop: this.scrollTop,
      scrollHeight: this.scrollHeight,
      scrollWidth: this.scrollWidth,
    });
  };

  private setSize = () => {
    const { width, height } = this.container.getBoundingClientRect();
    this.width = width;
    this.height = height;
  };
}
