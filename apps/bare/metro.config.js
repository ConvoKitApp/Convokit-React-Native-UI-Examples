const fs = require('fs')
const path = require('path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const workspaceRoot = path.resolve(__dirname, '../..')
const workspaceNodeModules = path.join(workspaceRoot, 'node_modules')
const linkedPackages = ['react-native', 'react-native-ui']
  .map(name => path.join(workspaceRoot, 'node_modules/@convokitapp', name))
  .filter(location => fs.existsSync(location))
  .map(location => fs.realpathSync(location))
const linkedNodeModules = linkedPackages
  .map(location => path.join(location, 'node_modules'))
  .filter(location => fs.existsSync(location))

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [workspaceRoot, ...linkedPackages],
  resolver: {
    // Linked SDK/UI repositories have development-only node_modules folders.
    // Search the workspace first and force React plus its renderer to come from
    // there; linked node_modules remain fallbacks for package-specific tooling.
    disableHierarchicalLookup: true,
    nodeModulesPaths: [workspaceNodeModules, ...linkedNodeModules],
    extraNodeModules: {
      react: path.join(workspaceNodeModules, 'react'),
      'react-native': path.join(workspaceNodeModules, 'react-native'),
    },
    unstable_enableSymlinks: true,
  },
})
