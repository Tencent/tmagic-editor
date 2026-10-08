import { toRaw } from 'vue';

import type { Id, MContainer, MNode } from '@tmagic/core';

import { editorService, propsService } from '@editor/services/sdk-instance';
import type { AddMNode, PastePosition } from '@editor/type';

import {
  beforePaste as sdkBeforePaste,
  getAddParent as sdkGetAddParent,
  getDefaultConfig as sdkGetDefaultConfig,
  getPositionInContainer as sdkGetPositionInContainer,
} from '../sdk/utils/operator';

const getContext = () => ({
  editor: editorService,
  props: propsService,
  reactivity: { toRaw } as any,
});

/**
 * 粘贴前置操作：返回分配了新id以及校准了坐标的配置
 * @param position 粘贴的坐标
 * @param config 待粘贴的元素配置(复制时保存的那份配置)
 * @returns
 */
export const beforePaste = (position: PastePosition, config: MNode[], doc?: Document): MNode[] =>
  sdkBeforePaste(getContext(), position, config, doc);

/**
 * 将元素粘贴到容器内时，将相对于画布坐标转换为相对于容器的坐标
 * @param position PastePosition 粘贴时相对于画布的坐标
 * @param id 元素id
 * @returns PastePosition 转换后的坐标
 */
export const getPositionInContainer = (position: PastePosition = {}, id: Id, doc?: Document) =>
  sdkGetPositionInContainer(getContext(), position, id, doc);

export const getAddParent = (node: MNode) => sdkGetAddParent(getContext(), node);

export const getDefaultConfig = (addNode: AddMNode, parentNode: MContainer) =>
  sdkGetDefaultConfig(getContext(), addNode, parentNode);
