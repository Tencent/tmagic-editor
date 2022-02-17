/**
 * @param {Array} middleware
 * @return {Function}
 */
export const compose = (middleware: Function[]) => {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware 必须是一个数组!');
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware 必须由函数组成!');
  }

  /**
   * @param {Object} args
   * @return {Promise}
   * @api public
   */
  return (args: any[], next?: Function) => {
    // last called middleware #
    let index = -1;
    return dispatch(0);
    function dispatch(i: number): Promise<void> {
      if (i <= index) return Promise.reject(new Error('next() 被多次调用'));
      index = i;
      let fn = middleware[i];
      if (i === middleware.length && next) fn = next;
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(...args, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
};
