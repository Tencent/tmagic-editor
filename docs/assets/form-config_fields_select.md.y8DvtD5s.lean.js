import{aw as i,ag as n,y as o,z as p,A as e,P as s,b0 as h,L as d,H as l}from"./chunks/framework.BCBheFgR.js";const x=JSON.parse('{"title":"Select 选择器","description":"","frontmatter":{},"headers":[],"relativePath":"form-config/fields/select.md","filePath":"form-config/fields/select.md"}'),u={name:"form-config/fields/select.md"};function b(k,t,m,g,c,f){const a=n("demo-block");return p(),o("div",null,[t[5]||(t[5]=e("h1",{id:"select-选择器",tabindex:"-1"},[d("Select 选择器 "),e("a",{class:"header-anchor",href:"#select-选择器","aria-label":'Permalink to "Select 选择器"'},"​")],-1)),t[6]||(t[6]=e("p",null,"当选项过多时，使用下拉菜单展示并选择内容。",-1)),t[7]||(t[7]=e("h2",{id:"基础用法",tabindex:"-1"},[d("基础用法 "),e("a",{class:"header-anchor",href:"#基础用法","aria-label":'Permalink to "基础用法"'},"​")],-1)),t[8]||(t[8]=e("p",null,"适用广泛的基础单选",-1)),s(a,{type:"form",config:[{type:"select",name:"select",text:"选项",placeholder:"请选择",options:[{text:"选项1",value:1},{text:"选项2",value:2}]}]},{source:l(()=>t[0]||(t[0]=[e("p",null," type为'select' ",-1)])),_:1}),t[9]||(t[9]=e("h2",{id:"有禁用选项",tabindex:"-1"},[d("有禁用选项 "),e("a",{class:"header-anchor",href:"#有禁用选项","aria-label":'Permalink to "有禁用选项"'},"​")],-1)),s(a,{type:"form",config:[{type:"select",name:"select",text:"选项",placeholder:"请选择",options:[{text:"选项1",value:1},{text:"选项2",value:2,disabled:!0}]}]},{source:l(()=>t[1]||(t[1]=[e("p",null," 在 opitons 选项配置中，设定 disabled 值为 true，即可禁用该选项 ",-1)])),_:1}),t[10]||(t[10]=e("h2",{id:"禁用状态",tabindex:"-1"},[d("禁用状态 "),e("a",{class:"header-anchor",href:"#禁用状态","aria-label":'Permalink to "禁用状态"'},"​")],-1)),t[11]||(t[11]=e("p",null,"选择器不可用状态",-1)),s(a,{type:"form",config:[{type:"select",name:"select",text:"选项",placeholder:"请选择",disabled:!0,options:[{text:"选项1",value:1},{text:"选项2",value:2}]}]},{source:l(()=>t[2]||(t[2]=[e("p",null," 为 el-select 设置 disabled 属性，则整个选择器不可用 ",-1)])),_:1}),t[12]||(t[12]=e("h2",{id:"基础多选",tabindex:"-1"},[d("基础多选 "),e("a",{class:"header-anchor",href:"#基础多选","aria-label":'Permalink to "基础多选"'},"​")],-1)),t[13]||(t[13]=e("p",null,"适用性较广的基础多选，用 Tag 展示已选项",-1)),s(a,{type:"form",config:[{type:"select",name:"select",text:"选项",placeholder:"请选择",multiple:!0,options:[{text:"选项1",value:1},{text:"选项2",value:2},{text:"选项3",value:3}]}]}),t[14]||(t[14]=e("h2",{id:"分组",tabindex:"-1"},[d("分组 "),e("a",{class:"header-anchor",href:"#分组","aria-label":'Permalink to "分组"'},"​")],-1)),t[15]||(t[15]=e("p",null,"备选项进行分组展示",-1)),s(a,{type:"form",config:[{type:"select",name:"select",text:"选项",placeholder:"请选择",group:!0,options:[{label:"group1",options:[{text:"选项1",value:1},{text:"选项2",value:2},{text:"选项3",value:3}],disabled:!0},{label:"group2",options:[{text:"选项4",value:4},{text:"选项5",value:5},{text:"选项6",value:6}]}]}]},{source:l(()=>t[3]||(t[3]=[e("p",null," 配置group为true ",-1)])),_:1}),t[16]||(t[16]=e("h2",{id:"创建条目",tabindex:"-1"},[d("创建条目 "),e("a",{class:"header-anchor",href:"#创建条目","aria-label":'Permalink to "创建条目"'},"​")],-1)),t[17]||(t[17]=e("p",null,"可以创建并选中选项中不存在的条目",-1)),s(a,{type:"form",config:[{type:"select",name:"select",text:"选项",placeholder:"请选择",allowCreate:!0,options:[{text:"选项1",value:1},{text:"选项2",value:2}]}]}),t[18]||(t[18]=e("h2",{id:"远程选项",tabindex:"-1"},[d("远程选项 "),e("a",{class:"header-anchor",href:"#远程选项","aria-label":'Permalink to "远程选项"'},"​")],-1)),t[19]||(t[19]=e("p",null,"通过接口请求获取选项列表",-1)),s(a,{type:"form",config:[{type:"select",name:"select",text:"选项",placeholder:"请选择",remote:!0,option:{url:"select/remote",root:"data",method:"post",mode:"cors",headers:{"Content-Type":"application/json"},body:{query:""},json:!0,text:r=>`${r.name}`,value:r=>`${r.id}`}}]},{source:l(()=>t[4]||(t[4]=[e("p",null," 配置remote为true，然后配置option，而不是options ",-1)])),_:1},8,["config"]),t[20]||(t[20]=h("",9))])}const E=i(u,[["render",b]]);export{x as __pageData,E as default};
