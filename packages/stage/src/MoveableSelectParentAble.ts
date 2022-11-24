import { MoveableManagerInterface, Renderer } from 'moveable';

export default (selectParentHandler: () => void) => ({
  name: 'select-parent',
  props: {},
  events: {},
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
        transform-origin: 0px 0px;
        display: flex;
      }
      .moveable-button {
        width: 20px;
        height: 20px;
        background: #4af;
        border-radius: 4px;
        appearance: none;
        border: 0;
        color: white;
        font-size: 12px;
        font-weight: bold;
      }
      `,
    );
    // Add key (required)
    // Add class prefix moveable-(required)
    return React.createElement(
      editableViewer,
      {
        className: 'moveable-editable',
        style: {
          transform: `translate(${pos2[0] - 25}px, ${pos2[1] - 30}px) rotate(${rect.rotation}deg) translate(10px)`,
        },
      },
      React.createElement(
        'button',
        {
          className: 'moveable-button',
          title: '选中父组件',
          onClick: () => {
            selectParentHandler();
          },
        },
        React.createElement(
          'svg',
          {
            width: '1em',
            height: '1em',
            viewBox: '0 0 16 16',
            fill: 'none',
            xmlns: 'http://www.w3.org/2000/svg',
            style: {
              transform: 'rotate(90deg)',
            },
          },
          React.createElement('path', {
            d: 'M13.0001 4V10H4.20718L5.85363 8.35355L5.14652 7.64645L2.64652 10.1464C2.45126 10.3417 2.45126 10.6583 2.64652 10.8536L5.14652 13.3536L5.85363 12.6464L4.20718 11H13.0001C13.5524 11 14.0001 10.5523 14.0001 10V4H13.0001Z',
            fill: 'currentColor',
            fillOpacity: '0.9',
          }),
        ),
      ),
    );
  },
});
