import { computed, onBeforeUnmount, reactive, toRaw, watch } from 'vue';
import { cloneDeep } from 'lodash-es';

import type {
  CodeBlockContent,
  DataSourceSchema,
  EventOption,
  Id,
  MApp,
  MNode,
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
import { getNodes, isPage, isValueIncludeDataSource, traverseNode } from '@tmagic/utils';

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

      eventMethodList &&
        Object.keys(eventMethodList).forEach((type: string) => {
          eventsList[type] = eventMethodList[type].events;
          methodsList[type] = eventMethodList[type].methods;
        });

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
      configs &&
        Object.entries(configs).forEach(([key, value]) => {
          dataSourceService.setFormConfig(key, value);
        });
    },
    {
      immediate: true,
    },
  );

  watch(
    () => props.datasourceValues,
    (values) => {
      values &&
        Object.entries(values).forEach(([key, value]) => {
          dataSourceService.setFormValue(key, value);
        });
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

      eventMethodList &&
        Object.keys(eventMethodList).forEach((type: string) => {
          eventsList[type] = eventMethodList[type].events;
          methodsList[type] = eventMethodList[type].methods;
        });

      Object.entries(eventsList).forEach(([key, value]) => {
        dataSourceService.setFormEvent(key, value);
      });
      Object.entries(methodsList).forEach(([key, value]) => {
        dataSourceService.setFormMethod(key, value);
      });
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
  });
};

export const initServiceEvents = (
  props: EditorProps,
  emit: ((event: 'props-panel-mounted', instance: InstanceType<typeof PropsPanel>) => void) &
    ((event: 'update:modelValue', value: MApp | null) => void),
  { editorService, codeBlockService, dataSourceService, depService }: Services,
) => {
  const rootChangeHandler = async (value: MApp | null, preValue?: MApp | null) => {
    if (!value) return;

    value.codeBlocks = value.codeBlocks || {};
    value.dataSources = value.dataSources || [];

    codeBlockService.setCodeDsl(value.codeBlocks);
    dataSourceService.set('dataSources', value.dataSources);

    depService.removeTargets(DepTargetType.CODE_BLOCK);

    Object.entries(value.codeBlocks).forEach(([id, code]) => {
      depService.addTarget(createCodeBlockTarget(id, code));
    });

    dataSourceService.get('dataSources').forEach((ds) => {
      initDataSourceDepTarget(ds);
    });

    if (Array.isArray(value.items)) {
      depService.clearIdleTasks();
      collectIdle(value.items, true);
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

  const stage = computed(() => editorService.get('stage'));

  watch(stage, (stage) => {
    if (!stage) {
      return;
    }

    stage.on('rerender', () => {
      const node = editorService.get('node');

      if (!node) return;

      collectIdle([node], true).then(() => {
        afterUpdateNodes([node]);
      });
    });
  });

  const getApp = () => stage.value?.renderer?.runtime?.getApp?.();

  const updateDataSourceSchema = (nodes: MNode[], deep: boolean) => {
    const root = editorService.get('root');
    const app = getApp();

    if (root && app?.dsl) {
      app.dsl.dataSourceDeps = root.dataSourceDeps;
      app.dsl.dataSourceCondDeps = root.dataSourceCondDeps;
      app.dsl.dataSources = root.dataSources;
    }

    if (root?.dataSources) {
      getApp()?.dataSourceManager?.updateSchema(root.dataSources);
    }

    if (!root || !stage.value) return;

    const allNodes: MNode[] = [];

    if (deep) {
      nodes.forEach((node) => {
        traverseNode<MNode>(node, (node) => {
          if (!allNodes.includes(node)) {
            allNodes.push(node);
          }
        });
      });
    } else {
      allNodes.push(...nodes);
    }

    const deps = Object.values(root.dataSourceDeps || {});
    deps.forEach((dep) => {
      Object.keys(dep).forEach((id) => {
        const node = allNodes.find((node) => node.id === id);
        node &&
          stage.value?.update({
            config: cloneDeep(node),
            parentId: editorService.getParentById(node.id)?.id,
            root: cloneDeep(root),
          });
      });
    });
  };

  const afterUpdateNodes = (nodes: MNode[]) => {
    const root = editorService.get('root');
    if (!root) return;
    for (const node of nodes) {
      stage.value?.update({
        config: cloneDeep(node),
        parentId: editorService.getParentById(node.id)?.id,
        root: cloneDeep(root),
      });
    }
  };

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

  const depCollectedHandler = () => {
    const root = editorService.get('root');
    if (!root) return;
    const app = getApp();
    if (app?.dsl) {
      app.dsl.dataSourceDeps = root.dataSourceDeps;
    }
  };

  depService.on('add-target', targetAddHandler);
  depService.on('remove-target', targetRemoveHandler);
  depService.on('collected', depCollectedHandler);

  const initDataSourceDepTarget = (ds: DataSourceSchema) => {
    depService.addTarget(createDataSourceTarget(ds, reactive({})));
    depService.addTarget(createDataSourceMethodTarget(ds, reactive({})));
    depService.addTarget(createDataSourceCondTarget(ds, reactive({})));
  };

  const collectIdle = (nodes: MNode[], deep: boolean) =>
    Promise.all(
      nodes.map((node) => {
        let pageId: Id | undefined;

        if (isPage(node)) {
          pageId = node.id;
        } else {
          const info = editorService.getNodeInfo(node.id);
          pageId = info.page?.id;
        }
        return depService.collectIdle([node], { pageId }, deep);
      }),
    );

  // 新增节点，收集依赖
  const nodeAddHandler = (nodes: MNode[]) => {
    collectIdle(nodes, true).then(() => {
      afterUpdateNodes(nodes);
    });
  };

  // 节点更新，收集依赖
  // 仅当修改到数据源相关的才收集
  const nodeUpdateHandler = (data: { newNode: MNode; oldNode: MNode; changeRecords?: ChangeRecord[] }[]) => {
    const needRecollectNodes: MNode[] = [];
    const normalNodes: MNode[] = [];
    data.forEach(({ newNode, oldNode, changeRecords }) => {
      if (changeRecords?.length) {
        for (const record of changeRecords) {
          // NODE_CONDS_KEY为显示条件key
          if (
            !record.propPath ||
            new RegExp(`${NODE_CONDS_KEY}.(\\d)+.cond`).test(record.propPath) ||
            new RegExp(`${NODE_CONDS_KEY}.(\\d)+.cond.(\\d)+.value`).test(record.propPath) ||
            record.propPath === NODE_CONDS_KEY ||
            isValueIncludeDataSource(record.value)
          ) {
            needRecollectNodes.push(newNode);
          } else {
            normalNodes.push(newNode);
          }
        }
      } else if (isIncludeDataSource(newNode, oldNode)) {
        needRecollectNodes.push(newNode);
      } else {
        normalNodes.push(newNode);
      }
    });

    if (needRecollectNodes.length) {
      collectIdle(needRecollectNodes, true).then(() => {
        afterUpdateNodes(needRecollectNodes);
      });
    } else if (normalNodes.length) {
      afterUpdateNodes(normalNodes);
    }
  };

  // 节点删除，清除对齐的依赖收集
  const nodeRemoveHandler = (nodes: MNode[]) => {
    depService.clear(nodes);
  };

  // 由于历史记录变化是更新整个page，所以历史记录变化时，需要重新收集依赖
  const historyChangeHandler = (page: MPage | MPageFragment) => {
    collectIdle([page], true).then(() => {
      updateDataSourceSchema([page], true);
    });
  };

  editorService.on('history-change', historyChangeHandler);
  editorService.on('root-change', rootChangeHandler);
  editorService.on('add', nodeAddHandler);
  editorService.on('remove', nodeRemoveHandler);
  editorService.on('update', nodeUpdateHandler);

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

  const dataSourceAddHandler = (config: DataSourceSchema) => {
    initDataSourceDepTarget(config);
    getApp()?.dataSourceManager?.addDataSource(config);
  };

  const dataSourceUpdateHandler = (config: DataSourceSchema, { changeRecords }: { changeRecords: ChangeRecord[] }) => {
    let needRecollectDep = false;
    for (const changeRecord of changeRecords) {
      if (!changeRecord.propPath) {
        continue;
      }

      needRecollectDep =
        changeRecord.propPath === 'fields' ||
        changeRecord.propPath === 'methods' ||
        /fields.(\d)+.name/.test(changeRecord.propPath) ||
        /fields.(\d)+$/.test(changeRecord.propPath) ||
        /methods.(\d)+.name/.test(changeRecord.propPath) ||
        /methods.(\d)+$/.test(changeRecord.propPath);

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

        collectIdle(root.items, true).then(() => {
          updateDataSourceSchema(root?.items || [], true);
        });
      }
    } else if (root?.dataSources) {
      getApp()?.dataSourceManager?.updateSchema(root.dataSources);
    }
  };

  const removeDataSourceTarget = (id: string) => {
    depService.removeTarget(id, DepTargetType.DATA_SOURCE);
    depService.removeTarget(id, DepTargetType.DATA_SOURCE_COND);
    depService.removeTarget(id, DepTargetType.DATA_SOURCE_METHOD);
  };

  const dataSourceRemoveHandler = (id: string) => {
    const root = editorService.get('root');
    const nodeIds = Object.keys(root?.dataSourceDeps?.[id] || {});
    const nodes = getNodes(nodeIds, root?.items);
    collectIdle(nodes, false).then(() => {
      updateDataSourceSchema(nodes, false);
    });

    removeDataSourceTarget(id);
  };

  dataSourceService.on('add', dataSourceAddHandler);
  dataSourceService.on('update', dataSourceUpdateHandler);
  dataSourceService.on('remove', dataSourceRemoveHandler);

  onBeforeUnmount(() => {
    depService.off('add-target', targetAddHandler);
    depService.off('remove-target', targetRemoveHandler);
    depService.off('collected', depCollectedHandler);

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
