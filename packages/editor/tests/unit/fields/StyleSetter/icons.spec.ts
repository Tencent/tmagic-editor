/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';

import BgPosLeftBottom from '@editor/fields/StyleSetter/icons/background-position/LeftBottom.vue';
import BgPosLeftCenter from '@editor/fields/StyleSetter/icons/background-position/LeftCenter.vue';
import BgPosLeftTop from '@editor/fields/StyleSetter/icons/background-position/LeftTop.vue';
import NoRepeat from '@editor/fields/StyleSetter/icons/background-repeat/NoRepeat.vue';
import Repeat from '@editor/fields/StyleSetter/icons/background-repeat/Repeat.vue';
import RepeatX from '@editor/fields/StyleSetter/icons/background-repeat/RepeatX.vue';
import RepeatY from '@editor/fields/StyleSetter/icons/background-repeat/RepeatY.vue';
import DisplayBlock from '@editor/fields/StyleSetter/icons/display/Block.vue';
import DisplayFlex from '@editor/fields/StyleSetter/icons/display/Flex.vue';
import DisplayInline from '@editor/fields/StyleSetter/icons/display/Inline.vue';
import DisplayInlineBlock from '@editor/fields/StyleSetter/icons/display/InlineBlock.vue';
import DisplayNone from '@editor/fields/StyleSetter/icons/display/None.vue';
import FdColumn from '@editor/fields/StyleSetter/icons/flex-direction/Column.vue';
import FdColumnReverse from '@editor/fields/StyleSetter/icons/flex-direction/ColumnReverse.vue';
import FdRow from '@editor/fields/StyleSetter/icons/flex-direction/Row.vue';
import FdRowReverse from '@editor/fields/StyleSetter/icons/flex-direction/RowReverse.vue';
import JcCenter from '@editor/fields/StyleSetter/icons/justify-content/Center.vue';
import JcFlexEnd from '@editor/fields/StyleSetter/icons/justify-content/FlexEnd.vue';
import JcFlexStart from '@editor/fields/StyleSetter/icons/justify-content/FlexStart.vue';
import JcSpaceAround from '@editor/fields/StyleSetter/icons/justify-content/SpaceAround.vue';
import JcSpaceBetween from '@editor/fields/StyleSetter/icons/justify-content/SpaceBetween.vue';
import TaCenter from '@editor/fields/StyleSetter/icons/text-align/Center.vue';
import TaLeft from '@editor/fields/StyleSetter/icons/text-align/Left.vue';
import TaRight from '@editor/fields/StyleSetter/icons/text-align/Right.vue';

describe('StyleSetter icons', () => {
  const icons = [
    ['BgPosLeftBottom', BgPosLeftBottom],
    ['BgPosLeftCenter', BgPosLeftCenter],
    ['BgPosLeftTop', BgPosLeftTop],
    ['NoRepeat', NoRepeat],
    ['Repeat', Repeat],
    ['RepeatX', RepeatX],
    ['RepeatY', RepeatY],
    ['DisplayBlock', DisplayBlock],
    ['DisplayFlex', DisplayFlex],
    ['DisplayInline', DisplayInline],
    ['DisplayInlineBlock', DisplayInlineBlock],
    ['DisplayNone', DisplayNone],
    ['FdColumn', FdColumn],
    ['FdColumnReverse', FdColumnReverse],
    ['FdRow', FdRow],
    ['FdRowReverse', FdRowReverse],
    ['JcCenter', JcCenter],
    ['JcFlexEnd', JcFlexEnd],
    ['JcFlexStart', JcFlexStart],
    ['JcSpaceAround', JcSpaceAround],
    ['JcSpaceBetween', JcSpaceBetween],
    ['TaCenter', TaCenter],
    ['TaLeft', TaLeft],
    ['TaRight', TaRight],
  ];

  test.each(icons)('%s 渲染 svg', (_name, comp) => {
    const wrapper = mount(comp as any);
    expect(wrapper.find('svg').exists()).toBe(true);
  });
});
