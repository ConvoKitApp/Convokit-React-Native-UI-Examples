const fs = require('fs')
const path = require('path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const workspaceRoot = path.resolve(__dirname, '../..')
const linkedPackages = ['react-native', 'react-native-ui']
  .map(name => path.join(workspaceRoot, 'node_modules/@convokitapp', name))
  .filter(location => fs.existsSync(location))
  .map(location => fs.realpathSync(location))

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [workspaceRoot, ...linkedPackages],
  resolver: {
    nodeModulesPaths: [path.join(workspaceRoot, 'node_modules')],
    unstable_enableSymlinks: true,
  },
})
