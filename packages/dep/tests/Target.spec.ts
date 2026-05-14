import { describe, expect, test } from 'vitest';

import Target from '../src/Target';

describe('Target', () => {
  test('instance', () => {
    const target = new Target({
      isTarget: () => true,
      id: 'target',
    });
    expect(target).toBeInstanceOf(Target);
  });

  test('default target type', () => {
    const defaultTarget = new Target({
      isTarget: () => true,
      id: 'default',
      type: 'default',
    });
    const target = new Target({
      isTarget: () => true,
      id: 'target',
      type: 'target',
    });
    expect(defaultTarget.type).toBe('default');
    expect(target.type).toBe('target');
  });

  test('initialDeps / name / isCollectByDefault 默认值', () => {
    const t = new Target({
      isTarget: () => true,
      id: 't1',
      name: 'first',
      initialDeps: { node_1: { name: 'n', keys: ['k1'] } },
    });
    expect(t.name).toBe('first');
    expect(t.deps.node_1.keys).toEqual(['k1']);
    expect(t.isCollectByDefault).toBe(true);

    const t2 = new Target({
      isTarget: () => true,
      id: 't2',
      isCollectByDefault: false,
    });
    expect(t2.isCollectByDefault).toBe(false);
  });

  test('updateDep 累加 keys 并保留 name/data', () => {
    const t = new Target({ isTarget: () => true, id: 't' });
    t.updateDep({ id: 'n1', name: 'n1-name', key: 'key1', data: { foo: 1 } });
    expect(t.deps.n1.name).toBe('n1-name');
    expect(t.deps.n1.keys).toEqual(['key1']);
    expect((t.deps.n1 as any).data).toEqual({ foo: 1 });

    t.updateDep({ id: 'n1', name: 'n1-name', key: 'key2', data: { foo: 2 } });
    expect(t.deps.n1.keys).toEqual(['key1', 'key2']);

    t.updateDep({ id: 'n1', name: 'n1-name', key: 'key1', data: { foo: 3 } });
    expect(t.deps.n1.keys).toEqual(['key1', 'key2']);
  });

  test('removeDep 全删 / 删指定 id / 按 key 删', () => {
    const t = new Target({ isTarget: () => true, id: 't' });
    t.updateDep({ id: 'n1', name: 'n', key: 'k1', data: {} });
    t.updateDep({ id: 'n1', name: 'n', key: 'k2', data: {} });
    t.updateDep({ id: 'n2', name: 'n', key: 'k1', data: {} });

    t.removeDep('n1', 'k1');
    expect(t.deps.n1.keys).toEqual(['k2']);

    t.removeDep('n1', 'k2');
    expect(t.deps.n1).toBeUndefined();

    t.removeDep('n2');
    expect(t.deps.n2).toBeUndefined();

    t.updateDep({ id: 'a', name: 'a', key: 'k', data: {} });
    t.updateDep({ id: 'b', name: 'b', key: 'k', data: {} });
    t.removeDep();
    expect(Object.keys(t.deps)).toHaveLength(0);

    t.removeDep('not-exist');
  });

  test('hasDep / destroy', () => {
    const t = new Target({ isTarget: () => true, id: 't' });
    t.updateDep({ id: 'n1', name: 'n', key: 'k', data: {} });
    expect(t.hasDep('n1', 'k')).toBe(true);
    expect(t.hasDep('n1', 'other')).toBe(false);
    expect(t.hasDep('not-exist', 'k')).toBe(false);

    t.destroy();
    expect(t.deps).toEqual({});
  });
});
