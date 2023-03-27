import { describe, expect, test } from 'vitest';

import depService, { Target, Watcher } from '@editor/services/dep';

describe('Watcher', () => {
  test('instance', () => {
    const watcher = new Watcher();
    expect(watcher).toBeInstanceOf(Watcher);
  });
});

describe('depService', () => {
  const defaultTarget = new Target({
    id: 1,
    name: 'test',
    isTarget: () => true,
  });

  const target = new Target({
    type: 'target',
    id: 2,
    name: 'test',
    isTarget: () => true,
  });

  test('default target type', () => {
    expect(defaultTarget.type).toBe('default');
    expect(target.type).toBe('target');
  });

  test('addTarget', () => {
    depService.addTarget(target);

    expect(depService.getTarget(1)).toBeUndefined();
    expect(depService.getTarget(2)?.id).toBe(2);
    expect(Object.keys(depService.getTargets())).toHaveLength(0);
    expect(Object.keys(depService.getTargets('target'))).toHaveLength(1);
  });

  test('clearTargets', () => {
    depService.clearTargets();

    depService.addTarget(target);

    expect(depService.hasTarget(2)).toBeTruthy();

    depService.clearTargets();

    expect(depService.hasTarget(2)).toBeFalsy();
  });

  test('hasTarget', () => {
    depService.clearTargets();

    depService.addTarget(target);

    expect(depService.hasTarget(1)).toBeFalsy();
    expect(depService.hasTarget(2)).toBeTruthy();
  });

  test('removeTarget', () => {
    depService.clearTargets();
    depService.addTarget(target);
    expect(depService.hasTarget(2)).toBeTruthy();
    depService.removeTarget(2);
    expect(depService.hasTarget(2)).toBeFalsy();
  });

  test('removeTargets', () => {
    depService.clearTargets();
    depService.addTarget(defaultTarget);
    depService.addTarget(target);
    expect(depService.hasTarget(1)).toBeTruthy();
    expect(depService.hasTarget(2)).toBeTruthy();
    depService.removeTargets('target');
    expect(depService.hasTarget(1)).toBeTruthy();
    expect(depService.hasTarget(2)).toBeFalsy();

    depService.removeTargets('target1');
  });

  test('collect', () => {
    depService.clearTargets();

    depService.addTarget(
      new Target({
        type: 'target',
        id: 'collect_1',
        name: 'test',
        isTarget: (key: string | number, value: any) => key === 'text' && value === 'text1',
      }),
    );

    depService.addTarget(
      new Target({
        type: 'target',
        id: 'collect_2',
        name: 'test2',
        isTarget: (key: string | number, value: any) => key === 'text1' && value === 'text',
      }),
    );

    depService.collect([
      {
        id: 'node_1',
        name: 'node',
        text: 'text1',
        text1: 'text',
        object: {
          text1: 'text',
        },
        array: [
          {
            object: {
              text1: 'text',
            },
          },
        ],
      },
    ]);

    const target1 = depService.getTarget('collect_1');
    const target2 = depService.getTarget('collect_2');

    expect((target1?.deps || {}).node_1.name).toBe('node');
    expect((target2?.deps || {}).node_1.name).toBe('node');
    expect((target1?.deps || {}).node_1.keys).toHaveLength(1);
    expect((target2?.deps || {}).node_1.keys).toHaveLength(3);

    depService.collect([
      {
        id: 'node_1',
        name: 'node',
        text: 'text',
        text1: 'text',
        object: {
          text1: 'text1',
        },
        array: [
          {
            object: {
              text1: 'text1',
            },
          },
        ],
      },
    ]);

    expect((target1?.deps || {}).node_1).toBeUndefined();
    expect((target2?.deps || {}).node_1.keys).toHaveLength(1);

    depService.collect([
      {
        id: 'node_1',
        name: 'node',
        text: 'text',
        text1: 'text',
      },
    ]);

    expect((target1?.deps || {}).node_1).toBeUndefined();
    expect((target2?.deps || {}).node_1.keys[0]).toBe('text1');

    depService.clear([
      {
        id: 'node_1',
        name: 'node',
      },
    ]);

    expect((target1?.deps || {}).node_1).toBeUndefined();
    expect((target2?.deps || {}).node_1).toBeUndefined();
  });

  test('collect deep', () => {
    depService.clearTargets();

    depService.addTarget(
      new Target({
        type: 'target',
        id: 'collect_1',
        name: 'test',
        isTarget: (key: string | number, value: any) => key === 'text' && value === 'text1',
      }),
    );

    depService.collect(
      [
        {
          id: 'node_1',
          name: 'node',
          text: 'text1',
          items: [
            {
              id: 'node_2',
              name: 'node2',
              text: 'text1',
            },
          ],
        },
      ],
      true,
    );

    const target1 = depService.getTarget('collect_1');

    expect((target1?.deps || {}).node_1.name).toBe('node');
    expect((target1?.deps || {}).node_2.name).toBe('node2');

    depService.clear([
      {
        id: 'node_1',
        name: 'node',
        items: [
          {
            id: 'node_2',
            name: 'node2',
            text: 'text1',
          },
        ],
      },
    ]);

    expect((target1?.deps || {}).node_1).toBeUndefined();
    expect((target1?.deps || {}).node_2).toBeUndefined();
  });
});
