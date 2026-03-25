/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export * from '@tmagic/form';
export { default as formPlugin } from '@tmagic/form';
export * from '@tmagic/table';
export { default as tablePlugin } from '@tmagic/table';
export * from '@tmagic/stage';
export { default as StageCore } from '@tmagic/stage';
export * from '@tmagic/design';
export { default as designPlugin } from '@tmagic/design';
export * from '@tmagic/utils';

export type { OnDrag } from 'gesto';

export { DepTargetType } from '@tmagic/core';
export * from './type';
export * from './hooks';
export * from './utils';
export { default as TMagicEditor } from './Editor.vue';
export { default as TMagicCodeEditor } from './layouts/CodeEditor.vue';
export { default as editorService } from './services/editor';
export { default as propsService } from './services/props';
export { default as historyService } from './services/history';
export { default as storageService } from './services/storage';
export { default as eventsService } from './services/events';
export { default as dataSourceService } from './services/dataSource';
export { default as stageOverlayService } from './services/stageOverlay';
export { default as uiService } from './services/ui';
export { default as codeBlockService } from './services/codeBlock';
export { default as depService } from './services/dep';
export { default as ComponentListPanel } from './layouts/sidebar/ComponentListPanel.vue';
export { default as LayerPanel } from './layouts/sidebar/layer/LayerPanel.vue';
export { default as CodeSelect } from './fields/CodeSelect.vue';
export { default as CodeSelectCol } from './fields/CodeSelectCol.vue';
export { default as DataSourceFields } from './fields/DataSourceFields.vue';
export { default as DataSourceMocks } from './fields/DataSourceMocks.vue';
export { default as DataSourceMethods } from './fields/DataSourceMethods.vue';
export { default as DataSourceInput } from './fields/DataSourceInput.vue';
export { default as DataSourceSelect } from './fields/DataSourceSelect.vue';
export { default as DataSourceMethodSelect } from './fields/DataSourceMethodSelect.vue';
export { default as DataSourceFieldSelect } from './fields/DataSourceFieldSelect/Index.vue';
export { default as EventSelect } from './fields/EventSelect.vue';
export { default as KeyValue } from './fields/KeyValue.vue';
export { default as CodeBlockList } from './layouts/sidebar/code-block/CodeBlockList.vue';
export { default as CodeBlockListPanel } from './layouts/sidebar/code-block/CodeBlockListPanel.vue';
export { default as DataSourceConfigPanel } from './layouts/sidebar/data-source/DataSourceConfigPanel.vue';
export { default as DataSourceAddButton } from './layouts/sidebar/data-source/DataSourceAddButton.vue';
export { default as PropsPanel } from './layouts/props-panel/PropsPanel.vue';
export { default as PropsFormPanel } from './layouts/props-panel/FormPanel.vue';
export { default as ToolButton } from './components/ToolButton.vue';
export { default as ContentMenu } from './components/ContentMenu.vue';
export { default as Icon } from './components/Icon.vue';
export { default as LayoutContainer } from './components/SplitView.vue';
export { default as SplitView } from './components/SplitView.vue';
export { default as Resizer } from './components/Resizer.vue';
export { default as CodeBlockEditor } from './components/CodeBlockEditor.vue';
export { default as FloatingBox } from './components/FloatingBox.vue';
export { default as Tree } from './components/Tree.vue';
export { default as TreeNode } from './components/TreeNode.vue';
export { default as PageFragmentSelect } from './fields/PageFragmentSelect.vue';
export { default as DisplayConds } from './fields/DisplayConds.vue';
export { default as CondOpSelect } from './fields/CondOpSelect.vue';
export { default as StyleSetter } from './fields/StyleSetter/Index.vue';

export { default } from './plugin';
