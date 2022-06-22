import EventEmitter from 'events';

import Guides, { GuidesEvents } from '@scena/guides';

import { GuidesType } from './const';

export default class Rule extends EventEmitter {
  public hGuides: Guides;
  public vGuides: Guides;
  public horizontalGuidelines: number[] = [];
  public verticalGuidelines: number[] = [];

  private container: HTMLDivElement;
  private containerResizeObserver: ResizeObserver;

  constructor(container: HTMLDivElement) {
    super();

    this.container = container;
    this.hGuides = this.createGuides(GuidesType.HORIZONTAL, this.horizontalGuidelines);
    this.vGuides = this.createGuides(GuidesType.VERTICAL, this.verticalGuidelines);

    this.hGuides.on('changeGuides', this.hGuidesChangeGuidesHandler);
    this.vGuides.on('changeGuides', this.vGuidesChangeGuidesHandler);

    this.containerResizeObserver = new ResizeObserver(() => {
      this.vGuides.resize();
      this.hGuides.resize();
    });

    this.containerResizeObserver.observe(this.container);
  }

  /**
   * 是否显示标尺
   * @param show 是否显示
   */
  public showGuides(show = true) {
    this.hGuides.setState({
      showGuides: show,
    });

    this.vGuides.setState({
      showGuides: show,
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

    this.emit('changeGuides', {
      type: GuidesType.HORIZONTAL,
      guides: hLines,
    });

    this.emit('changeGuides', {
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
    // 当尺子隐藏时发现大小变化，显示后会变形，所以这里做重新初始化处理
    if (show) {
      this.hGuides.destroy();
      this.hGuides = this.createGuides(GuidesType.HORIZONTAL, this.horizontalGuidelines);

      this.vGuides.destroy();
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
    this.hGuides.off('changeGuides', this.hGuidesChangeGuidesHandler);
    this.vGuides.off('changeGuides', this.vGuidesChangeGuidesHandler);
    this.containerResizeObserver.disconnect();
    this.removeAllListeners();
  }

  private getGuidesStyle = (type: GuidesType) => ({
    position: 'fixed',
    zIndex: 1,
    left: type === GuidesType.HORIZONTAL ? 0 : '-30px',
    top: type === GuidesType.HORIZONTAL ? '-30px' : 0,
    width: type === GuidesType.HORIZONTAL ? '100%' : '30px',
    height: type === GuidesType.HORIZONTAL ? '30px' : '100%',
  });

  private createGuides = (type: GuidesType, defaultGuides: number[] = []): Guides =>
    new Guides(this.container, {
      type,
      defaultGuides,
      displayDragPos: true,
      backgroundColor: '#fff',
      lineColor: '#000',
      textColor: '#000',
      style: this.getGuidesStyle(type),
    });

  private hGuidesChangeGuidesHandler = (e: GuidesEvents['changeGuides']) => {
    this.horizontalGuidelines = e.guides;
    this.emit('changeGuides', {
      type: GuidesType.HORIZONTAL,
      guides: this.horizontalGuidelines,
    });
  };

  private vGuidesChangeGuidesHandler = (e: GuidesEvents['changeGuides']) => {
    this.verticalGuidelines = e.guides;
    this.emit('changeGuides', {
      type: GuidesType.VERTICAL,
      guides: this.verticalGuidelines,
    });
  };
}
