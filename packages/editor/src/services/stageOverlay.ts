import { reactive } from 'vue';

import StageCore from '@tmagic/stage';

import { useStage } from '@editor/hooks/use-stage';
import BaseService from '@editor/services//BaseService';
import editorService from '@editor/services//editor';
import type { StageOptions, StageOverlayState } from '@editor/type';

class StageOverlay extends BaseService {
  private state: StageOverlayState = reactive({
    wrapDiv: document.createElement('div'),
    sourceEl: null,
    contentEl: null,
    stage: null,
    stageOptions: null,
    wrapWidth: 0,
    wrapHeight: 0,
    stageOverlayVisible: false,
  });

  constructor() {
    super([
      { name: 'openOverlay', isAsync: false },
      { name: 'closeOverlay', isAsync: false },
      { name: 'updateOverlay', isAsync: false },
      { name: 'createStage', isAsync: false },
    ]);

    this.get('wrapDiv').classList.add('tmagic-editor-sub-stage-wrap');
  }

  public get<K extends keyof StageOverlayState>(name: K): StageOverlayState[K] {
    return this.state[name];
  }

  public set<K extends keyof StageOverlayState, T extends StageOverlayState[K]>(name: K, value: T) {
    this.state[name] = value;
  }

  public openOverlay(el: HTMLElement | undefined | null) {
    const stageOptions = this.get('stageOptions');
    if (!el || !stageOptions) return;

    this.set('sourceEl', el);

    this.createContentEl();

    this.set('stageOverlayVisible', true);

    editorService.on('update', this.updateHandler);
    editorService.on('add', this.addHandler);
    editorService.on('remove', this.removeHandler);
  }

  public closeOverlay() {
    this.set('stageOverlayVisible', false);
    const subStage = this.get('stage');
    const wrapDiv = this.get('wrapDiv');
    subStage?.destroy();
    wrapDiv.remove();

    this.set('stage', null);
    this.set('sourceEl', null);
    this.set('contentEl', null);

    editorService.off('update', this.updateHandler);
    editorService.off('add', this.addHandler);
    editorService.off('remove', this.removeHandler);
  }

  public updateOverlay() {
    const sourceEl = this.get('sourceEl');

    if (!sourceEl) return;

    const { scrollWidth, scrollHeight } = sourceEl;

    this.set('wrapWidth', scrollWidth);
    this.set('wrapHeight', scrollHeight);
  }

  public createStage(stageOptions: StageOptions = {}) {
    return useStage({
      ...stageOptions,
      runtimeUrl: '',
      autoScrollIntoView: false,
      render: async (stage: StageCore) => {
        this.copyDocumentElement();

        const rootEls = stage.renderer.getDocument()?.body.children;
        if (rootEls) {
          Array.from(rootEls).forEach((element) => {
            if (['SCRIPT', 'STYLE'].includes(element.tagName)) {
              return;
            }
            element.remove();
          });
        }

        const wrapDiv = this.get('wrapDiv');
        const sourceEl = this.get('sourceEl');

        wrapDiv.style.cssText = `
            width: ${sourceEl?.scrollWidth}px;
            height: ${sourceEl?.scrollHeight}px;
            background-color: #fff;
          `;

        await this.render();

        return wrapDiv;
      },
    });
  }

  private createContentEl() {
    const sourceEl = this.get('sourceEl');
    if (!sourceEl) return;

    const contentEl = sourceEl.cloneNode(true) as HTMLElement;
    this.set('contentEl', contentEl);

    contentEl.style.position = 'static';
    contentEl.style.overflow = 'visible';
  }

  private copyDocumentElement() {
    const subStage = this.get('stage');
    const stage = editorService.get('stage');

    const doc = subStage?.renderer.getDocument();
    const documentElement = stage?.renderer.getDocument()?.documentElement;

    if (doc && documentElement) {
      doc.replaceChild(documentElement.cloneNode(true), doc.documentElement);
    }
  }

  private async render() {
    this.createContentEl();

    const contentEl = this.get('contentEl');
    const wrapDiv = this.get('wrapDiv');
    const subStage = this.get('stage');
    const stageOptions = this.get('stageOptions');

    if (!contentEl) return;

    Array.from(wrapDiv.children).forEach((element) => {
      element.remove();
    });
    wrapDiv.appendChild(contentEl);

    setTimeout(() => {
      subStage?.renderer.contentWindow?.magic.onPageElUpdate(wrapDiv);
    });

    if (await stageOptions?.canSelect?.(contentEl)) {
      subStage?.select(contentEl);
    }
  }

  private updateHandler = () => {
    this.render();
    this.updateOverlay();
  };

  private addHandler = () => {
    this.render();
    this.updateOverlay();
  };

  private removeHandler = () => {
    this.render();
    this.updateOverlay();
  };
}

export type StageOverlayService = StageOverlay;

export default new StageOverlay();
