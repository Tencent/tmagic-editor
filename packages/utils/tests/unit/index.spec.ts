/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
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

import { assert, describe, expect, test, vi } from 'vitest';

import type { DataSchema } from '@tmagic/schema';

import * as util from '../../src';

describe('asyncLoadJs', () => {
  const url = 'https://m.www.tmagic.com/magic-ui/production/1/1625056093304/magic/magic-ui.umd.min.js';

  // 在测试环境中，浏览器不会真的加载外部 script。
  // 通过监听插入到 head 的 script 节点，手动派发 load 事件来驱动 Promise resolve。
  const triggerScriptLoad = () => {
    queueMicrotask(() => {
      const scripts = document.getElementsByTagName('script');
      Array.from(scripts).forEach((s) => {
        if (typeof s.onload === 'function') {
          (s.onload as any)(new Event('load'));
        }
      });
    });
  };

  test('第一次加载asyncLoadJs带url与crossorigin参数', async () => {
    const crossOrigin = 'anonymous';
    const load = util.asyncLoadJs(url, crossOrigin);
    triggerScriptLoad();
    await load;
    const script = document.getElementsByTagName('script')[0];
    expect(script).not.toBeUndefined();
    expect(script.type).toMatch('text/javascript');
    expect(script.crossOrigin).toMatch(crossOrigin);
    expect(script.src).toMatch(url);
  });

  test('第二次加载asyncLoadJs', async () => {
    const load1 = util.asyncLoadJs(url, 'anonymous');
    triggerScriptLoad();
    await load1;
    await util.asyncLoadJs(url, 'use-credentials');
    const scriptList = document.getElementsByTagName('script');
    expect(scriptList.length).toBe(1);
    expect(scriptList[0].crossOrigin).toMatch('anonymous');
    expect(scriptList[0].src).toMatch(url);
  });

  test('url无效, onerror 触发后 reject', async () => {
    const promise = util.asyncLoadJs('error-url');
    queueMicrotask(() => {
      const scripts = document.getElementsByTagName('script');
      Array.from(scripts).forEach((s) => {
        if (s.src.includes('error-url') && typeof s.onerror === 'function') {
          (s.onerror as any)(new Event('error'));
        }
      });
    });
    await expect(promise).rejects.toBeInstanceOf(Error);
  });
});

describe('asyncLoadCss', () => {
  const url = 'https://beta.m.www.tmagic.com/magic-act/css/BuyGift.75d837d2b3fd.css?max_age=864000';

  const triggerLinkLoad = () => {
    queueMicrotask(() => {
      const links = document.getElementsByTagName('link');
      Array.from(links).forEach((l) => {
        if (typeof l.onload === 'function') {
          (l.onload as any)(new Event('load'));
        }
      });
    });
  };

  test('第一次加载asyncLoadCss', async () => {
    const load = util.asyncLoadCss(url);
    triggerLinkLoad();
    await load;
    const link = document.getElementsByTagName('link')[0];
    expect(link).not.toBeUndefined();
    expect(link.rel).toMatch('stylesheet');
    expect(link.href).toMatch(url);
  });

  test('第二次加载asyncLoadCss命中缓存', async () => {
    const load1 = util.asyncLoadCss(url);
    triggerLinkLoad();
    await load1;
    await util.asyncLoadCss(url);
    const linkList = document.getElementsByTagName('link');
    expect(linkList.length).toBe(1);
    expect(linkList[0].href).toMatch(url);
  });

  test('url无效, onerror 触发后 reject', async () => {
    const promise = util.asyncLoadCss('error-css');
    queueMicrotask(() => {
      const links = document.getElementsByTagName('link');
      Array.from(links).forEach((l) => {
        if (l.href.includes('error-css') && typeof l.onerror === 'function') {
          (l.onerror as any)(new Event('error'));
        }
      });
    });
    await expect(promise).rejects.toBeInstanceOf(Error);
  });
});

describe('toLine', () => {
  test('aBc', () => {
    const value = util.toLine('aBc');
    expect(value).toBe('a-bc');
  });

  test('aBC', () => {
    const value = util.toLine('aBC');
    expect(value).toBe('a-b-c');
  });

  test('ABC', () => {
    const value = util.toLine('ABC');
    expect(value).toBe('a-b-c');
  });
});

describe('toHump', () => {
  test('a-bc', () => {
    const value = util.toHump('a-bc');
    expect(value).toBe('aBc');
  });

  test('a-b-c', () => {
    const value = util.toHump('a-b-c');
    expect(value).toBe('aBC');
  });

  test('-b-c', () => {
    const value = util.toHump('-b-c');
    expect(value).toBe('BC');
  });
});

describe('getNodePath', () => {
  const root = [
    {
      id: 1,
      type: 'container',
      items: [
        {
          id: 11,
          items: [
            {
              id: 111,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      type: 'container',
      items: [
        {
          id: 22,
          items: [
            {
              id: 222,
            },
          ],
        },
      ],
    },
  ];
  test('基础', () => {
    const path = util.getNodePath(111, root);
    const path2 = util.getNodePath(22, root);
    expect(path).toHaveLength(3);
    expect(path2).toHaveLength(2);
  });

  test('error', () => {
    const path = util.getNodePath(111, 123 as any);
    const path2 = util.getNodePath(33, root);
    expect(path).toHaveLength(0);
    expect(path2).toHaveLength(0);
  });

  test('skip 跳过指定子树后查找不到其内部节点', () => {
    // 跳过 id 为 2 的容器，其子树（22 / 222）不再被遍历
    const skipped = util.getNodePath(222, root, root[1]);
    expect(skipped).toHaveLength(0);
    // 其它子树不受影响
    const path = util.getNodePath(111, root, root[1]);
    expect(path).toHaveLength(3);
  });

  test('skip 不影响对被跳过节点自身的匹配', () => {
    // skip 仅阻止递归进入其 items，节点自身仍可被匹配到
    const path = util.getNodePath(2, root, root[1]);
    expect(path).toHaveLength(1);
    expect(path[0].id).toBe(2);
  });
});

describe('filterXSS', () => {
  test('<>', () => {
    const value = util.filterXSS('<div></div>');
    expect(value).toBe('&lt;div&gt;&lt;/div&gt;');
  });

  test('\'"', () => {
    const value = util.filterXSS('\'div\'"span"');
    expect(value).toBe('&apos;div&apos;&quot;span&quot;');
  });
});

describe('getUrlParam', () => {
  test('正常', () => {
    const url = 'http://www.tmagic.com?a=b';
    const value = util.getUrlParam('a', url);
    expect(value).toBe('b');
  });

  test('null', () => {
    const url = 'http://www.tmagic.com';
    const value = util.getUrlParam('a', url);
    expect(value).toBe('');
  });

  test('emprty', () => {
    const url = 'http://www.tmagic.com?a=';
    const value = util.getUrlParam('a', url);
    expect(value).toBe('');
  });
});

describe('setUrlParam', () => {
  test('正常', () => {
    expect(util.setUrlParam('a', '1', 'https://www.tmagic.com')).toBe('https://www.tmagic.com?a=1');

    expect(util.setUrlParam('a', '1', 'https://www.tmagic.com?c&d')).toBe('https://www.tmagic.com?c&d&a=1');
    expect(util.setUrlParam('a', '1', 'https://www.tmagic.com?b=1')).toBe('https://www.tmagic.com?b=1&a=1');
  });
});

describe('getSearchObj', () => {
  test('正常', () => {
    expect(util.getSearchObj('a=1&b=2')).toEqual({ a: '1', b: '2' });
  });
});

describe('delQueStr', () => {
  test('正常', () => {
    expect(util.delQueStr('https://www.tmagic.com?a=1', 'a')).toBe('https://www.tmagic.com');
    expect(util.delQueStr('https://www.tmagic.com?a=1&b=2', ['a', 'b'])).toBe('https://www.tmagic.com');
    expect(util.delQueStr('https://www.tmagic.com?a=1&b=2', ['a'])).toBe('https://www.tmagic.com?b=2');
  });
});

describe('isPop', () => {
  // type 为 pop 结尾 isPop 才为 true
  test('true', () => {
    expect(
      util.isPop({
        type: 'pop',
        id: 1,
      }),
    ).toBeTruthy();
  });

  test('endswidth true', () => {
    expect(
      util.isPop({
        type: 'xxxpop',
        id: 1,
      }),
    ).toBeTruthy();
  });

  test('false', () => {
    expect(
      util.isPop({
        type: 'pop1',
        id: 1,
      }),
    ).toBeFalsy();
  });
});

describe('isPage', () => {
  test('true', () => {
    expect(
      util.isPage({
        type: 'page',
        id: 1,
      }),
    ).toBeTruthy();
  });

  test('false', () => {
    expect(
      util.isPage({
        type: 'pop1',
        id: 1,
      }),
    ).toBeFalsy();
  });
});

describe('getHost', () => {
  test('正常', () => {
    const host = util.getHost('https://www.tmagic.com/index.html');
    expect(host).toBe('www.tmagic.com');
  });
});

describe('isSameDomain', () => {
  test('正常', () => {
    const flag = util.isSameDomain('https://www.tmagic.com/index.html', 'www.tmagic.com');
    expect(flag).toBeTruthy();
  });

  test('不正常', () => {
    const flag = util.isSameDomain('https://www.tmagic.com/index.html', 'test.www.tmagic.com');
    expect(flag).toBeFalsy();
  });

  test('不是http', () => {
    const flag = util.isSameDomain('ftp://www.tmagic.com/index.html', 'test.www.tmagic.com');
    expect(flag).toBeTruthy();
  });
});

describe('guid', () => {
  test('获取id', () => {
    const id = util.guid();
    const id1 = util.guid();
    expect(typeof id).toBe('string');
    expect(id === id1).toBeFalsy();
  });
});

describe('getValueByKeyPath', () => {
  test('key', () => {
    const value = util.getValueByKeyPath('a', {
      a: 1,
    });

    expect(value).toBe(1);
  });

  test('keys', () => {
    const value = util.getValueByKeyPath('a.b', {
      a: {
        b: 1,
      },
    });

    expect(value).toBe(1);
  });

  test('array', () => {
    const value = util.getValueByKeyPath('a.0.b', {
      a: [
        {
          b: 1,
        },
      ],
    });

    expect(value).toBe(1);

    const value1 = util.getValueByKeyPath('a[0].b', {
      a: [
        {
          b: 1,
        },
      ],
    });

    expect(value1).toBe(1);
  });

  test('error', () => {
    assert.throws(() => {
      util.getValueByKeyPath('a.b.c.d', {
        a: {},
      });
    });

    assert.throws(() => {
      util.getValueByKeyPath('a.b.c', {
        a: {},
      });
    });

    assert.doesNotThrow(() => {
      util.getValueByKeyPath('a', {
        a: {},
      });
    });
  });
});

describe('getNodes', () => {
  test('获取id', () => {
    const root = [
      {
        id: 1,
        type: 'container',
        items: [
          {
            id: 11,
            items: [
              {
                id: 111,
              },
            ],
          },
        ],
      },
      {
        id: 2,
        type: 'container',
        items: [
          {
            id: 22,
            items: [
              {
                id: 222,
              },
            ],
          },
        ],
      },
      {
        id: 3,
        type: 'container',
        items: {
          id: 33,
          items: [
            {
              id: 333,
            },
          ],
        },
      },
    ];
    const nodes = util.getNodes([22, 111, 2], root);
    expect(nodes.length).toBe(3);
  });
});

describe('getNodes - 补充', () => {
  const createRoot = (): any[] => [
    { id: 1, items: [{ id: 11, items: [{ id: 111 }] }, { id: 12 }] },
    { id: 2, items: [{ id: 21 }] },
  ];

  test('按先序遍历顺序返回，且 id 类型不敏感', () => {
    const nodes = util.getNodes(['21', 111, 1], createRoot());
    expect(nodes.map((n) => n.id)).toEqual([1, 111, 21]);
  });

  test('找到的 id 会从传入的 ids 中移除，未找到的保留', () => {
    const ids: (string | number)[] = [11, 'none', 21];
    const nodes = util.getNodes(ids, createRoot());
    expect(nodes.map((n) => n.id)).toEqual([11, 21]);
    expect(ids).toEqual(['none']);
  });

  test('ids 为空时直接返回空数组', () => {
    expect(util.getNodes([], createRoot())).toEqual([]);
  });

  test('ids 中重复的 id 按次数匹配', () => {
    const root = [{ id: 1 }, { id: 1 }, { id: 1 }];
    const ids = [1, 1];
    expect(util.getNodes(ids, root).length).toBe(2);
    expect(ids).toEqual([]);
  });

  test('所有 id 找到后提前结束遍历', () => {
    const root: any[] = createRoot();
    const lateAccess = vi.fn();
    Object.defineProperty(root[1], 'items', {
      get() {
        lateAccess();
        return [];
      },
    });
    const nodes = util.getNodes([11], root);
    expect(nodes.length).toBe(1);
    expect(lateAccess).not.toHaveBeenCalled();
  });

  test('data 默认值与非数组 items', () => {
    expect(util.getNodes([1])).toEqual([]);
    expect(util.getNodes([33], [{ id: 3, items: { id: 33 } } as any])).toEqual([]);
  });
});

describe('replaceChildNodes', () => {
  const createRoot = (): any[] => [
    {
      id: 'page',
      items: [
        { id: 'a', text: '', items: [{ id: 'a1', text: '' }] },
        { id: 'b', text: '' },
        { id: 'c', text: '', items: [{ id: 'c1', text: '', items: [{ id: 'c11', text: '' }] }] },
      ],
    },
  ];

  test('批量替换多个节点', () => {
    const root = createRoot();
    util.replaceChildNodes(
      [
        { id: 'a1', text: 'A1' },
        { id: 'b', text: 'B' },
        { id: 'c11', text: 'C11' },
      ],
      root,
    );
    expect(root[0].items[0].items[0].text).toBe('A1');
    expect(root[0].items[1].text).toBe('B');
    expect(root[0].items[2].items[0].items[0].text).toBe('C11');
  });

  test('结果与依次调用 replaceChildNode 一致', () => {
    const newNodes = [
      { id: 'c1', text: 'C1', items: [] as any[] },
      { id: 'a', text: 'A' },
    ];
    const rootA = createRoot();
    const rootB = createRoot();
    newNodes.forEach((n) => util.replaceChildNode(n as any, rootA));
    util.replaceChildNodes(newNodes as any, rootB);
    expect(rootB).toEqual(rootA);
  });

  test('父节点与子节点同时替换，且新父节点的 items 是新数组时仍能替换到新父节点下', () => {
    const root = createRoot();
    const newChild = { id: 'c11', text: 'new' };
    const newParent = { id: 'c1', text: 'p', items: [{ id: 'c11', text: 'old-copy' }] };
    util.replaceChildNodes([newParent, newChild], root);
    expect(root[0].items[2].items[0]).toBe(newParent);
    expect(newParent.items[0]).toBe(newChild);
  });

  test('父节点与子节点同时替换，新父节点共用原 items 数组', () => {
    const root = createRoot();
    const oldItems = root[0].items[2].items;
    const newParent = { id: 'c', text: 'p', items: oldItems };
    const newChild = { id: 'c1', text: 'child' };
    util.replaceChildNodes([newParent, newChild], root);
    expect(root[0].items[2]).toBe(newParent);
    expect(root[0].items[2].items[0]).toBe(newChild);
  });

  test('传入顺序为子节点在前、父节点在后时，也会先替换父节点，子节点的更新不会被覆盖', () => {
    const root = createRoot();
    const newChild = { id: 'c11', text: 'new-child' };
    // 新父节点的 items 是新数组，里面还是旧的子节点副本
    const newParent = { id: 'c1', text: 'p', items: [{ id: 'c11', text: 'old-copy' }] };

    util.replaceChildNodes([newChild, newParent], root);

    expect(root[0].items[2].items[0]).toBe(newParent);
    expect(newParent.items[0]).toBe(newChild);
  });

  test('传入顺序为子节点在前、新父节点共用原 items 数组时同样正确', () => {
    const root = createRoot();
    const newParent = { id: 'c', text: 'p', items: root[0].items[2].items };
    const newChild = { id: 'c1', text: 'child' };

    util.replaceChildNodes([newChild, newParent], root);

    expect(root[0].items[2]).toBe(newParent);
    expect(root[0].items[2].items[0]).toBe(newChild);
  });

  test('同一层级保持传入顺序，不影响传入的数组', () => {
    const root = createRoot();
    const first = { id: 'b', text: '1' };
    const second = { id: 'b', text: '2' };
    const deep = { id: 'c11', text: 'deep' };
    const input = [deep, first, second];

    util.replaceChildNodes(input, root);

    expect(root[0].items[1]).toBe(second);
    expect(root[0].items[2].items[0].items[0]).toBe(deep);
    expect(input).toEqual([deep, first, second]);
  });

  test('目标节点不存在、位于顶层、newNodes 为空时的处理', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const root = createRoot();

    util.replaceChildNodes([], root);
    expect(warn).not.toHaveBeenCalled();

    util.replaceChildNodes([{ id: 'none' }], root);
    expect(warn).toHaveBeenCalledWith('未找到目标节点(none)');

    util.replaceChildNodes([{ id: 'page' }], root);
    expect(warn).toHaveBeenCalledWith('未找到父节点(page)');

    // data 使用默认值
    expect(() => util.replaceChildNodes([{ id: 'x' }])).not.toThrow();

    warn.mockRestore();
  });

  test('位置信息失效（数组被外部修改）时回退到 findIndex', () => {
    const root = createRoot();
    const first = { id: 'a', text: 'A', items: root[0].items[0].items };
    const second = { id: 'b', text: 'B' };
    // 第一次替换时通过 getter 在中途改变数组顺序
    const container = root[0].items;
    const origSplice = container.splice.bind(container);
    container.splice = (...args: any[]) => {
      const r = origSplice(...(args as [number, number, ...any[]]));
      container.unshift({ id: 'inserted' });
      return r;
    };
    util.replaceChildNodes([first, second], root);
    container.splice = origSplice;
    expect(container.find((n: any) => n.id === 'b')).toBe(second);
    expect(container.find((n: any) => n.id === 'a')).toBe(first);
  });
});

describe('getDepKeys', () => {
  test('get keys', () => {
    const keys = util.getDepKeys(
      {
        ds_bebcb2d5: {
          61705611: {
            name: '文本',
            keys: ['text'],
          },
        },
      },
      61705611,
    );
    expect(keys).toEqual(['text']);
  });
});

describe('getDepNodeIds', () => {
  test('get node ids', () => {
    const ids = util.getDepNodeIds({
      ds_bebcb2d5: {
        61705611: {
          name: '文本',
          keys: ['text'],
        },
      },
    });
    expect(ids).toEqual(['61705611']);
  });
});

describe('replaceChildNode', () => {
  test('replace', () => {
    const root = [
      {
        id: 1,
        text: '',
        type: 'container',
        items: [
          {
            id: 11,
            text: '',
            items: [
              {
                id: 111,
                text: '',
              },
            ],
          },
        ],
      },
      {
        id: 2,
        type: 'container',
        text: '',
        items: [
          {
            id: 22,
            text: '',
            items: [
              {
                id: 222,
                text: '',
              },
            ],
          },
        ],
      },
    ];
    expect(root[1].items[0].items[0].text).toBe('');
    util.replaceChildNode(
      {
        id: 222,
        text: '文本',
      },
      root,
    );
    expect(root[1].items[0].items[0].text).toBe('文本');
  });

  test('replace with parent', () => {
    const root = [
      {
        id: 1,
        text: '',
        type: 'container',
        items: [
          {
            id: 11,
            text: '',
            items: [
              {
                id: 111,
                text: '',
              },
            ],
          },
        ],
      },
      {
        id: 2,
        type: 'container',
        text: '',
        items: [
          {
            id: 22,
            text: '',
            items: [
              {
                id: 222,
                text: '',
              },
            ],
          },
        ],
      },
    ];
    expect(root[1].items[0].items[0].text).toBe('');
    util.replaceChildNode(
      {
        id: 222,
        text: '文本',
      },
      root,
      22,
    );
    expect(root[1].items[0].items[0].text).toBe('文本');
  });
});

describe('compiledNode', () => {
  test('传入 sourceId 但节点不在该数据源依赖中时不抛错，节点保持不变', () => {
    const node: any = { id: 'x', type: 'text', text: 't' };
    const compile = vi.fn((v: any) => v);

    expect(() =>
      util.compiledNode(compile, node, { ds_1: { other: { name: 'o', keys: ['text'] } } } as any, 'ds_1'),
    ).not.toThrow();
    expect(util.compiledNode(compile, node, { ds_1: { other: { name: 'o', keys: ['text'] } } } as any, 'ds_1')).toBe(
      node,
    );
    expect(util.compiledNode(compile, node, {}, 'ds_none')).toBe(node);
    expect(compile).not.toHaveBeenCalled();
    expect(node.text).toBe('t');
  });

  test('compiled', () => {
    const node = util.compiledNode(
      (_str: string) => '123',
      {
        id: 61705611,
        type: 'text',
        text: {
          value: '456',
        },
      },
      {
        ds_bebcb2d5: {
          61705611: {
            name: '文本',
            keys: ['text.value'],
          },
        },
      },
    );

    expect(node.text.value).toBe('123');
  });

  test('compile with source id', () => {
    const node = util.compiledNode(
      (_str: string) => '123',
      {
        id: 61705611,
        type: 'text',
        text: '456',
      },
      {
        ds_bebcb2d5: {
          61705611: {
            name: '文本',
            keys: ['text'],
          },
        },
      },
      'ds_bebcb2d5',
    );

    expect(node.text).toBe('123');
  });

  test('compile error', () => {
    const node = util.compiledNode(
      (_str: string) => {
        throw new Error('error');
      },
      {
        id: 61705611,
        type: 'text',
        text: '456',
      },
      {
        ds_bebcb2d5: {
          61705611: {
            name: '文本',
            keys: ['text'],
          },
        },
      },
    );

    expect(node.text).toBe('');
  });

  test('compile 缓存命中时直接复用 cache value', () => {
    const node: any = {
      id: 61705611,
      type: 'text',
      [`${util.DSL_NODE_KEY_COPY_PREFIX}text`]: 'cached-template',
      text: 'old-value',
    };
    const result = util.compiledNode((str: string) => `compiled-${str}`, node, {
      ds_bebcb2d5: {
        61705611: {
          name: '文本',
          keys: ['text'],
        },
      },
    });
    expect(result.text).toBe('compiled-cached-template');
  });
});

describe('getDefaultValueFromFields', () => {
  test('最简单', () => {
    const fields = [
      {
        name: 'name',
      },
    ];
    const data = util.getDefaultValueFromFields(fields);
    expect(data).toHaveProperty('name');
  });

  test('默认值为string', () => {
    const fields = [
      {
        name: 'name',
        defaultValue: 'name',
      },
    ];
    const data = util.getDefaultValueFromFields(fields);
    expect(data.name).toBe('name');
  });

  test('type 为 object', () => {
    const fields: DataSchema[] = [
      {
        type: 'object',
        name: 'name',
      },
    ];
    const data = util.getDefaultValueFromFields(fields);
    expect(data.name).toEqual({});
  });

  test('type 为 array', () => {
    const fields: DataSchema[] = [
      {
        type: 'array',
        name: 'name',
      },
    ];
    const data = util.getDefaultValueFromFields(fields);
    expect(data.name).toEqual([]);
  });

  test('type 为 null', () => {
    const fields: DataSchema[] = [
      {
        type: 'null',
        name: 'name',
      },
    ];
    const data = util.getDefaultValueFromFields(fields);
    expect(data.name).toBeNull();
  });

  test('object 嵌套', () => {
    const fields: DataSchema[] = [
      {
        type: 'object',
        name: 'name',
        fields: [
          {
            name: 'key',
            defaultValue: 'key',
          },
        ],
      },
    ];
    const data = util.getDefaultValueFromFields(fields);
    expect(data.name.key).toBe('key');
  });
});

describe('compiledCond', () => {
  test('is', () => {
    expect(util.compiledCond('is', undefined, 1)).toBeFalsy();
    expect(util.compiledCond('is', 1, 1)).toBeTruthy();
    expect(util.compiledCond('is', '1', 1)).toBeFalsy();
    expect(util.compiledCond('is', NaN, 1)).toBeFalsy();
    expect(util.compiledCond('is', NaN, undefined)).toBeFalsy();
  });
});

describe('getKeysArray', () => {
  // 测试普通数组索引转换
  test('应该将array[0]转换为["array", "0"]', () => {
    const input = 'array[0]';
    const expected = ['array', '0'];
    const result = util.getKeysArray(input);
    expect(result).toEqual(expected);
  });

  // 测试多层数组索引转换
  test('应该将array[0][1]转换为["array", "0", "1"]', () => {
    const input = 'array[0][1]';
    const expected = ['array', '0', '1'];
    const result = util.getKeysArray(input);
    expect(result).toEqual(expected);
  });

  // 测试数字输入
  test('应该将数字123转换为["123"]', () => {
    const input = 123;
    const expected = ['123'];
    const result = util.getKeysArray(input);
    expect(result).toEqual(expected);
  });

  // 测试不含数组索引的字符串
  test('应该将普通字符串按点号分割', () => {
    const input = 'a.b.c';
    const expected = ['a', 'b', 'c'];
    const result = util.getKeysArray(input);
    expect(result).toEqual(expected);
  });

  // 测试空字符串
  test('应该正确处理空字符串', () => {
    const input = '';
    const expected = [''];
    const result = util.getKeysArray(input);
    expect(result).toEqual(expected);
  });

  // 测试混合格式
  test('应该正确处理混合格式的字符串', () => {
    const input = 'obj.array[0].prop[1]';
    const expected = ['obj', 'array', '0', 'prop', '1'];
    const result = util.getKeysArray(input);
    expect(result).toEqual(expected);
  });

  // 测试特殊字符情况
  test('应该正确处理包含特殊字符的字符串', () => {
    const input = 'obj.array[0].prop-with-dash[1]';
    const expected = ['obj', 'array', '0', 'prop-with-dash', '1'];
    const result = util.getKeysArray(input);
    expect(result).toEqual(expected);
  });

  // 测试只有数组索引的情况
  test('应该正确处理只有数组索引的情况', () => {
    const input = '[0][1]';
    const expected = ['', '0', '1'];
    const result = util.getKeysArray(input);
    expect(result).toEqual(expected);
  });
});
