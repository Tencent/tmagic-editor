System.register([],(function(e,t){"use strict";return{execute:function(){e("u",(e=>{const t=Vue.inject("app"),n=t?.page?.getNode(e.config.id),u=Vue.getCurrentInstance()?.proxy;return n?.emit("created",u),Vue.onMounted((()=>{n?.emit("mounted",u)})),Vue.onUnmounted((()=>{n?.emit("destroy",u)})),t}))}}}));
//# sourceMappingURL=useApp-legacy.d06aeb34.js.map
