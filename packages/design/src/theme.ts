/*
 * 主题作用域穿透到 portal 节点的基建。
 *
 * `<MEditor>` / `<MForm>` 通过 provide 暴露当前的 `theme`，包含 `<Teleport>` 的组件
 * 通过 `useThemeClass()` inject 得到主题修饰类，挂到传送目标根节点上即可让主题级
 * CSS 变量（如 `--el-color-primary`）在 body 下的 portal 节点上也命中。
 *
 * 命名约定：portal 节点本身既不是 `m-editor` 也不是 `m-form`，因此使用独立的中性类
 * `m-theme--<theme>`，避免语义混淆。同时把跨组件共享的主题级 CSS 变量统一挂在该类上，
 * editor 根 / form 根 / portal 根都加上该类即可统一受用，editor / form 各自的内部
 * 样式仍保留在 `.m-editor.m-editor--<theme>` / `.m-form.m-form--<theme>` 双类选择器
 * 上，互不污染。
 */

import type { ComputedRef, InjectionKey, Ref } from 'vue';
import { computed, inject } from 'vue';

/** 祖先 `<MEditor>` / `<MForm>` 暴露的当前 theme（一般来自 props.theme，经 MForm 时
 *  若自身没设 theme，会透传外层 `<MEditor>` 的值，详见 Form.vue 中的 effectiveTheme）。 */
export const M_THEME_KEY: InjectionKey<Ref<string>> = Symbol('mTheme');

/**
 * 取得来自最近 `<MEditor>` / `<MForm>` 祖先 provide 的主题，拼成可直接套到 class 字符串
 * 的格式：例如 `"m-theme--magic-admin"`。
 *
 * - 不在主题作用域里时返回空串，调用方可直接拼接，无需额外判空。
 * - 与 `m-editor` / `m-form` 同名修饰类完全解耦：portal 节点只挂这一个中性主题类，
 *   不会意外命中 editor / form 内部 DOM 的样式作用域。
 *
 * 使用场景：组件自身渲染了 `<Teleport>`（如 `TMagicPopover` / `FloatingBox` /
 * `ContentMenu`），需要在传送目标根节点上挂主题类，让主题 CSS 变量能命中。
 */
export const useThemeClass = (): ComputedRef<string> => {
  const theme = inject(M_THEME_KEY, null);
  return computed(() => {
    const t = theme?.value;
    return t ? `m-theme--${t}` : '';
  });
};

/**
 * 在组件内统一解析当前生效的 theme：以 `prop.theme` 为准，缺省时回退到祖先
 * `<MEditor>` / `<MForm>` provide 的主题。
 *
 * 入参 `prop` 是任意结构，约束只看 `theme?: string`。一般直接把 `defineProps()` 的
 * 返回值传进来即可（reactive proxy，computed 可正确跟踪外部更新）；不要传
 * `toRefs` 解构后的对象。
 *
 * 若 `prop.theme` 与祖先都没有，返回空串，调用方可直接拼接。
 *
 * @example
 * const props = defineProps<{ theme?: string }>();
 * const theme = useTheme(props);
 * // theme.value -> 'magic-admin' 或 ''
 */
export const useTheme = <T extends { theme?: string }>(prop: T): ComputedRef<string> => {
  const injected = inject(M_THEME_KEY, null);
  return computed(() => prop.theme || injected?.value || '');
};
