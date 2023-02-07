const r=c=>{var u,o;const e=Vue.inject("app"),t=(u=e==null?void 0:e.page)==null?void 0:u.getNode(c.config.id),n=(o=Vue.getCurrentInstance())==null?void 0:o.proxy;return t==null||t.emit("created",n),Vue.onMounted(()=>{t==null||t.emit("mounted",n)}),Vue.onUnmounted(()=>{t==null||t.emit("destroy",n)}),e};export{r as u};
//# sourceMappingURL=useApp.8bd6dbd4.js.map
