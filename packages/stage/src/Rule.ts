import EventEmitter from 'events';

import Guides, { type GuidesEvents, type GuidesOptions } from '@scena/guides';

import { GuidesType } from './const';
import type { RuleOptions } from './types';

const guidesClass = 'tmagic-stage-guides';

export default class Rule extends EventEmitter {
  public hGuides: Guides;
  public vGuides: Guides;
  public horizontalGuidelines: number[] = [];
  public verticalGuidelines: number[] = [];

  private container: HTMLDivElement;
  private containerResizeObserver: ResizeObserver;
  private isShowGuides = true;
  private guidesOptions?: Partial<GuidesOptions>;

  constructor(container: HTMLDivElement, options?: RuleOptions) {
    super();

    this.guidesOptions = options?.guidesOptions || {};

    this.container = container;
    this.hGuides = this.createGuides(GuidesType.HORIZONTAL, this.horizontalGuidelines);
    this.vGuides = this.createGuides(GuidesType.VERTICAL, this.verticalGuidelines);

    this.containerResizeObserver = new ResizeObserver(() => {
      this.vGuides.resize();
      this.hGuides.resize();
    });

    this.containerResizeObserver.observe(this.container);
  }

  /**
   * 是否显示辅助线
   * @param isShowGuides 是否显示
   */
  public showGuides(isShowGuides = true) {
    this.isShowGuides = isShowGuides;

    this.hGuides.setState({
      showGuides: isShowGuides,
    });

    this.vGuides.setState({
      showGuides: isShowGuides,
    });
  }

  public setGuides([hLines, vLines]: [number[], number[]]) {
    this.horizontalGuidelines = hLines;
    this.verticalGuidelines = vLines;

    this.hGuides.setState({
      defaultGuides: hLines,
    });

    this.vGuides.setState({
      defaultGuides: vLines,
    });

    this.emit('change-guides', {
      type: GuidesType.HORIZONTAL,
      guides: hLines,
    });

    this.emit('change-guides', {
      type: GuidesType.VERTICAL,
      guides: vLines,
    });
  }

  /**
   * 清空所有参考线
   */
  public clearGuides() {
    this.setGuides([[], []]);
  }

  /**
   * 是否显示标尺
   * @param show 是否显示
   */
  public showRule(show = true) {
    // 当尺子隐藏时发生大小变化，显示后会变形，所以这里做重新初始化处理
    if (show) {
      this.destroyGuides();

      this.hGuides = this.createGuides(GuidesType.HORIZONTAL, this.horizontalGuidelines);
      this.vGuides = this.createGuides(GuidesType.VERTICAL, this.verticalGuidelines);
    } else {
      this.hGuides.setState({
        rulerStyle: {
          visibility: 'hidden',
        },
      });

      this.vGuides.setState({
        rulerStyle: {
          visibility: 'hidden',
        },
      });
    }
  }

  public scrollRule(scrollTop: number) {
    this.hGuides.scrollGuides(scrollTop);
    this.hGuides.scroll(0);

    this.vGuides.scrollGuides(0);
    this.vGuides.scroll(scrollTop);
  }

  public destroy(): void {
    this.destroyGuides();
    this.hGuides.off('changeGuides', this.hGuidesChangeGuidesHandler);
    this.vGuides.off('changeGuides', this.vGuidesChangeGuidesHandler);
    this.containerResizeObserver.disconnect();
    this.removeAllListeners();
  }

  public destroyGuides(): void {
    this.hGuides.destroy();
    this.vGuides.destroy();

    this.container.querySelectorAll(`.${guidesClass}`).forEach((el) => {
      el.remove();
    });
  }

  private getGuidesStyle = (type: GuidesType) => ({
    position: 'fixed',
    zIndex: 1,
    left: type === GuidesType.HORIZONTAL ? 0 : '-30px',
    top: type === GuidesType.HORIZONTAL ? '-30px' : 0,
    width: type === GuidesType.HORIZONTAL ? '100%' : '30px',
    height: type === GuidesType.HORIZONTAL ? '30px' : '100%',
  });

  private createGuides = (type: GuidesType, defaultGuides: number[] = []): Guides => {
    const guides = new Guides(this.container, {
      type,
      defaultGuides,
      displayDragPos: true,
      className: guidesClass,
      backgroundColor: '#fff',
      lineColor: '#000',
      textColor: '#000',
      style: this.getGuidesStyle(type),
      showGuides: this.isShowGuides,
      ...this.guidesOptions,
    });

    const changEventHandler = {
      [GuidesType.HORIZONTAL]: this.hGuidesChangeGuidesHandler,
      [GuidesType.VERTICAL]: this.vGuidesChangeGuidesHandler,
    }[type];

    if (changEventHandler) {
      guides.on('changeGuides', changEventHandler);
    }

    return guides;
  };

  private hGuidesChangeGuidesHandler = (e: GuidesEvents['changeGuides']) => {
    this.horizontalGuidelines = e.guides;
    this.emit('change-guides', {
      type: GuidesType.HORIZONTAL,
      guides: this.horizontalGuidelines,
    });
  };

  private vGuidesChangeGuidesHandler = (e: GuidesEvents['changeGuides']) => {
    this.verticalGuidelines = e.guides;
    this.emit('change-guides', {
      type: GuidesType.VERTICAL,
      guides: this.verticalGuidelines,
    });
  };
}
