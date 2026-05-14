import { describe, expect, test } from 'vitest';

import { DataSchema, NODE_CONDS_KEY } from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from '@tmagic/utils';

import Target from '../src/Target';
import { DepTargetType } from '../src/types';
import * as utils from '../src/utils';

describe('utils', () => {
  test('createCodeBlockTarget', () => {
    const target = utils.createCodeBlockTarget('code_5316', {
      name: 'code',
      content: () => false,
      params: [],
    });

    expect(target.id).toBe('code_5316');
    expect(target.name).toBe('code');
    expect(target.type).toBe('code-block');

    const isTarget = target.isTarget('created', {
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
    });

    expect(isTarget).toBeTruthy();

    const target1 = utils.createCodeBlockTarget('1', {
      name: 'code',
      content: () => false,
      params: [],
    });

    const isTarget1 = target1.isTarget('created', {
      hookType: 'code',
      hookData: [
        {
          codeId: 'code_5316',
          params: {},
        },
      ],
    });

    expect(isTarget1).toBeFalsy();
  });

  test('isIncludeArrayField', () => {
    const arrayFields: DataSchema[] = [{ fields: [{ name: 'a', type: 'string' }], type: 'array', name: 'array' }];
    const objectFields: DataSchema[] = [{ fields: [{ name: 'a', type: 'string' }], type: 'object', name: 'object' }];

    expect(utils.isIncludeArrayField(['array', 'a'], arrayFields)).toBeTruthy();

    expect(utils.isIncludeArrayField(['array', '0', 'a'], arrayFields)).toBeFalsy();
    expect(utils.isIncludeArrayField(['array', '0'], arrayFields)).toBeFalsy();
    expect(utils.isIncludeArrayField(['array'], arrayFields)).toBeFalsy();

    expect(utils.isIncludeArrayField(['object'], objectFields)).toBeFalsy();
    expect(utils.isIncludeArrayField(['object', 'a'], objectFields)).toBeFalsy();
  });

  test('isDataSourceTemplate', () => {
    expect(utils.isDataSourceTemplate('xxx${dsId.field}xxx${dsId.field}', { id: 'dsId', fields: [] })).toBeTruthy();
    expect(utils.isDataSourceTemplate('${dsId.field}', { id: 'dsId', fields: [] })).toBeTruthy();
    expect(utils.isDataSourceTemplate('${dsId}', { id: 'dsId', fields: [] })).toBeTruthy();
    expect(utils.isDataSourceTemplate('${dsId.field}', { id: 'dsId1', fields: [] })).toBeFalsy();
    expect(utils.isDataSourceTemplate('${dsId.field', { id: 'dsId', fields: [] })).toBeFalsy();
  });

  test('isSpecificDataSourceTemplate', () => {
    expect(
      utils.isSpecificDataSourceTemplate(
        {
          isBindDataSourceField: true,
          dataSourceId: 'id',
          template: 'xxx${field}xxx',
        },
        'id',
      ),
    ).toBeTruthy();

    expect(
      utils.isSpecificDataSourceTemplate(
        {
          isBindDataSourceField: true,
          template: 'xxx${field}xxx',
        },
        'id',
      ),
    ).toBeFalsy();

    expect(
      utils.isSpecificDataSourceTemplate(
        {
          isBindDataSourceField: true,
          dataSourceId: 'id',
          template: 123,
        },
        'id',
      ),
    ).toBeFalsy();

    expect(
      utils.isSpecificDataSourceTemplate(
        {
          isBindDataSourceField: true,
          dataSourceId: 'id',
          template: 'xxx${field}xxx',
        },
        'id1',
      ),
    ).toBeFalsy();
  });

  test('isUseDataSourceField', () => {
    expect(utils.isUseDataSourceField([`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}dsID`, 'field'], 'dsID')).toBeTruthy();
    expect(utils.isUseDataSourceField([`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}dsID`, 'field'], 'dsID1')).toBeFalsy();
    expect(utils.isUseDataSourceField(['abcdsID', 'field'], 'dsID')).toBeFalsy();
    expect(utils.isUseDataSourceField([123, 'field'], 123)).toBeFalsy();
  });

  test('isDataSourceTemplateNotIncludeArrayField', () => {
    const arrayFields: DataSchema[] = [{ fields: [{ name: 'a', type: 'string' }], type: 'array', name: 'array' }];
    const objectFields: DataSchema[] = [{ fields: [{ name: 'a', type: 'string' }], type: 'object', name: 'object' }];

    expect(
      utils.isDataSourceTemplateNotIncludeArrayField('${dsId.array}', {
        type: 'base',
        id: 'dsId',
        methods: [],
        fields: arrayFields,
        events: [],
      }),
    ).toBeTruthy();

    expect(
      utils.isDataSourceTemplateNotIncludeArrayField('${dsId.array}${dsId.object.a}', {
        type: 'base',
        id: 'dsId',
        methods: [],
        fields: [...arrayFields, ...objectFields],
        events: [],
      }),
    ).toBeTruthy();

    expect(
      utils.isDataSourceTemplateNotIncludeArrayField('${dsId.array.a}${dsId.object.a}', {
        type: 'base',
        id: 'dsId',
        methods: [],
        fields: [...arrayFields, ...objectFields],
        events: [],
      }),
    ).toBeFalsy();

    expect(
      utils.isDataSourceTemplateNotIncludeArrayField('${dsId.array}${dsId.array.a}', {
        type: 'base',
        id: 'dsId',
        methods: [],
        fields: arrayFields,
        events: [],
      }),
    ).toBeFalsy();

    expect(
      utils.isDataSourceTemplateNotIncludeArrayField('${dsId.array.a}', {
        type: 'base',
        id: 'dsId',
        methods: [],
        fields: arrayFields,
        events: [],
      }),
    ).toBeFalsy();

    expect(
      utils.isDataSourceTemplateNotIncludeArrayField('${dsId.array[1].a}', {
        type: 'base',
        id: 'dsId',
        methods: [],
        fields: arrayFields,
        events: [],
      }),
    ).toBeTruthy();
  });

  test('isDataSourceTarget', () => {
    const ds = { id: 'ds_1', fields: [{ name: 'name', type: 'string' }] as DataSchema[] };

    expect(utils.isDataSourceTarget(ds, 'k', null)).toBe(false);
    expect(utils.isDataSourceTarget(ds, 'k', 123)).toBe(false);

    expect(utils.isDataSourceTarget(ds, `${NODE_CONDS_KEY}_x`, '${ds_1.name}')).toBe(false);

    expect(utils.isDataSourceTarget(ds, 'text', '${ds_1.name}')).toBe(true);
    expect(utils.isDataSourceTarget(ds, 'text', '${other.name}')).toBe(false);

    expect(utils.isDataSourceTarget(ds, 'text', { isBindDataSource: true, dataSourceId: 'ds_1' })).toBe(true);
    expect(utils.isDataSourceTarget(ds, 'text', { isBindDataSource: true, dataSourceId: 'other' })).toBe(false);

    expect(
      utils.isDataSourceTarget(ds, 'text', {
        isBindDataSourceField: true,
        dataSourceId: 'ds_1',
        template: 'foo${name}',
      }),
    ).toBe(true);

    expect(utils.isDataSourceTarget(ds, 'text', [`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}ds_1`, 'name'])).toBe(true);

    expect(
      utils.isDataSourceTarget(
        { id: 'ds_1', fields: [{ name: 'arr', type: 'array', fields: [{ name: 'a' }] }] as DataSchema[] },
        'text',
        [`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}ds_1`, 'arr', 'a'],
        true,
      ),
    ).toBe(true);
  });

  test('isDataSourceCondTarget', () => {
    const ds = { id: 'ds_1', fields: [{ name: 'name' }] as DataSchema[] };

    expect(utils.isDataSourceCondTarget(ds, 'k', 'not-array')).toBe(false);
    expect(utils.isDataSourceCondTarget(ds, 'k', null as any)).toBe(false);

    expect(utils.isDataSourceCondTarget(ds, `${NODE_CONDS_KEY}_x`, ['ds_1', 'name'])).toBe(true);
    expect(utils.isDataSourceCondTarget(ds, 'k', ['ds_1', 'name'])).toBe(false);
    expect(utils.isDataSourceCondTarget(ds, `${NODE_CONDS_KEY}_x`, ['other', 'name'])).toBe(false);
    expect(utils.isDataSourceCondTarget(ds, `${NODE_CONDS_KEY}_x`, ['ds_1', 'unknown'])).toBe(false);
  });

  test('createDataSourceTarget / Cond / Method', () => {
    const ds = { id: 'ds_1', fields: [{ name: 'name' }] as DataSchema[] };
    const t1 = utils.createDataSourceTarget(ds);
    expect(t1.type).toBe(DepTargetType.DATA_SOURCE);
    expect(t1.isTarget('text', '${ds_1.name}')).toBe(true);

    const t2 = utils.createDataSourceCondTarget(ds);
    expect(t2.type).toBe(DepTargetType.DATA_SOURCE_COND);
    expect(t2.isTarget(`${NODE_CONDS_KEY}_x`, ['ds_1', 'name'])).toBe(true);

    const t3 = utils.createDataSourceMethodTarget({
      id: 'ds_1',
      methods: [{ name: 'load', content: () => undefined, params: [] } as any],
      fields: [{ name: 'name' }] as DataSchema[],
    });
    expect(t3.type).toBe(DepTargetType.DATA_SOURCE_METHOD);
    expect(t3.isTarget('k', ['ds_1', 'load'])).toBe(true);
    expect(t3.isTarget('k', ['ds_1', 'name'])).toBe(false);
    expect(t3.isTarget('k', ['other', 'load'])).toBe(false);
    expect(t3.isTarget('k', 'not-array')).toBe(false);
    expect(t3.isTarget('k', ['ds_1', ''])).toBe(false);
    expect(t3.isTarget('k', ['ds_1', 'unknown'])).toBe(true);
  });

  test('traverseTarget 遍历所有 / 指定 type', () => {
    const t1 = new Target({ id: '1', isTarget: () => true, type: 'a' });
    const t2 = new Target({ id: '2', isTarget: () => true, type: 'b' });
    const list = {
      a: { 1: t1 },
      b: { 2: t2 },
    };
    const visited: string[] = [];
    utils.traverseTarget(list, (t) => visited.push(`${t.type}:${t.id}`));
    expect(visited).toEqual(expect.arrayContaining(['a:1', 'b:2']));

    const visitedA: string[] = [];
    utils.traverseTarget(list, (t) => visitedA.push(`${t.type}:${t.id}`), 'a');
    expect(visitedA).toEqual(['a:1']);

    const visitedX: string[] = [];
    utils.traverseTarget(list, (t) => visitedX.push(`${t.type}:${t.id}`), 'not-exist');
    expect(visitedX).toEqual([]);
  });
});
