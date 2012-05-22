assert = require 'assert'
joe = require 'joeson/src/joescript'
jsi = require './javascript'
_ = require 'underscore'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require 'joeson/lib/colors'

isEqual = (a, b) ->
  if isNaN a
    return isNaN b
  return a is b

console.log blue "\n-= interpreter test =-"

counter = 0
test = (code, expected) ->
  console.log "#{red "test #{counter++}:"}\n#{normal code}"
  node = joe.parse code
  result = jsi.interpret(node, include:{require:require})
  if typeof expected is 'function'
    if not expected(result)
      console.log "ERROR: didnt expect to get #{result}"
      process.exit(1)
  else if not isEqual result, expected
    console.log "ERROR: expected: #{expected} (#{expected?.constructor?.name}) but got #{result} (#{result?.constructor?.name})"
    process.exit(1)

test "null", null
test "undefined", undefined
test "null * undefined", NaN
test "Array", Array
test """if true then 1 else 2""", 1
test """if false then 1 else 2""", 2
test """a = 'bar'""", 'bar'
test """a = 'foo'
b = 'bar'
a + b""", 'foobar'
test """1 + 2 * 3 + 4""", 11
test """{}""", (it) -> it instanceof Object and _.keys(it).length is 0
test """{foo:1}""", (it) -> it instanceof Object and _.keys(it).length is 1
test """a = {foo:1}
a.foo""", 1
test """
foo = (bar) -> return bar + 1
foo(1)""", 2
test """
outer = (foo) ->
  inner = ->
    return foo + 1
func = outer(1)
func()
""", 2
test """
outer = (foo) ->
  bar = foo
  inner = ->
    bar = bar + 1
func = outer(1)
func()
func()
func()
func()
func()
""", 6
test """
outer = (foo) ->
  inner = ->
    bar = bar + 1
  bar = foo
  return inner
func = outer(1)
func()
func()
""", NaN
test """
outer = (foo) ->
  bar = foo
  inner = ->
    bar = bar + 1
func = outer(1)
a = func() for i in [1..5]
a
""", 6
test """
foo = ->
  1 + 1
foo()""", 2

# construction tests
test """
a = ->
new a""", (it) ->
  assert.ok it instanceof Object
  assert.ok _.keys(it).length is 0
  yes

test """
Foo = ->
  this.a = 'A'
  this.b = 'B'
f = new Foo()""", (it) ->
  assert.ok it instanceof Object
  assert.ok _.keys(it).length is 2
  assert.ok it.a is 'A' and it.b is 'B'
  yes

test """
p = {key:'value'}
Foo = ->
Foo.prototype = p
f = new Foo
f.key""", 'value'

test """
_ = require('underscore')
_.keys(foo:1, bar:2, baz:3).join(',')""", 'foo,bar,baz'
