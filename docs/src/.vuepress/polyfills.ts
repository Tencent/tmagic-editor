// serialize-javascript 依赖的 randombytes 依赖全局的 global 对象，因此此处需添加 global polyfill
if (typeof global === 'undefined') {
  (window as any).global = window;
}

if (typeof globalThis === 'undefined') {
  (window as any).globalThis = window;
}
