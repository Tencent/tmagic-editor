import { describe, expect, test } from 'vitest';
import { defineComponent, isVue3, provide } from 'vue-demi';
import { mount } from '@vue/test-utils';

import Core from '@tmagic/core';

import { useComponent } from '../src';

describe('useComponent', () => {
  const app = new Core({});
  const fooComponent = 'foo-component';
  app.registerComponent('foo', fooComponent);
  const containerComponent = {};
  app.registerComponent('magic-ui-container', containerComponent);

  test('string para', () => {
    const component = useComponent('foo');
    expect(component).toEqual('magic-ui-foo');
  });

  test('object para and can find component', () => {
    const component = useComponent({ componentType: 'foo', app });
    expect(component).toEqual(fooComponent);
  });

  test('without app and can not find component', () => {
    const component = useComponent({ componentType: 'foo' });
    expect(component).toEqual('magic-ui-foo');
  });

  test('with magic-ui- componentType and can not find component', () => {
    const component = useComponent({ componentType: 'magic-ui-foo', app });
    expect(component).toEqual('magic-ui-foo');
  });

  test.runIf(isVue3)('auto inject and empty para', () => {
    const child = defineComponent({
      setup() {
        const component = useComponent();
        expect(component).toEqual(containerComponent);
      },
    });

    const parent = defineComponent({
      template: '<child-com></child-com>',
      components: { 'child-com': child },
      setup() {
        provide('app', app);
      },
    });

    const vueApp = mount(parent);
    vueApp.unmount();
  });
});
