import { describe, expect, test } from 'vitest';

import { DataSchema } from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX } from '@tmagic/utils';

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
    expect(utils.isDataSourceTemplate('xxx${dsId.field}xxx${dsId.field}', 'dsId')).toBeTruthy();
    expect(utils.isDataSourceTemplate('${dsId.field}', 'dsId')).toBeTruthy();
    expect(utils.isDataSourceTemplate('${dsId}', 'dsId')).toBeTruthy();
    expect(utils.isDataSourceTemplate('${dsId.field}', 'dsId1')).toBeFalsy();
    expect(utils.isDataSourceTemplate('${dsId.field', 'dsId')).toBeFalsy();
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
    expect(utils.isUseDataSourceField([`abcdsID`, 'field'], 'dsID')).toBeFalsy();
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
      }),
    ).toBeTruthy();

    expect(
      utils.isDataSourceTemplateNotIncludeArrayField('${dsId.array}${dsId.object.a}', {
        type: 'base',
        id: 'dsId',
        methods: [],
        fields: [...arrayFields, ...objectFields],
      }),
    ).toBeTruthy();

    expect(
      utils.isDataSourceTemplateNotIncludeArrayField('${dsId.array.a}${dsId.object.a}', {
        type: 'base',
        id: 'dsId',
        methods: [],
        fields: [...arrayFields, ...objectFields],
      }),
    ).toBeFalsy();

    expect(
      utils.isDataSourceTemplateNotIncludeArrayField('${dsId.array}${dsId.array.a}', {
        type: 'base',
        id: 'dsId',
        methods: [],
        fields: arrayFields,
      }),
    ).toBeFalsy();

    expect(
      utils.isDataSourceTemplateNotIncludeArrayField('${dsId.array.a}', {
        type: 'base',
        id: 'dsId',
        methods: [],
        fields: arrayFields,
      }),
    ).toBeFalsy();

    expect(
      utils.isDataSourceTemplateNotIncludeArrayField('${dsId.array[1].a}', {
        type: 'base',
        id: 'dsId',
        methods: [],
        fields: arrayFields,
      }),
    ).toBeTruthy();
  });
});
