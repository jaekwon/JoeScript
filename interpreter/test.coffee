assert = require 'assert'
joe = require '../joescript_grammar'
jsi = require './javascript'
_ = require 'underscore'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require '../lib/colors'

isEqual = (a, b) ->
  if isNaN a
    return isNaN b
  return a is b

counter = 0
test = (code, expected) ->
  console.log "#{red "test #{counter++}:"}\n#{normal code}"
  node = joe.GRAMMAR.parse code
  result = jsi.interpret(node)
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
