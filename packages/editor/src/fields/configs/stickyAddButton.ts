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

/**
 * 属性面板列表字段共用的吸底全宽「添加」按钮，展开到 group-list 配置上。
 *
 * 吸底按钮会盖住列表底部，新增的项必须同时滚进视口才看得见，两者一起给出避免漏配。
 */
export const stickyAddButton = (text: string) => ({
  scrollLastItemIntoView: true as const,
  addButtonConfig: {
    sticky: true as const,
    text,
    props: { type: 'primary', plain: true, text: false },
  },
});
