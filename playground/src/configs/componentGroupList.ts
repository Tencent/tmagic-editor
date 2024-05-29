import { Files, FolderOpened, Grid, PictureFilled, SwitchButton, Ticket, Tickets } from '@element-plus/icons-vue';

import type { ComponentGroup } from '@tmagic/editor';

export default [
  {
    title: '示例容器',
    items: [
      {
        icon: FolderOpened,
        text: '组',
        type: 'container',
      },
      {
        icon: FolderOpened,
        text: '蒙层',
        type: 'overlay',
      },
      {
        icon: Ticket,
        text: '页面片容器',
        type: 'page-fragment-container',
      },
      {
        icon: Files,
        text: '迭代器容器',
        type: 'iterator-container',
      },
    ],
  },
  {
    title: '示例组件',
    items: [
      {
        icon: Tickets,
        text: '文本',
        type: 'text',
      },
      {
        icon: SwitchButton,
        text: '按钮',
        type: 'button',
      },
      {
        icon: PictureFilled,
        text: '图片',
        type: 'img',
      },
      {
        icon: Grid,
        text: '二维码',
        type: 'qrcode',
      },
    ],
  },
  {
    title: '组合',
    items: [
      {
        icon: Tickets,
        text: '弹窗',
        data: {
          type: 'overlay',
          style: {
            position: 'fixed',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          },
          name: '弹窗',
          items: [
            {
              type: 'container',
              style: {
                position: 'absolute',
                width: '80%',
                height: '400',
                top: '143.87',
                left: 37.5,
                backgroundColor: 'rgba(255, 255, 255, 1)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '100% 100%',
              },
              name: '组',
              items: [],
              layout: 'absolute',
            },
          ],
        },
      },
    ],
  },
] as ComponentGroup[];
