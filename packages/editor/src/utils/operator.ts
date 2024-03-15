import { toRaw } from 'vue';
import { isEmpty } from 'lodash-es';

import { Id, MContainer, MNode, NodeType } from '@tmagic/schema';
import { isPage, isPageFragment } from '@tmagic/utils';

import editorService from '@editor/services/editor';
import propsService from '@editor/services/props';
import type { AddMNode, PastePosition } from '@editor/type';
import { generatePageNameByApp, getInitPositionStyle } from '@editor/utils/editor';

/**
 * 粘贴前置操作：返回分配了新id以及校准了坐标的配置
 * @param position 粘贴的坐标
 * @param config 待粘贴的元素配置(复制时保存的那份配置)
 * @returns
 */
export const beforePaste = (position: PastePosition, config: MNode[]): MNode[] => {
  if (!config[0]?.style) return config;
  const curNode = editorService.get('node');
  // 将数组中第一个元素的坐标作为参照点
  const { left: referenceLeft, top: referenceTop } = config[0].style;
  // 坐标校准后的粘贴数据
  const pasteConfigs: MNode[] = config.map((configItem: MNode): MNode => {
    // 解构 position 对象，从 position 删除 offsetX、offsetY字段
    const { offsetX = 0, offsetY = 0, ...positionClone } = position;
    let pastePosition = positionClone;

    if (!isEmpty(pastePosition) && curNode?.items) {
      // 如果没有传入粘贴坐标则可能为键盘操作，不再转换
      // 如果粘贴时选中了容器，则将元素粘贴到容器内，坐标需要转换为相对于容器的坐标
      pastePosition = getPositionInContainer(pastePosition, curNode.id);
    }

    // 将所有待粘贴元素坐标相对于多选第一个元素坐标重新计算，以保证多选粘贴后元素间距不变
    if (pastePosition.left && configItem.style?.left) {
      pastePosition.left = configItem.style.left - referenceLeft + pastePosition.left;
    }
    if (pastePosition.top && configItem.style?.top) {
      pastePosition.top = configItem.style?.top - referenceTop + pastePosition.top;
    }
    const pasteConfig = propsService.setNewItemId(configItem, false);

    if (pasteConfig.style) {
      const { left, top } = pasteConfig.style;
      // 判断能转换为数字时，做粘贴偏移量计算
      if (typeof left === 'number' || (!!left && !isNaN(Number(left)))) {
        pasteConfig.style.left = Number(left) + offsetX;
      }
      if (typeof top === 'number' || (!!top && !isNaN(Number(top)))) {
        pasteConfig.style.top = Number(top) + offsetY;
      }

      pasteConfig.style = {
        ...pasteConfig.style,
        ...pastePosition,
      };
    }
    const root = editorService.get('root');
    if ((isPage(pasteConfig) || isPageFragment(pasteConfig)) && root) {
      pasteConfig.name = generatePageNameByApp(root, isPage(pasteConfig) ? NodeType.PAGE : NodeType.PAGE_FRAGMENT);
    }
    return pasteConfig as MNode;
  });
  return pasteConfigs;
};

/**
 * 将元素粘贴到容器内时，将相对于画布坐标转换为相对于容器的坐标
 * @param position PastePosition 粘贴时相对于画布的坐标
 * @param id 元素id
 * @returns PastePosition 转换后的坐标
 */
export const getPositionInContainer = (position: PastePosition = {}, id: Id) => {
  let { left = 0, top = 0 } = position;
  const parentEl = editorService.get('stage')?.renderer?.contentWindow?.document.getElementById(`${id}`);
  const parentElRect = parentEl?.getBoundingClientRect();
  left = left - (parentElRect?.left || 0);
  top = top - (parentElRect?.top || 0);
  return {
    left,
    top,
  };
};

export const getAddParent = (node: MNode) => {
  const curNode = editorService.get('node');

  let parentNode;
  if (isPage(node)) {
    parentNode = editorService.get('root');
  } else if (curNode?.items) {
    parentNode = curNode as MContainer;
  } else if (curNode?.id) {
    parentNode = editorService.getParentById(curNode.id, false);
  }
  return parentNode;
};

export const getDefaultConfig = async (addNode: AddMNode, parentNode: MContainer) => {
  const { type, inputEvent, ...config } = addNode;
  const layout = await editorService.getLayout(toRaw(parentNode), addNode as MNode);
  const newNode = { ...toRaw(await propsService.getPropsValue(type, config)) };
  newNode.style = getInitPositionStyle(newNode.style, layout);
  return newNode;
};
