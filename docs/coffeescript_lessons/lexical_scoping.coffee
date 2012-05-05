assert = require 'assert'

console.log "whether an inner variable is the same as that in the parent scope depends on when that variable is lexically defined"

do ->
  bar = 0
  foo = -> bar = bar + 1
  foo()
  assert.ok bar is 1

do ->
  foo = -> bar = bar + 1
  bar = 0
  foo()
  assert.ok bar is 0
