// Webpack config for NestJS — resolves @/ path alias in compiled output
// Used by: npm run build (nest build --webpack)
const path = require('path');

module.exports = (options) => ({
  ...options,
  resolve: {
    ...options.resolve,
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
