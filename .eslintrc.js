/* @flow */

module.exports = {
  extends: "./node_modules/@krakenjs/grumbler-scripts/config/.eslintrc-node.js",
  rules: {
    // legacy rule settings
    "prefer-const": "off",
    "flowtype/require-exact-type": "off",
  },
};
