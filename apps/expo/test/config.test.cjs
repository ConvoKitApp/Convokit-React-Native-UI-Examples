const assert = require('node:assert/strict')
const config = require('../app.json')
const test = require('node:test')

test('Expo example targets managed New Architecture builds', () => {
  assert.equal(config.expo.newArchEnabled, true)
  assert.equal(config.expo.ios.bundleIdentifier, 'app.convokit.example.expo')
  assert.equal(config.expo.android.package, 'app.convokit.example.expo')
})
