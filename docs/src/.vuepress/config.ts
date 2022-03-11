import { defineUserConfig } from '@vuepress/cli'
import type { DefaultThemeOptions } from '@vuepress/theme-default'
import path from 'path';

const sidebar = {
  guide: [
    {
      text: '使用指南',
      children: [
        '/guide/introduction',
        '/guide/installation',
        '/guide/conception',
      ]
    }, {
      text: '进阶指南',
      children: [
        '/guide/advanced/js-schema.md',
        '/guide/advanced/layout.md',
        '/guide/advanced/page.md',
        '/guide/advanced/high-level-function.md',
        '/guide/advanced/magic-ui.md',
        '/guide/advanced/magic-form.md',
        '/guide/advanced/coupling.md',
      ]
    }
  ],
  page: [
    {
      text: '页面发布',
      sidebarDepth: 2,
      children: [
        '/page/introduction',
        '/page/advanced',
      ]
    }
  ],
  admin: [
    {
      text: '管理端Demo',
      children: [
        '/admin/introduction',
      ]
    }
  ],
  component: [
    {
      text: '组件开发',
      children: [
        '/component/introduction',
      ]
    }
  ],
  api: [
    {
      text: '编辑器',
      children: [
        '/api/editor',
        '/api/model',
      ]
    },
    {
      text: '表单',
      children: [
        '/api/form',
      ]
    },
    {
      text: '表单配置协议',
      children: [
        '/api/base-config',
        '/api/field-config',
      ]
    }
  ]
};

export default defineUserConfig<DefaultThemeOptions>({
  title: '魔方',
  description: 'magic',
  clientAppEnhanceFiles: path.resolve(__dirname, './clientAppEnhance.ts'),
  themeConfig: {
    logo: 'https://vfiles.gtimg.cn/vupload/20210811/388ed01628667545737.png',
    navbar: [
      {
        text: '文档',
        children: [
          {
            text: '使用指南',
            link: '/guide/introduction'
          },
          {
            text: '组件开发',
            link: '/component/introduction'
          },
          {
            text: '页面发布',
            link: '/page/introduction'
          },
          {
            text: '管理端Demo',
            link: '/admin/introduction'
          },
        ]
      },
      {
        text: 'API参考',
        link: '/api/editor'
      }, {
        text: '查看源码',
        link: 'https://github.com/Tencent/tmagic-editor'
      }, {
        text: 'Playground',
        link: 'https://tencent.github.io/tmagic-editor/playground/index.html'
      }
    ],
    docsDir: 'src',
    sidebarDepth: 2,
    sidebar: {
      '/guide/': sidebar.guide,
      '/page/': sidebar.page,
      '/component/': sidebar.component,
      '/api/': sidebar.api,
    },
    smoothScroll: false,
    lastUpdated: false,
    contributors: false,

  },
  base: '/tmagic-editor/docs/',
  bundlerConfig: {
    vuePluginOptions: {
      template: {
        ssr: true,
        compilerOptions: {
          directiveTransforms: {
            loading: () => {
              return {
                props: [],
                needRuntime: true,
              };
            },
          },
        },
      },
    },
    viteOptions: {
      resolve: {
        alias:[
          { find: /^@tmagic\/form/, replacement: path.join(__dirname, '../../../packages/form/src/index.ts') },
          { find: /^@tmagic\/form/, replacement: path.join(__dirname, '../../../packages/form/src/index.ts') },
          { find: /^@tmagic\/utils/, replacement: path.join(__dirname, '../../../packages/utils/src/index.ts') },
        ]
      },
    },
  },
});
