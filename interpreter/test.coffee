assert = require 'assert'
joe = require '../joescript_grammar'
jsi = require './javascript'

counter = 0
test = (code, expected) ->
  node = joe.GRAMMAR.parse code
  console.log "test #{counter++}: #{code}"
  result = jsi.interpret(node)
  if result isnt expected
    console.log "ERROR: expected: #{expected} but got #{result}"
    process.exit()

test """if true then 1 else 2""", 1
test """if false then 1 else 2""", 2
test """a = 'bar'""", 'bar'
