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

import type { EventOption, Id, MComponent, MContainer } from '@tmagic/core';
import type { CascaderOption } from '@tmagic/form';
import { DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX, traverseNode } from '@tmagic/utils';

import dataSourceService from '@editor/services/dataSource';
import editorService from '@editor/services/editor';
import eventsService from '@editor/services/events';
import { getCascaderOptionsFromFields } from '@editor/utils/data-source';

export const EVENT_NAME_VALUE_SEPARATOR = '.';

export type EventNameSelectOption = { text: string; value: string };
export type EventNameOption = EventOption | CascaderOption | EventNameSelectOption;

/** 与 EventSelect 中 checkStrictly 一致：component 为 false，其余为 true */
export const isEventNameCheckStrictly = (src?: string) => src !== 'component';

/** 将动作 method 值规范为与 collectEventNameOptionValues 一致的字符串（cascader 无 valueSeparator 时存数组） */
export const normalizeCompActionValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`).join(EVENT_NAME_VALUE_SEPARATOR);
  }
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return `${value}`;
};

/**
 * 组装事件名称下拉/级联 options，与 EventSelect 默认 eventNameConfig.options 逻辑一致。
 */
export const getEventNameOptions = (
  src: string | undefined,
  formValue: Record<string, any> = {},
): EventNameOption[] => {
  if (!formValue.type) {
    return [];
  }

  if (src === 'component') {
    let events: EventOption[] | CascaderOption[] = eventsService.getEvent(formValue.type) || [];

    if (formValue.type === 'page-fragment-container' && formValue.pageFragmentId) {
      const pageFragment = editorService.get('root')?.items?.find((page) => page.id === formValue.pageFragmentId);
      if (!pageFragment) {
        return [];
      }

      events = [
        {
          label: pageFragment.name || '页面片容器',
          value: pageFragment.id,
          children: events,
        },
      ];

      (pageFragment.items || []).forEach((node) => {
        traverseNode<MComponent | MContainer>(node, (current) => {
          const nodeEvents = (current.type && eventsService.getEvent(current.type)) || [];
          (events as CascaderOption[]).push({
            label: `${current.name}_${current.id}`,
            value: `${current.id}`,
            children: nodeEvents,
          });
        });
      });

      return events;
    }

    return (events as EventOption[]).map((option) => ({
      text: option.label,
      value: option.value,
    }));
  }

  if (src === 'datasource') {
    const events: EventNameOption[] = dataSourceService.getFormEvent(formValue.type) || [];
    const dataSource = dataSourceService.getDataSourceById(formValue.id);
    const fields = dataSource?.fields || [];

    if (fields.length > 0) {
      return [
        ...events,
        {
          label: '数据变化',
          value: DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX,
          children: getCascaderOptionsFromFields(fields),
        },
      ];
    }

    return events;
  }

  return [];
};

/** 将 select / cascader options 展平为最终写入 name 的字符串集合（cascader 用 `.` 拼接） */
export const collectEventNameOptionValues = (
  options: EventNameOption[],
  checkStrictly: boolean,
  prefix: any[] = [],
  result: Set<string> = new Set(),
): Set<string> => {
  options.forEach((option) => {
    if (typeof option?.value === 'undefined') {
      return;
    }

    const path = [...prefix, option.value];
    const joined = path.map((item) => `${item}`).join(EVENT_NAME_VALUE_SEPARATOR);
    const children = 'children' in option ? option.children : undefined;

    if (Array.isArray(children) && children.length) {
      if (checkStrictly) {
        result.add(joined);
      }
      collectEventNameOptionValues(children as EventNameOption[], checkStrictly, path, result);
      return;
    }

    result.add(joined);
  });

  return result;
};

/**
 * 解析 event-select 允许的 name 集合。
 * 自定义 eventNameConfig.options 时返回 null（跳过枚举校验）。
 */
export const getEventNameAllowedValues = (
  config: { src?: string; eventNameConfig?: { options?: unknown } } = {},
  formValue: Record<string, any> = {},
): Set<string> | null => {
  if (typeof config.eventNameConfig?.options !== 'undefined') {
    return null;
  }

  if (config.src !== 'component' && config.src !== 'datasource') {
    return null;
  }

  return collectEventNameOptionValues(getEventNameOptions(config.src, formValue), isEventNameCheckStrictly(config.src));
};

/**
 * 组装联动组件动作下拉/级联 options，与 EventSelect 默认 compActionConfig.options 逻辑一致。
 */
export const getCompActionOptions = (toId?: Id): EventNameOption[] => {
  if (typeof toId === 'undefined' || toId === null || toId === '') {
    return [];
  }

  const node = editorService.getNodeById(toId);
  if (!node?.type) {
    return [];
  }

  let methods: EventOption[] | CascaderOption[] = eventsService.getMethod(node.type, toId) || [];

  if (node.type === 'page-fragment-container' && node.pageFragmentId) {
    const pageFragment = editorService.get('root')?.items?.find((page) => page.id === node.pageFragmentId);
    if (!pageFragment) {
      return [];
    }

    methods = [];
    (pageFragment.items || []).forEach((item: MComponent | MContainer) => {
      traverseNode<MComponent | MContainer>(item, (current) => {
        const nodeMethods = (current.type && eventsService.getMethod(current.type, current.id)) || [];

        if (nodeMethods.length) {
          (methods as CascaderOption[]).push({
            label: `${current.name}_${current.id}`,
            value: `${current.id}`,
            children: nodeMethods,
          });
        }
      });
    });

    return methods;
  }

  return (methods as EventOption[]).map((method) => ({
    text: method.label,
    value: method.value,
  }));
};

/**
 * 解析 event-select 联动组件动作允许的 method 集合。
 * 自定义 compActionConfig.options 时返回 null（跳过枚举校验）。
 */
export const getCompActionAllowedValues = (
  config: { src?: string; compActionConfig?: { options?: unknown } } = {},
  model: { to?: Id } = {},
): Set<string> | null => {
  if (typeof config.compActionConfig?.options !== 'undefined') {
    return null;
  }

  return collectEventNameOptionValues(getCompActionOptions(model.to), isEventNameCheckStrictly(config.src));
};
