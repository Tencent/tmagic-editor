import { describe, expect, test } from 'vitest';

import { MApp, NodeType, TMagicIteratorContainer } from '@tmagic/schema';

import App from '../src/App';

const createAppDsl = (pageLength: number, nodeLength = 0) => {
  const dsl: MApp = {
    type: NodeType.ROOT,
    id: 'app_1',
    dataSources: [
      {
        id: 'ds_1',
        fields: [
          {
            type: 'array',
            name: 'array',
            title: 'array',
            enable: true,
            fields: [
              {
                type: 'array',
                name: 'arr',
                title: 'arr',
                defaultValue: [],
                enable: true,
                fields: [],
              },
            ],
          },
        ],
        events: [],
        methods: [],
        type: 'base',
      },
    ],
    dataSourceDeps: {},
    dataSourceCondDeps: {},
    items: [
      ...new Array(pageLength)
        .fill({
          type: NodeType.PAGE,
          items: new Array(nodeLength)
            .fill({
              type: 'text',
            })
            .map((node, index) => ({
              ...node,
              id: `text_${index}`,
            })),
        })
        .map((page, index) => ({
          ...page,
          id: `page_${index}`,
        })),
      {
        type: NodeType.PAGE_FRAGMENT,
        id: 'page_fragment_1',
        items: [
          {
            type: 'text',
            id: 'text_page_fragment',
            text: 'text_page_fragment',
          },
        ],
      },
    ],
  };

  return dsl;
};

describe('App', () => {
  test('instance', () => {
    const app = new App({});
    expect(app).toBeInstanceOf(App);
  });

  test('page', () => {
    const app = new App({
      config: createAppDsl(2),
    });
    expect(app.getNode('page_0')?.data.id).toBe('page_0');
    expect(app.page?.data.id).toBe('page_0');

    app.setConfig(createAppDsl(3), 'page_1');
    expect(app.page?.data.id).toBe('page_1');

    app.setPage('page_2');
    expect(app.page?.data.id).toBe('page_2');
  });

  test('node', () => {
    const app = new App({
      config: createAppDsl(1, 10),
    });

    expect(app.getNode('text_1')?.data.id).toBe('text_1');
  });

  test('iterator-container', () => {
    const dsl = createAppDsl(1, 10);

    dsl.items[0].items.push({
      type: 'iterator-container',
      id: 'iterator-container_1',
      items: [
        {
          type: 'text',
          id: 'text',
        },
      ],
    });

    const app = new App({
      config: dsl,
    });

    const ic = app.getNode('iterator-container_1') as unknown as TMagicIteratorContainer;

    expect(ic?.data.id).toBe('iterator-container_1');

    ic?.setNodes(
      [
        {
          type: 'text',
          id: 'text',
          text: '1',
        },
        {
          type: 'page-fragment-container',
          id: 'page_fragment_container_1',
          pageFragmentId: 'page_fragment_1',
        },
        {
          type: 'iterator-container',
          id: 'iterator-container_11',
          items: [
            {
              type: 'text',
              id: 'text',
            },
          ],
        },
      ],
      0,
    );

    ic?.setNodes(
      [
        {
          type: 'text',
          id: 'text',
          text: '2',
        },
        {
          type: 'iterator-container',
          id: 'iterator-container_11',
          items: [
            {
              type: 'text',
              id: 'text',
            },
          ],
        },
      ],
      1,
    );

    expect(app.getNode('text', ['iterator-container_1'], [0])?.data.text).toBe('1');
    expect(app.getNode('text', ['iterator-container_1'], [1])?.data.text).toBe('2');
    expect(app.getNode('text_page_fragment', ['iterator-container_1'], [0])?.data.text).toBe('text_page_fragment');

    const ic1 = app.getNode(
      'iterator-container_11',
      ['iterator-container_1'],
      [0],
    ) as unknown as TMagicIteratorContainer;

    ic1?.setNodes(
      [
        {
          type: 'text',
          id: 'text',
          text: '111',
        },
      ],
      0,
    );

    ic1?.setNodes(
      [
        {
          type: 'text',
          id: 'text',
          text: '222',
        },
      ],
      1,
    );

    const ic2 = app.getNode(
      'iterator-container_11',
      ['iterator-container_1'],
      [1],
    ) as unknown as TMagicIteratorContainer;

    ic2?.setNodes(
      [
        {
          type: 'text',
          id: 'text',
          text: '11',
        },
      ],
      0,
    );

    ic2?.setNodes(
      [
        {
          type: 'text',
          id: 'text',
          text: '22',
        },
      ],
      1,
    );

    expect(app.getNode('text', ['iterator-container_1', 'iterator-container_11'], [0, 0])?.data.text).toBe('111');
    expect(app.getNode('text', ['iterator-container_1', 'iterator-container_11'], [0, 1])?.data.text).toBe('222');
    expect(app.getNode('text', ['iterator-container_1', 'iterator-container_11'], [1, 0])?.data.text).toBe('11');
    expect(app.getNode('text', ['iterator-container_1', 'iterator-container_11'], [1, 1])?.data.text).toBe('22');

    ic.resetNodes();

    expect(ic2?.nodes.length).toBe(0);
  });
});
