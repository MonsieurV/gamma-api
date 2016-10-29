module.exports = {
  // Some flufy stuff to an async/await interface to NodeJs callbacks.
  callbackToPromise: function (method, ...args) {
    return new Promise(function(resolve, reject) {
      return method(...args, function(err, result) {
        return err ? reject(err) : resolve(result);
      });
    });
  }
};
