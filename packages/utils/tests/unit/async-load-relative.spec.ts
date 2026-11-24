import { describe, expect, test } from 'vitest';

import { asyncLoadJs } from '../../src/dom';

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

describe('asyncLoadJs relative url', () => {
  test('resolves relative urls to absolute so concurrent loads keep their own base (issue #589)', async () => {
    // 两个不同目录下的脚本并发加载，都用相对路径。
    // 若把原始相对路径直接赋给 script.src，浏览器按**文档**的 base 解析，
    // 两个脚本内部的相对引用会互相串味：airship 里的 ./p-xxx.js 会被解析成
    // ../jquery/p-xxx.js。
    const jquery = '../jquery/jquery.js';
    const airship = '../airship/airship.js';

    const p1 = asyncLoadJs(jquery);
    const p2 = asyncLoadJs(airship);
    triggerScriptLoad();
    await Promise.all([p1, p2]);

    const scripts = Array.from(document.getElementsByTagName('script'));
    const jqScript = scripts.find((s) => (s.getAttribute('src') || '').includes('jquery/jquery.js'));
    const airScript = scripts.find((s) => (s.getAttribute('src') || '').includes('airship/airship.js'));

    expect(jqScript).toBeDefined();
    expect(airScript).toBeDefined();

    // 赋给 script 的 src 必须是绝对 URL。
    // 传相对路径时浏览器按**文档**的 base 解析，脚本内部的相对引用
    // 就会落到文档目录而不是脚本自己的目录（issue #589）。
    // 这里读 getAttribute，它保留的是赋值时的原始字符串。
    expect(jqScript!.getAttribute('src')).toMatch(/^https?:\/\//);
    expect(airScript!.getAttribute('src')).toMatch(/^https?:\/\//);

    // 两个脚本各自解析到自己的目录，而不是共用文档的 base
    const jqDir = new URL('.', jqScript!.src).pathname;
    const airDir = new URL('.', airScript!.src).pathname;
    expect(jqDir).not.toBe(airDir);
    expect(jqDir).toContain('jquery');
    expect(airDir).toContain('airship');

    // airship 内部的 ./p-xxx.js 会基于 airDir 解析，不会落到 jquery 目录
    const inner = new URL('./p-68ed0ce0.system.js', airScript!.src).pathname;
    expect(inner).toContain('airship');
    expect(inner).not.toContain('jquery');
  });
});
