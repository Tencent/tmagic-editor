import{av as a,ah as n,q as p,U as h,aQ as s,p as l}from"./chunks/framework.DMVh9u1e.js";const u=JSON.parse('{"title":"联动原理","description":"","frontmatter":{},"headers":[],"relativePath":"guide/advanced/coupling.md","filePath":"guide/advanced/coupling.md"}'),t={name:"guide/advanced/coupling.md"},k=s("",6),e=s("",25);function E(r,d,g,c,o,y){const i=n("demo-block");return l(),p("div",null,[k,h(i,{type:"form",config:`[{
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
}]`}),e])}const A=a(t,[["render",E]]);export{u as __pageData,A as default};
