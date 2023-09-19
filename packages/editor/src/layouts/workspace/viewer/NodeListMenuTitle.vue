<template>
  <div
    style="
      text-align: center;
      padding: 5px 0;
      font-size: 14px;
      cursor: move;
      display: flex;
      justify-content: space-between;
      align-items: center;
    "
    ref="target"
  >
    <TMagicTooltip placement="top" :content="pinned ? '取消置于顶层自动隐藏' : '置于顶层不消失'">
      <MIcon
        style="margin-left: 10px; cursor: pointer"
        :icon="pinned ? PinnedIcon : PinIcon"
        @click="pinHandler"
      ></MIcon>
    </TMagicTooltip>

    <span>可选组件</span>

    <div style="margin-right: 10px">
      <TMagicButton text size="small" @click="closeHandler">
        <MIcon :icon="Close"></MIcon>
      </TMagicButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Close } from '@element-plus/icons-vue';
import type { OnDrag } from 'gesto';

import { TMagicButton, TMagicTooltip } from '@tmagic/design';

import MIcon from '@editor/components/Icon.vue';
import { useGetSo } from '@editor/hooks/use-getso';
import PinIcon from '@editor/icons/PinIcon.vue';
import PinnedIcon from '@editor/icons/PinnedIcon.vue';

defineOptions({
  name: 'MEditorNodeListMenuTitle',
});

const props = defineProps<{
  pinned: boolean;
}>();

const emit = defineEmits<{
  close: [];
  'update:pinned': [pinned: boolean];
  change: [e: OnDrag];
}>();

const pinHandler = () => {
  emit('update:pinned', !props.pinned);
};

const closeHandler = () => {
  emit('close');
};

const target = ref<HTMLDivElement>();
useGetSo(target, emit);
</script>
