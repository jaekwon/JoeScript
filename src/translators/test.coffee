assert = require 'assert'
joe = require 'joeson/src/joescript'
jsx = require './javascript'
_ = require 'underscore'
{inspect} = require 'util'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require 'joeson/lib/colors'

console.log blue "\n-= translator test =-"

counter = 0
test = (code, expected) ->
  console.log "#{red "test #{counter++}:"}\n#{normal code}"
  node = joe.parse code
  proc = []
  translated = jsx.translate(node)
  if translated.replace(/[\n ]+/g, '').trim() isnt expected.replace(/[\n ]+/g, '').trim()
    console.log "ERROR:\n  expected:\n#{green expected}\n  result:\n#{red translated}.\n  nodes:\n#{yellow node.serialize()}"
    process.exit(1)

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
    3""", 'var foo; foo = (1 ? 2 : 3);'
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
