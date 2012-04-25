assert = require 'assert'
joe = require '../joescript_grammar'
jsx = require './javascript'

test = (code, expected) ->
  node = joe.GRAMMAR.parse code
  proc = []
  translated = jsx.translate(node)
  assert.equal translated.replace(/[\n ]+/g, ' '), expected.replace(/[\n ]+/g, ' ')

test """if true then 1 + 1 else 2 + 2""", 'var temp0; if(true) { temp0 = (1 + 1); } else { temp0 = (2 + 2); }; temp0'
test """
if true
  1 + 1
  b = 2
  2
""", 'var b,temp0; if(true) { (1 + 1); (b = 2); temp0 = 2; }; temp0'
test """1 + 1""", 'var temp0; temp0 = (1 + 1); temp0'
test """
if 1
  2
else
  3""", 'var temp0; if(1) { temp0 = 2; } else { temp0 = 3; }; temp0'
test """(a) -> a""", 'var temp0; temp0 = function(a) { var temp0; temp0 = a; temp0 }; temp0'
