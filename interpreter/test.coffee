assert = require 'assert'
joe = require '../joescript_grammar'
jsi = require './javascript'
_ = require 'underscore'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require '../lib/colors'

counter = 0
test = (code, expected) ->
  node = joe.GRAMMAR.parse code
  console.log "#{red "test #{counter++}:"}\n#{normal code}"
  result = jsi.interpret(node)
  if typeof expected is 'function'
    if not expected(result)
      console.log "ERROR: didnt expect to get #{result}"
      process.exit()
  else if result isnt expected
    console.log "ERROR: expected: #{expected} but got #{result}"
    process.exit()

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
