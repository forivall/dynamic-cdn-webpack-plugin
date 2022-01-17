const mod = require('./lib/index');
module.exports = Object.defineProperties(
  mod.default,
  Object.getOwnPropertyDescriptors(mod)
);
