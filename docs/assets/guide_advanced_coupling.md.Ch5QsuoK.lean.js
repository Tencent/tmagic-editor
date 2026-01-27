import{ax as n,al as p,z as l,A as h,b2 as i,R as t}from"./chunks/framework.DkLJC2NO.js";const c=JSON.parse('{"title":"联动原理","description":"","frontmatter":{},"headers":[],"relativePath":"guide/advanced/coupling.md","filePath":"guide/advanced/coupling.md"}'),k={name:"guide/advanced/coupling.md"};function e(E,s,r,d,g,o){const a=p("demo-block");return h(),l("div",null,[s[0]||(s[0]=i("",6)),t(a,{type:"form",config:`[{
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
}]`}),s[1]||(s[1]=i("",23))])}const F=n(k,[["render",e]]);export{c as __pageData,F as default};
