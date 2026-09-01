import { nextTick, type Ref } from 'vue';

type ListRef = Ref<{ $el?: unknown } | HTMLElement | null | undefined>;

interface ScrollTarget {
  root: HTMLElement;
  last: HTMLElement | null;
  count: number;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** 滚动要用的列表根与最后一项；组件已卸载（宿主重建了整棵表单）时返回 null */
const resolveScrollTarget = (listRef: ListRef): ScrollTarget | null => {
  const inst = listRef.value;
  const root = inst instanceof HTMLElement ? inst : inst?.$el;
  if (!(root instanceof HTMLElement)) return null;

  const items = root.querySelectorAll(':scope > .m-fields-group-list-item');
  const last = items[items.length - 1];
  return { root, last: last instanceof HTMLElement ? last : null, count: items.length };
};

/** 吸顶标题自身的高度：滚动后新项的标题不能被上一层标题压住 */
const getStickyHeaderOffset = (item: HTMLElement): number => {
  const header = item.querySelector(':scope > .el-card__header, :scope > .t-card__header');
  if (!(header instanceof HTMLElement)) return 0;
  return Number.parseFloat(getComputedStyle(header).top) || 0;
};

/** 吸底「新增」按钮盖住的高度；嵌套列表的 footer 还用 bottom 给外层按钮留了位 */
const getStickyFooterOffset = (root: HTMLElement): number => {
  const footer = root.querySelector(':scope > .m-fields-group-list-footer.is-sticky-full');
  if (!(footer instanceof HTMLElement)) return 0;
  return footer.getBoundingClientRect().height + (Number.parseFloat(getComputedStyle(footer).bottom) || 0);
};

/**
 * 等列表渲染出至少 `expectedCount` 项、且最后一项的 DOM 节点连续两帧不变再返回。
 *
 * 新增只抛 change，写回要经过宿主（如编辑器属性面板）的异步校验与表单值重建，
 * 新项不一定当帧就出现；期间宿主还可能自己再追加项，末尾节点会换掉。
 * 只判「节点不变」会滚到旧的最后一项上，所以先等够数量再等稳定。
 */
const waitForStableTarget = async (
  listRef: ListRef,
  expectedCount: number,
  timeout = 600,
): Promise<ScrollTarget | null> => {
  const deadline = Date.now() + timeout;
  let previous: HTMLElement | null = null;

  while (Date.now() < deadline) {
    const target = resolveScrollTarget(listRef);
    if (!target) return null;
    if (target.count >= expectedCount && target.last && target.last === previous) return target;
    previous = target.last;
    await nextFrame();
  }

  return resolveScrollTarget(listRef);
};

/**
 * 新增后把最后一项滚进视口，避开吸顶标题与吸底按钮。
 *
 * `enabled` 为 false（未开配置、或不在 group-list 形态）时直接返回。
 */
export const useScrollLastItemIntoView = (listRef: ListRef, enabled: () => boolean) => {
  const scrollLastItemIntoView = async (expectedCount: number) => {
    if (!enabled()) return;

    // 先让已经同步写回的那部分渲染出来，稳定判定的第一帧就能拿到新项，少等一帧
    await nextTick();

    const target = await waitForStableTarget(listRef, expectedCount);
    if (!target?.last) return;

    const { root, last } = target;

    // 新项是追加在末尾的，下方往往没有多余内容可滚，用 `start` 会被浏览器夹住、
    // 仍压在吸底按钮下面。`nearest` 只滚到刚好露出，配合两侧 scroll-margin 避开吸顶标题与吸底按钮。
    const top = getStickyHeaderOffset(last);
    const bottom = getStickyFooterOffset(root);
    last.style.scrollMarginTop = top ? `${top}px` : '';
    last.style.scrollMarginBottom = bottom ? `${bottom}px` : '';

    // 用瞬时定位而不是 smooth：平滑滚动要持续几百毫秒，期间宿主的回写重绘会把滚动位置改掉，
    // 动画继续奔向旧目标，看起来就是「先弹回顶部再滚下来」。瞬时定位没有这个窗口。
    last.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  };

  return { scrollLastItemIntoView };
};
