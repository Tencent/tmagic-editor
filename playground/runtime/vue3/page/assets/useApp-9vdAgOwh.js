const n=({config:o,methods:m})=>{var s;const e=Vue.inject("app"),t=(s=e==null?void 0:e.page)==null?void 0:s.getNode(o.id),u={config:o,...m};return t==null||t.emit("created",u),Vue.onMounted(()=>{t==null||t.emit("mounted",u)}),Vue.onBeforeUnmount(()=>{t==null||t.emit("destroy",u)}),e};export{n as u};
//# sourceMappingURL=useApp-9vdAgOwh.js.map
