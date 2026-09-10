const assert = require('node:assert/strict')
const { readFile } = require('node:fs/promises')
const path = require('node:path')
const test = require('node:test')

test('bare native projects enable Hermes and the New Architecture', async () => {
  const properties = await readFile(new URL('../android/gradle.properties', `file://${__dirname}/`), 'utf8')
  assert.match(properties, /^newArchEnabled=true$/m)
  assert.match(properties, /^hermesEnabled=true$/m)
  await readFile(new URL('../ios/Podfile', `file://${__dirname}/`), 'utf8')
})

test('Metro resolves one React instance for linked workspace packages', () => {
  const config = require('../metro.config')
  const workspaceNodeModules = path.resolve(__dirname, '../../..', 'node_modules')

  assert.equal(config.resolver.disableHierarchicalLookup, true)
  assert.equal(config.resolver.nodeModulesPaths[0], workspaceNodeModules)
  assert.equal(config.resolver.extraNodeModules.react, path.join(workspaceNodeModules, 'react'))
  assert.equal(config.resolver.extraNodeModules['react-native'], path.join(workspaceNodeModules, 'react-native'))
})
