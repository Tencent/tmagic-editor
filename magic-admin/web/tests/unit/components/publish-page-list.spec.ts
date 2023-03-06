/*
 * Tencent is pleased to support the open source community by making MagicEditor available.
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

import { nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import { editorService } from '@tmagic/editor';
import { MApp } from '@tmagic/schema';

import publishApi from '@src/api/publish';
import PublishPageList from '@src/components/publish-page-list.vue';
import magicStore from '@src/store/index';

// mock的活动配置数据
const root = {
  type: 'app',
  id: 73,
  name: '7月活动',
  items: [
    {
      type: 'page',
      id: 74,
      name: 'index',
      items: [],
    },
    {
      type: 'page',
      id: 75,
      name: 'page1',
      items: [],
    },
  ],
  abTest: [
    {
      name: 'index',
      pageList: [
        {
          pageName: 'index',
        },
      ],
    },
  ],
};
// mock的活动基础信息
const actInfo = {
  actId: 73,
  actCryptoId: 'sd23z1vt2',
  actName: '7月活动',
  operator: 'parisma',
  actStatus: 0,
  abTest: [
    {
      name: 'test',
      pageList: [
        {
          pageName: 'index',
          proportion: '100',
        },
      ],
    },
  ],
};
editorService.set('root', root as MApp);
magicStore.set('actInfo', actInfo);

jest.mock('vue-router', () => {
  let route = {
    path: '',
    params: {},
  };
  return {
    useRoute: jest.fn(() => route),
    setRoute: (mockRoute: any) => {
      route = mockRoute;
    },
  };
});

jest.mock('@src/api/publish', () => ({
  publishPage: jest
    .fn(() => ({
      ret: 0,
      msg: '',
    }))
    .mockImplementationOnce(() => ({
      ret: -1,
      msg: '发布失败',
    }))
    .mockImplementationOnce(() => ({
      ret: -1,
      msg: '发布成功',
    })),
}));

describe('PublishPageList', () => {
  it('发布失败', async () => {
    const wrapper = mount(PublishPageList, {
      global: {
        provide: {
          publishPageListVisible: ref(true),
        },
      },
    });
    const buttons = wrapper.findAll('el-button');
    // 确认按钮
    const btn = buttons.find((btn) => btn.text() === '确认');
    await btn?.trigger('click');
    setTimeout((done) => {
      expect(document.querySelector('.el-message')?.textContent).toBe('发布失败');
      done();
    }, 0);
  });
  it('发布成功', async () => {
    const wrapper = mount(PublishPageList, {
      global: {
        provide: {
          publishPageListVisible: ref(true),
        },
      },
    });
    const buttons = wrapper.findAll('el-button');
    // 确认按钮
    const btn = buttons.find((btn) => btn.text() === '确认');
    await btn?.trigger('click');
    setTimeout((done) => {
      expect(document.querySelector('.el-message')?.textContent).toBe('发布成功');
      done();
    }, 0);
  });
  it('发布弹窗能正确显示', () => {
    const wrapper = mount(PublishPageList, {
      global: {
        provide: {
          publishPageListVisible: ref(false),
        },
      },
    });
    wrapper.vm.publishPageListVisible = true;
    expect(wrapper.html()).toContain('请勾选需要发布的页面');
  });
  it('全选', () => {
    const wrapper = mount(PublishPageList);
    wrapper.vm.handleCheckAllChange(['index', 'page1']);
    expect(wrapper.vm.checkAll).toBe(true);
  });
  it('全选异常情况', () => {
    const wrapper = mount(PublishPageList);
    (wrapper.vm as any).handleCheckAllChange();
    expect(wrapper.vm.checkedPages).toHaveLength(0);
  });
  it('未选择发布页面，发布按钮不可点击', async () => {
    const wrapper = mount(PublishPageList);
    wrapper.vm.handleCheckedPagesChange([]);
    expect(wrapper.vm.tipVisible).toBe(true);
  });
  it('取消全选', async () => {
    const wrapper = mount(PublishPageList);
    wrapper.vm.handleCheckAllChange([]);
    expect(wrapper.vm.checkedPages).toHaveLength(0);
  });
  it('选择页面', async () => {
    const wrapper = mount(PublishPageList, {
      global: {
        provide: {
          publishPageListVisible: ref(false),
        },
      },
    });
    wrapper.vm.publishPageListVisible = true;
    wrapper.vm.handleCheckedPagesChange(['index']);
    expect(wrapper.vm.isIndeterminate).toBe(false);
  });
  it('点击取消', async () => {
    const wrapper = mount(PublishPageList, {
      global: {
        provide: {
          publishPageListVisible: ref(true),
        },
      },
    });
    const buttons = wrapper.findAll('el-button');
    // 取消按钮
    const btn = buttons.find((btn) => btn.text() === '取消');
    await btn?.trigger('click');
    expect(wrapper.vm.publishPageListVisible).toBe(false);
  });
  it('点击发布', async () => {
    const wrapper = mount(PublishPageList, {
      global: {
        provide: {
          publishPageListVisible: ref(true),
        },
      },
    });
    const res = {
      ret: 0,
      msg: '发布成功',
    };
    publishApi.publishPage = jest.fn(() => Promise.resolve(res));
    const buttons = wrapper.findAll('el-button');
    // 确认按钮
    const btn = buttons.find((btn) => btn.text() === '确认');
    await btn?.trigger('click');
    await nextTick();
    expect(wrapper.vm.publishPageListVisible).toBe(false);
  });
});
