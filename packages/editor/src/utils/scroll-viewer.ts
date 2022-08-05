import { Keys } from '../type';

interface ScrollViewerOptions {
  container: HTMLDivElement;
  target: HTMLDivElement;
  zoom: number;
}

export class ScrollViewer {
  private enter = false;
  private targetEnter = false;
  private keydown = false;
  private container: HTMLDivElement;
  private target: HTMLDivElement;
  private zoom = 1;

  private scrollLeft = 0;
  private scrollTop = 0;

  private x = 0;
  private y = 0;

  private resizeObserver = new ResizeObserver((entries) => {
    for (const { contentRect } of entries) {
      const { width, height } = contentRect;
      const targetRect = this.target.getBoundingClientRect();
      const targetWidth = targetRect.width * this.zoom;
      const targetMarginTop = Number(this.target.style.marginTop) || 0;
      const targetHeight = (targetRect.height + targetMarginTop) * this.zoom;

      if (targetWidth < width) {
        (this.target as any)._left = 0;
      }
      if (targetHeight < height) {
        (this.target as any)._top = 0;
      }

      this.scroll();
    }
  });

  constructor(options: ScrollViewerOptions) {
    this.container = options.container;
    this.target = options.target;
    this.zoom = options.zoom;

    globalThis.addEventListener('keydown', this.keydownHandler);
    globalThis.addEventListener('keyup', this.keyupHandler);

    this.container.addEventListener('mouseenter', this.mouseEnterHandler);
    this.container.addEventListener('mouseleave', this.mouseLeaveHandler);
    this.target.addEventListener('mouseenter', this.targetMouseEnterHandler);
    this.target.addEventListener('mouseleave', this.targetMouseLeaveHandler);

    this.container.addEventListener('wheel', this.wheelHandler);

    this.resizeObserver.observe(this.container);
  }

  public destroy() {
    this.resizeObserver.disconnect();

    this.container.removeEventListener('mouseenter', this.mouseEnterHandler);
    this.container.removeEventListener('mouseleave', this.mouseLeaveHandler);
    this.target.removeEventListener('mouseenter', this.targetMouseEnterHandler);
    this.target.removeEventListener('mouseleave', this.targetMouseLeaveHandler);
    globalThis.removeEventListener('keydown', this.keydownHandler);
    globalThis.removeEventListener('keyup', this.keyupHandler);
  }

  public setZoom(zoom: number) {
    this.zoom = zoom;
  }

  private scroll() {
    const scrollLeft = (this.target as any)._left;
    const scrollTop = (this.target as any)._top;

    this.target.style.transform = `translate(${scrollLeft}px, ${scrollTop}px)`;
  }

  private removeHandler() {
    this.target.style.cursor = '';
    this.target.removeEventListener('mousedown', this.mousedownHandler);
    document.removeEventListener('mousemove', this.mousemoveHandler);
    document.removeEventListener('mouseup', this.mouseupHandler);
  }

  private wheelHandler = (event: WheelEvent) => {
    if (this.targetEnter) return;

    const { deltaX, deltaY, currentTarget } = event;

    if (currentTarget !== this.container) return;

    this.setScrollOffset(deltaX, deltaY);
    this.scroll();
    this.scrollLeft = (this.target as any)._left;
    this.scrollTop = (this.target as any)._top;
  };

  private mouseEnterHandler = () => {
    this.enter = true;
  };

  private mouseLeaveHandler = () => {
    this.enter = false;
  };

  private targetMouseEnterHandler = () => {
    this.targetEnter = true;
  };

  private targetMouseLeaveHandler = () => {
    this.targetEnter = false;
  };

  private mousedownHandler = (event: MouseEvent) => {
    if (!this.keydown) return;

    event.stopImmediatePropagation();
    event.stopPropagation();

    this.target.style.cursor = 'grabbing';

    this.x = event.clientX;
    this.y = event.clientY;

    document.addEventListener('mousemove', this.mousemoveHandler);
    document.addEventListener('mouseup', this.mouseupHandler);
  };

  private mouseupHandler = () => {
    this.x = 0;
    this.y = 0;

    this.scrollLeft = (this.target as any)._left;
    this.scrollTop = (this.target as any)._top;
    this.removeHandler();
  };

  private mousemoveHandler = (event: MouseEvent) => {
    event.stopImmediatePropagation();
    event.stopPropagation();

    const deltaX = event.clientX - this.x;
    const deltaY = event.clientY - this.y;

    this.setScrollOffset(deltaX, deltaY);
    this.scroll();
  };

  private keydownHandler = (event: KeyboardEvent) => {
    if (event.code === Keys.ESCAPE && this.enter) {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    }

    if (event.code !== Keys.ESCAPE || !this.enter || this.keydown) {
      return;
    }

    this.keydown = true;

    this.target.style.cursor = 'grab';
    this.container.addEventListener('mousedown', this.mousedownHandler);
  };

  private keyupHandler = (event: KeyboardEvent) => {
    if (event.code !== Keys.ESCAPE || !this.keydown) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();

    this.keydown = false;

    event.preventDefault();

    this.removeHandler();
  };

  private setScrollOffset(deltaX: number, deltaY: number) {
    const { width, height } = this.container.getBoundingClientRect();
    const targetRect = this.target.getBoundingClientRect();

    const targetWidth = targetRect.width * this.zoom;
    const targetHeight = targetRect.height * this.zoom;

    let y = 0;

    if (targetHeight > height) {
      if (deltaY > 0) {
        y = this.scrollTop + Math.min(targetHeight - height - this.scrollTop, deltaY);
      } else {
        y = this.scrollTop + Math.max(-(targetHeight - height + this.scrollTop), deltaY);
      }
    }

    let x = 0;

    if (targetWidth > width) {
      if (deltaX > 0) {
        x = this.scrollLeft + Math.min(targetWidth - width - this.scrollLeft, deltaX);
      } else {
        x = this.scrollLeft + Math.max(-(targetWidth - width + this.scrollLeft), deltaX);
      }
    }

    (this.target as any)._left = x;
    (this.target as any)._top = y;
  }
}
