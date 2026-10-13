import{Pt as e,Rt as t,dt as n,ht as r,n as i,pt as a}from"./chunks/framework.sx5Zuccm.js";var o=JSON.parse(`{"title":"联动原理","description":"","frontmatter":{},"headers":[],"relativePath":"guide/advanced/coupling.md","filePath":"guide/advanced/coupling.md"}`),s={name:`guide/advanced/coupling.md`};function c(i,o,s,c,l,u){let d=t(`demo-block`);return e(),n(`div`,null,[o[0]||=a("",6),r(d,{type:`form`,config:`[{
  text: '文本',
  name: 'text'
}, {
  type: 'select',
  text: '下拉选项',
  name: 'select',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ],
  onChange: (vm, value, { model }) => {
    model.text = value;
  }
}]`}),o[1]||=a("",23)])}var l=i(s,[[`render`,c]]);export{o as __pageData,l as default};