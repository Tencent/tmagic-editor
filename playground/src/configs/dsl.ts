/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-nocheck
export default {
  id: '75f0extui9d7yksklx27hff8xg',
  name: 'test',
  type: 'app',
  codeBlocks: {
    code_5336: {
      name: 'getData',
      content: ({ app, params }) => {
        console.log('this is getData function', params, app);
      },
      params: [
        {
          name: 'age',
          type: 'number',
          tip: '年纪',
        },
        {
          name: 'studentName',
          type: 'text',
          tip: '学生姓名',
        },
      ],
    },
    code_5316: {
      name: 'getList',
      content: () => {
        console.log('this is getList function');
      },
      params: [],
    },
  },
  items: [
    {
      type: 'page',
      id: 'page_299',
      name: 'index',
      title: '',
      layout: 'absolute',
      style: {
        position: 'relative',
        left: 0,
        top: 0,
        right: '',
        bottom: '',
        width: '100%',
        height: '1728',
        backgroundImage: '',
        backgroundColor: 'rgba(248, 218, 218, 1)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
        color: '',
        fontSize: '',
        fontWeight: '',
      },
      events: [
        {
          name: 'magic:common:events:click', // 事件名
          actions: [
            {
              actionType: 'code', // 联动动作类型
              codeId: 'code_5336', // 代码块id
              params: {
                age: 12, // 参数
              },
            },
          ],
        },
        {
          name: 'magic:common:events:click', // 事件名
          actions: [
            {
              actionType: 'code', // 联动动作类型
              codeId: 'code_5316', // 代码块id
              params: {},
            },
          ],
        },
      ],
      created: {
        hookType: 'code',
        hookData: [
          {
            codeId: 'code_5336',
            params: {
              studentName: 'lisa',
              age: 14,
            },
          },
          {
            codeId: 'code_5316',
            params: {},
          },
        ],
      },
      items: [
        {
          type: 'text',
          id: 'text_9027',
          style: {
            width: '280.75',
            height: '38.97',
            position: 'absolute',
            top: '107.90',
            left: '46.96',
            right: '',
            bottom: '',
            backgroundImage: '',
            backgroundColor: '',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 100%',
            color: '',
            fontSize: '20',
            fontWeight: '',
          },
          name: '文本',
          text: 'Tmagic editor 营销活动编辑器',
          multiple: true,
          events: [],
        },
        {
          type: 'qrcode',
          id: 'qrcode_4738',
          style: {
            position: 'absolute',
            left: '91.92',
            width: '176',
            height: '176',
            top: '565.50',
            right: '',
            bottom: '',
            backgroundImage: '',
            backgroundColor: '',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 100%',
            color: '',
            fontSize: '',
            fontWeight: '',
          },
          name: '二维码',
          url: 'https://github.com/Tencent/tmagic-editor',
          events: [],
          created: [],
        },
        {
          type: 'img',
          id: 'img_3877',
          style: {
            position: 'absolute',
            left: '95.91',
            width: '176',
            height: '176',
            top: '325.71',
            right: '',
            bottom: '',
            backgroundImage: '',
            backgroundColor: '',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 100%',
            color: '',
            fontSize: '',
            fontWeight: '',
          },
          name: '图片',
          src: 'https://vfiles.gtimg.cn/vupload/20210811/388ed01628667545737.png',
          url: '',
          events: [],
          created: [],
        },
        {
          type: 'button',
          id: 'button_430',
          style: {
            position: 'absolute',
            width: '270',
            height: '37.5',
            border: 0,
            backgroundColor: '#fb6f00',
            top: '206.82',
            left: '55.95',
            right: '',
            bottom: '',
            backgroundImage: '',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 100%',
            color: '',
            fontSize: '',
            fontWeight: '',
            borderWidth: '0',
            borderColor: '',
            borderStyle: 'none',
            transform: {
              rotate: '',
              scale: '',
            },
          },
          name: '按钮',
          text: '${ds_b64c92b5.text}',
          multiple: true,
          events: [
            {
              name: 'magic:common:events:click',
              actions: [
                {
                  actionType: 'comp',
                  to: 'overlay_2159',
                  method: 'openOverlay',
                },
              ],
            },
          ],
          created: [],
        },
        {
          type: 'overlay',
          id: 'overlay_2159',
          style: {
            position: 'fixed',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          },
          name: '蒙层',
          items: [
            {
              type: 'container',
              id: 'container_607',
              style: {
                position: 'absolute',
                width: '80%',
                height: '400',
                top: '143.87',
                left: 37.5,
                right: '',
                bottom: '',
                backgroundImage: '',
                backgroundColor: 'rgba(255, 255, 255, 1)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '100% 100%',
                color: '',
                fontSize: '',
                fontWeight: '',
              },
              name: '组',
              items: [
                {
                  type: 'button',
                  id: 'button_7265',
                  style: {
                    position: 'absolute',
                    width: '270',
                    height: '37.5',
                    border: 0,
                    backgroundColor: '#fb6f00',
                    top: '322.71',
                    left: '15.99',
                    right: '',
                    bottom: '',
                    backgroundImage: '',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '100% 100%',
                    color: '',
                    fontSize: '',
                    fontWeight: '',
                    borderWidth: '0',
                    borderColor: '',
                    borderStyle: 'none',
                    transform: {
                      rotate: '',
                      scale: '',
                    },
                  },
                  name: '按钮',
                  text: '关闭弹窗',
                  multiple: true,
                  events: [
                    {
                      name: 'magic:common:events:click',
                      actions: [
                        {
                          actionType: 'comp',
                          to: 'overlay_2159',
                          method: 'closeOverlay',
                        },
                      ],
                    },
                  ],
                  created: [],
                },
                {
                  type: 'img',
                  id: 'img_3291',
                  style: {
                    position: 'absolute',
                    left: '63.94',
                    width: '176',
                    height: '176',
                    top: '105.91',
                  },
                  name: '图片',
                  src: 'https://puui.qpic.cn/vupload/0/1573555382625_bhp0wud8l6w.png/0',
                  url: '',
                },
                {
                  type: 'text',
                  id: 'text_8598',
                  style: {
                    position: 'absolute',
                    width: '86.92',
                    height: '37.97',
                    left: '106.90',
                    top: '35.97',
                    right: '',
                    bottom: '',
                    backgroundImage: '',
                    backgroundColor: '',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '100% 100%',
                    color: '',
                    fontSize: '24',
                    fontWeight: '',
                  },
                  name: '文本',
                  text: 'Tmagic',
                  multiple: false,
                  events: [],
                  created: [],
                },
              ],
              layout: 'absolute',
              events: [],
              created: [],
            },
          ],
        },
      ],
    },
  ],
  dataSources: [
    {
      id: 'ds_b64c92b5',
      type: 'base',
      title: 'button',
      description: '按钮',
      fields: [
        {
          name: 'text',
          title: '按钮文案',
          type: 'string',
          description: '',
          enable: true,
          defaultValue: '打开弹窗',
          fields: [],
        },
        {
          name: 'array',
          title: 'array',
          type: 'array',
          description: '',
          enable: true,
          defaultValue: [
            {
              a: 1,
            },
            {
              a: 2,
            },
          ],
          fields: [
            {
              name: 'a',
              title: 'a',
              type: 'number',
              description: '',
              enable: true,
              defaultValue: 1,
              fields: [],
            },
          ],
        },
        {
          name: 'object',
          title: 'object',
          type: 'object',
          description: '',
          enable: true,
          defaultValue: {
            a: 1,
          },
          fields: [
            {
              name: 'a',
              title: 'a',
              type: 'number',
              description: '',
              enable: true,
              defaultValue: 1,
              fields: [],
            },
          ],
        },
      ],
      methods: [],
      events: '',
      mocks: [],
      beforeRequest: '',
      afterResponse: '',
    },
    {
      id: 'ds_d1a460c5',
      type: 'base',
      title: 'style',
      description: '',
      fields: [
        {
          name: 'color',
          title: 'color',
          type: 'string',
          description: '',
          enable: true,
          defaultValue: '#fff',
          fields: [],
        },
      ],
      methods: [
        {
          name: 'setCorlor',
          desc: '',
          timing: '',
          params: [],
          content: ({ dataSource }) => {
            // place your code here
            setTimeout(() => {
              dataSource.setData('red', 'color');
            }, 1000);
          },
        },
      ],
      events: '',
      mocks: [],
      beforeRequest: '',
      afterResponse: '',
    },
  ],
  dataSourceDeps: {
    ds_b64c92b5: {
      button_430: {
        name: '按钮',
        keys: ['text'],
      },
    },
  },
};
