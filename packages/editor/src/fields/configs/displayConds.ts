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

import type { DisplayCondsConfig, FormState, GroupListConfig } from '@tmagic/form/headless';
import { removeDataSourceFieldPrefix } from '@tmagic/utils';

import dataSourceService from '@editor/services/dataSource';
import { getCascaderOptionsFromFields, getFieldType } from '@editor/utils/data-source';

import { stickyAddButton } from './stickyAddButton';

/**
 * `fields/DisplayConds.vue` 内部渲染的条件列表配置。
 *
 * 外层是条件组，内层 `cond` 是组内条件（groupList，每个字段单独一行）。
 * 由组件与无渲染校验的嵌套配置共用。
 *
 * `parentFields` 由调用方求值：有父级字段路径时用 cascader 在该路径下选字段，
 * 没有时用 data-source-field-select 从头选。
 */
export const createDisplayCondsConfig = (
  config: Pick<DisplayCondsConfig, 'titlePrefix' | 'flat' | 'defaultValue' | 'rules'>,
  name: string,
  parentFields: string[],
): GroupListConfig => {
  const resolveFieldPath = (path: string[]) => {
    const [id, ...fieldNames] = path;
    const ds = id ? dataSourceService.getDataSourceById(removeDataSourceFieldPrefix(`${id}`)) : undefined;
    return { ds, fieldNames };
  };

  // 字段变更后按新字段的类型把已填的值转成对应类型，避免类型校验与运行期取值不一致
  const fieldOnChange = (_formState: FormState | undefined, v: string[], { model }: { model: Record<string, any> }) => {
    const { ds, fieldNames } = resolveFieldPath([...parentFields, ...v]);
    const type = getFieldType(ds, fieldNames);
    if (type === 'number') {
      model.value = Number(model.value);
    } else if (type === 'boolean') {
      model.value = Boolean(model.value);
    } else if (type === 'null') {
      model.value = null;
    } else {
      model.value = `${model.value}`;
    }
    return v;
  };

  const fieldItem = parentFields.length
    ? {
        type: 'cascader',
        options: () => {
          const { ds, fieldNames } = resolveFieldPath(parentFields);
          if (!ds) {
            return [];
          }

          let fields = ds.fields || [];
          fieldNames.forEach((key) => {
            const field = fields.find((f) => f.name === key);
            fields = field?.fields || [];
          });

          return getCascaderOptionsFromFields(fields, ['string', 'number', 'boolean', 'any']);
        },
        name: 'field',
        value: 'key',
        text: '字段',
        checkStrictly: false,
        onChange: fieldOnChange,
        defaultValue: () => [],
        rules: [
          { required: true, trigger: 'blur', message: '请选择字段' },
          { typeMatch: true, trigger: 'change' },
        ],
      }
    : {
        type: 'data-source-field-select',
        name: 'field',
        value: 'key',
        text: '字段',
        checkStrictly: false,
        dataSourceFieldType: ['string', 'number', 'boolean', 'any'],
        onChange: fieldOnChange,
        defaultValue: () => [],
        rules: [
          { required: true, trigger: 'blur', message: '请选择字段' },
          { typeMatch: true, trigger: 'change' },
        ],
      };

  return {
    type: 'groupList',
    name,
    titlePrefix: config.titlePrefix,
    expandAll: true,
    enableToggleMode: false,
    defaultAdd: { cond: [] },
    ...stickyAddButton(`新增${config.titlePrefix || '条件组'}`),
    flat: config.flat,
    defaultValue: config.defaultValue ?? [],
    rules: config.rules ?? [{ typeMatch: true }],
    items: [
      {
        type: 'groupList',
        name: 'cond',
        titlePrefix: '条件',
        expandAll: true,
        enableToggleMode: false,
        copyable: true,
        movable: false,
        flat: true,
        labelWidth: 80,
        ...stickyAddButton('新增条件'),
        items: [
          fieldItem,
          {
            type: 'cond-op-select',
            parentFields,
            text: '条件',
            name: 'op',
            rules: [
              { required: true, trigger: 'blur', message: '请选择条件' },
              { typeMatch: true, trigger: 'change' },
            ],
          },
          {
            name: 'value',
            text: '值',
            type: (_mForm: FormState | undefined, { model }: any) => {
              const { ds, fieldNames } = resolveFieldPath([...parentFields, ...(model.field || [])]);
              const type = getFieldType(ds, fieldNames);

              if (type === 'number') {
                return 'number';
              }

              if (type === 'boolean') {
                return 'select';
              }

              if (type === 'null') {
                return 'display';
              }

              return 'text';
            },
            options: [
              { text: 'true', value: true },
              { text: 'false', value: false },
            ],
            display: (_mForm: FormState | undefined, { model }: any) => !['between', 'not_between'].includes(model.op),
            displayText: (_mForm: FormState | undefined, { model }: any) => {
              if (model.value === null) {
                return 'null';
              }
              return model.value;
            },
          },
          {
            name: 'range',
            text: '值',
            type: 'number-range',
            display: (_mForm: FormState | undefined, { model }: any) => ['between', 'not_between'].includes(model.op),
          },
        ],
      },
    ],
  } as any as GroupListConfig;
};
