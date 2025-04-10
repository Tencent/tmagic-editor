import{g as ne}from"./index-DUtJ1Lt-.js";import{C as re}from"./tmagic-core-fMp8xZqy.js";import{b as oe,r as ie,_ as se}from"./plugin-vueexport-helper-CcqgLIiX.js";import"./tmagic-dep-DfEzeAO0.js";var V={},Q,Bt;function ue(){return Bt||(Bt=1,Q=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then}),Q}var $={},v={},Rt;function U(){if(Rt)return v;Rt=1;let r;const o=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];return v.getSymbolSize=function(e){if(!e)throw new Error('"version" cannot be null or undefined');if(e<1||e>40)throw new Error('"version" should be in range from 1 to 40');return e*4+17},v.getSymbolTotalCodewords=function(e){return o[e]},v.getBCHDigit=function(i){let e=0;for(;i!==0;)e++,i>>>=1;return e},v.setToSJISFunction=function(e){if(typeof e!="function")throw new Error('"toSJISFunc" is not a valid function.');r=e},v.isKanjiModeEnabled=function(){return typeof r<"u"},v.toSJIS=function(e){return r(e)},v}var W={},At;function Ct(){return At||(At=1,function(r){r.L={bit:1},r.M={bit:0},r.Q={bit:3},r.H={bit:2};function o(i){if(typeof i!="string")throw new Error("Param is not a string");switch(i.toLowerCase()){case"l":case"low":return r.L;case"m":case"medium":return r.M;case"q":case"quartile":return r.Q;case"h":case"high":return r.H;default:throw new Error("Unknown EC Level: "+i)}}r.isValid=function(e){return e&&typeof e.bit<"u"&&e.bit>=0&&e.bit<4},r.from=function(e,t){if(r.isValid(e))return e;try{return o(e)}catch(n){return t}}}(W)),W}var X,It;function ae(){if(It)return X;It=1;function r(){this.buffer=[],this.length=0}return r.prototype={get:function(o){const i=Math.floor(o/8);return(this.buffer[i]>>>7-o%8&1)===1},put:function(o,i){for(let e=0;e<i;e++)this.putBit((o>>>i-e-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(o){const i=Math.floor(this.length/8);this.buffer.length<=i&&this.buffer.push(0),o&&(this.buffer[i]|=128>>>this.length%8),this.length++}},X=r,X}var Z,Nt;function ce(){if(Nt)return Z;Nt=1;function r(o){if(!o||o<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=o,this.data=new Uint8Array(o*o),this.reservedBit=new Uint8Array(o*o)}return r.prototype.set=function(o,i,e,t){const n=o*this.size+i;this.data[n]=e,t&&(this.reservedBit[n]=!0)},r.prototype.get=function(o,i){return this.data[o*this.size+i]},r.prototype.xor=function(o,i,e){this.data[o*this.size+i]^=e},r.prototype.isReserved=function(o,i){return this.reservedBit[o*this.size+i]},Z=r,Z}var x={},Tt;function le(){return Tt||(Tt=1,function(r){const o=U().getSymbolSize;r.getRowColCoords=function(e){if(e===1)return[];const t=Math.floor(e/7)+2,n=o(e),s=n===145?26:Math.ceil((n-13)/(2*t-2))*2,a=[n-7];for(let u=1;u<t-1;u++)a[u]=a[u-1]-s;return a.push(6),a.reverse()},r.getPositions=function(e){const t=[],n=r.getRowColCoords(e),s=n.length;for(let a=0;a<s;a++)for(let u=0;u<s;u++)a===0&&u===0||a===0&&u===s-1||a===s-1&&u===0||t.push([n[a],n[u]]);return t}}(x)),x}var tt={},Mt;function fe(){if(Mt)return tt;Mt=1;const r=U().getSymbolSize,o=7;return tt.getPositions=function(e){const t=r(e);return[[0,0],[t-o,0],[0,t-o]]},tt}var et={},Pt;function de(){return Pt||(Pt=1,function(r){r.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const o={N1:3,N2:3,N3:40,N4:10};r.isValid=function(t){return t!=null&&t!==""&&!isNaN(t)&&t>=0&&t<=7},r.from=function(t){return r.isValid(t)?parseInt(t,10):void 0},r.getPenaltyN1=function(t){const n=t.size;let s=0,a=0,u=0,c=null,d=null;for(let p=0;p<n;p++){a=u=0,c=d=null;for(let h=0;h<n;h++){let l=t.get(p,h);l===c?a++:(a>=5&&(s+=o.N1+(a-5)),c=l,a=1),l=t.get(h,p),l===d?u++:(u>=5&&(s+=o.N1+(u-5)),d=l,u=1)}a>=5&&(s+=o.N1+(a-5)),u>=5&&(s+=o.N1+(u-5))}return s},r.getPenaltyN2=function(t){const n=t.size;let s=0;for(let a=0;a<n-1;a++)for(let u=0;u<n-1;u++){const c=t.get(a,u)+t.get(a,u+1)+t.get(a+1,u)+t.get(a+1,u+1);(c===4||c===0)&&s++}return s*o.N2},r.getPenaltyN3=function(t){const n=t.size;let s=0,a=0,u=0;for(let c=0;c<n;c++){a=u=0;for(let d=0;d<n;d++)a=a<<1&2047|t.get(c,d),d>=10&&(a===1488||a===93)&&s++,u=u<<1&2047|t.get(d,c),d>=10&&(u===1488||u===93)&&s++}return s*o.N3},r.getPenaltyN4=function(t){let n=0;const s=t.data.length;for(let u=0;u<s;u++)n+=t.data[u];return Math.abs(Math.ceil(n*100/s/5)-10)*o.N4};function i(e,t,n){switch(e){case r.Patterns.PATTERN000:return(t+n)%2===0;case r.Patterns.PATTERN001:return t%2===0;case r.Patterns.PATTERN010:return n%3===0;case r.Patterns.PATTERN011:return(t+n)%3===0;case r.Patterns.PATTERN100:return(Math.floor(t/2)+Math.floor(n/3))%2===0;case r.Patterns.PATTERN101:return t*n%2+t*n%3===0;case r.Patterns.PATTERN110:return(t*n%2+t*n%3)%2===0;case r.Patterns.PATTERN111:return(t*n%3+(t+n)%2)%2===0;default:throw new Error("bad maskPattern:"+e)}}r.applyMask=function(t,n){const s=n.size;for(let a=0;a<s;a++)for(let u=0;u<s;u++)n.isReserved(u,a)||n.xor(u,a,i(t,u,a))},r.getBestMask=function(t,n){const s=Object.keys(r.Patterns).length;let a=0,u=1/0;for(let c=0;c<s;c++){n(c),r.applyMask(c,t);const d=r.getPenaltyN1(t)+r.getPenaltyN2(t)+r.getPenaltyN3(t)+r.getPenaltyN4(t);r.applyMask(c,t),d<u&&(u=d,a=c)}return a}}(et)),et}var J={},St;function $t(){if(St)return J;St=1;const r=Ct(),o=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],i=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];return J.getBlocksCount=function(t,n){switch(n){case r.L:return o[(t-1)*4+0];case r.M:return o[(t-1)*4+1];case r.Q:return o[(t-1)*4+2];case r.H:return o[(t-1)*4+3];default:return}},J.getTotalCodewordsCount=function(t,n){switch(n){case r.L:return i[(t-1)*4+0];case r.M:return i[(t-1)*4+1];case r.Q:return i[(t-1)*4+2];case r.H:return i[(t-1)*4+3];default:return}},J}var nt={},H={},bt;function ge(){if(bt)return H;bt=1;const r=new Uint8Array(512),o=new Uint8Array(256);return function(){let e=1;for(let t=0;t<255;t++)r[t]=e,o[e]=t,e<<=1,e&256&&(e^=285);for(let t=255;t<512;t++)r[t]=r[t-255]}(),H.log=function(e){if(e<1)throw new Error("log("+e+")");return o[e]},H.exp=function(e){return r[e]},H.mul=function(e,t){return e===0||t===0?0:r[o[e]+o[t]]},H}var Lt;function he(){return Lt||(Lt=1,function(r){const o=ge();r.mul=function(e,t){const n=new Uint8Array(e.length+t.length-1);for(let s=0;s<e.length;s++)for(let a=0;a<t.length;a++)n[s+a]^=o.mul(e[s],t[a]);return n},r.mod=function(e,t){let n=new Uint8Array(e);for(;n.length-t.length>=0;){const s=n[0];for(let u=0;u<t.length;u++)n[u]^=o.mul(t[u],s);let a=0;for(;a<n.length&&n[a]===0;)a++;n=n.slice(a)}return n},r.generateECPolynomial=function(e){let t=new Uint8Array([1]);for(let n=0;n<e;n++)t=r.mul(t,new Uint8Array([1,o.exp(n)]));return t}}(nt)),nt}var rt,Dt;function me(){if(Dt)return rt;Dt=1;const r=he();function o(i){this.genPoly=void 0,this.degree=i,this.degree&&this.initialize(this.degree)}return o.prototype.initialize=function(e){this.degree=e,this.genPoly=r.generateECPolynomial(this.degree)},o.prototype.encode=function(e){if(!this.genPoly)throw new Error("Encoder not initialized");const t=new Uint8Array(e.length+this.degree);t.set(e);const n=r.mod(t,this.genPoly),s=this.degree-n.length;if(s>0){const a=new Uint8Array(this.degree);return a.set(n,s),a}return n},rt=o,rt}var ot={},it={},st={},qt;function Wt(){return qt||(qt=1,st.isValid=function(o){return!isNaN(o)&&o>=1&&o<=40}),st}var L={},_t;function Xt(){if(_t)return L;_t=1;const r="[0-9]+",o="[A-Z $%*+\\-./:]+";let i="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";i=i.replace(/u/g,"\\u");const e="(?:(?![A-Z0-9 $%*+\\-./:]|"+i+")(?:.|[\r\n]))+";L.KANJI=new RegExp(i,"g"),L.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g"),L.BYTE=new RegExp(e,"g"),L.NUMERIC=new RegExp(r,"g"),L.ALPHANUMERIC=new RegExp(o,"g");const t=new RegExp("^"+i+"$"),n=new RegExp("^"+r+"$"),s=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");return L.testKanji=function(u){return t.test(u)},L.testNumeric=function(u){return n.test(u)},L.testAlphanumeric=function(u){return s.test(u)},L}var vt;function k(){return vt||(vt=1,function(r){const o=Wt(),i=Xt();r.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},r.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},r.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},r.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},r.MIXED={bit:-1},r.getCharCountIndicator=function(n,s){if(!n.ccBits)throw new Error("Invalid mode: "+n);if(!o.isValid(s))throw new Error("Invalid version: "+s);return s>=1&&s<10?n.ccBits[0]:s<27?n.ccBits[1]:n.ccBits[2]},r.getBestModeForData=function(n){return i.testNumeric(n)?r.NUMERIC:i.testAlphanumeric(n)?r.ALPHANUMERIC:i.testKanji(n)?r.KANJI:r.BYTE},r.toString=function(n){if(n&&n.id)return n.id;throw new Error("Invalid mode")},r.isValid=function(n){return n&&n.bit&&n.ccBits};function e(t){if(typeof t!="string")throw new Error("Param is not a string");switch(t.toLowerCase()){case"numeric":return r.NUMERIC;case"alphanumeric":return r.ALPHANUMERIC;case"kanji":return r.KANJI;case"byte":return r.BYTE;default:throw new Error("Unknown mode: "+t)}}r.from=function(n,s){if(r.isValid(n))return n;try{return e(n)}catch(a){return s}}}(it)),it}var Ut;function we(){return Ut||(Ut=1,function(r){const o=U(),i=$t(),e=Ct(),t=k(),n=Wt(),s=7973,a=o.getBCHDigit(s);function u(h,l,T){for(let M=1;M<=40;M++)if(l<=r.getCapacity(M,T,h))return M}function c(h,l){return t.getCharCountIndicator(h,l)+4}function d(h,l){let T=0;return h.forEach(function(M){const S=c(M.mode,l);T+=S+M.getBitsLength()}),T}function p(h,l){for(let T=1;T<=40;T++)if(d(h,T)<=r.getCapacity(T,l,t.MIXED))return T}r.from=function(l,T){return n.isValid(l)?parseInt(l,10):T},r.getCapacity=function(l,T,M){if(!n.isValid(l))throw new Error("Invalid QR Code version");typeof M>"u"&&(M=t.BYTE);const S=o.getSymbolTotalCodewords(l),A=i.getTotalCodewordsCount(l,T),P=(S-A)*8;if(M===t.MIXED)return P;const I=P-c(M,l);switch(M){case t.NUMERIC:return Math.floor(I/10*3);case t.ALPHANUMERIC:return Math.floor(I/11*2);case t.KANJI:return Math.floor(I/13);case t.BYTE:default:return Math.floor(I/8)}},r.getBestVersionForData=function(l,T){let M;const S=e.from(T,e.M);if(Array.isArray(l)){if(l.length>1)return p(l,S);if(l.length===0)return 1;M=l[0]}else M=l;return u(M.mode,M.getLength(),S)},r.getEncodedBits=function(l){if(!n.isValid(l)||l<7)throw new Error("Invalid QR Code version");let T=l<<12;for(;o.getBCHDigit(T)-a>=0;)T^=s<<o.getBCHDigit(T)-a;return l<<12|T}}(ot)),ot}var ut={},kt;function Ce(){if(kt)return ut;kt=1;const r=U(),o=1335,i=21522,e=r.getBCHDigit(o);return ut.getEncodedBits=function(n,s){const a=n.bit<<3|s;let u=a<<10;for(;r.getBCHDigit(u)-e>=0;)u^=o<<r.getBCHDigit(u)-e;return(a<<10|u)^i},ut}var at={},ct,Ft;function Ee(){if(Ft)return ct;Ft=1;const r=k();function o(i){this.mode=r.NUMERIC,this.data=i.toString()}return o.getBitsLength=function(e){return 10*Math.floor(e/3)+(e%3?e%3*3+1:0)},o.prototype.getLength=function(){return this.data.length},o.prototype.getBitsLength=function(){return o.getBitsLength(this.data.length)},o.prototype.write=function(e){let t,n,s;for(t=0;t+3<=this.data.length;t+=3)n=this.data.substr(t,3),s=parseInt(n,10),e.put(s,10);const a=this.data.length-t;a>0&&(n=this.data.substr(t),s=parseInt(n,10),e.put(s,a*3+1))},ct=o,ct}var lt,Vt;function ye(){if(Vt)return lt;Vt=1;const r=k(),o=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function i(e){this.mode=r.ALPHANUMERIC,this.data=e}return i.getBitsLength=function(t){return 11*Math.floor(t/2)+6*(t%2)},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(t){let n;for(n=0;n+2<=this.data.length;n+=2){let s=o.indexOf(this.data[n])*45;s+=o.indexOf(this.data[n+1]),t.put(s,11)}this.data.length%2&&t.put(o.indexOf(this.data[n]),6)},lt=i,lt}var ft,zt;function pe(){if(zt)return ft;zt=1;const r=k();function o(i){this.mode=r.BYTE,typeof i=="string"?this.data=new TextEncoder().encode(i):this.data=new Uint8Array(i)}return o.getBitsLength=function(e){return e*8},o.prototype.getLength=function(){return this.data.length},o.prototype.getBitsLength=function(){return o.getBitsLength(this.data.length)},o.prototype.write=function(i){for(let e=0,t=this.data.length;e<t;e++)i.put(this.data[e],8)},ft=o,ft}var dt,Ht;function Be(){if(Ht)return dt;Ht=1;const r=k(),o=U();function i(e){this.mode=r.KANJI,this.data=e}return i.getBitsLength=function(t){return t*13},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(e){let t;for(t=0;t<this.data.length;t++){let n=o.toSJIS(this.data[t]);if(n>=33088&&n<=40956)n-=33088;else if(n>=57408&&n<=60351)n-=49472;else throw new Error("Invalid SJIS character: "+this.data[t]+"\nMake sure your charset is UTF-8");n=(n>>>8&255)*192+(n&255),e.put(n,13)}},dt=i,dt}var gt={exports:{}},Kt;function Re(){return Kt||(Kt=1,function(r){var o={single_source_shortest_paths:function(i,e,t){var n={},s={};s[e]=0;var a=o.PriorityQueue.make();a.push(e,0);for(var u,c,d,p,h,l,T,M,S;!a.empty();){u=a.pop(),c=u.value,p=u.cost,h=i[c]||{};for(d in h)h.hasOwnProperty(d)&&(l=h[d],T=p+l,M=s[d],S=typeof s[d]>"u",(S||M>T)&&(s[d]=T,a.push(d,T),n[d]=c))}if(typeof t<"u"&&typeof s[t]>"u"){var A=["Could not find a path from ",e," to ",t,"."].join("");throw new Error(A)}return n},extract_shortest_path_from_predecessor_list:function(i,e){for(var t=[],n=e;n;)t.push(n),i[n],n=i[n];return t.reverse(),t},find_path:function(i,e,t){var n=o.single_source_shortest_paths(i,e,t);return o.extract_shortest_path_from_predecessor_list(n,t)},PriorityQueue:{make:function(i){var e=o.PriorityQueue,t={},n;i=i||{};for(n in e)e.hasOwnProperty(n)&&(t[n]=e[n]);return t.queue=[],t.sorter=i.sorter||e.default_sorter,t},default_sorter:function(i,e){return i.cost-e.cost},push:function(i,e){var t={value:i,cost:e};this.queue.push(t),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};r.exports=o}(gt)),gt.exports}var Jt;function Ae(){return Jt||(Jt=1,function(r){const o=k(),i=Ee(),e=ye(),t=pe(),n=Be(),s=Xt(),a=U(),u=Re();function c(A){return unescape(encodeURIComponent(A)).length}function d(A,P,I){const B=[];let b;for(;(b=A.exec(I))!==null;)B.push({data:b[0],index:b.index,mode:P,length:b[0].length});return B}function p(A){const P=d(s.NUMERIC,o.NUMERIC,A),I=d(s.ALPHANUMERIC,o.ALPHANUMERIC,A);let B,b;return a.isKanjiModeEnabled()?(B=d(s.BYTE,o.BYTE,A),b=d(s.KANJI,o.KANJI,A)):(B=d(s.BYTE_KANJI,o.BYTE,A),b=[]),P.concat(I,B,b).sort(function(E,C){return E.index-C.index}).map(function(E){return{data:E.data,mode:E.mode,length:E.length}})}function h(A,P){switch(P){case o.NUMERIC:return i.getBitsLength(A);case o.ALPHANUMERIC:return e.getBitsLength(A);case o.KANJI:return n.getBitsLength(A);case o.BYTE:return t.getBitsLength(A)}}function l(A){return A.reduce(function(P,I){const B=P.length-1>=0?P[P.length-1]:null;return B&&B.mode===I.mode?(P[P.length-1].data+=I.data,P):(P.push(I),P)},[])}function T(A){const P=[];for(let I=0;I<A.length;I++){const B=A[I];switch(B.mode){case o.NUMERIC:P.push([B,{data:B.data,mode:o.ALPHANUMERIC,length:B.length},{data:B.data,mode:o.BYTE,length:B.length}]);break;case o.ALPHANUMERIC:P.push([B,{data:B.data,mode:o.BYTE,length:B.length}]);break;case o.KANJI:P.push([B,{data:B.data,mode:o.BYTE,length:c(B.data)}]);break;case o.BYTE:P.push([{data:B.data,mode:o.BYTE,length:c(B.data)}])}}return P}function M(A,P){const I={},B={start:{}};let b=["start"];for(let g=0;g<A.length;g++){const E=A[g],C=[];for(let f=0;f<E.length;f++){const R=E[f],m=""+g+f;C.push(m),I[m]={node:R,lastCount:0},B[m]={};for(let y=0;y<b.length;y++){const w=b[y];I[w]&&I[w].node.mode===R.mode?(B[w][m]=h(I[w].lastCount+R.length,R.mode)-h(I[w].lastCount,R.mode),I[w].lastCount+=R.length):(I[w]&&(I[w].lastCount=R.length),B[w][m]=h(R.length,R.mode)+4+o.getCharCountIndicator(R.mode,P))}}b=C}for(let g=0;g<b.length;g++)B[b[g]].end=0;return{map:B,table:I}}function S(A,P){let I;const B=o.getBestModeForData(A);if(I=o.from(P,B),I!==o.BYTE&&I.bit<B.bit)throw new Error('"'+A+'" cannot be encoded with mode '+o.toString(I)+".\n Suggested mode is: "+o.toString(B));switch(I===o.KANJI&&!a.isKanjiModeEnabled()&&(I=o.BYTE),I){case o.NUMERIC:return new i(A);case o.ALPHANUMERIC:return new e(A);case o.KANJI:return new n(A);case o.BYTE:return new t(A)}}r.fromArray=function(P){return P.reduce(function(I,B){return typeof B=="string"?I.push(S(B,null)):B.data&&I.push(S(B.data,B.mode)),I},[])},r.fromString=function(P,I){const B=p(P,a.isKanjiModeEnabled()),b=T(B),g=M(b,I),E=u.find_path(g.map,"start","end"),C=[];for(let f=1;f<E.length-1;f++)C.push(g.table[E[f]].node);return r.fromArray(l(C))},r.rawSplit=function(P){return r.fromArray(p(P,a.isKanjiModeEnabled()))}}(at)),at}var Ot;function Ie(){if(Ot)return $;Ot=1;const r=U(),o=Ct(),i=ae(),e=ce(),t=le(),n=fe(),s=de(),a=$t(),u=me(),c=we(),d=Ce(),p=k(),h=Ae();function l(g,E){const C=g.size,f=n.getPositions(E);for(let R=0;R<f.length;R++){const m=f[R][0],y=f[R][1];for(let w=-1;w<=7;w++)if(!(m+w<=-1||C<=m+w))for(let N=-1;N<=7;N++)y+N<=-1||C<=y+N||(w>=0&&w<=6&&(N===0||N===6)||N>=0&&N<=6&&(w===0||w===6)||w>=2&&w<=4&&N>=2&&N<=4?g.set(m+w,y+N,!0,!0):g.set(m+w,y+N,!1,!0))}}function T(g){const E=g.size;for(let C=8;C<E-8;C++){const f=C%2===0;g.set(C,6,f,!0),g.set(6,C,f,!0)}}function M(g,E){const C=t.getPositions(E);for(let f=0;f<C.length;f++){const R=C[f][0],m=C[f][1];for(let y=-2;y<=2;y++)for(let w=-2;w<=2;w++)y===-2||y===2||w===-2||w===2||y===0&&w===0?g.set(R+y,m+w,!0,!0):g.set(R+y,m+w,!1,!0)}}function S(g,E){const C=g.size,f=c.getEncodedBits(E);let R,m,y;for(let w=0;w<18;w++)R=Math.floor(w/3),m=w%3+C-8-3,y=(f>>w&1)===1,g.set(R,m,y,!0),g.set(m,R,y,!0)}function A(g,E,C){const f=g.size,R=d.getEncodedBits(E,C);let m,y;for(m=0;m<15;m++)y=(R>>m&1)===1,m<6?g.set(m,8,y,!0):m<8?g.set(m+1,8,y,!0):g.set(f-15+m,8,y,!0),m<8?g.set(8,f-m-1,y,!0):m<9?g.set(8,15-m-1+1,y,!0):g.set(8,15-m-1,y,!0);g.set(f-8,8,1,!0)}function P(g,E){const C=g.size;let f=-1,R=C-1,m=7,y=0;for(let w=C-1;w>0;w-=2)for(w===6&&w--;;){for(let N=0;N<2;N++)if(!g.isReserved(R,w-N)){let _=!1;y<E.length&&(_=(E[y]>>>m&1)===1),g.set(R,w-N,_),m--,m===-1&&(y++,m=7)}if(R+=f,R<0||C<=R){R-=f,f=-f;break}}}function I(g,E,C){const f=new i;C.forEach(function(N){f.put(N.mode.bit,4),f.put(N.getLength(),p.getCharCountIndicator(N.mode,g)),N.write(f)});const R=r.getSymbolTotalCodewords(g),m=a.getTotalCodewordsCount(g,E),y=(R-m)*8;for(f.getLengthInBits()+4<=y&&f.put(0,4);f.getLengthInBits()%8!==0;)f.putBit(0);const w=(y-f.getLengthInBits())/8;for(let N=0;N<w;N++)f.put(N%2?17:236,8);return B(f,g,E)}function B(g,E,C){const f=r.getSymbolTotalCodewords(E),R=a.getTotalCodewordsCount(E,C),m=f-R,y=a.getBlocksCount(E,C),w=f%y,N=y-w,_=Math.floor(f/y),z=Math.floor(m/y),xt=z+1,Et=_-z,te=new u(Et);let O=0;const K=new Array(y),yt=new Array(y);let j=0;const ee=new Uint8Array(g.buffer);for(let F=0;F<y;F++){const G=F<N?z:xt;K[F]=ee.slice(O,O+G),yt[F]=te.encode(K[F]),O+=G,j=Math.max(j,G)}const Y=new Uint8Array(f);let pt=0,D,q;for(D=0;D<j;D++)for(q=0;q<y;q++)D<K[q].length&&(Y[pt++]=K[q][D]);for(D=0;D<Et;D++)for(q=0;q<y;q++)Y[pt++]=yt[q][D];return Y}function b(g,E,C,f){let R;if(Array.isArray(g))R=h.fromArray(g);else if(typeof g=="string"){let _=E;if(!_){const z=h.rawSplit(g);_=c.getBestVersionForData(z,C)}R=h.fromString(g,_||40)}else throw new Error("Invalid data");const m=c.getBestVersionForData(R,C);if(!m)throw new Error("The amount of data is too big to be stored in a QR Code");if(!E)E=m;else if(E<m)throw new Error("\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: "+m+".\n");const y=I(E,C,R),w=r.getSymbolSize(E),N=new e(w);return l(N,E),T(N),M(N,E),A(N,C,0),E>=7&&S(N,E),P(N,y),isNaN(f)&&(f=s.getBestMask(N,A.bind(null,N,C))),s.applyMask(f,N),A(N,C,f),{modules:N,version:E,errorCorrectionLevel:C,maskPattern:f,segments:R}}return $.create=function(E,C){if(typeof E>"u"||E==="")throw new Error("No input text");let f=o.M,R,m;return typeof C<"u"&&(f=o.from(C.errorCorrectionLevel,o.M),R=c.from(C.version),m=s.from(C.maskPattern),C.toSJISFunc&&r.setToSJISFunction(C.toSJISFunc)),b(E,R,f,m)},$}var ht={},mt={},jt;function Zt(){return jt||(jt=1,function(r){function o(i){if(typeof i=="number"&&(i=i.toString()),typeof i!="string")throw new Error("Color should be defined as hex string");let e=i.slice().replace("#","").split("");if(e.length<3||e.length===5||e.length>8)throw new Error("Invalid hex color: "+i);(e.length===3||e.length===4)&&(e=Array.prototype.concat.apply([],e.map(function(n){return[n,n]}))),e.length===6&&e.push("F","F");const t=parseInt(e.join(""),16);return{r:t>>24&255,g:t>>16&255,b:t>>8&255,a:t&255,hex:"#"+e.slice(0,6).join("")}}r.getOptions=function(e){e||(e={}),e.color||(e.color={});const t=typeof e.margin>"u"||e.margin===null||e.margin<0?4:e.margin,n=e.width&&e.width>=21?e.width:void 0,s=e.scale||4;return{width:n,scale:n?4:s,margin:t,color:{dark:o(e.color.dark||"#000000ff"),light:o(e.color.light||"#ffffffff")},type:e.type,rendererOpts:e.rendererOpts||{}}},r.getScale=function(e,t){return t.width&&t.width>=e+t.margin*2?t.width/(e+t.margin*2):t.scale},r.getImageWidth=function(e,t){const n=r.getScale(e,t);return Math.floor((e+t.margin*2)*n)},r.qrToImageData=function(e,t,n){const s=t.modules.size,a=t.modules.data,u=r.getScale(s,n),c=Math.floor((s+n.margin*2)*u),d=n.margin*u,p=[n.color.light,n.color.dark];for(let h=0;h<c;h++)for(let l=0;l<c;l++){let T=(h*c+l)*4,M=n.color.light;if(h>=d&&l>=d&&h<c-d&&l<c-d){const S=Math.floor((h-d)/u),A=Math.floor((l-d)/u);M=p[a[S*s+A]?1:0]}e[T++]=M.r,e[T++]=M.g,e[T++]=M.b,e[T]=M.a}}}(mt)),mt}var Yt;function Ne(){return Yt||(Yt=1,function(r){const o=Zt();function i(t,n,s){t.clearRect(0,0,n.width,n.height),n.style||(n.style={}),n.height=s,n.width=s,n.style.height=s+"px",n.style.width=s+"px"}function e(){try{return document.createElement("canvas")}catch(t){throw new Error("You need to specify a canvas element")}}r.render=function(n,s,a){let u=a,c=s;typeof u>"u"&&(!s||!s.getContext)&&(u=s,s=void 0),s||(c=e()),u=o.getOptions(u);const d=o.getImageWidth(n.modules.size,u),p=c.getContext("2d"),h=p.createImageData(d,d);return o.qrToImageData(h.data,n,u),i(p,c,d),p.putImageData(h,0,0),c},r.renderToDataURL=function(n,s,a){let u=a;typeof u>"u"&&(!s||!s.getContext)&&(u=s,s=void 0),u||(u={});const c=r.render(n,s,u),d=u.type||"image/png",p=u.rendererOpts||{};return c.toDataURL(d,p.quality)}}(ht)),ht}var wt={},Gt;function Te(){if(Gt)return wt;Gt=1;const r=Zt();function o(t,n){const s=t.a/255,a=n+'="'+t.hex+'"';return s<1?a+" "+n+'-opacity="'+s.toFixed(2).slice(1)+'"':a}function i(t,n,s){let a=t+n;return typeof s<"u"&&(a+=" "+s),a}function e(t,n,s){let a="",u=0,c=!1,d=0;for(let p=0;p<t.length;p++){const h=Math.floor(p%n),l=Math.floor(p/n);!h&&!c&&(c=!0),t[p]?(d++,p>0&&h>0&&t[p-1]||(a+=c?i("M",h+s,.5+l+s):i("m",u,0),u=0,c=!1),h+1<n&&t[p+1]||(a+=i("h",d),d=0)):u++}return a}return wt.render=function(n,s,a){const u=r.getOptions(s),c=n.modules.size,d=n.modules.data,p=c+u.margin*2,h=u.color.light.a?"<path "+o(u.color.light,"fill")+' d="M0 0h'+p+"v"+p+'H0z"/>':"",l="<path "+o(u.color.dark,"stroke")+' d="'+e(d,c,u.margin)+'"/>',T='viewBox="0 0 '+p+" "+p+'"',S='<svg xmlns="http://www.w3.org/2000/svg" '+(u.width?'width="'+u.width+'" height="'+u.width+'" ':"")+T+' shape-rendering="crispEdges">'+h+l+"</svg>\n";return typeof a=="function"&&a(null,S),S},wt}var Qt;function Me(){if(Qt)return V;Qt=1;const r=ue(),o=Ie(),i=Ne(),e=Te();function t(n,s,a,u,c){const d=[].slice.call(arguments,1),p=d.length,h=typeof d[p-1]=="function";if(!h&&!r())throw new Error("Callback required as last argument");if(h){if(p<2)throw new Error("Too few arguments provided");p===2?(c=a,a=s,s=u=void 0):p===3&&(s.getContext&&typeof c>"u"?(c=u,u=void 0):(c=u,u=a,a=s,s=void 0))}else{if(p<1)throw new Error("Too few arguments provided");return p===1?(a=s,s=u=void 0):p===2&&!s.getContext&&(u=a,a=s,s=void 0),new Promise(function(l,T){try{const M=o.create(a,u);l(n(M,s,u))}catch(M){T(M)}})}try{const l=o.create(a,u);c(null,n(l,s,u))}catch(l){c(l)}}return V.create=o.create,V.toCanvas=t.bind(null,i.render),V.toDataURL=t.bind(null,i.renderToDataURL),V.toString=t.bind(null,function(n,s,a){return e.render(n,a)}),V}var Pe=Me();const Se=ne(Pe),be=VueDemi.defineComponent({name:"tmagic-qrcode",props:{config:{type:Object,required:!0},iteratorIndex:Array,iteratorContainerId:Array,containerIndex:Number,model:{type:Object,default:()=>({})}},setup(r){const o=VueDemi.ref();VueDemi.watch(()=>r.config.url,(n="")=>{Se.toDataURL(n,(s,a)=>{s&&console.error(s),o.value=a})},{immediate:!0});const i=VueDemi.inject("app"),e=oe(r);return ie(e),{imgUrl:o,clickHandler:()=>{i&&e&&i.emit("".concat(re,"click"),e)}}}}),Le=["src"];function De(r,o,i,e,t,n){return Vue.openBlock(),Vue.createElementBlock("img",{src:r.imgUrl,onClick:o[0]||(o[0]=(...s)=>r.clickHandler&&r.clickHandler(...s))},null,8,Le)}const ke=se(be,[["render",De]]);export{ke as default};
//# sourceMappingURL=index-C_So_LRT.js.map
