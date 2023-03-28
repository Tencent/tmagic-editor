import type { ExtractPropTypes } from 'vue';
import { onUnmounted, toRaw, watch } from 'vue';

import type { EventOption } from '@tmagic/core';
import type { CodeBlockContent, Id, MApp, MNode, MPage } from '@tmagic/schema';

import { createCodeBlockTarget } from './utils/dep';
import editorProps from './editorProps';
import type { Services } from './type';

export declare type LooseRequired<T> = {
  [P in string & keyof T]: T[P];
};

export const initServiceState = (
  props: Readonly<LooseRequired<Readonly<ExtractPropTypes<typeof editorProps>>>>,
  {
    editorService,
    historyService,
    componentListService,
    propsService,
    eventsService,
    uiService,
    codeBlockService,
  }: Services,
) => {
  // 初始值变化，重新设置节点信息
  watch(
    () => props.modelValue,
    (modelValue) => {
      editorService.set('root', modelValue);
    },
    {
      immediate: true,
    },
  );

  watch(
    () => props.componentGroupList,
    (componentGroupList) => componentListService.setList(componentGroupList),
    {
      immediate: true,
    },
  );

  watch(
    () => props.propsConfigs,
    (configs) => propsService.setPropsConfigs(configs),
    {
      immediate: true,
    },
  );

  watch(
    () => props.propsValues,
    (values) => propsService.setPropsValues(values),
    {
      immediate: true,
    },
  );

  watch(
    () => props.eventMethodList,
    (eventMethodList) => {
      const eventsList: Record<string, EventOption[]> = {};
      const methodsList: Record<string, EventOption[]> = {};

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

  onUnmounted(() => {
    editorService.resetState();
    historyService.resetState();
    propsService.resetState();
    uiService.resetState();
    componentListService.resetState();
    codeBlockService.resetState();
  });
};

export const initServiceEvents = (
  props: Readonly<LooseRequired<Readonly<ExtractPropTypes<typeof editorProps>>>>,
  emit: (event: 'props-panel-mounted' | 'update:modelValue', ...args: any[]) => void,
  { editorService, codeBlockService, depService }: Services,
) => {
  const rootChangeHandler = async (value: MApp, preValue?: MApp | null) => {
    const nodeId = editorService.get('node')?.id || props.defaultSelected;
    let node;
    if (nodeId) {
      node = editorService.getNodeById(nodeId);
    }

    if (node && node !== value) {
      await editorService.select(node.id);
    } else if (value?.items?.length) {
      await editorService.select(value.items[0]);
    } else if (value?.id) {
      editorService.set('nodes', [value]);
      editorService.set('parent', null);
      editorService.set('page', null);
    }

    if (toRaw(value) !== toRaw(preValue)) {
      emit('update:modelValue', value);
    }

    value.codeBlocks = value.codeBlocks || {};

    codeBlockService.setCodeDsl(value.codeBlocks);

    depService.removeTargets('code-block');

    Object.entries(value.codeBlocks).forEach(([id, code]) => {
      depService.addTarget(createCodeBlockTarget(id, code));
    });

    if (value && Array.isArray(value.items)) {
      depService.collect(value.items, true);
    } else {
      depService.clear();
    }
  };

  const nodeAddHandler = (nodes: MNode[]) => {
    depService.collect(nodes);
  };

  const nodeUpdateHandler = (nodes: MNode[]) => {
    depService.collect(nodes);
  };

  const nodeRemoveHandler = (nodes: MNode[]) => {
    depService.clear(nodes);
  };

  const historyChangeHandler = (page: MPage) => {
    depService.collect([page], true);
  };

  editorService.on('history-change', historyChangeHandler);
  editorService.on('root-change', rootChangeHandler);
  editorService.on('add', nodeAddHandler);
  editorService.on('remove', nodeRemoveHandler);
  editorService.on('update', nodeUpdateHandler);

  const codeBlockAddOrUpdateHandler = (id: Id, codeBlock: CodeBlockContent) => {
    if (depService.hasTarget(id)) {
      depService.getTarget(id)!.name = codeBlock.name;
      return;
    }

    depService.addTarget(createCodeBlockTarget(id, codeBlock));
  };

  const codeBlockRemoveHandler = (id: Id) => {
    depService.removeTarget(id);
  };

  codeBlockService.on('addOrUpdate', codeBlockAddOrUpdateHandler);
  codeBlockService.on('remove', codeBlockRemoveHandler);

  onUnmounted(() => {
    editorService.off('history-change', historyChangeHandler);
    editorService.off('root-change', rootChangeHandler);
    editorService.off('add', nodeAddHandler);
    editorService.off('remove', nodeRemoveHandler);
    editorService.off('update', nodeUpdateHandler);

    codeBlockService.off('addOrUpdate', codeBlockAddOrUpdateHandler);
    codeBlockService.off('remove', codeBlockRemoveHandler);
  });
};
