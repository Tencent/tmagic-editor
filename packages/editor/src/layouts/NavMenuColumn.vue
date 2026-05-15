<template>
  <div
    :class="`menu-${columnKey} m-editor-nav-menu-column`"
    :style="width != null ? `width: ${width}px` : ''"
    ref="columnEl"
  >
    <ToolButton
      v-for="(item, index) in items"
      :data="item"
      :key="`item-${index}`"
      :class="{ 'm-editor-nav-menu-slot-hidden': hiddenIndexSet.has(index) }"
      :ref="(comp: any) => setItemRef(comp, index)"
    ></ToolButton>

    <div
      class="m-editor-nav-menu-more-wrapper"
      :class="{ 'm-editor-nav-menu-more-wrapper-hidden': !hasOverflow }"
      ref="moreWrapperEl"
    >
      <TMagicPopover
        placement="bottom-end"
        popper-class="m-editor-nav-menu-popover"
        :width="popoverWidth"
        :visible="popoverVisible"
      >
        <div class="m-editor-nav-menu-overflow-list">
          <ToolButton v-for="(item, index) in overflowItems" :data="item" :key="`o-${index}`"></ToolButton>
        </div>
        <template #reference>
          <div class="menu-item button m-editor-nav-menu-more" ref="referenceEl" @click="togglePopover">
            <TMagicButton
              size="small"
              text
              :icon="popoverVisible ? ArrowUp : ArrowDown"
              :bg="popoverVisible"
              :type="popoverVisible ? 'primary' : ''"
            ></TMagicButton>
          </div>
        </template>
      </TMagicPopover>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue';

import { TMagicButton, TMagicPopover } from '@tmagic/design';

import ToolButton from '@editor/components/ToolButton.vue';
import { MenuButton, MenuComponent } from '@editor/type';

defineOptions({
  name: 'MEditorNavMenuColumn',
});

const props = withDefaults(
  defineProps<{
    columnKey: string;
    items: (MenuButton | MenuComponent)[];
    width?: number;
    /** 子元素之间的间距，需与 SCSS gap 保持一致 */
    gap?: number;
    /** Popover 内容宽度 */
    popoverWidth?: number;
  }>(),
  {
    items: () => [],
    gap: 3,
    popoverWidth: 180,
  },
);

const columnEl = useTemplateRef<HTMLDivElement>('columnEl');
const moreWrapperEl = useTemplateRef<HTMLDivElement>('moreWrapperEl');

const popoverVisible = ref(false);
const togglePopover = () => {
  popoverVisible.value = !popoverVisible.value;
};

const itemInstances = ref<(InstanceType<typeof ToolButton> | null)[]>([]);
let slotsRO: ResizeObserver | undefined;
const observedEls = new Set<HTMLElement>();

const setItemRef = (inst: InstanceType<typeof ToolButton> | null, index: number) => {
  itemInstances.value[index] = inst ?? null;
};

const itemEls = computed<(HTMLElement | null)[]>(() =>
  itemInstances.value.map((inst) => inst?.getElRef?.().value ?? null),
);

const reobserveSlots = () => {
  if (!slotsRO) return;
  for (const el of observedEls) slotsRO.unobserve(el);
  observedEls.clear();
  for (const el of itemEls.value) {
    if (el) {
      slotsRO.observe(el);
      observedEls.add(el);
    }
  }
};

const cachedWidths = ref<Map<number, number>>(new Map());
const moreWidth = ref(0);
const containerWidth = ref(0);
const hiddenIndexSet = ref<Set<number>>(new Set());

const hasOverflow = computed(() => hiddenIndexSet.value.size > 0);
const overflowItems = computed(() => props.items.filter((_, index) => hiddenIndexSet.value.has(index)));

const measureAndCompute = () => {
  if (!columnEl.value) return;

  containerWidth.value = columnEl.value.clientWidth;

  const els = itemEls.value;
  for (let i = 0; i < props.items.length; i++) {
    const el = els[i];
    if (!el) {
      cachedWidths.value.delete(i);
      continue;
    }
    const w = el.getBoundingClientRect().width;
    if (w > 0) {
      cachedWidths.value.set(i, w);
    } else {
      cachedWidths.value.delete(i);
    }
  }

  if (moreWrapperEl.value) {
    const w = moreWrapperEl.value.getBoundingClientRect().width;
    if (w > 0) moreWidth.value = w;
  }

  const total = props.items.length;
  if (total === 0 || containerWidth.value <= 0) {
    if (hiddenIndexSet.value.size > 0) hiddenIndexSet.value = new Set();
    return;
  }

  let fullSum = 0;
  let positive = 0;
  for (let i = 0; i < total; i++) {
    const w = cachedWidths.value.get(i) ?? 0;
    if (w > 0) {
      fullSum += w;
      positive += 1;
    }
  }
  fullSum += props.gap * Math.max(0, positive - 1);

  // more 按钮位置始终保留，参与"是否放得下"的判断，避免出现时再次挤压
  const effectiveMoreWidth = moreWidth.value > 0 ? moreWidth.value : 32;
  const reservedMore = effectiveMoreWidth + (positive > 0 ? props.gap : 0);

  let nextHidden: Set<number> | null = null;
  if (fullSum + reservedMore <= containerWidth.value + 0.5) {
    if (hiddenIndexSet.value.size > 0) nextHidden = new Set();
  } else {
    const newHidden = new Set<number>();
    let used = effectiveMoreWidth;
    let cutoff = -1;
    for (let i = 0; i < total; i++) {
      const w = cachedWidths.value.get(i) ?? 0;
      if (w === 0) continue;
      const need = props.gap + w;
      if (used + need > containerWidth.value) {
        cutoff = i;
        break;
      }
      used += need;
    }
    if (cutoff >= 0) {
      for (let j = cutoff; j < total; j++) newHidden.add(j);
    }
    nextHidden = newHidden;
  }

  if (nextHidden) {
    const same =
      nextHidden.size === hiddenIndexSet.value.size && [...nextHidden].every((v) => hiddenIndexSet.value.has(v));
    if (!same) hiddenIndexSet.value = nextHidden;
  }
};

let raf = 0;
const scheduleMeasure = () => {
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    raf = 0;
    measureAndCompute();
    if (hasOverflow.value && moreWidth.value === 0) {
      raf = requestAnimationFrame(() => {
        raf = 0;
        measureAndCompute();
      });
    }
  });
};

watch(hasOverflow, (value) => {
  if (!value) popoverVisible.value = false;
});

watch(
  () => props.items,
  () => {
    cachedWidths.value = new Map();
    hiddenIndexSet.value = new Set();
  },
  { deep: true },
);

watch(itemEls, () => {
  cachedWidths.value = new Map();
  reobserveSlots();
  scheduleMeasure();
});

watch(
  () => props.width,
  () => scheduleMeasure(),
);

let ro: ResizeObserver | undefined;

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    if (columnEl.value) {
      ro = new ResizeObserver(() => scheduleMeasure());
      ro.observe(columnEl.value);
    }
    slotsRO = new ResizeObserver(() => scheduleMeasure());
    reobserveSlots();
  }

  scheduleMeasure();
});

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf);
  ro?.disconnect();
  slotsRO?.disconnect();
  slotsRO = undefined;
  observedEls.clear();
});
</script>
