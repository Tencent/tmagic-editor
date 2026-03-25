export default {
  methods: [
    {
      label: '打开蒙层',
      value: 'openOverlay',
    },
    {
      label: '关闭蒙层',
      value: 'closeOverlay',
    },
  ],
  events: [
    {
      label: '打开蒙层',
      value: 'overlay:open',
    },
    {
      label: '关闭蒙层',
      value: 'overlay:close',
    },
  ],
};
