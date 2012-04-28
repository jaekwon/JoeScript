assert = require 'assert'
joe = require '../joescript_grammar'
jsx = require './javascript'

test = (code, expected) ->
  node = joe.GRAMMAR.parse code
  proc = []
  translated = jsx.translate(node)
  assert.equal translated.replace(/[\n ]+/g, ' '), expected.replace(/[\n ]+/g, ' ')

test """if true then 1 + 1 else 2 + 2""", 'if(true) { (1 + 1); } else { (2 + 2); };'
test """
if true
  1 + 1
  b = 2
  2
""", 'var b; if(true) { (1 + 1); b = 2; 2; };'
test """1 + 1""", '(1 + 1);'
test """
if 1
  2
else
  3""", 'if(1) { 2; } else { 3; };'
test """
foo =
  if 1
    2
  else
    3""", 'var foo; if(1) { foo = 2; } else { foo = 3; };'
test """(a) -> return a""", 'function(a) { return a; };'

###
need to find implicit returns in the block.
then,
  1. I need to convert them into return statements
  2. or I need to flag them as return statements and special treat them in the translator
  3. or I need to do this all dynamically in the js translator
  4. or I create a special filter step that does this <-- winner?
  5. or ...
###
test """(b) -> b""", 'function(b) { return b; };'
