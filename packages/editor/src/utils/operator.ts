import { toRaw } from 'vue';
import { cloneDeep, isEmpty } from 'lodash-es';

import { Id, MApp, MContainer, MNode, NodeType } from '@tmagic/schema';
import StageCore from '@tmagic/stage';
import { isPage } from '@tmagic/utils';

import editorService from '../services/editor';
import historyService from '../services/history';
import propsService from '../services/props';
import { AddMNode, Layout, PastePosition } from '../type';
import { fixNodeLeft, generatePageNameByApp, getInitPositionStyle, getNodeIndex } from '../utils/editor';

/**
 * 粘贴前置操作：返回分配了新id以及校准了坐标的配置
 * @param position 粘贴的坐标
 * @param config 待粘贴的元素配置(复制时保存的那份配置)
 * @returns
 */
export const beforePaste = async (position: PastePosition, config: MNode[]) => {
  if (!config[0]?.style) return config;
  const curNode = editorService.get<MContainer>('node');
  // 将数组中第一个元素的坐标作为参照点
  const { left: referenceLeft, top: referenceTop } = config[0].style;
  // 坐标校准后的粘贴数据
  const pasteConfigs: MNode[] = await Promise.all(
    config.map(async (configItem: MNode): Promise<MNode> => {
      // 解构 position 对象，从 position 删除 offsetX、offsetY字段
      const { offsetX = 0, offsetY = 0, ...positionClone } = position;
      let pastePosition = positionClone;

      if (!isEmpty(pastePosition) && curNode.items) {
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

      const pasteConfig = await propsService.setNewItemId(configItem, editorService.get('root'));

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
      if (isPage(pasteConfig)) {
        pasteConfig.name = generatePageNameByApp(editorService.get('root'));
      }
      return pasteConfig as MNode;
    }),
  );
  return pasteConfigs;
};

/**
 * 新增元素前置操作，实现了在编辑器中新增元素节点，并返回新增元素信息以供stage更新
 * @param addNode 待添加元素的配置
 * @param parent 父级容器（可选）
 * @returns 新增的元素，父级元素，布局方式，是否为根页面
 */
export const beforeAdd = async (
  addNode: AddMNode,
  parent?: MContainer | null,
): Promise<{ parentNode: MContainer; newNode: MNode; layout: Layout; isPage: boolean }> => {
  // 加入inputEvent是为给业务扩展时可以获取到更多的信息，只有在使用拖拽添加组件时才有改对象
  const { type, inputEvent, ...config } = addNode;
  const curNode = editorService.get<MContainer>('node');

  let parentNode: MContainer | undefined;
  const isPage = type === NodeType.PAGE;

  if (isPage) {
    parentNode = editorService.get<MApp>('root');
    // 由于支持中间件扩展，在parent参数为undefined时，parent会变成next函数
  } else if (parent && typeof parent !== 'function') {
    parentNode = parent;
  } else if (curNode.items) {
    parentNode = curNode;
  } else {
    parentNode = editorService.getParentById(curNode.id, false);
  }

  if (!parentNode) throw new Error('未找到父元素');

  const layout = await editorService.getLayout(toRaw(parentNode), addNode as MNode);
  const newNode = { ...toRaw(await propsService.getPropsValue(type, config)) };
  newNode.style = getInitPositionStyle(newNode.style, layout, parentNode, editorService.get<StageCore>('stage'));

  if ((parentNode?.type === NodeType.ROOT || curNode.type === NodeType.ROOT) && newNode.type !== NodeType.PAGE) {
    throw new Error('app下不能添加组件');
  }
  // 新增节点添加到配置中
  parentNode?.items?.push(newNode);
  // 返回新增信息以供stage更新
  return {
    parentNode,
    newNode,
    layout,
    isPage,
  };
};

/**
 * 将元素粘贴到容器内时，将相对于画布坐标转换为相对于容器的坐标
 * @param position PastePosition 粘贴时相对于画布的坐标
 * @param id 元素id
 * @returns PastePosition 转换后的坐标
 */
export const getPositionInContainer = (position: PastePosition = {}, id: Id) => {
  let { left = 0, top = 0 } = position;
  const parentEl = editorService.get<StageCore>('stage')?.renderer?.contentWindow?.document.getElementById(`${id}`);
  const parentElRect = parentEl?.getBoundingClientRect();
  left = left - (parentElRect?.left || 0);
  top = top - (parentElRect?.top || 0);
  return {
    left,
    top,
  };
};

/**
 * 将新增元素事件通知到stage以更新渲染
 * @param parentNode 父元素
 * @param newNode 当前新增元素
 * @param layout 布局方式
 */
export const notifyAddToStage = async (parentNode: MContainer, newNode: MNode, layout: Layout) => {
  const stage = editorService.get<StageCore | null>('stage');
  const root = editorService.get<MApp>('root');

  await stage?.add({ config: cloneDeep(newNode), parent: cloneDeep(parentNode), root: cloneDeep(root) });

  if (layout === Layout.ABSOLUTE) {
    const fixedLeft = fixNodeLeft(newNode, parentNode, stage?.renderer.contentWindow?.document);
    if (typeof fixedLeft !== 'undefined' && newNode.style) {
      newNode.style.left = fixedLeft;
      await stage?.update({ config: cloneDeep(newNode), root: cloneDeep(root) });
    }
  }
};

/**
 * 删除前置操作：实现了在编辑器中删除元素节点，并返回父级元素信息以供stage更新
 * @param node 待删除的节点
 * @returns 父级元素，root根元素
 */
export const beforeRemove = async (node: MNode): Promise<MContainer | void> => {
  if (!node?.id) return;

  const stage = editorService.get<StageCore | null>('stage');
  const root = editorService.get<MApp | null>('root');

  if (!root) throw new Error('没有root');

  const { parent, node: curNode } = editorService.getNodeInfo(node.id, false);

  if (!parent || !curNode) throw new Error('找不要删除的节点');

  const index = getNodeIndex(curNode, parent);

  if (typeof index !== 'number' || index === -1) throw new Error('找不要删除的节点');
  // 从配置中删除元素
  parent.items?.splice(index, 1);

  // 通知stage更新
  stage?.remove({ id: node.id, root: cloneDeep(root) });

  if (node.type === NodeType.PAGE) {
    editorService.state.pageLength -= 1;

    if (root.items[0]) {
      await editorService.select(root.items[0]);
      stage?.select(root.items[0].id);
    } else {
      editorService.set('node', null);
      editorService.set('nodes', []);
      editorService.set('parent', null);
      editorService.set('page', null);
      editorService.set('stage', null);
      editorService.set('highlightNode', null);
      editorService.resetModifiedNodeId();
      historyService.reset();

      editorService.emit('remove', node);

      return;
    }
  } else {
    await editorService.select(parent);
    stage?.select(parent.id);
  }
  return parent;
};
