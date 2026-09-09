const assert = require('node:assert/strict')
const { readFile } = require('node:fs/promises')
const test = require('node:test')

test('bare native projects enable Hermes and the New Architecture', async () => {
  const properties = await readFile(new URL('../android/gradle.properties', `file://${__dirname}/`), 'utf8')
  assert.match(properties, /^newArchEnabled=true$/m)
  assert.match(properties, /^hermesEnabled=true$/m)
  await readFile(new URL('../ios/Podfile', `file://${__dirname}/`), 'utf8')
})
