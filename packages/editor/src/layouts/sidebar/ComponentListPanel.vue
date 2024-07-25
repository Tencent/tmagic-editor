<template>
  <TMagicScrollbar>
    <slot name="component-list-panel-header"></slot>

    <SearchInput @search="filterTextChangeHandler"></SearchInput>

    <slot name="component-list" :component-group-list="list">
      <TMagicCollapse class="ui-component-panel" :model-value="collapseValue">
        <template v-for="(group, index) in list">
          <TMagicCollapseItem v-if="group.items && group.items.length" :key="index" :name="`${index}`">
            <template #title><MIcon :icon="Grid"></MIcon>{{ group.title }}</template>
            <div
              v-for="item in group.items"
              class="component-item"
              draggable="true"
              :key="item.type"
              @click="appendComponent(item)"
              @dragstart="dragstartHandler(item, $event)"
              @dragend="dragendHandler"
              @drag="dragHandler"
            >
              <slot name="component-list-item" :component="item">
                <TMagicTooltip placement="right" :disabled="!Boolean(item.desc)" :content="item.desc">
                  <MIcon :icon="item.icon"></MIcon>
                </TMagicTooltip>
                <span :title="item.text">{{ item.text }}</span>
              </slot>
            </div>
          </TMagicCollapseItem>
        </template>
      </TMagicCollapse>
    </slot>
  </TMagicScrollbar>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import { Grid } from '@element-plus/icons-vue';
import serialize from 'serialize-javascript';

import { TMagicCollapse, TMagicCollapseItem, TMagicScrollbar, TMagicTooltip } from '@tmagic/design';
import { removeClassNameByClassName } from '@tmagic/utils';

import MIcon from '@editor/components/Icon.vue';
import SearchInput from '@editor/components/SearchInput.vue';
import {
  type ComponentGroup,
  type ComponentItem,
  ComponentListPanelSlots,
  DragType,
  type Services,
  type StageOptions,
} from '@editor/type';

defineSlots<ComponentListPanelSlots>();

defineOptions({
  name: 'MEditorComponentListPanel',
});

const searchText = ref('');

const filterTextChangeHandler = (v: string) => {
  searchText.value = v;
};

const services = inject<Services>('services');
const stageOptions = inject<StageOptions>('stageOptions');

const stage = computed(() => services?.editorService.get('stage'));
const list = computed<ComponentGroup[]>(() =>
  (services?.componentListService.getList() || []).map((group: ComponentGroup) => ({
    ...group,
    items: group.items.filter((item: ComponentItem) => item.text.includes(searchText.value)),
  })),
);
const collapseValue = computed(() =>
  Array(list.value?.length)
    .fill(1)
    .map((x, i) => `${i}`),
);

let timeout: NodeJS.Timeout | undefined;
let clientX: number;
let clientY: number;

const appendComponent = ({ text, type, data = {} }: ComponentItem): void => {
  services?.editorService.add({
    name: text,
    type,
    ...data,
  });
};

const dragstartHandler = ({ text, type, data = {} }: ComponentItem, e: DragEvent) => {
  e.dataTransfer?.setData(
    'text/json',
    serialize({
      dragType: DragType.COMPONENT_LIST,
      data: {
        name: text,
        type,
        ...data,
      },
    }),
  );
};

const dragendHandler = () => {
  if (timeout) {
    globalThis.clearTimeout(timeout);
    timeout = undefined;
  }
  const doc = stage.value?.renderer.getDocument();
  if (doc && stageOptions?.containerHighlightClassName) {
    removeClassNameByClassName(doc, stageOptions.containerHighlightClassName);
  }
  clientX = 0;
  clientY = 0;
};

const dragHandler = (e: DragEvent) => {
  if (e.clientX !== clientX || e.clientY !== clientY) {
    clientX = e.clientX;
    clientY = e.clientY;
    if (timeout) {
      globalThis.clearTimeout(timeout);
      timeout = undefined;
    }
    return;
  }

  if (timeout || !stage.value) return;

  timeout = stage.value.delayedMarkContainer(e);
};
</script>
