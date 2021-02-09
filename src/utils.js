const jsSHA = require("jssha");

module.exports = {
  // Some flufy stuff to an async/await interface to NodeJs callbacks.
  callbackToPromise: function (method, ...args) {
    return new Promise(function (resolve, reject) {
      return method(...args, function (err, result) {
        return err ? reject(err) : resolve(result);
      });
    });
  },

  validateEmail: function (email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  },

  hashSha512: function (string) {
    const shaObj = new jsSHA("SHA-512", "TEXT");
    shaObj.update(string);
    return shaObj.getHash("HEX");
  },
};
