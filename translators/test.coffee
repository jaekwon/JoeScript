assert = require 'assert'
joe = require '../joescript_grammar'
jsx = require './javascript'

test = (code, expected) ->
  node = joe.GRAMMAR.parse code
  proc = []
  translated = jsx.translate(node)
  assert.equal translated.replace(/[\n ]+/g, ' '), expected.replace(/[\n ]+/g, ' ')

test """
if 1
  2
else
  3""", 'var temp0; if(1) { temp0 = 2; } else { temp0 = 3; };temp0'

test """1 + 1""", '1+1'
test """(a) -> a""", ''
