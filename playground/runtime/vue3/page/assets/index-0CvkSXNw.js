import{C as i}from"./tmagic-core-fMp8xZqy.js";import{b as c,r as a,_ as s}from"./plugin-vueexport-helper-CcqgLIiX.js";import"./index-DUtJ1Lt-.js";import"./tmagic-dep-DfEzeAO0.js";const p=VueDemi.defineComponent({name:"tmagic-text",props:{config:{type:Object,required:!0},iteratorIndex:Array,iteratorContainerId:Array,containerIndex:Number,model:{type:Object,default:()=>({})}},setup(e){const r=VueDemi.inject("app"),t=c(e);return a(t),{clickHandler:()=>{r&&t&&r.emit("".concat(i,"click"),t)}}}}),d=["innerHTML"];function l(e,r,t,n,m,u){return Vue.openBlock(),Vue.createElementBlock("p",{onClick:r[0]||(r[0]=(...o)=>e.clickHandler&&e.clickHandler(...o)),innerHTML:e.config.text},null,8,d)}const x=s(p,[["render",l]]);export{x as default};
//# sourceMappingURL=index-0CvkSXNw.js.map
