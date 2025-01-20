import { onBeforeUnmount, reactive, toRaw, watch } from 'vue';
import { cloneDeep } from 'lodash-es';

import type TMagicCore from '@tmagic/core';
import type {
  CodeBlockContent,
  DataSourceSchema,
  EventOption,
  Id,
  MApp,
  MComponent,
  MPage,
  MPageFragment,
} from '@tmagic/core';
import {
  createCodeBlockTarget,
  createDataSourceCondTarget,
  createDataSourceMethodTarget,
  createDataSourceTarget,
  DepTargetType,
  NODE_CONDS_KEY,
  Target,
} from '@tmagic/core';
import { ChangeRecord } from '@tmagic/form';
import { getNodes, isPage, isValueIncludeDataSource } from '@tmagic/utils';

import PropsPanel from './layouts/PropsPanel.vue';
import { isIncludeDataSource } from './utils/editor';
import { EditorProps } from './editorProps';
import { Services } from './type';

export declare type LooseRequired<T> = {
  [P in string & keyof T]: T[P];
};

export const initServiceState = (
  props: EditorProps,
  {
    editorService,
    historyService,
    componentListService,
    propsService,
    eventsService,
    uiService,
    codeBlockService,
    keybindingService,
    dataSourceService,
    depService,
  }: Services,
) => {
  // 初始值变化，重新设置节点信息
  watch(
    () => props.modelValue,
    (modelValue) => {
      editorService.set('root', modelValue || null);
    },
    {
      immediate: true,
    },
  );

  watch(
    () => props.disabledMultiSelect,
    (disabledMultiSelect) => {
      editorService.set('disabledMultiSelect', disabledMultiSelect || false);
    },
    {
      immediate: true,
    },
  );

  watch(
    () => props.componentGroupList,
    (componentGroupList) => componentGroupList && componentListService.setList(componentGroupList),
    {
      immediate: true,
    },
  );

  watch(
    () => props.datasourceList,
    (datasourceList) => datasourceList && dataSourceService.set('datasourceTypeList', datasourceList),
    {
      immediate: true,
    },
  );

  watch(
    () => props.propsConfigs,
    (configs) => configs && propsService.setPropsConfigs(configs),
    {
      immediate: true,
    },
  );

  watch(
    () => props.propsValues,
    (values) => values && propsService.setPropsValues(values),
    {
      immediate: true,
    },
  );

  watch(
    () => props.eventMethodList,
    (eventMethodList) => {
      const eventsList: Record<string, EventOption[]> = {};
      const methodsList: Record<string, EventOption[]> = {};

      if (eventMethodList) {
        for (const type of Object.keys(eventMethodList)) {
          eventsList[type] = eventMethodList[type].events;
          methodsList[type] = eventMethodList[type].methods;
        }
      }

      eventsService.setEvents(eventsList);
      eventsService.setMethods(methodsList);
    },
    {
      immediate: true,
    },
  );

  watch(
    () => props.datasourceConfigs,
    (configs) => {
      if (!configs) {
        return;
      }

      for (const [key, value] of Object.entries(configs)) {
        dataSourceService.setFormConfig(key, value);
      }
    },
    {
      immediate: true,
    },
  );

  watch(
    () => props.datasourceValues,
    (values) => {
      if (!values) {
        return;
      }

      for (const [key, value] of Object.entries(values)) {
        dataSourceService.setFormValue(key, value);
      }
    },
    {
      immediate: true,
    },
  );

  watch(
    () => props.datasourceEventMethodList,
    (eventMethodList) => {
      const eventsList: Record<string, EventOption[]> = {};
      const methodsList: Record<string, EventOption[]> = {};

      if (eventMethodList) {
        for (const type of Object.keys(eventMethodList)) {
          eventsList[type] = eventMethodList[type].events;
          methodsList[type] = eventMethodList[type].methods;
        }
      }

      for (const [key, value] of Object.entries(eventsList)) {
        dataSourceService.setFormEvent(key, value);
      }

      for (const [key, value] of Object.entries(methodsList)) {
        dataSourceService.setFormMethod(key, value);
      }
    },
    {
      immediate: true,
    },
  );

  watch(
    () => props.defaultSelected,
    (defaultSelected) => defaultSelected && editorService.select(defaultSelected),
    {
      immediate: true,
    },
  );

  watch(
    () => props.stageRect,
    (stageRect) => stageRect && uiService.set('stageRect', stageRect),
    {
      immediate: true,
    },
  );

  onBeforeUnmount(() => {
    editorService.resetState();
    historyService.resetState();
    propsService.resetState();
    uiService.resetState();
    componentListService.resetState();
    codeBlockService.resetState();
    keybindingService.reset();
    depService.reset();
  });
};

export const initServiceEvents = (
  props: EditorProps,
  emit: ((event: 'props-panel-mounted', instance: InstanceType<typeof PropsPanel>) => void) &
    ((event: 'update:modelValue', value: MApp | null) => void),
  { editorService, codeBlockService, dataSourceService, depService }: Services,
) => {
  const getTMagicApp = () => {
    const renderer = editorService.get('stage')?.renderer;
    if (!renderer) {
      return undefined;
    }

    if (renderer.runtime) {
      return renderer.runtime.getApp?.();
    }

    return new Promise<TMagicCore | undefined>((resolve) => {
      // 设置 10s 超时
      const timeout = globalThis.setTimeout(() => {
        resolve(undefined);
      }, 10000);

      renderer.on('runtime-ready', () => {
        if (timeout) {
          globalThis.clearTimeout(timeout);
        }
        resolve(renderer.runtime?.getApp?.());
      });
    });
  };

  const updateStageNodes = (nodes: MComponent[]) => {
    for (const node of nodes) {
      updateStageNode(node);
    }
  };

  const updateStageNode = (node: MComponent) => {
    const root = editorService.get('root');
    if (!root) return;

    return editorService.get('stage')?.update({
      config: cloneDeep(node),
      parentId: editorService.getParentById(node.id)?.id,
      root: cloneDeep(root),
    });
  };

  const updateDataSourceSchema = async () => {
    const root = editorService.get('root');
    const app = await getTMagicApp();

    if (!app || !root) {
      return;
    }

    if (app.dsl) {
      app.dsl.dataSources = root.dataSources;
    }
  };

  const dsDepCollectedHandler = async () => {
    const root = editorService.get('root');
    const app = await getTMagicApp();

    if (root && app?.dsl) {
      app.dsl.dataSourceDeps = root.dataSourceDeps;
    }
  };

  const collectIdle = (nodes: MComponent[], deep: boolean, type?: DepTargetType) =>
    Promise.all(
      nodes.map((node) => {
        let pageId: Id | undefined;

        if (isPage(node)) {
          pageId = node.id;
        } else {
          const info = editorService.getNodeInfo(node.id);
          pageId = info.page?.id;
        }
        return depService.collectIdle([node], { pageId }, deep, type);
      }),
    );

  watch(
    () => editorService.get('stage'),
    (stage) => {
      if (!stage) {
        return;
      }

      stage.on('rerender', async () => {
        const node = editorService.get('node');

        if (!node) return;

        await collectIdle([node], true, DepTargetType.DATA_SOURCE);
        updateStageNode(node);
      });
    },
  );

  const initDataSourceDepTarget = (ds: DataSourceSchema) => {
    depService.addTarget(createDataSourceTarget(ds, reactive({})));
    depService.addTarget(createDataSourceMethodTarget(ds, reactive({})));
    depService.addTarget(createDataSourceCondTarget(ds, reactive({})));
  };

  const rootChangeHandler = async (value: MApp | null, preValue?: MApp | null) => {
    if (!value) return;

    value.codeBlocks = value.codeBlocks || {};
    value.dataSources = value.dataSources || [];

    codeBlockService.setCodeDsl(value.codeBlocks);
    dataSourceService.set('dataSources', value.dataSources);

    depService.removeTargets(DepTargetType.CODE_BLOCK);

    for (const [id, code] of Object.entries(value.codeBlocks)) {
      depService.addTarget(createCodeBlockTarget(id, code));
    }

    for (const ds of dataSourceService.get('dataSources')) {
      initDataSourceDepTarget(ds);
    }

    if (Array.isArray(value.items)) {
      depService.clearIdleTasks();
      collectIdle(value.items, true).then(() => {
        updateStageNodes(value.items);
      });
    } else {
      depService.clear();
      delete value.dataSourceDeps;
      delete value.dataSourceCondDeps;
    }

    const nodeId = editorService.get('node')?.id || props.defaultSelected;
    let node;
    if (nodeId) {
      node = editorService.getNodeById(nodeId);
    }

    if (node && node !== value) {
      await editorService.select(node.id);
    } else if (value.items?.length) {
      await editorService.select(value.items[0]);
    } else if (value.id) {
      editorService.set('nodes', [value]);
      editorService.set('parent', null);
      editorService.set('page', null);
    }

    if (toRaw(value) !== toRaw(preValue)) {
      emit('update:modelValue', value);
    }
  };

  // 新增节点，收集依赖
  const nodeAddHandler = async (nodes: MComponent[]) => {
    await collectIdle(nodes, true);

    updateStageNodes(nodes);
  };

  // 节点更新，收集依赖
  // 仅当修改到数据源相关的才收集
  const nodeUpdateHandler = async (
    data: { newNode: MComponent; oldNode: MComponent; changeRecords?: ChangeRecord[] }[],
  ) => {
    const needRecollectNodes: MComponent[] = [];
    const normalNodes: MComponent[] = [];
    for (const { newNode, oldNode, changeRecords } of data) {
      if (changeRecords?.length) {
        // eslint-disable-next-line no-restricted-syntax
        forChangeRecords: for (const record of changeRecords) {
          if (!record.propPath) {
            needRecollectNodes.push(newNode);
            break forChangeRecords;
          }

          // NODE_CONDS_KEY为显示条件key
          if (
            new RegExp(`${NODE_CONDS_KEY}.(\\d)+.cond`).test(record.propPath) ||
            new RegExp(`${NODE_CONDS_KEY}.(\\d)+.cond.(\\d)+.value`).test(record.propPath) ||
            record.propPath === NODE_CONDS_KEY ||
            isValueIncludeDataSource(record.value)
          ) {
            needRecollectNodes.push(newNode);
            break forChangeRecords;
          }

          // 修改的key在收集的依赖中，则需要触发重新收集
          for (const target of Object.values(depService.getTargets(DepTargetType.DATA_SOURCE))) {
            if (!target.deps[newNode.id]) {
              continue;
            }
            if (target.deps[newNode.id].keys.includes(record.propPath)) {
              needRecollectNodes.push(newNode);
              break forChangeRecords;
            }
          }

          normalNodes.push(newNode);
        }
      } else if (isIncludeDataSource(newNode, oldNode)) {
        needRecollectNodes.push(newNode);
      } else {
        normalNodes.push(newNode);
      }
    }

    if (needRecollectNodes.length) {
      // 有数据源依赖，需要等依赖重新收集完才更新stage
      await collectIdle(needRecollectNodes, true, DepTargetType.DATA_SOURCE);
      await collectIdle(needRecollectNodes, true, DepTargetType.DATA_SOURCE_COND);
      updateStageNodes(needRecollectNodes);
    } else {
      updateStageNodes(normalNodes);
      // 在上面判断是否需要收集数据源依赖中已经更新stage
      Promise.all([
        collectIdle(normalNodes, true, DepTargetType.CODE_BLOCK),
        collectIdle(normalNodes, true, DepTargetType.DATA_SOURCE_METHOD),
      ]);
    }
  };

  // 节点删除，清除对齐的依赖收集
  const nodeRemoveHandler = (nodes: MComponent[]) => {
    depService.clear(nodes);
  };

  // 由于历史记录变化是更新整个page，所以历史记录变化时，需要重新收集依赖
  const historyChangeHandler = async (page: MPage | MPageFragment) => {
    await collectIdle([page], true);
    updateStageNode(page);
  };

  editorService.on('history-change', historyChangeHandler);
  editorService.on('root-change', rootChangeHandler);
  editorService.on('add', nodeAddHandler);
  editorService.on('remove', nodeRemoveHandler);
  editorService.on('update', nodeUpdateHandler);

  const dataSourceAddHandler = async (config: DataSourceSchema) => {
    initDataSourceDepTarget(config);
    const app = await getTMagicApp();

    if (!app?.dataSourceManager) {
      return;
    }

    app.dataSourceManager.addDataSource(config);

    const newDs = app.dataSourceManager.get(config.id);

    if (newDs) {
      app.dataSourceManager.init(newDs);
    }
  };

  const dataSourceUpdateHandler = async (
    config: DataSourceSchema,
    { changeRecords }: { changeRecords: ChangeRecord[] },
  ) => {
    const updateDsData = async () => {
      const app = await getTMagicApp();

      if (!app?.dataSourceManager) {
        return;
      }

      const ds = app.dataSourceManager.get(config.id);

      if (!ds) return;

      ds.setFields(config.fields);
      ds.setData(config.mocks?.find((mock) => mock.useInEditor)?.data || ds.getDefaultData());
    };

    let needRecollectDep = false;
    let isModifyField = false;
    let isModifyMock = false;
    let isModifyMethod = false;
    for (const changeRecord of changeRecords) {
      if (!changeRecord.propPath) {
        continue;
      }

      isModifyField =
        changeRecord.propPath === 'fields' ||
        /fields.(\d)+.name/.test(changeRecord.propPath) ||
        /fields.(\d)+$/.test(changeRecord.propPath);

      isModifyMock = changeRecord.propPath === 'mocks';

      isModifyMethod =
        changeRecord.propPath === 'methods' ||
        /methods.(\d)+.name/.test(changeRecord.propPath) ||
        /methods.(\d)+$/.test(changeRecord.propPath);

      needRecollectDep = isModifyField || isModifyMock || isModifyMethod;

      if (needRecollectDep) {
        break;
      }
    }

    const root = editorService.get('root');
    if (needRecollectDep) {
      if (Array.isArray(root?.items)) {
        depService.clearIdleTasks();

        removeDataSourceTarget(config.id);
        initDataSourceDepTarget(config);

        let collectIdlePromises: Promise<void[]>[] = [];
        if (isModifyField) {
          collectIdlePromises = [
            collectIdle(root.items, true, DepTargetType.DATA_SOURCE),
            collectIdle(root.items, true, DepTargetType.DATA_SOURCE_COND),
          ];
        } else if (isModifyMock) {
          collectIdlePromises = [collectIdle(root.items, true, DepTargetType.DATA_SOURCE)];
        } else if (isModifyMethod) {
          collectIdlePromises = [collectIdle(root.items, true, DepTargetType.DATA_SOURCE_METHOD)];
        }
        Promise.all(collectIdlePromises).then(() => {
          updateDataSourceSchema();
          updateDsData();
          updateStageNodes(root.items);
        });
      }
    } else if (root?.dataSources) {
      updateDsData();
    }
  };

  const removeDataSourceTarget = (id: string) => {
    depService.removeTarget(id, DepTargetType.DATA_SOURCE);
    depService.removeTarget(id, DepTargetType.DATA_SOURCE_COND);
    depService.removeTarget(id, DepTargetType.DATA_SOURCE_METHOD);
  };

  const dataSourceRemoveHandler = async (id: string) => {
    const root = editorService.get('root');

    if (!root) {
      return;
    }

    const nodeIds = Object.keys(root.dataSourceDeps?.[id] || {});
    const nodes = getNodes(nodeIds, root.items);

    await Promise.all([
      collectIdle(nodes, false, DepTargetType.DATA_SOURCE),
      collectIdle(nodes, false, DepTargetType.DATA_SOURCE_COND),
      collectIdle(nodes, false, DepTargetType.DATA_SOURCE_METHOD),
    ]);

    updateDataSourceSchema();

    const app = await getTMagicApp();
    app?.dataSourceManager?.removeDataSource(id);

    updateStageNodes(nodes);
    removeDataSourceTarget(id);
  };

  dataSourceService.on('add', dataSourceAddHandler);
  dataSourceService.on('update', dataSourceUpdateHandler);
  dataSourceService.on('remove', dataSourceRemoveHandler);

  const codeBlockAddOrUpdateHandler = (id: Id, codeBlock: CodeBlockContent) => {
    if (depService.hasTarget(id, DepTargetType.CODE_BLOCK)) {
      depService.getTarget(id, DepTargetType.CODE_BLOCK)!.name = codeBlock.name;
      return;
    }

    depService.addTarget(createCodeBlockTarget(id, codeBlock));
  };

  const codeBlockRemoveHandler = (id: Id) => {
    depService.removeTarget(id, DepTargetType.CODE_BLOCK);
  };

  codeBlockService.on('addOrUpdate', codeBlockAddOrUpdateHandler);
  codeBlockService.on('remove', codeBlockRemoveHandler);

  const targetAddHandler = (target: Target) => {
    const root = editorService.get('root');
    if (!root) return;

    if (target.type === DepTargetType.DATA_SOURCE) {
      if (!root.dataSourceDeps) {
        root.dataSourceDeps = {};
      }
      root.dataSourceDeps[target.id] = target.deps;
    }

    if (target.type === DepTargetType.DATA_SOURCE_COND) {
      if (!root.dataSourceCondDeps) {
        root.dataSourceCondDeps = {};
      }
      root.dataSourceCondDeps[target.id] = target.deps;
    }
  };

  const targetRemoveHandler = (id: string | number) => {
    const root = editorService.get('root');

    if (!root) return;

    if (root.dataSourceDeps) {
      delete root.dataSourceDeps[id];
    }

    if (root.dataSourceCondDeps) {
      delete root.dataSourceCondDeps[id];
    }
  };

  depService.on('add-target', targetAddHandler);
  depService.on('remove-target', targetRemoveHandler);
  depService.on('ds-collected', dsDepCollectedHandler);

  onBeforeUnmount(() => {
    depService.off('add-target', targetAddHandler);
    depService.off('remove-target', targetRemoveHandler);
    depService.off('ds-collected', dsDepCollectedHandler);

    editorService.off('history-change', historyChangeHandler);
    editorService.off('root-change', rootChangeHandler);
    editorService.off('add', nodeAddHandler);
    editorService.off('remove', nodeRemoveHandler);
    editorService.off('update', nodeUpdateHandler);

    codeBlockService.off('addOrUpdate', codeBlockAddOrUpdateHandler);
    codeBlockService.off('remove', codeBlockRemoveHandler);

    dataSourceService.off('add', dataSourceAddHandler);
    dataSourceService.off('update', dataSourceUpdateHandler);
    dataSourceService.off('remove', dataSourceRemoveHandler);
  });
};
