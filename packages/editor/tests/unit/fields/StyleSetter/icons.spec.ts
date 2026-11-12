/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';

import AiBaseline from '@editor/fields/StyleSetter/icons/align-items/Baseline.vue';
import AiEnd from '@editor/fields/StyleSetter/icons/align-items/End.vue';
import AiNormal from '@editor/fields/StyleSetter/icons/align-items/Normal.vue';
import AiStart from '@editor/fields/StyleSetter/icons/align-items/Start.vue';
import AiStretch from '@editor/fields/StyleSetter/icons/align-items/Stretch.vue';
import BgPosLeftBottom from '@editor/fields/StyleSetter/icons/background-position/LeftBottom.vue';
import BgPosLeftCenter from '@editor/fields/StyleSetter/icons/background-position/LeftCenter.vue';
import BgPosLeftTop from '@editor/fields/StyleSetter/icons/background-position/LeftTop.vue';
import NoRepeat from '@editor/fields/StyleSetter/icons/background-repeat/NoRepeat.vue';
import Repeat from '@editor/fields/StyleSetter/icons/background-repeat/Repeat.vue';
import RepeatX from '@editor/fields/StyleSetter/icons/background-repeat/RepeatX.vue';
import RepeatY from '@editor/fields/StyleSetter/icons/background-repeat/RepeatY.vue';
import BgRound from '@editor/fields/StyleSetter/icons/background-repeat/Round.vue';
import BgSpace from '@editor/fields/StyleSetter/icons/background-repeat/Space.vue';
import DisplayBlock from '@editor/fields/StyleSetter/icons/display/Block.vue';
import DisplayFlex from '@editor/fields/StyleSetter/icons/display/Flex.vue';
import DisplayGrid from '@editor/fields/StyleSetter/icons/display/Grid.vue';
import DisplayInline from '@editor/fields/StyleSetter/icons/display/Inline.vue';
import DisplayInlineBlock from '@editor/fields/StyleSetter/icons/display/InlineBlock.vue';
import DisplayInlineFlex from '@editor/fields/StyleSetter/icons/display/InlineFlex.vue';
import DisplayInlineGrid from '@editor/fields/StyleSetter/icons/display/InlineGrid.vue';
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
import JcSpaceEvenly from '@editor/fields/StyleSetter/icons/justify-content/SpaceEvenly.vue';
import TaCenter from '@editor/fields/StyleSetter/icons/text-align/Center.vue';
import TaEnd from '@editor/fields/StyleSetter/icons/text-align/End.vue';
import TaJustify from '@editor/fields/StyleSetter/icons/text-align/Justify.vue';
import TaLeft from '@editor/fields/StyleSetter/icons/text-align/Left.vue';
import TaMatchParent from '@editor/fields/StyleSetter/icons/text-align/MatchParent.vue';
import TaRight from '@editor/fields/StyleSetter/icons/text-align/Right.vue';
import TaStart from '@editor/fields/StyleSetter/icons/text-align/Start.vue';

describe('StyleSetter icons', () => {
  const icons = [
    ['AiBaseline', AiBaseline],
    ['AiEnd', AiEnd],
    ['AiNormal', AiNormal],
    ['AiStart', AiStart],
    ['AiStretch', AiStretch],
    ['BgPosLeftBottom', BgPosLeftBottom],
    ['BgPosLeftCenter', BgPosLeftCenter],
    ['BgPosLeftTop', BgPosLeftTop],
    ['NoRepeat', NoRepeat],
    ['Repeat', Repeat],
    ['RepeatX', RepeatX],
    ['RepeatY', RepeatY],
    ['BgRound', BgRound],
    ['BgSpace', BgSpace],
    ['DisplayBlock', DisplayBlock],
    ['DisplayFlex', DisplayFlex],
    ['DisplayGrid', DisplayGrid],
    ['DisplayInline', DisplayInline],
    ['DisplayInlineBlock', DisplayInlineBlock],
    ['DisplayInlineFlex', DisplayInlineFlex],
    ['DisplayInlineGrid', DisplayInlineGrid],
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
    ['JcSpaceEvenly', JcSpaceEvenly],
    ['TaCenter', TaCenter],
    ['TaEnd', TaEnd],
    ['TaJustify', TaJustify],
    ['TaLeft', TaLeft],
    ['TaMatchParent', TaMatchParent],
    ['TaRight', TaRight],
    ['TaStart', TaStart],
  ];

  test.each(icons)('%s 渲染 svg', (_name, comp) => {
    const wrapper = mount(comp as any);
    expect(wrapper.find('svg').exists()).toBe(true);
  });
});
