import { describe, expect, test } from 'vitest';

import Target from '../src/Target';
import Watcher from '../src/Watcher';

describe('Watcher', () => {
  test('instance', () => {
    const watcher = new Watcher();
    expect(watcher).toBeInstanceOf(Watcher);
  });

  test('addTarget', () => {
    const watcher = new Watcher();
    const target = new Target({
      isTarget: () => true,
      id: 'target',
      type: 'target',
    });

    watcher.addTarget(target);

    expect(watcher.getTarget(1, 'target')).toBeUndefined();
    expect(watcher.getTarget('target', 'target')?.id).toBe('target');
    expect(Object.keys(watcher.getTargets())).toHaveLength(0);
    expect(Object.keys(watcher.getTargets('target'))).toHaveLength(1);
  });

  test('clearTargets', () => {
    const watcher = new Watcher();
    watcher.clearTargets();

    const target = new Target({
      isTarget: () => true,
      id: 'target',
    });

    watcher.addTarget(target);

    expect(watcher.hasTarget('target')).toBeTruthy();

    watcher.clearTargets();

    expect(watcher.hasTarget('target')).toBeFalsy();
  });

  test('hasTarget', () => {
    const watcher = new Watcher();

    const target = new Target({
      isTarget: () => true,
      id: 'target2',
    });

    watcher.clearTargets();

    watcher.addTarget(target);

    expect(watcher.hasTarget('target')).toBeFalsy();
    expect(watcher.hasTarget('target2')).toBeTruthy();
  });

  test('removeTarget', () => {
    const watcher = new Watcher();

    const target = new Target({
      isTarget: () => true,
      id: 'target',
    });

    watcher.clearTargets();
    watcher.addTarget(target);
    expect(watcher.hasTarget('target')).toBeTruthy();
    watcher.removeTarget('target');
    expect(watcher.hasTarget('target')).toBeFalsy();
  });

  test('removeTargets', () => {
    const watcher = new Watcher();

    const defaultTarget = new Target({
      isTarget: () => true,
      id: 'defaultTarget',
    });

    const target = new Target({
      isTarget: () => true,
      type: 'targetType',
      id: 'target',
    });

    watcher.clearTargets();
    watcher.addTarget(defaultTarget);
    watcher.addTarget(target);
    expect(watcher.hasTarget('defaultTarget')).toBeTruthy();
    expect(watcher.hasTarget('target', 'targetType')).toBeTruthy();

    watcher.removeTargets('targetType');
    expect(watcher.hasTarget('defaultTarget')).toBeTruthy();
    expect(watcher.hasTarget('target', 'targetType')).toBeFalsy();
  });

  test('collect', () => {
    const watcher = new Watcher();

    watcher.clearTargets();

    watcher.addTarget(
      new Target({
        type: 'target',
        id: 'collect_1',
        name: 'test',
        isTarget: (key: string | number, value: any) => key === 'text' && value === 'text1',
      }),
    );

    watcher.addTarget(
      new Target({
        type: 'target',
        id: 'collect_2',
        name: 'test2',
        isTarget: (key: string | number, value: any) => `${key}`.includes('text1') && value === 'text',
      }),
    );

    watcher.collect([
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

    const target1 = watcher.getTarget('collect_1', 'target');
    const target2 = watcher.getTarget('collect_2', 'target');

    expect(target1?.deps?.node_1.name).toBe('node');
    expect(target2?.deps?.node_1.name).toBe('node');
    expect(target1?.deps?.node_1.keys).toHaveLength(1);
    expect(target2?.deps?.node_1.keys).toHaveLength(3);

    watcher.collect([
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

    expect(target1?.deps?.node_1).toBeUndefined();
    expect(target2?.deps?.node_1.keys).toHaveLength(1);

    watcher.collect([
      {
        id: 'node_1',
        name: 'node',
        text: 'text',
        text1: 'text',
      },
    ]);

    expect(target1?.deps?.node_1).toBeUndefined();
    expect(target2?.deps?.node_1.keys[0]).toBe('text1');

    watcher.clear([
      {
        id: 'node_1',
        name: 'node',
      },
    ]);

    expect(target1?.deps?.node_1).toBeUndefined();
    expect(target2?.deps?.node_1).toBeUndefined();
  });

  test('collect deep', () => {
    const watcher = new Watcher();

    watcher.clearTargets();

    watcher.addTarget(
      new Target({
        type: 'target',
        id: 'collect_1',
        name: 'test',
        isTarget: (key: string | number, value: any) => key === 'text' && value === 'text1',
      }),
    );

    watcher.collect(
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
      {},
      true,
    );

    const target1 = watcher.getTarget('collect_1', 'target');

    expect(target1?.deps?.node_1.name).toBe('node');
    expect(target1?.deps?.node_2.name).toBe('node2');

    watcher.clear([
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

    expect(target1?.deps?.node_1).toBeUndefined();
    expect(target1?.deps?.node_2).toBeUndefined();
  });
});
