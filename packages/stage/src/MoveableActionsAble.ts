import type { MoveableManagerInterface, Renderer } from 'moveable';

import { AbleActionEventType } from './const';
import ableCss from './moveable-able.css?raw';

export interface AbleCustomizedButton {
  props: {
    className?: string;
    onClick?(e: MouseEvent): void;
    [key: string]: any;
  };
  children: ReturnType<Renderer['createElement']>[];
}

export default (
  handler: (type: AbleActionEventType) => void,
  customizedButton: ((react: Renderer) => AbleCustomizedButton)[] = [],
) => ({
  name: 'actions',
  props: [],
  always: true,
  events: [],
  render(moveable: MoveableManagerInterface<any, any>, React: Renderer) {
    const rect = moveable.getRect();
    const { pos2 } = moveable.state;

    // use css for able
    const editableViewer = moveable.useCSS(
      'div',
      `
      {
        position: absolute;
        left: 0px;
        top: 0px;
        will-change: transform;
        transform-origin: 60px 28px;
        display: flex;
      }
      ${ableCss}
      `,
    );
    // Add key (required)
    // Add class prefix moveable-(required)
    return React.createElement(
      editableViewer,
      {
        className: 'moveable-editable',
        style: {
          transform: `translate(${pos2[0] - (customizedButton.length + 3) * 20}px, ${pos2[1] - 28}px) rotate(${
            rect.rotation
          }deg)`,
        },
      },
      [
        ...customizedButton.map((buttonRenderer) => {
          const options = buttonRenderer(React);
          return React.createElement('button', options.props || {}, ...(options.children || []));
        }),

        React.createElement(
          'button',
          {
            className: 'moveable-button moveable-rerender-button',
            title: '重新收集依赖后渲染',
            onClick: () => {
              handler(AbleActionEventType.RERENDER);
            },
          },
          React.createElement('img', {
            src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb24tdGFibGVyLXJlcGxhY2UiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZT0iI2ZmZmZmZiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICA8cGF0aCBzdHJva2U9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KICA8cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iNiIgaGVpZ2h0PSI2IiByeD0iMSIgLz4KICA8cmVjdCB4PSIxNSIgeT0iMTUiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiIHJ4PSIxIiAvPgogIDxwYXRoIGQ9Ik0yMSAxMXYtM2EyIDIgMCAwIDAgLTIgLTJoLTZsMyAzbTAgLTZsLTMgMyIgLz4KICA8cGF0aCBkPSJNMyAxM3YzYTIgMiAwIDAgMCAyIDJoNmwtMyAtM20wIDZsMyAtMyIgLz4KPC9zdmc+CgoK',
            width: '16',
            height: '16',
          }),
        ),
        React.createElement(
          'button',
          {
            className: 'moveable-button',
            title: '选中父组件',
            onClick: () => {
              handler(AbleActionEventType.SELECT_PARENT);
            },
          },
          React.createElement('div', {
            className: 'moveable-select-parent-arrow-top-icon',
          }),
          React.createElement('div', {
            className: 'moveable-select-parent-arrow-body-icon',
          }),
        ),
        React.createElement('button', {
          className: 'moveable-button moveable-remove-button',
          title: '删除',
          onClick: () => {
            handler(AbleActionEventType.REMOVE);
          },
        }),
        React.createElement(
          'button',
          {
            className: 'moveable-button moveable-drag-area-button',
            title: '拖动',
          },
          React.createElement('div', {
            className: 'moveable-select-parent-arrow-top-icon moveable-select-parent-arrow-top-icon-top',
          }),
          React.createElement('div', {
            className: 'moveable-select-parent-arrow-top-icon moveable-select-parent-arrow-top-icon-bottom',
          }),
          React.createElement('div', {
            className: 'moveable-select-parent-arrow-top-icon moveable-select-parent-arrow-top-icon-left',
          }),
          React.createElement('div', {
            className: ' moveable-select-parent-arrow-top-icon moveable-select-parent-arrow-top-icon-right',
          }),
          React.createElement('div', {
            className: 'moveable-select-parent-arrow-body-icon-horizontal',
          }),
          React.createElement('div', {
            className: 'moveable-select-parent-arrow-body-icon-vertical',
          }),
        ),
      ],
    );
  },
});
