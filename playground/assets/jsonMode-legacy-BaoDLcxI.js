System.register(["./index-legacy-CAxyFin2.js"],(function(e,t){"use strict";var n;return{setters:[e=>{n=e.m}],execute:function(){e({fromPosition:ut,fromRange:dt,getWorker:function(){return new Promise(((e,t)=>{if(!Pt)return t("JSON not registered!");e(Pt)}))},setupMode:function(e){const t=[],n=[],r=new ne(e);function i(){const{languageId:t,modeConfiguration:r}=e;Jt(n),r.documentFormattingEdits&&n.push(a.languages.registerDocumentFormattingEditProvider(t,new Ct(Pt))),r.documentRangeFormattingEdits&&n.push(a.languages.registerDocumentRangeFormattingEditProvider(t,new yt(Pt))),r.completionItems&&n.push(a.languages.registerCompletionItemProvider(t,new ct(Pt,[" ",":",'"']))),r.hovers&&n.push(a.languages.registerHoverProvider(t,new ft(Pt))),r.documentSymbols&&n.push(a.languages.registerDocumentSymbolProvider(t,new bt(Pt))),r.tokens&&n.push(a.languages.setTokensProvider(t,{getInitialState:()=>new Xt(null,null,!1,null),tokenize:(e,t)=>function(e,t,n,r=0){let i=0,o=!1;switch(n.scanError){case 2:t='"'+t,i=1;break;case 1:t="/*"+t,i=2}const a=Mt(t);let s=n.lastWasColon,c=n.parents;const u={tokens:[],endState:n.clone()};for(;;){let e=r+a.getPosition(),d="";const g=a.scan();if(17===g)break;if(e===r+a.getPosition())throw new Error("Scanner did not advance, next 3 characters are: "+t.substr(a.getPosition(),3));switch(o&&(e-=i),o=i>0,g){case 1:c=qt.push(c,0),d=jt,s=!1;break;case 2:c=qt.pop(c),d=jt,s=!1;break;case 3:c=qt.push(c,1),d=Lt,s=!1;break;case 4:c=qt.pop(c),d=Lt,s=!1;break;case 6:d=Ft,s=!0;break;case 5:d=Ot,s=!1;break;case 8:case 9:d=Nt,s=!1;break;case 7:d=Wt,s=!1;break;case 10:const e=c?c.type:0;d=s||1===e?Ut:Ht,s=!1;break;case 11:d=Vt,s=!1}switch(g){case 12:d=zt;break;case 13:d=Kt}u.endState=new Xt(n.getStateData(),a.getTokenError(),s,c),u.tokens.push({startIndex:e,scopes:d})}return u}(0,e,t)})),r.colors&&n.push(a.languages.registerColorProvider(t,new xt(Pt))),r.foldingRanges&&n.push(a.languages.registerFoldingRangeProvider(t,new It(Pt))),r.diagnostics&&n.push(new Bt(t,Pt,e)),r.selectionRanges&&n.push(a.languages.registerSelectionRangeProvider(t,new St(Pt)))}t.push(r),Pt=(...e)=>r.getLanguageServiceWorker(...e),i(),t.push(a.languages.setLanguageConfiguration(e.languageId,Qt));let o=e.modeConfiguration;return e.onDidChange((e=>{e.modeConfiguration!==o&&(o=e.modeConfiguration,i())})),t.push($t(n)),$t(t)},toRange:gt,toTextEdit:ht});
/*!-----------------------------------------------------------------------------
       * Copyright (c) Microsoft Corporation. All rights reserved.
       * Version: 0.48.0(0037b13fb5d186fdf1e7df51a9416a2de2b8c670)
       * Released under the MIT license
       * https://github.com/microsoft/monaco-editor/blob/main/LICENSE.txt
       *-----------------------------------------------------------------------------*/
var t=Object.defineProperty,r=Object.getOwnPropertyDescriptor,i=Object.getOwnPropertyNames,o=Object.prototype.hasOwnProperty,a={};((e,n,a,s)=>{if(n&&"object"==typeof n||"function"==typeof n)for(let c of i(n))o.call(e,c)||c===a||t(e,c,{get:()=>n[c],enumerable:!(s=r(n,c))||s.enumerable})})(a,n,"default");var s,c,u,d,g,l,h,f,p,m,v,k,b,_,w,C,y,E,A,x,I,S,T,R,D,P,M,j,L,F,O,N,W,U,V,H,K,z,q,X,B,$,J,Q,G,Y,Z,ee,te,ne=e("WorkerManager",class{constructor(e){this._defaults=e,this._worker=null,this._client=null,this._idleCheckInterval=window.setInterval((()=>this._checkIfIdle()),3e4),this._lastUsedTime=0,this._configChangeListener=this._defaults.onDidChange((()=>this._stopWorker()))}_stopWorker(){this._worker&&(this._worker.dispose(),this._worker=null),this._client=null}dispose(){clearInterval(this._idleCheckInterval),this._configChangeListener.dispose(),this._stopWorker()}_checkIfIdle(){this._worker&&Date.now()-this._lastUsedTime>12e4&&this._stopWorker()}_getClient(){return this._lastUsedTime=Date.now(),this._client||(this._worker=a.editor.createWebWorker({moduleId:"vs/language/json/jsonWorker",label:this._defaults.languageId,createData:{languageSettings:this._defaults.diagnosticsOptions,languageId:this._defaults.languageId,enableSchemaRequest:this._defaults.diagnosticsOptions.enableSchemaRequest}}),this._client=this._worker.getProxy()),this._client}getLanguageServiceWorker(...e){let t;return this._getClient().then((e=>{t=e})).then((t=>{if(this._worker)return this._worker.withSyncedResources(e)})).then((e=>t))}});(c=s||(s={})).MIN_VALUE=-2147483648,c.MAX_VALUE=2147483647,(d=u||(u={})).MIN_VALUE=0,d.MAX_VALUE=2147483647,(l=g||(g={})).create=function(e,t){return e===Number.MAX_VALUE&&(e=u.MAX_VALUE),t===Number.MAX_VALUE&&(t=u.MAX_VALUE),{line:e,character:t}},l.is=function(e){var t=e;return nt.objectLiteral(t)&&nt.uinteger(t.line)&&nt.uinteger(t.character)},(f=h||(h={})).create=function(e,t,n,r){if(nt.uinteger(e)&&nt.uinteger(t)&&nt.uinteger(n)&&nt.uinteger(r))return{start:g.create(e,t),end:g.create(n,r)};if(g.is(e)&&g.is(t))return{start:e,end:t};throw new Error("Range#create called with invalid arguments["+e+", "+t+", "+n+", "+r+"]")},f.is=function(e){var t=e;return nt.objectLiteral(t)&&g.is(t.start)&&g.is(t.end)},(m=p||(p={})).create=function(e,t){return{uri:e,range:t}},m.is=function(e){var t=e;return nt.defined(t)&&h.is(t.range)&&(nt.string(t.uri)||nt.undefined(t.uri))},(k=v||(v={})).create=function(e,t,n,r){return{targetUri:e,targetRange:t,targetSelectionRange:n,originSelectionRange:r}},k.is=function(e){var t=e;return nt.defined(t)&&h.is(t.targetRange)&&nt.string(t.targetUri)&&(h.is(t.targetSelectionRange)||nt.undefined(t.targetSelectionRange))&&(h.is(t.originSelectionRange)||nt.undefined(t.originSelectionRange))},(_=b||(b={})).create=function(e,t,n,r){return{red:e,green:t,blue:n,alpha:r}},_.is=function(e){var t=e;return nt.numberRange(t.red,0,1)&&nt.numberRange(t.green,0,1)&&nt.numberRange(t.blue,0,1)&&nt.numberRange(t.alpha,0,1)},(C=w||(w={})).create=function(e,t){return{range:e,color:t}},C.is=function(e){var t=e;return h.is(t.range)&&b.is(t.color)},(E=y||(y={})).create=function(e,t,n){return{label:e,textEdit:t,additionalTextEdits:n}},E.is=function(e){var t=e;return nt.string(t.label)&&(nt.undefined(t.textEdit)||U.is(t))&&(nt.undefined(t.additionalTextEdits)||nt.typedArray(t.additionalTextEdits,U.is))},(x=A||(A={})).Comment="comment",x.Imports="imports",x.Region="region",(S=I||(I={})).create=function(e,t,n,r,i){var o={startLine:e,endLine:t};return nt.defined(n)&&(o.startCharacter=n),nt.defined(r)&&(o.endCharacter=r),nt.defined(i)&&(o.kind=i),o},S.is=function(e){var t=e;return nt.uinteger(t.startLine)&&nt.uinteger(t.startLine)&&(nt.undefined(t.startCharacter)||nt.uinteger(t.startCharacter))&&(nt.undefined(t.endCharacter)||nt.uinteger(t.endCharacter))&&(nt.undefined(t.kind)||nt.string(t.kind))},(R=T||(T={})).create=function(e,t){return{location:e,message:t}},R.is=function(e){var t=e;return nt.defined(t)&&p.is(t.location)&&nt.string(t.message)},(P=D||(D={})).Error=1,P.Warning=2,P.Information=3,P.Hint=4,(j=M||(M={})).Unnecessary=1,j.Deprecated=2,(L||(L={})).is=function(e){var t=e;return null!=t&&nt.string(t.href)},(O=F||(F={})).create=function(e,t,n,r,i,o){var a={range:e,message:t};return nt.defined(n)&&(a.severity=n),nt.defined(r)&&(a.code=r),nt.defined(i)&&(a.source=i),nt.defined(o)&&(a.relatedInformation=o),a},O.is=function(e){var t,n=e;return nt.defined(n)&&h.is(n.range)&&nt.string(n.message)&&(nt.number(n.severity)||nt.undefined(n.severity))&&(nt.integer(n.code)||nt.string(n.code)||nt.undefined(n.code))&&(nt.undefined(n.codeDescription)||nt.string(null===(t=n.codeDescription)||void 0===t?void 0:t.href))&&(nt.string(n.source)||nt.undefined(n.source))&&(nt.undefined(n.relatedInformation)||nt.typedArray(n.relatedInformation,T.is))},(W=N||(N={})).create=function(e,t){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];var i={title:e,command:t};return nt.defined(n)&&n.length>0&&(i.arguments=n),i},W.is=function(e){var t=e;return nt.defined(t)&&nt.string(t.title)&&nt.string(t.command)},(V=U||(U={})).replace=function(e,t){return{range:e,newText:t}},V.insert=function(e,t){return{range:{start:e,end:e},newText:t}},V.del=function(e){return{range:e,newText:""}},V.is=function(e){var t=e;return nt.objectLiteral(t)&&nt.string(t.newText)&&h.is(t.range)},(K=H||(H={})).create=function(e,t,n){var r={label:e};return void 0!==t&&(r.needsConfirmation=t),void 0!==n&&(r.description=n),r},K.is=function(e){var t=e;return void 0!==t&&nt.objectLiteral(t)&&nt.string(t.label)&&(nt.boolean(t.needsConfirmation)||void 0===t.needsConfirmation)&&(nt.string(t.description)||void 0===t.description)},(z||(z={})).is=function(e){return"string"==typeof e},(X=q||(q={})).replace=function(e,t,n){return{range:e,newText:t,annotationId:n}},X.insert=function(e,t,n){return{range:{start:e,end:e},newText:t,annotationId:n}},X.del=function(e,t){return{range:e,newText:"",annotationId:t}},X.is=function(e){var t=e;return U.is(t)&&(H.is(t.annotationId)||z.is(t.annotationId))},($=B||(B={})).create=function(e,t){return{textDocument:e,edits:t}},$.is=function(e){var t=e;return nt.defined(t)&&se.is(t.textDocument)&&Array.isArray(t.edits)},(Q=J||(J={})).create=function(e,t,n){var r={kind:"create",uri:e};return void 0===t||void 0===t.overwrite&&void 0===t.ignoreIfExists||(r.options=t),void 0!==n&&(r.annotationId=n),r},Q.is=function(e){var t=e;return t&&"create"===t.kind&&nt.string(t.uri)&&(void 0===t.options||(void 0===t.options.overwrite||nt.boolean(t.options.overwrite))&&(void 0===t.options.ignoreIfExists||nt.boolean(t.options.ignoreIfExists)))&&(void 0===t.annotationId||z.is(t.annotationId))},(Y=G||(G={})).create=function(e,t,n,r){var i={kind:"rename",oldUri:e,newUri:t};return void 0===n||void 0===n.overwrite&&void 0===n.ignoreIfExists||(i.options=n),void 0!==r&&(i.annotationId=r),i},Y.is=function(e){var t=e;return t&&"rename"===t.kind&&nt.string(t.oldUri)&&nt.string(t.newUri)&&(void 0===t.options||(void 0===t.options.overwrite||nt.boolean(t.options.overwrite))&&(void 0===t.options.ignoreIfExists||nt.boolean(t.options.ignoreIfExists)))&&(void 0===t.annotationId||z.is(t.annotationId))},(ee=Z||(Z={})).create=function(e,t,n){var r={kind:"delete",uri:e};return void 0===t||void 0===t.recursive&&void 0===t.ignoreIfNotExists||(r.options=t),void 0!==n&&(r.annotationId=n),r},ee.is=function(e){var t=e;return t&&"delete"===t.kind&&nt.string(t.uri)&&(void 0===t.options||(void 0===t.options.recursive||nt.boolean(t.options.recursive))&&(void 0===t.options.ignoreIfNotExists||nt.boolean(t.options.ignoreIfNotExists)))&&(void 0===t.annotationId||z.is(t.annotationId))},(te||(te={})).is=function(e){var t=e;return t&&(void 0!==t.changes||void 0!==t.documentChanges)&&(void 0===t.documentChanges||t.documentChanges.every((function(e){return nt.string(e.kind)?J.is(e)||G.is(e)||Z.is(e):B.is(e)})))};var re,ie,oe,ae,se,ce,ue,de,ge,le,he,fe,pe,me,ve,ke,be,_e,we,Ce,ye,Ee,Ae,xe,Ie,Se,Te,Re,De,Pe,Me,je,Le,Fe,Oe,Ne,We,Ue,Ve,He,Ke,ze,qe,Xe,Be,$e,Je,Qe,Ge,Ye,Ze,et=function(){function e(e,t){this.edits=e,this.changeAnnotations=t}return e.prototype.insert=function(e,t,n){var r,i;if(void 0===n?r=U.insert(e,t):z.is(n)?(i=n,r=q.insert(e,t,n)):(this.assertChangeAnnotations(this.changeAnnotations),i=this.changeAnnotations.manage(n),r=q.insert(e,t,i)),this.edits.push(r),void 0!==i)return i},e.prototype.replace=function(e,t,n){var r,i;if(void 0===n?r=U.replace(e,t):z.is(n)?(i=n,r=q.replace(e,t,n)):(this.assertChangeAnnotations(this.changeAnnotations),i=this.changeAnnotations.manage(n),r=q.replace(e,t,i)),this.edits.push(r),void 0!==i)return i},e.prototype.delete=function(e,t){var n,r;if(void 0===t?n=U.del(e):z.is(t)?(r=t,n=q.del(e,t)):(this.assertChangeAnnotations(this.changeAnnotations),r=this.changeAnnotations.manage(t),n=q.del(e,r)),this.edits.push(n),void 0!==r)return r},e.prototype.add=function(e){this.edits.push(e)},e.prototype.all=function(){return this.edits},e.prototype.clear=function(){this.edits.splice(0,this.edits.length)},e.prototype.assertChangeAnnotations=function(e){if(void 0===e)throw new Error("Text edit change is not configured to manage change annotations.")},e}(),tt=function(){function e(e){this._annotations=void 0===e?Object.create(null):e,this._counter=0,this._size=0}return e.prototype.all=function(){return this._annotations},Object.defineProperty(e.prototype,"size",{get:function(){return this._size},enumerable:!1,configurable:!0}),e.prototype.manage=function(e,t){var n;if(z.is(e)?n=e:(n=this.nextId(),t=e),void 0!==this._annotations[n])throw new Error("Id "+n+" is already in use.");if(void 0===t)throw new Error("No annotation provided for id "+n);return this._annotations[n]=t,this._size++,n},e.prototype.nextId=function(){return this._counter++,this._counter.toString()},e}();!function(){function e(e){var t=this;this._textEditChanges=Object.create(null),void 0!==e?(this._workspaceEdit=e,e.documentChanges?(this._changeAnnotations=new tt(e.changeAnnotations),e.changeAnnotations=this._changeAnnotations.all(),e.documentChanges.forEach((function(e){if(B.is(e)){var n=new et(e.edits,t._changeAnnotations);t._textEditChanges[e.textDocument.uri]=n}}))):e.changes&&Object.keys(e.changes).forEach((function(n){var r=new et(e.changes[n]);t._textEditChanges[n]=r}))):this._workspaceEdit={}}Object.defineProperty(e.prototype,"edit",{get:function(){return this.initDocumentChanges(),void 0!==this._changeAnnotations&&(0===this._changeAnnotations.size?this._workspaceEdit.changeAnnotations=void 0:this._workspaceEdit.changeAnnotations=this._changeAnnotations.all()),this._workspaceEdit},enumerable:!1,configurable:!0}),e.prototype.getTextEditChange=function(e){if(se.is(e)){if(this.initDocumentChanges(),void 0===this._workspaceEdit.documentChanges)throw new Error("Workspace edit is not configured for document changes.");var t={uri:e.uri,version:e.version};if(!(r=this._textEditChanges[t.uri])){var n={textDocument:t,edits:i=[]};this._workspaceEdit.documentChanges.push(n),r=new et(i,this._changeAnnotations),this._textEditChanges[t.uri]=r}return r}if(this.initChanges(),void 0===this._workspaceEdit.changes)throw new Error("Workspace edit is not configured for normal text edit changes.");var r;if(!(r=this._textEditChanges[e])){var i=[];this._workspaceEdit.changes[e]=i,r=new et(i),this._textEditChanges[e]=r}return r},e.prototype.initDocumentChanges=function(){void 0===this._workspaceEdit.documentChanges&&void 0===this._workspaceEdit.changes&&(this._changeAnnotations=new tt,this._workspaceEdit.documentChanges=[],this._workspaceEdit.changeAnnotations=this._changeAnnotations.all())},e.prototype.initChanges=function(){void 0===this._workspaceEdit.documentChanges&&void 0===this._workspaceEdit.changes&&(this._workspaceEdit.changes=Object.create(null))},e.prototype.createFile=function(e,t,n){if(this.initDocumentChanges(),void 0===this._workspaceEdit.documentChanges)throw new Error("Workspace edit is not configured for document changes.");var r,i,o;if(H.is(t)||z.is(t)?r=t:n=t,void 0===r?i=J.create(e,n):(o=z.is(r)?r:this._changeAnnotations.manage(r),i=J.create(e,n,o)),this._workspaceEdit.documentChanges.push(i),void 0!==o)return o},e.prototype.renameFile=function(e,t,n,r){if(this.initDocumentChanges(),void 0===this._workspaceEdit.documentChanges)throw new Error("Workspace edit is not configured for document changes.");var i,o,a;if(H.is(n)||z.is(n)?i=n:r=n,void 0===i?o=G.create(e,t,r):(a=z.is(i)?i:this._changeAnnotations.manage(i),o=G.create(e,t,r,a)),this._workspaceEdit.documentChanges.push(o),void 0!==a)return a},e.prototype.deleteFile=function(e,t,n){if(this.initDocumentChanges(),void 0===this._workspaceEdit.documentChanges)throw new Error("Workspace edit is not configured for document changes.");var r,i,o;if(H.is(t)||z.is(t)?r=t:n=t,void 0===r?i=Z.create(e,n):(o=z.is(r)?r:this._changeAnnotations.manage(r),i=Z.create(e,n,o)),this._workspaceEdit.documentChanges.push(i),void 0!==o)return o}}(),(ie=re||(re={})).create=function(e){return{uri:e}},ie.is=function(e){var t=e;return nt.defined(t)&&nt.string(t.uri)},(ae=oe||(oe={})).create=function(e,t){return{uri:e,version:t}},ae.is=function(e){var t=e;return nt.defined(t)&&nt.string(t.uri)&&nt.integer(t.version)},(ce=se||(se={})).create=function(e,t){return{uri:e,version:t}},ce.is=function(e){var t=e;return nt.defined(t)&&nt.string(t.uri)&&(null===t.version||nt.integer(t.version))},(de=ue||(ue={})).create=function(e,t,n,r){return{uri:e,languageId:t,version:n,text:r}},de.is=function(e){var t=e;return nt.defined(t)&&nt.string(t.uri)&&nt.string(t.languageId)&&nt.integer(t.version)&&nt.string(t.text)},(le=ge||(ge={})).PlainText="plaintext",le.Markdown="markdown",function(e){e.is=function(t){var n=t;return n===e.PlainText||n===e.Markdown}}(ge||(ge={})),(he||(he={})).is=function(e){var t=e;return nt.objectLiteral(e)&&ge.is(t.kind)&&nt.string(t.value)},(pe=fe||(fe={})).Text=1,pe.Method=2,pe.Function=3,pe.Constructor=4,pe.Field=5,pe.Variable=6,pe.Class=7,pe.Interface=8,pe.Module=9,pe.Property=10,pe.Unit=11,pe.Value=12,pe.Enum=13,pe.Keyword=14,pe.Snippet=15,pe.Color=16,pe.File=17,pe.Reference=18,pe.Folder=19,pe.EnumMember=20,pe.Constant=21,pe.Struct=22,pe.Event=23,pe.Operator=24,pe.TypeParameter=25,(ve=me||(me={})).PlainText=1,ve.Snippet=2,(ke||(ke={})).Deprecated=1,(_e=be||(be={})).create=function(e,t,n){return{newText:e,insert:t,replace:n}},_e.is=function(e){var t=e;return t&&nt.string(t.newText)&&h.is(t.insert)&&h.is(t.replace)},(Ce=we||(we={})).asIs=1,Ce.adjustIndentation=2,(ye||(ye={})).create=function(e){return{label:e}},(Ee||(Ee={})).create=function(e,t){return{items:e||[],isIncomplete:!!t}},(xe=Ae||(Ae={})).fromPlainText=function(e){return e.replace(/[\\`*_{}[\]()#+\-.!]/g,"\\$&")},xe.is=function(e){var t=e;return nt.string(t)||nt.objectLiteral(t)&&nt.string(t.language)&&nt.string(t.value)},(Ie||(Ie={})).is=function(e){var t=e;return!!t&&nt.objectLiteral(t)&&(he.is(t.contents)||Ae.is(t.contents)||nt.typedArray(t.contents,Ae.is))&&(void 0===e.range||h.is(e.range))},(Se||(Se={})).create=function(e,t){return t?{label:e,documentation:t}:{label:e}},(Te||(Te={})).create=function(e,t){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];var i={label:e};return nt.defined(t)&&(i.documentation=t),nt.defined(n)?i.parameters=n:i.parameters=[],i},(De=Re||(Re={})).Text=1,De.Read=2,De.Write=3,(Pe||(Pe={})).create=function(e,t){var n={range:e};return nt.number(t)&&(n.kind=t),n},(je=Me||(Me={})).File=1,je.Module=2,je.Namespace=3,je.Package=4,je.Class=5,je.Method=6,je.Property=7,je.Field=8,je.Constructor=9,je.Enum=10,je.Interface=11,je.Function=12,je.Variable=13,je.Constant=14,je.String=15,je.Number=16,je.Boolean=17,je.Array=18,je.Object=19,je.Key=20,je.Null=21,je.EnumMember=22,je.Struct=23,je.Event=24,je.Operator=25,je.TypeParameter=26,(Le||(Le={})).Deprecated=1,(Fe||(Fe={})).create=function(e,t,n,r,i){var o={name:e,kind:t,location:{uri:r,range:n}};return i&&(o.containerName=i),o},(Ne=Oe||(Oe={})).create=function(e,t,n,r,i,o){var a={name:e,detail:t,kind:n,range:r,selectionRange:i};return void 0!==o&&(a.children=o),a},Ne.is=function(e){var t=e;return t&&nt.string(t.name)&&nt.number(t.kind)&&h.is(t.range)&&h.is(t.selectionRange)&&(void 0===t.detail||nt.string(t.detail))&&(void 0===t.deprecated||nt.boolean(t.deprecated))&&(void 0===t.children||Array.isArray(t.children))&&(void 0===t.tags||Array.isArray(t.tags))},(Ue=We||(We={})).Empty="",Ue.QuickFix="quickfix",Ue.Refactor="refactor",Ue.RefactorExtract="refactor.extract",Ue.RefactorInline="refactor.inline",Ue.RefactorRewrite="refactor.rewrite",Ue.Source="source",Ue.SourceOrganizeImports="source.organizeImports",Ue.SourceFixAll="source.fixAll",(He=Ve||(Ve={})).create=function(e,t){var n={diagnostics:e};return null!=t&&(n.only=t),n},He.is=function(e){var t=e;return nt.defined(t)&&nt.typedArray(t.diagnostics,F.is)&&(void 0===t.only||nt.typedArray(t.only,nt.string))},(ze=Ke||(Ke={})).create=function(e,t,n){var r={title:e},i=!0;return"string"==typeof t?(i=!1,r.kind=t):N.is(t)?r.command=t:r.edit=t,i&&void 0!==n&&(r.kind=n),r},ze.is=function(e){var t=e;return t&&nt.string(t.title)&&(void 0===t.diagnostics||nt.typedArray(t.diagnostics,F.is))&&(void 0===t.kind||nt.string(t.kind))&&(void 0!==t.edit||void 0!==t.command)&&(void 0===t.command||N.is(t.command))&&(void 0===t.isPreferred||nt.boolean(t.isPreferred))&&(void 0===t.edit||te.is(t.edit))},(Xe=qe||(qe={})).create=function(e,t){var n={range:e};return nt.defined(t)&&(n.data=t),n},Xe.is=function(e){var t=e;return nt.defined(t)&&h.is(t.range)&&(nt.undefined(t.command)||N.is(t.command))},($e=Be||(Be={})).create=function(e,t){return{tabSize:e,insertSpaces:t}},$e.is=function(e){var t=e;return nt.defined(t)&&nt.uinteger(t.tabSize)&&nt.boolean(t.insertSpaces)},(Qe=Je||(Je={})).create=function(e,t,n){return{range:e,target:t,data:n}},Qe.is=function(e){var t=e;return nt.defined(t)&&h.is(t.range)&&(nt.undefined(t.target)||nt.string(t.target))},(Ye=Ge||(Ge={})).create=function(e,t){return{range:e,parent:t}},Ye.is=function(e){var t=e;return void 0!==t&&h.is(t.range)&&(void 0===t.parent||Ye.is(t.parent))},function(e){function t(e,n){if(e.length<=1)return e;var r=e.length/2|0,i=e.slice(0,r),o=e.slice(r);t(i,n),t(o,n);for(var a=0,s=0,c=0;a<i.length&&s<o.length;){var u=n(i[a],o[s]);e[c++]=u<=0?i[a++]:o[s++]}for(;a<i.length;)e[c++]=i[a++];for(;s<o.length;)e[c++]=o[s++];return e}e.create=function(e,t,n,r){return new ot(e,t,n,r)},e.is=function(e){var t=e;return!!(nt.defined(t)&&nt.string(t.uri)&&(nt.undefined(t.languageId)||nt.string(t.languageId))&&nt.uinteger(t.lineCount)&&nt.func(t.getText)&&nt.func(t.positionAt)&&nt.func(t.offsetAt))},e.applyEdits=function(e,n){for(var r=e.getText(),i=t(n,(function(e,t){var n=e.range.start.line-t.range.start.line;return 0===n?e.range.start.character-t.range.start.character:n})),o=r.length,a=i.length-1;a>=0;a--){var s=i[a],c=e.offsetAt(s.range.start),u=e.offsetAt(s.range.end);if(!(u<=o))throw new Error("Overlapping edit");r=r.substring(0,c)+s.newText+r.substring(u,r.length),o=c}return r}}(Ze||(Ze={}));var nt,rt,it,ot=function(){function e(e,t,n,r){this._uri=e,this._languageId=t,this._version=n,this._content=r,this._lineOffsets=void 0}return Object.defineProperty(e.prototype,"uri",{get:function(){return this._uri},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"languageId",{get:function(){return this._languageId},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"version",{get:function(){return this._version},enumerable:!1,configurable:!0}),e.prototype.getText=function(e){if(e){var t=this.offsetAt(e.start),n=this.offsetAt(e.end);return this._content.substring(t,n)}return this._content},e.prototype.update=function(e,t){this._content=e.text,this._version=t,this._lineOffsets=void 0},e.prototype.getLineOffsets=function(){if(void 0===this._lineOffsets){for(var e=[],t=this._content,n=!0,r=0;r<t.length;r++){n&&(e.push(r),n=!1);var i=t.charAt(r);n="\r"===i||"\n"===i,"\r"===i&&r+1<t.length&&"\n"===t.charAt(r+1)&&r++}n&&t.length>0&&e.push(t.length),this._lineOffsets=e}return this._lineOffsets},e.prototype.positionAt=function(e){e=Math.max(Math.min(e,this._content.length),0);var t=this.getLineOffsets(),n=0,r=t.length;if(0===r)return g.create(0,e);for(;n<r;){var i=Math.floor((n+r)/2);t[i]>e?r=i:n=i+1}var o=n-1;return g.create(o,e-t[o])},e.prototype.offsetAt=function(e){var t=this.getLineOffsets();if(e.line>=t.length)return this._content.length;if(e.line<0)return 0;var n=t[e.line],r=e.line+1<t.length?t[e.line+1]:this._content.length;return Math.max(Math.min(n+e.character,r),n)},Object.defineProperty(e.prototype,"lineCount",{get:function(){return this.getLineOffsets().length},enumerable:!1,configurable:!0}),e}();rt=nt||(nt={}),it=Object.prototype.toString,rt.defined=function(e){return void 0!==e},rt.undefined=function(e){return void 0===e},rt.boolean=function(e){return!0===e||!1===e},rt.string=function(e){return"[object String]"===it.call(e)},rt.number=function(e){return"[object Number]"===it.call(e)},rt.numberRange=function(e,t,n){return"[object Number]"===it.call(e)&&t<=e&&e<=n},rt.integer=function(e){return"[object Number]"===it.call(e)&&-2147483648<=e&&e<=2147483647},rt.uinteger=function(e){return"[object Number]"===it.call(e)&&0<=e&&e<=2147483647},rt.func=function(e){return"[object Function]"===it.call(e)},rt.objectLiteral=function(e){return null!==e&&"object"==typeof e},rt.typedArray=function(e,t){return Array.isArray(e)&&e.every(t)};var at=e("DiagnosticsAdapter",class{constructor(e,t,n){this._languageId=e,this._worker=t,this._disposables=[],this._listener=Object.create(null);const r=e=>{let t,n=e.getLanguageId();n===this._languageId&&(this._listener[e.uri.toString()]=e.onDidChangeContent((()=>{window.clearTimeout(t),t=window.setTimeout((()=>this._doValidate(e.uri,n)),500)})),this._doValidate(e.uri,n))},i=e=>{a.editor.setModelMarkers(e,this._languageId,[]);let t=e.uri.toString(),n=this._listener[t];n&&(n.dispose(),delete this._listener[t])};this._disposables.push(a.editor.onDidCreateModel(r)),this._disposables.push(a.editor.onWillDisposeModel(i)),this._disposables.push(a.editor.onDidChangeModelLanguage((e=>{i(e.model),r(e.model)}))),this._disposables.push(n((e=>{a.editor.getModels().forEach((e=>{e.getLanguageId()===this._languageId&&(i(e),r(e))}))}))),this._disposables.push({dispose:()=>{a.editor.getModels().forEach(i);for(let e in this._listener)this._listener[e].dispose()}}),a.editor.getModels().forEach(r)}dispose(){this._disposables.forEach((e=>e&&e.dispose())),this._disposables.length=0}_doValidate(e,t){this._worker(e).then((t=>t.doValidation(e.toString()))).then((n=>{const r=n.map((e=>function(e,t){let n="number"==typeof t.code?String(t.code):t.code;return{severity:st(t.severity),startLineNumber:t.range.start.line+1,startColumn:t.range.start.character+1,endLineNumber:t.range.end.line+1,endColumn:t.range.end.character+1,message:t.message,code:n,source:t.source}}(0,e)));let i=a.editor.getModel(e);i&&i.getLanguageId()===t&&a.editor.setModelMarkers(i,t,r)})).then(void 0,(e=>{console.error(e)}))}});function st(e){switch(e){case D.Error:return a.MarkerSeverity.Error;case D.Warning:return a.MarkerSeverity.Warning;case D.Information:return a.MarkerSeverity.Info;case D.Hint:return a.MarkerSeverity.Hint;default:return a.MarkerSeverity.Info}}var ct=e("CompletionAdapter",class{constructor(e,t){this._worker=e,this._triggerCharacters=t}get triggerCharacters(){return this._triggerCharacters}provideCompletionItems(e,t,n,r){const i=e.uri;return this._worker(i).then((e=>e.doComplete(i.toString(),ut(t)))).then((n=>{if(!n)return;const r=e.getWordUntilPosition(t),i=new a.Range(t.lineNumber,r.startColumn,t.lineNumber,r.endColumn),o=n.items.map((e=>{const t={label:e.label,insertText:e.insertText||e.label,sortText:e.sortText,filterText:e.filterText,documentation:e.documentation,detail:e.detail,command:(n=e.command,n&&"editor.action.triggerSuggest"===n.command?{id:n.command,title:n.title,arguments:n.arguments}:void 0),range:i,kind:lt(e.kind)};var n,r;return e.textEdit&&(void 0!==(r=e.textEdit).insert&&void 0!==r.replace?t.range={insert:gt(e.textEdit.insert),replace:gt(e.textEdit.replace)}:t.range=gt(e.textEdit.range),t.insertText=e.textEdit.newText),e.additionalTextEdits&&(t.additionalTextEdits=e.additionalTextEdits.map(ht)),e.insertTextFormat===me.Snippet&&(t.insertTextRules=a.languages.CompletionItemInsertTextRule.InsertAsSnippet),t}));return{isIncomplete:n.isIncomplete,suggestions:o}}))}});function ut(e){if(e)return{character:e.column-1,line:e.lineNumber-1}}function dt(e){if(e)return{start:{line:e.startLineNumber-1,character:e.startColumn-1},end:{line:e.endLineNumber-1,character:e.endColumn-1}}}function gt(e){if(e)return new a.Range(e.start.line+1,e.start.character+1,e.end.line+1,e.end.character+1)}function lt(e){const t=a.languages.CompletionItemKind;switch(e){case fe.Text:return t.Text;case fe.Method:return t.Method;case fe.Function:return t.Function;case fe.Constructor:return t.Constructor;case fe.Field:return t.Field;case fe.Variable:return t.Variable;case fe.Class:return t.Class;case fe.Interface:return t.Interface;case fe.Module:return t.Module;case fe.Property:return t.Property;case fe.Unit:return t.Unit;case fe.Value:return t.Value;case fe.Enum:return t.Enum;case fe.Keyword:return t.Keyword;case fe.Snippet:return t.Snippet;case fe.Color:return t.Color;case fe.File:return t.File;case fe.Reference:return t.Reference}return t.Property}function ht(e){if(e)return{range:gt(e.range),text:e.newText}}var ft=e("HoverAdapter",class{constructor(e){this._worker=e}provideHover(e,t,n){let r=e.uri;return this._worker(r).then((e=>e.doHover(r.toString(),ut(t)))).then((e=>{if(e)return{range:gt(e.range),contents:mt(e.contents)}}))}});function pt(e){return"string"==typeof e?{value:e}:(t=e)&&"object"==typeof t&&"string"==typeof t.kind?"plaintext"===e.kind?{value:e.value.replace(/[\\`*_{}[\]()#+\-.!]/g,"\\$&")}:{value:e.value}:{value:"```"+e.language+"\n"+e.value+"\n```\n"};var t}function mt(e){if(e)return Array.isArray(e)?e.map(pt):[pt(e)]}function vt(e){switch(e){case Re.Read:return a.languages.DocumentHighlightKind.Read;case Re.Write:return a.languages.DocumentHighlightKind.Write;case Re.Text:return a.languages.DocumentHighlightKind.Text}return a.languages.DocumentHighlightKind.Text}function kt(e){return{uri:a.Uri.parse(e.uri),range:gt(e.range)}}e("DocumentHighlightAdapter",class{constructor(e){this._worker=e}provideDocumentHighlights(e,t,n){const r=e.uri;return this._worker(r).then((e=>e.findDocumentHighlights(r.toString(),ut(t)))).then((e=>{if(e)return e.map((e=>({range:gt(e.range),kind:vt(e.kind)})))}))}}),e("DefinitionAdapter",class{constructor(e){this._worker=e}provideDefinition(e,t,n){const r=e.uri;return this._worker(r).then((e=>e.findDefinition(r.toString(),ut(t)))).then((e=>{if(e)return[kt(e)]}))}}),e("ReferenceAdapter",class{constructor(e){this._worker=e}provideReferences(e,t,n,r){const i=e.uri;return this._worker(i).then((e=>e.findReferences(i.toString(),ut(t)))).then((e=>{if(e)return e.map(kt)}))}}),e("RenameAdapter",class{constructor(e){this._worker=e}provideRenameEdits(e,t,n,r){const i=e.uri;return this._worker(i).then((e=>e.doRename(i.toString(),ut(t),n))).then((e=>function(e){if(!e||!e.changes)return;let t=[];for(let n in e.changes){const r=a.Uri.parse(n);for(let i of e.changes[n])t.push({resource:r,versionId:void 0,textEdit:{range:gt(i.range),text:i.newText}})}return{edits:t}}(e)))}});var bt=e("DocumentSymbolAdapter",class{constructor(e){this._worker=e}provideDocumentSymbols(e,t){const n=e.uri;return this._worker(n).then((e=>e.findDocumentSymbols(n.toString()))).then((e=>{if(e)return e.map((e=>"children"in e?_t(e):{name:e.name,detail:"",containerName:e.containerName,kind:wt(e.kind),range:gt(e.location.range),selectionRange:gt(e.location.range),tags:[]}))}))}});function _t(e){return{name:e.name,detail:e.detail??"",kind:wt(e.kind),range:gt(e.range),selectionRange:gt(e.selectionRange),tags:e.tags??[],children:(e.children??[]).map((e=>_t(e)))}}function wt(e){let t=a.languages.SymbolKind;switch(e){case Me.File:return t.File;case Me.Module:return t.Module;case Me.Namespace:return t.Namespace;case Me.Package:return t.Package;case Me.Class:return t.Class;case Me.Method:return t.Method;case Me.Property:return t.Property;case Me.Field:return t.Field;case Me.Constructor:return t.Constructor;case Me.Enum:return t.Enum;case Me.Interface:return t.Interface;case Me.Function:return t.Function;case Me.Variable:return t.Variable;case Me.Constant:return t.Constant;case Me.String:return t.String;case Me.Number:return t.Number;case Me.Boolean:return t.Boolean;case Me.Array:return t.Array}return t.Function}e("DocumentLinkAdapter",class{constructor(e){this._worker=e}provideLinks(e,t){const n=e.uri;return this._worker(n).then((e=>e.findDocumentLinks(n.toString()))).then((e=>{if(e)return{links:e.map((e=>({range:gt(e.range),url:e.target})))}}))}});var Ct=e("DocumentFormattingEditProvider",class{constructor(e){this._worker=e}provideDocumentFormattingEdits(e,t,n){const r=e.uri;return this._worker(r).then((e=>e.format(r.toString(),null,Et(t)).then((e=>{if(e&&0!==e.length)return e.map(ht)}))))}}),yt=e("DocumentRangeFormattingEditProvider",class{constructor(e){this._worker=e,this.canFormatMultipleRanges=!1}provideDocumentRangeFormattingEdits(e,t,n,r){const i=e.uri;return this._worker(i).then((e=>e.format(i.toString(),dt(t),Et(n)).then((e=>{if(e&&0!==e.length)return e.map(ht)}))))}});function Et(e){return{tabSize:e.tabSize,insertSpaces:e.insertSpaces}}var At,xt=e("DocumentColorAdapter",class{constructor(e){this._worker=e}provideDocumentColors(e,t){const n=e.uri;return this._worker(n).then((e=>e.findDocumentColors(n.toString()))).then((e=>{if(e)return e.map((e=>({color:e.color,range:gt(e.range)})))}))}provideColorPresentations(e,t,n){const r=e.uri;return this._worker(r).then((e=>e.getColorPresentations(r.toString(),t.color,dt(t.range)))).then((e=>{if(e)return e.map((e=>{let t={label:e.label};return e.textEdit&&(t.textEdit=ht(e.textEdit)),e.additionalTextEdits&&(t.additionalTextEdits=e.additionalTextEdits.map(ht)),t}))}))}}),It=e("FoldingRangeAdapter",class{constructor(e){this._worker=e}provideFoldingRanges(e,t,n){const r=e.uri;return this._worker(r).then((e=>e.getFoldingRanges(r.toString(),t))).then((e=>{if(e)return e.map((e=>{const t={start:e.startLine+1,end:e.endLine+1};return void 0!==e.kind&&(t.kind=function(e){switch(e){case A.Comment:return a.languages.FoldingRangeKind.Comment;case A.Imports:return a.languages.FoldingRangeKind.Imports;case A.Region:return a.languages.FoldingRangeKind.Region}}(e.kind)),t}))}))}}),St=e("SelectionRangeAdapter",class{constructor(e){this._worker=e}provideSelectionRanges(e,t,n){const r=e.uri;return this._worker(r).then((e=>e.getSelectionRanges(r.toString(),t.map(ut)))).then((e=>{if(e)return e.map((e=>{const t=[];for(;e;)t.push({range:gt(e.range)}),e=e.parent;return t}))}))}});function Tt(e){return 32===e||9===e||11===e||12===e||160===e||5760===e||e>=8192&&e<=8203||8239===e||8287===e||12288===e||65279===e}function Rt(e){return 10===e||13===e||8232===e||8233===e}function Dt(e){return e>=48&&e<=57}(At||(At={})).DEFAULT={allowTrailingComma:!1};var Pt,Mt=function(e,t){void 0===t&&(t=!1);var n=e.length,r=0,i="",o=0,a=16,s=0,c=0,u=0,d=0,g=0;function l(t,n){for(var i=0,o=0;i<t;){var a=e.charCodeAt(r);if(a>=48&&a<=57)o=16*o+a-48;else if(a>=65&&a<=70)o=16*o+a-65+10;else{if(!(a>=97&&a<=102))break;o=16*o+a-97+10}r++,i++}return i<t&&(o=-1),o}function h(){if(i="",g=0,o=r,c=s,d=u,r>=n)return o=n,a=17;var t=e.charCodeAt(r);if(Tt(t)){do{r++,i+=String.fromCharCode(t),t=e.charCodeAt(r)}while(Tt(t));return a=15}if(Rt(t))return r++,i+=String.fromCharCode(t),13===t&&10===e.charCodeAt(r)&&(r++,i+="\n"),s++,u=r,a=14;switch(t){case 123:return r++,a=1;case 125:return r++,a=2;case 91:return r++,a=3;case 93:return r++,a=4;case 58:return r++,a=6;case 44:return r++,a=5;case 34:return r++,i=function(){for(var t="",i=r;;){if(r>=n){t+=e.substring(i,r),g=2;break}var o=e.charCodeAt(r);if(34===o){t+=e.substring(i,r),r++;break}if(92!==o){if(o>=0&&o<=31){if(Rt(o)){t+=e.substring(i,r),g=2;break}g=6}r++}else{if(t+=e.substring(i,r),++r>=n){g=2;break}switch(e.charCodeAt(r++)){case 34:t+='"';break;case 92:t+="\\";break;case 47:t+="/";break;case 98:t+="\b";break;case 102:t+="\f";break;case 110:t+="\n";break;case 114:t+="\r";break;case 116:t+="\t";break;case 117:var a=l(4);a>=0?t+=String.fromCharCode(a):g=4;break;default:g=5}i=r}}return t}(),a=10;case 47:var h=r-1;if(47===e.charCodeAt(r+1)){for(r+=2;r<n&&!Rt(e.charCodeAt(r));)r++;return i=e.substring(h,r),a=12}if(42===e.charCodeAt(r+1)){r+=2;for(var p=n-1,m=!1;r<p;){var v=e.charCodeAt(r);if(42===v&&47===e.charCodeAt(r+1)){r+=2,m=!0;break}r++,Rt(v)&&(13===v&&10===e.charCodeAt(r)&&r++,s++,u=r)}return m||(r++,g=1),i=e.substring(h,r),a=13}return i+=String.fromCharCode(t),r++,a=16;case 45:if(i+=String.fromCharCode(t),++r===n||!Dt(e.charCodeAt(r)))return a=16;case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:return i+=function(){var t=r;if(48===e.charCodeAt(r))r++;else for(r++;r<e.length&&Dt(e.charCodeAt(r));)r++;if(r<e.length&&46===e.charCodeAt(r)){if(!(++r<e.length&&Dt(e.charCodeAt(r))))return g=3,e.substring(t,r);for(r++;r<e.length&&Dt(e.charCodeAt(r));)r++}var n=r;if(r<e.length&&(69===e.charCodeAt(r)||101===e.charCodeAt(r)))if((++r<e.length&&43===e.charCodeAt(r)||45===e.charCodeAt(r))&&r++,r<e.length&&Dt(e.charCodeAt(r))){for(r++;r<e.length&&Dt(e.charCodeAt(r));)r++;n=r}else g=3;return e.substring(t,n)}(),a=11;default:for(;r<n&&f(t);)r++,t=e.charCodeAt(r);if(o!==r){switch(i=e.substring(o,r)){case"true":return a=8;case"false":return a=9;case"null":return a=7}return a=16}return i+=String.fromCharCode(t),r++,a=16}}function f(e){if(Tt(e)||Rt(e))return!1;switch(e){case 125:case 93:case 123:case 91:case 34:case 58:case 44:case 47:return!1}return!0}return{setPosition:function(e){r=e,i="",o=0,a=16,g=0},getPosition:function(){return r},scan:t?function(){var e;do{e=h()}while(e>=12&&e<=15);return e}:h,getToken:function(){return a},getTokenValue:function(){return i},getTokenOffset:function(){return o},getTokenLength:function(){return r-o},getTokenStartLine:function(){return c},getTokenStartCharacter:function(){return o-d},getTokenError:function(){return g}}},jt="delimiter.bracket.json",Lt="delimiter.array.json",Ft="delimiter.colon.json",Ot="delimiter.comma.json",Nt="keyword.json",Wt="keyword.json",Ut="string.value.json",Vt="number.json",Ht="string.key.json",Kt="comment.block.json",zt="comment.line.json",qt=class e{constructor(e,t){this.parent=e,this.type=t}static pop(e){return e?e.parent:null}static push(t,n){return new e(t,n)}static equals(e,t){if(!e&&!t)return!0;if(!e||!t)return!1;for(;e&&t;){if(e===t)return!0;if(e.type!==t.type)return!1;e=e.parent,t=t.parent}return!0}},Xt=class e{constructor(e,t,n,r){this._state=e,this.scanError=t,this.lastWasColon=n,this.parents=r}clone(){return new e(this._state,this.scanError,this.lastWasColon,this.parents)}equals(t){return t===this||!!(t&&t instanceof e)&&this.scanError===t.scanError&&this.lastWasColon===t.lastWasColon&&qt.equals(this.parents,t.parents)}getStateData(){return this._state}setStateData(e){this._state=e}},Bt=class extends at{constructor(e,t,n){super(e,t,n.onDidChange),this._disposables.push(a.editor.onWillDisposeModel((e=>{this._resetSchema(e.uri)}))),this._disposables.push(a.editor.onDidChangeModelLanguage((e=>{this._resetSchema(e.model.uri)})))}_resetSchema(e){this._worker().then((t=>{t.resetSchema(e.toString())}))}};function $t(e){return{dispose:()=>Jt(e)}}function Jt(e){for(;e.length;)e.pop().dispose()}var Qt={wordPattern:/(-?\d*\.\d\w*)|([^\[\{\]\}\:\"\,\s]+)/g,comments:{lineComment:"//",blockComment:["/*","*/"]},brackets:[["{","}"],["[","]"]],autoClosingPairs:[{open:"{",close:"}",notIn:["string"]},{open:"[",close:"]",notIn:["string"]},{open:'"',close:'"',notIn:["string"]}]}}}}));
//# sourceMappingURL=jsonMode-legacy-BaoDLcxI.js.map
