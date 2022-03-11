/*
 * Tencent is pleased to support the open source community by making MagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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

import vueRouter from 'vue-router';
import { flushPromises, mount } from '@vue/test-utils';
import { ElSelect } from 'element-plus';

import actApi from '@src/api/act';
import List from '@src/components/act-list.vue';
import FormDialog from '@src/components/form-dialog.vue';
import MTable from '@src/components/table.vue';
import { components } from '@tests/utils';

beforeEach(() => {
  jest.clearAllMocks();
});

// mock
jest.mock('js-cookie', () => {
  const map = new Map();
  return {
    get: (key: string) => map.get(key),
    set: (key: string, val: any) => map.set(key, val),
  };
});

// mock
jest.mock('vue-router', () => {
  let route = {
    path: '',
    params: {
      type: 'all',
      page: 0,
      query: 'query',
      status: -1,
    },
    query: {
      create: false,
    },
  };
  return {
    useRoute: jest.fn(() => route),
    useRouter: jest.fn(() => ({
      push: jest.fn((query) => {
        route.path = query;
      }),
    })),
    setRoute: (mockRoute: any) => {
      route = mockRoute;
    },
  };
});

// mock
jest.mock('@src/api/act', () => {
  const acts: any[] = [];
  for (let i = 0; i < 12; i++) {
    acts.push({
      actId: i,
      actName: `活动${i}`,
      operator: `operator${i}`,
      pagePublishStatus: 1,
      actStatusFormatter: 1,
    });
  }
  let actsRes = {
    data: acts,
    fetch: true,
    errorMsg: '',
    total: 15,
  };
  let copyRes = {
    ret: 0,
    msg: '复制成功',
  };
  return {
    getList: jest.fn(() => Promise.resolve(actsRes)),
    copyAct: jest.fn(() => Promise.resolve(copyRes)),
    setCopyRet: (ret: any) => {
      copyRes = ret;
    },
    setActsRes: (res: any) => {
      actsRes = res;
    },
  };
});

// 获取列表实例
const getWrapper = () =>
  mount(List, {
    global: {
      components: {
        'form-dialog': FormDialog,
        'm-table': MTable,
        ...components,
      },
      directives: {
        loading: {},
      },
    },
  });

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('List', () => {
  it('活动查询', async () => {
    const wrapper = getWrapper();
    const queryInput = wrapper.find('input[placeholder="输入活动ID，活动名称，加密ID，创建人查询.."]');

    await queryInput.setValue('test');
    // 模拟回车
    await queryInput.trigger('keydown.enter');

    const queryData = (actApi.getList as jest.Mock).mock.calls[0][0].data;
    expect(queryData.where.search).toBe('test');
  });

  it('输入切换页面', async () => {
    const wrapper = getWrapper();
    // 等待获取活动列表
    await flushPromises();
    const pageInput = wrapper.find('input[max="2"]');
    await pageInput.setValue(2);
    // 模拟回车
    await pageInput.trigger('keydown.enter');

    expect((vueRouter as any).useRoute().path).toBe('/act/all/1/-1/query');
  });

  it('按活动状态筛选', async () => {
    const wrapper = getWrapper();
    const select = wrapper.findComponent(ElSelect);
    select.vm.$emit('change', 0);
    expect((vueRouter as any).useRoute().path).toBe('/act/all/0/0/query');
  });

  it('按页面标题查询', async () => {
    const wrapper = getWrapper();
    const queryInput = wrapper.find('input[placeholder="页面标题"]');

    await queryInput.setValue('test');
    // 模拟回车
    await queryInput.trigger('keydown.enter');

    const queryData = (actApi.getList as jest.Mock).mock.calls[0][0].data;
    expect(queryData.where.pageTitle).toBe('test');
  });

  it('关闭对话框', () => {
    const wrapper = getWrapper();
    const dialog = wrapper.findComponent(FormDialog);
    dialog.vm.$emit('close');

    expect(dialog.vm.$props.visible).toBe(false);
  });

  it('复制成功', () => {
    const wrapper = getWrapper();
    const buttons = wrapper.findAll('button');
    const copyBtn = buttons.find((btn) => btn.text() === '复制');
    copyBtn?.trigger('click');
    setTimeout((done) => {
      expect(document.querySelector('.el-message')?.textContent).toBe('复制成功');
      done();
    }, 0);
  });

  it('复制成功-无msg', () => {
    (actApi as any).setCopyRet({
      ret: 0,
    });
    const wrapper = getWrapper();
    const buttons = wrapper.findAll('button');
    const copyBtn = buttons.find((btn) => btn.text() === '复制');
    copyBtn?.trigger('click');
    setTimeout((done) => {
      expect(document.querySelector('.el-message')?.textContent).toBe('复制失败');
      done();
    }, 0);
  });

  it('复制失败-有msg', () => {
    (actApi as any).setCopyRet({
      ret: -1,
      msg: '失败原因',
    });
    const wrapper = getWrapper();
    const buttons = wrapper.findAll('button');
    const copyBtn = buttons.find((btn) => btn.text() === '复制');
    copyBtn?.trigger('click');
    setTimeout((done) => {
      expect(document.querySelector('.el-message')?.textContent).toBe('失败原因');
      done();
    }, 0);
  });

  it('无权限复制', () => {
    const wrapper = getWrapper();
    const buttons = wrapper.findAll('button');
    const copyBtn = buttons.find((btn) => btn.text() === '复制');
    copyBtn?.trigger('click');
    expect(actApi.copyAct).toBeCalledTimes(0);
  });

  it('查看', () => {
    const wrapper = getWrapper();
    const buttons = wrapper.findAll('button');
    const copyBtn = buttons.find((btn) => btn.text() === '查看');
    copyBtn?.trigger('click');
    expect((vueRouter as any).useRoute().path).toBe('/editor/undefined');
  });

  it('新建活动出现弹窗', async () => {
    // 在创建活动页点击创建跳转到当前页面
    const wrapper = getWrapper();
    const createButton = wrapper.find('#create');
    await createButton.trigger('click');
    expect(wrapper.vm.formDialogVisible).toBe(true);
  });

  it('路由的活动状态值缺省', () => {
    (vueRouter as any).setRoute({
      path: '',
      params: {
        type: 'all',
        // 第一页
        page: 0,
        query: 'query',
        // 活动状态
        status: undefined,
      },
      query: {
        create: false,
      },
    });
    getWrapper();
    expect((actApi.getList as jest.Mock).mock.calls[0][0].data.where.actStatus).toBe(-1);
  });
});
