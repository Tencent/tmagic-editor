System.register([],(function(e,t){"use strict";return{execute:function(){
/*!-----------------------------------------------------------------------------
       * Copyright (c) Microsoft Corporation. All rights reserved.
       * Version: 0.48.0(0037b13fb5d186fdf1e7df51a9416a2de2b8c670)
       * Released under the MIT license
       * https://github.com/microsoft/monaco-editor/blob/main/LICENSE.txt
       *-----------------------------------------------------------------------------*/
e("conf",{comments:{lineComment:"#"}}),e("language",{defaultToken:"keyword",ignoreCase:!0,tokenPostfix:".azcli",str:/[^#\s]/,tokenizer:{root:[{include:"@comment"},[/\s-+@str*\s*/,{cases:{"@eos":{token:"key.identifier",next:"@popall"},"@default":{token:"key.identifier",next:"@type"}}}],[/^-+@str*\s*/,{cases:{"@eos":{token:"key.identifier",next:"@popall"},"@default":{token:"key.identifier",next:"@type"}}}]],type:[{include:"@comment"},[/-+@str*\s*/,{cases:{"@eos":{token:"key.identifier",next:"@popall"},"@default":"key.identifier"}}],[/@str+\s*/,{cases:{"@eos":{token:"string",next:"@popall"},"@default":"string"}}]],comment:[[/#.*$/,{cases:{"@eos":{token:"comment",next:"@popall"}}}]]}})}}}));
//# sourceMappingURL=azcli-legacy-BJXrEnMV.js.map
