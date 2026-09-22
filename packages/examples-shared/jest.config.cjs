const path = require('node:path')

// The workspace root's node_modules, as Metro searches it first (apps/bare/metro.config.js): a linked SDK
// or UI checkout carries its own development node_modules, and rendering through a second React copy
// breaks hooks. React and the ConvoKit packages are pinned to the workspace copies for the same reason.
const workspaceNodeModules = path.resolve(__dirname, '../..', 'node_modules')

module.exports = {
  preset: '@react-native/jest-preset',
  rootDir: __dirname,
  testMatch: ['<rootDir>/test/**/*.test.tsx'],
  // React Native's entry resolves its components through lazy getters, so the first `render()` of each
  // suite is what transforms React Native, the linked UI and the SDK through Babel. On a cold transform
  // cache (every CI run) that lands inside the first test, about 16 s on an M-series laptop and longer on
  // a hosted runner, well past Jest's 5 s default; a warm cache runs the same test in under a second.
  testTimeout: 120_000,
  moduleNameMapper: {
    '^react$': path.join(workspaceNodeModules, 'react'),
    '^react/(.*)$': path.join(workspaceNodeModules, 'react/$1'),
    '^@convokitapp/react-native$': path.join(workspaceNodeModules, '@convokitapp/react-native'),
    '^@convokitapp/sdk$': path.join(workspaceNodeModules, '@convokitapp/sdk'),
  },
  // The preset transforms React Native itself; the ConvoKit packages resolve through their `react-native`
  // export condition to TypeScript sources, and the URL polyfill and `uuid` (the core SDK's dependency,
  // an ES module under that condition) need Babel too.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-url-polyfill|@convokitapp|uuid)/)',
  ],
}
