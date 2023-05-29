import path from 'path';
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'tmagic-editor',
  description: '页面可视化平台',

  base: '/tmagic-editor/docs/',

  head: [
    ['meta', { name: 'theme-color', content: '#646cff' }],
  ],

  themeConfig: {
    logo: './favicon.png',

    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Tencent/tmagic-editor' }
    ],

    footer: {
      message: 'Powered by 腾讯视频会员平台技术中心',
      copyright: 'Copyright (C) 2023 THL A29 Limited, a Tencent company.'
    },

    nav: [
      { text: '文档', link: '/guide/', activeMatch: '/guide/' },
      { text: 'API', link: '/api/editor/props', activeMatch: '/api/' },
      { text: '表单配置', link: '/form-config/fields/text', activeMatch: '/form-config/' },
      { text: '更新日志', link: 'https://github.com/Tencent/tmagic-editor/releases' },
      { text: 'Playground', link: 'https://tencent.github.io/tmagic-editor/playground/index.html' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '文档',
          items: [
            {
              text: '介绍',
              link: '/guide/introduction.md'
            },
            {
              text: '快速开始',
              link: '/guide/'
            },
            {
              text: '基础概念',
              link: '/guide/conception.md',
            },
            {
              text: '页面发布',
              link: '/guide/publish.md'
            },
            {
              text: 'RUNTIME',
              link: '/guide/runtime.md'
            },
            {
              text: '组件开发',
              link: '/guide/component.md'
            },
            {
              text: '编辑器扩展',
              link: '/guide/editor-expand.md'
            },
          ]
        },
        {
          text: '进阶指南',
          items: [
            {
              text: 'JS Schema',
              link: '/guide/advanced/js-schema.md',
            },
            {
              text: '布局原理',
              link: '/guide/advanced/layout.md',
            },
            {
              text: '页面渲染',
              link: '/guide/advanced/page.md',
            },
            {
              text: '联动原理',
              link: '/guide/advanced/coupling.md',
            },
            {
              text: '代码块',
              link: '/guide/advanced/code-block.md',
            },
            {
              text: '@tmagic/ui',
              link: '/guide/advanced/tmagic-ui.md',
            },
            {
              text: '@tmagic/form',
              link: '/guide/advanced/tmagic-form.md',
            },
          ],
        },
        {
          text: '教程',
          items: [
            {
              text: '写在前面',
              link: '/guide/tutorial/'
            },
            {
              text: '1.Hello World',
              link: '/guide/tutorial/hello-world.md'
            },
            {
              text: '2.Runtime',
              link: '/guide/tutorial/runtime.md'
            },
            {
              text: '3.DSL解析渲染',
              link: '/guide/tutorial/render.md'
            }
          ]
        }
      ],
      '/api/': [
        {
          text: '编辑器',
          items: [
            {
              text: 'Editor组件',
              items: [
                {
                  text: 'props',
                  link: '/api/editor/props.md'
                },
                {
                  text: 'slots',
                  link: '/api/editor/slots.md'
                },
                {
                  text: 'events',
                  link: '/api/editor/events.md'
                },
              ]
            },
            {
              text: 'editorService',
              items: [
                {
                  text: '方法',
                  link: '/api/editor/editorServiceMethods.md',
                },
                {
                  text: '事件',
                  link: '/api/editor/editorServiceEvents.md',
                },
              ],
            },
            {
              text: 'propsService',
              items: [
                {
                  text: '方法',
                  link: '/api/editor/propsServiceMethods.md',
                },
                {
                  text: '事件',
                  link: '/api/editor/propsServiceEvents.md',
                }
              ],
            },
            {
              text: 'historyService',
              items: [
                {
                  text: '方法',
                  link: '/api/editor/historyServiceMethods.md',
                },
                {
                  text: '事件',
                  link: '/api/editor/historyServiceEvents.md',
                }
              ],
            },
            {
              text: 'eventsService',
              link: '/api/editor/eventsServiceMethods.md',
            },
            {
              text: 'uiService',
              link: '/api/editor/uiServiceMethods.md',
            },
            {
              text: 'codeBlockService',
              link: '/api/editor/codeBlockServiceMethods.md',
            },
            {
              text: 'componentListService',
              link: '/api/editor/componentListServiceMethods.md',
            },
            {
              text: 'storageService',
              link: '/api/editor/storageServiceMethods.md',
            },
          ]
        },
        {
          text: '表单',
          items: [
            {
              text: 'Form组件',
              items: [
                {
                  text: 'props',
                  link: '/api/form/form-props'
                },
                {
                  text: 'methods',
                  link: '/api/form/form-methods'
                },
                {
                  text: 'events',
                  link: '/api/form/form-events'
                },
              ]
            },
            {
              text: 'FormDialog组件',
              items: [
                {
                  text: 'props',
                  link: '/api/form/form-dialog-props'
                },
                {
                  text: 'methods',
                  link: '/api/form/form-dialog-methods'
                },
                {
                  text: 'events',
                  link: '/api/form/form-dialog-events'
                },
              ]
            },
          ],
        },
        {
          text: '表格',
          items: [
            {
              text: 'Table组件',
              items: [
                {
                  text: 'props',
                  link: '/api/table/props'
                },
                {
                  text: 'methods',
                  link: '/api/table/methods'
                },
                {
                  text: 'events',
                  link: '/api/table/events'
                },
              ]
            }
          ]
        },
        {
          text: 'stage',
          items: [
            {
              text: 'StageCore',
              items: [
                {
                  text: '方法',
                  link: '/api/stage/coreMethods',
                },
                {
                  text: '事件',
                  link: '/api/stage/coreEvents',
                }
              ]
            },
          ],
        },
      ],
      '/form-config/': [
        {
          text: '基础配置',
          items: [
            {
              text: 'Input输入框',
              link: '/form-config/fields/text.md'
            },
            {
              text: 'Textarea文本域',
              link: '/form-config/fields/textarea.md'
            },
            {
              text: 'InputNumber计数器',
              link: '/form-config/fields/number.md'
            },
            {
              text: 'Display只读文本',
              link: '/form-config/fields/display.md'
            },
            {
              text: 'Hidden隐藏域',
              link: '/form-config/fields/hidden.md'
            },
            {
              text: 'Link链接',
              link: '/form-config/fields/link.md'
            },
            {
              text: 'Checkbox多选框',
              link: '/form-config/fields/checkbox.md'
            },
            {
              text: 'Radio单选框',
              link: '/form-config/fields/radio.md'
            },
            {
              text: 'Switch开关',
              link: '/form-config/fields/switch.md'
            },
            {
              text: 'Select选择器',
              link: '/form-config/fields/select.md'
            },
            {
              text: 'Cascader级联选择器',
              link: '/form-config/fields/cascader.md'
            },
            {
              text: 'ColorPicker颜色选择器',
              link: '/form-config/fields/color-picker.md'
            },
            {
              text: 'DatePick日期选择器',
              link: '/form-config/fields/date-picker.md'
            },
            {
              text: 'DatetimePick日期时间选择器',
              link: '/form-config/fields/datetime-picker.md'
            },
            {
              text: 'TimePick时间选择器',
              link: '/form-config/fields/time-picker.md'
            }
          ]
        },
        {
          text: '布局配置',
          items: [
            {
              text: '布局',
              link: '/form-config/layout.md',
            }
          ]
        },
        {
          text: '联动配置',
          items: [
            {
              text: '联动',
              link: '/form-config/relate.md',
            }
          ]
        },
        {
          text: '表单对比',
          items: [
            {
              text: '表单对比',
              link: '/form-config/compare.md',
            }
          ]
        }
      ]
    },
  },

  vite: {
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    resolve: {
      alias:[
        { find: /^@tmagic\/form/, replacement: path.join(__dirname, '../../packages/form/src/index.ts') },
        { find: /^@tmagic\/utils/, replacement: path.join(__dirname, '../../packages/utils/src/index.ts') },
        { find: /^@tmagic\/schema/, replacement: path.join(__dirname, '../../packages/schema/src/index.ts') },
        { find: /^@tmagic\/design/, replacement: path.join(__dirname, '../../packages/design/src/index.ts') },
        { find: /^@tmagic\/element-plus-adapter/, replacement: path.join(__dirname, '../../packages/element-plus-adapter/src/index.ts') },
      ]
    },
    ssr: {
      noExternal: ['lodash-es'],
    }
  }
});
