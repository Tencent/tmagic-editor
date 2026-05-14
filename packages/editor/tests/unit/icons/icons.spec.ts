/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';

import AppManageIcon from '@editor/icons/AppManageIcon.vue';
import CenterIcon from '@editor/icons/CenterIcon.vue';
import CodeIcon from '@editor/icons/CodeIcon.vue';
import FolderMinusIcon from '@editor/icons/FolderMinusIcon.vue';
import PinIcon from '@editor/icons/PinIcon.vue';
import PinnedIcon from '@editor/icons/PinnedIcon.vue';

describe('icons', () => {
  test.each([
    ['AppManageIcon', AppManageIcon],
    ['CenterIcon', CenterIcon],
    ['CodeIcon', CodeIcon],
    ['FolderMinusIcon', FolderMinusIcon],
    ['PinIcon', PinIcon],
    ['PinnedIcon', PinnedIcon],
  ])('%s 渲染 svg 元素', (_name, comp) => {
    const wrapper = mount(comp as any);
    expect(wrapper.find('svg').exists()).toBe(true);
  });
});
