import{C as i}from"./tmagic-core-fMp8xZqy.js";import{c as a,_ as c}from"./plugin-vueexport-helper-CcqgLIiX.js";import"./index-DUtJ1Lt-.js";import"./tmagic-dep-DfEzeAO0.js";const p=VueDemi.defineComponent({name:"tmagic-button",props:{config:{type:Object,required:!0},iteratorIndex:Array,iteratorContainerId:Array,containerIndex:Number,model:{type:Object,default:()=>({})}},setup(e){const{app:t,node:n}=a(e);return{clickHandler:()=>{t&&n&&t.emit("".concat(i,"click"),n)}}}});function d(e,t,n,o,l,s){return Vue.openBlock(),Vue.createElementBlock("button",{onClick:t[0]||(t[0]=(...r)=>e.clickHandler&&e.clickHandler(...r))},[Vue.renderSlot(e.$slots,"default",{},()=>{var r;return[Vue.createTextVNode(Vue.toDisplayString(((r=e.config)==null?void 0:r.text)||""),1)]})])}const V=c(p,[["render",d]]);export{V as default};
//# sourceMappingURL=index-Bij6XBMv.js.map
