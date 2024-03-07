import type { MApp, MNode, MPage, MPageFragment } from '@tmagic/schema';
import { compiledCond, getValueByKeyPath, isPage, isPageFragment, replaceChildNode } from '@tmagic/utils';

import type { DataSourceManagerData } from './types';

export const compliedConditions = (node: MNode, data: DataSourceManagerData) => {
  if (!node.displayConds || !Array.isArray(node.displayConds) || !node.displayConds.length) return true;

  for (const { cond } of node.displayConds) {
    if (!cond) continue;

    let result = true;
    for (const { op, value, range, field } of cond) {
      const [sourceId, ...fields] = field;

      const dsData = data[sourceId];

      if (!dsData || !fields.length) {
        break;
      }

      const fieldValue = getValueByKeyPath(fields.join('.'), data[sourceId]);

      if (!compiledCond(op, fieldValue, value, range)) {
        result = false;
        break;
      }
    }

    if (result) {
      return true;
    }
  }

  return false;
};

export const updateNode = (node: MNode, dsl: MApp) => {
  if (isPage(node) || isPageFragment(node)) {
    const index = dsl.items?.findIndex((child: MNode) => child.id === node.id);
    dsl.items.splice(index, 1, node as MPage | MPageFragment);
  } else {
    replaceChildNode(node, dsl!.items);
  }
};

export const createIteratorContentData = (itemData: any, dsId: string, fields: string[] = []) => {
  const data = {
    [dsId]: {},
  };

  fields.reduce((obj: any, field, index) => {
    obj[field] = index === fields.length - 1 ? itemData : {};

    return obj[field];
  }, data[dsId]);

  return data;
};
