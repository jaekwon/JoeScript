assert = require 'assert'
joe = require '../joescript_grammar'
jsx = require './javascript'

counter = 0
test = (code, expected) ->
  node = joe.GRAMMAR.parse code
  proc = []
  console.log "test #{counter++}: #{code}"
  translated = jsx.translate(node)
  assert.equal translated.replace(/[\n ]+/g, ' ').trim(), expected.replace(/[\n ]+/g, ' ').trim()

test """if true then 1 + 1 else 2 + 2""", 'if(true) { (1 + 1); } else { (2 + 2); }'
test """
if true
  1 + 1
  b = 2
  2
""", 'var b; if(true) { (1 + 1); b = 2; 2; }'
test """1 + 1""", '(1 + 1);'
test """
if 1
  2
else
  3""", 'if(1) { 2; } else { 3; }'
test """
foo =
  if 1
    2
  else
    3""", 'var foo; if(1) { foo = 2; } else { foo = 3; }'
test """(a) -> return a""", 'function(a) { return a; };'
test """(b) -> b""", 'function(b) { return b; };'
test """(a) -> if true then a""", 'function(a) { if(true) { return a; } };'
test """(a) -> if true then a else b""", 'function(a) { if(true) { return a; } else { return b; } };'
test """foo is bar""", '(foo === bar);'
test """if foo is bar then 'foo is bar'""", 'if((foo === bar)) { \"foo is bar\"; }'
test """
foo = bar
if res is null
  break
  results.push res
""", 'var foo; foo = bar; if((res === null)) { break; results.push(res); }'
test """
loop
  a = b
""", 'var a; while(true) { a = b; }'
