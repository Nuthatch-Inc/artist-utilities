const assert = require('node:assert');
const { greet } = require('../../src/index.js');

assert.strictEqual(greet('World'), 'Hello, World!');
console.log('Node tests passed');
