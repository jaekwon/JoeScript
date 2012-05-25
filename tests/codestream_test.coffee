{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'
{CodeStream} = require 'joeson/src/codestream'

console.log blue "\n-= codestream test =-"

do ->
  cs = CodeStream """line 0
  line 1
  line 2 -- rest of line 2
  line 3
  line 4"""

  assert.equal cs.line, 0
  assert.equal cs.col, 0
  line = cs.getUntil('\n')
  assert.equal line, "line 0\n"

  assert.equal cs.line, 1
  assert.equal cs.col, 0
  line = cs.getUntil('\n')
  assert.equal line, "line 1\n"
  assert.equal cs.line, 2
  assert.equal cs.col, 0

  part = cs.getUntil(' -- ')
  assert.equal part, "line 2 -- "
  assert.equal cs.line, 2
  assert.equal cs.col, 10
  assert.equal cs.peek(afterChars:4), 'rest'
  assert.equal cs.peek(beforeLines:0, afterLines:0), 'line 2 -- rest of line 2'
  assert.equal cs.peek(afterLines:0), 'rest of line 2'
  assert.equal cs.peek(afterLines:1), 'rest of line 2\nline 3'

console.log "All tests passed"
