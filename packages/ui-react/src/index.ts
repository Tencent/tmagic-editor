/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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

import Button from '@tmagic/react-button';
import Container from '@tmagic/react-container';
import Img from '@tmagic/react-img';
import IteratorContainer from '@tmagic/react-iterator-container';
import Overlay from '@tmagic/react-overlay';
import Page from '@tmagic/react-page';
import PageFragment from '@tmagic/react-page-fragment';
import PageFragmentContainer from '@tmagic/react-page-fragment-container';
import QRcode from '@tmagic/react-qrcode';
import Text from '@tmagic/react-text';

export { default as TMagicUiButton } from '@tmagic/react-button';
export { default as TMagicUiContainer } from '@tmagic/react-container';
export { default as TMagicUiImg } from '@tmagic/react-img';
export { default as TMagicUiIteratorContainer } from '@tmagic/react-iterator-container';
export { default as TMagicUiOverlay } from '@tmagic/react-overlay';
export { default as TMagicUiPage } from '@tmagic/react-page';
export { default as TMagicUiPageFragment } from '@tmagic/react-page-fragment';
export { default as TMagicUiPageFragmentContainer } from '@tmagic/react-page-fragment-container';
export { default as TMagicUiQRcode } from '@tmagic/react-qrcode';
export { default as TMagicUiText } from '@tmagic/react-text';

const ui: Record<string, any> = {
  page: Page,
  container: Container,
  button: Button,
  text: Text,
  img: Img,
  qrcode: QRcode,
  overlay: Overlay,
  'page-fragment-container': PageFragmentContainer,
  'page-fragment': PageFragment,
  'iterator-container': IteratorContainer,
};

export default ui;
