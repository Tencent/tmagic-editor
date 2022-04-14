/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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

import * as util from '../../src';

describe('datetimeFormatter', () => {
  // Date会将时间转为UTC
  const date = new Date('2021-07-17T15:37:00');
  const dateValue = '2021-07-17 15:37:00';
  const defaultValue = '默认值';

  it('v为空且未设置默认时间', () => {
    expect(util.datetimeFormatter('')).toBe('-');
  });

  it('v是字符串且未设置了默认时间', () => {
    expect(util.datetimeFormatter('abc', defaultValue)).toMatch(defaultValue);
  });

  it('v是日期字符串', () => {
    expect(util.datetimeFormatter(date.toISOString(), defaultValue)).toMatch(dateValue);
  });

  it('v是Date对象', () => {
    expect(util.datetimeFormatter(date)).toMatch(dateValue);
  });

  it('v是UTC字符串', () => {
    expect(util.datetimeFormatter(date.toUTCString())).toMatch(dateValue);
  });

  it('format是x', () => {
    expect(util.datetimeFormatter(date.toISOString(), defaultValue, 'timestamp')).toBe(date.getTime());
  });
});

describe('util', () => {
  jest.useFakeTimers();

  it('sleep', (done) => {
    const callback = jest.fn();

    util
      .sleep(500)
      .then(callback)
      .then(() => {
        expect(callback).toBeCalled();
        done();
      });

    // 快进500毫秒，callback应该已执行
    jest.advanceTimersByTime(500);
  });
});

describe('asyncLoadJs', () => {
  const url = 'https://m.film.qq.com/magic-ui/production/1/1625056093304/magic/magic-ui.umd.min.js';

  /**
   * @jest-environment jsdom
   */

  it('第一次加载asyncLoadJs带url与crossorigin参数', () => {
    const crossOrigin = 'anonymous';
    const load = util.asyncLoadJs(url, crossOrigin);
    load.then(() => {
      const script = document.getElementsByTagName('script')[0];
      expect(script).not.toBeUndefined();
      expect(script.type).toMatch('text/javascript');
      // 设置了anonymous
      expect(script.crossOrigin).toMatch(crossOrigin);
      expect(script.src).toMatch(url);
    });
  });

  it('第二次加载asyncLoadJs', () => {
    util.asyncLoadJs(url, 'anonymous').then(() => {
      util.asyncLoadJs(url, 'use-credentials').then(() => {
        const scriptList = document.getElementsByTagName('script');
        expect(scriptList.length).toBe(1);
        expect(scriptList[0].crossOrigin).toMatch('anonymous');
        expect(scriptList[0].src).toMatch(url);
      });
    });
  });

  it('url无效', () => {
    util.asyncLoadJs('123').catch((e: any) => {
      expect(e).toMatch('error');
    });
  });
});

describe('asyncLoadCss', () => {
  const url = 'https://beta.m.film.qq.com/magic-act/css/BuyGift.75d837d2b3fd.css?max_age=864000';

  /**
   * @jest-environment jsdom
   */

  it('第一次加载asyncLoadCss', () => {
    const load = util.asyncLoadCss(url);
    load.then(() => {
      const link = document.getElementsByTagName('link')[0];
      expect(link).not.toBeUndefined();
      expect(link.rel).toMatch('stylesheet');
      expect(link.href).toMatch(url);
    });
  });

  it('第二次加载asyncLoadJs', () => {
    util.asyncLoadCss(url).then(() => {
      util.asyncLoadCss(url).then(() => {
        const linkList = document.getElementsByTagName('link');
        expect(linkList.length).toBe(1);
        expect(linkList[0].href).toMatch(url);
      });
    });
  });

  it('url无效', () => {
    util.asyncLoadCss('123').catch((e: any) => {
      expect(e).toMatch('error');
    });
  });
});

describe('toLine', () => {
  it('aBc', () => {
    const value = util.toLine('aBc');
    expect(value).toBe('a-bc');
  });

  it('aBC', () => {
    const value = util.toLine('aBC');
    expect(value).toBe('a-b-c');
  });

  it('ABC', () => {
    const value = util.toLine('ABC');
    expect(value).toBe('a-b-c');
  });
});

describe('toHump', () => {
  it('a-bc', () => {
    const value = util.toHump('a-bc');
    expect(value).toBe('aBc');
  });

  it('a-b-c', () => {
    const value = util.toHump('a-b-c');
    expect(value).toBe('aBC');
  });

  it('-b-c', () => {
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
  it('基础', () => {
    const path = util.getNodePath(111, root);
    const path2 = util.getNodePath(22, root);
    expect(path).toHaveLength(3);
    expect(path2).toHaveLength(2);
  });

  it('error', () => {
    const path = util.getNodePath(111, 123 as any);
    const path2 = util.getNodePath(33, root);
    expect(path).toHaveLength(0);
    expect(path2).toHaveLength(0);
  });
});

describe('filterXSS', () => {
  it('<>', () => {
    const value = util.filterXSS('<div></div>');
    expect(value).toBe('&lt;div&gt;&lt;/div&gt;');
  });

  it(`'"`, () => {
    const value = util.filterXSS(`'div'"span"`);
    expect(value).toBe('&apos;div&apos;&quot;span&quot;');
  });
});

describe('getUrlParam', () => {
  it('正常', () => {
    const url = 'http://film.qq.com?a=b';
    const value = util.getUrlParam('a', url);
    expect(value).toBe('b');
  });

  it('null', () => {
    const url = 'http://film.qq.com';
    const value = util.getUrlParam('a', url);
    expect(value).toBe('');
  });

  it('emprty', () => {
    const url = 'http://film.qq.com?a=';
    const value = util.getUrlParam('a', url);
    expect(value).toBe('');
  });
});

describe('isPop', () => {
  // type 为 pop 结尾 isPop 才为 true
  it('true', () => {
    expect(
      util.isPop({
        type: 'pop',
        id: 1,
      }),
    ).toBeTruthy();
  });

  it('endswidth true', () => {
    expect(
      util.isPop({
        type: 'xxxpop',
        id: 1,
      }),
    ).toBeTruthy();
  });

  it('false', () => {
    expect(
      util.isPop({
        type: 'pop1',
        id: 1,
      }),
    ).toBeFalsy();
  });
});
