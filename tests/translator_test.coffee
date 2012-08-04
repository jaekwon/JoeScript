require './setup'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
{equal, deepEqual, ok} = assert = require 'assert'
joe = require 'sembly/src/joescript'
jsx = require 'sembly/src/translators/javascript'

console.log blue "\n-= translator test =-"

canon = (str, stripWS=yes) ->
  nstr = str.replace(/[\n ]+/g, if stripWS then '' else ' ').replace(/_\$[a-zA-Z0-9]{4}\$_/g, '').trim()
  return nstr

counter = 0
test = (code, expected) ->
  console.log "#{red "test #{counter++}:"}\n#{normal code}"
  node = joe.parse code
  proc = []
  translated = jsx.translate(node)
  if typeof expected is 'function'
    try
      result = eval(translated)
      expected.call {it:result}, result
    catch error
      console.log "Error in evaluating translated javascript: #{yellow translated}.\nError:\n#{red error?.stack ? error}"
      process.exist(1)
    return
  if canon(translated) isnt canon(expected)
    console.log "ERROR:\n  expected:\n#{green canon expected, no}\n  result:\n#{red canon translated, no}." #\n  nodes:\n#{yellow node.serialize()}"
    process.exit(1)

test """
a = 1
loop
  return if a > 2
  a += 1
print a
""", 'var a; a = 1; while(true) {if((a > 2)){return }; a = (a + 1)}; print(a)'
test """
a = 1
loop
  return if a > 2
  a += 1
""", 'var a; a = 1; while(true) {if((a > 2)){return }; a = (a + 1)}'
test """
  a = 1
  b = loop
    return if a > 2
    a += 1
""", """
  var a, b, accum;
  a = 1;
  b = accum = [];
  while(true) {(if((a > 2)){return }; accum.push(a = (a + 1)))};
  accum_$temp$_
"""
test """if true then 1 + 1 else 2 + 2""", 'if(true) { (1 + 1) } else { (2 + 2) }'
test """
if true
  1 + 1
  b = 2
  2
""", 'var b; if(true) { (1 + 1); b = 2; 2 }'
test """1 + 1""", '(1 + 1)'
test """
if 1
  2
else
  3""", 'if(1) { 2 } else { 3 }'
test """
foo =
  if 1
    2
  else
    3""", 'var foo; foo = (1 ? 2 : 3)'
test """(a) -> return a""", 'function(a) { return a }'
test """(b) -> b""", 'function(b) { return b }'
test """(a) -> if true then a""", 'function(a) { if(true) { return a } }'
test """(a) -> if true then a else b""", 'function(a) { if(true) { return a } else { return b } }'
test """foo is bar""", '(foo === bar)'
test """if foo is bar then 'foo is bar'""", 'if((foo === bar)) { \"foo is bar\" }'
test """
foo = bar
if res is null
  break
  results.push res
""", 'var foo; foo = bar; if((res === null)) { break; results.push(res) }'
test """
loop
  a = b
""", 'var a; while(true) { a = b }'
test """
({foo,bar}) -> foo+bar
""", """function(arg) {(var foo, bar; foo = arg.foo; bar = arg.bar; return (foo + bar))}"""
test """
temp = {foo:1, bar:2}
{foo,bar} = temp
foo + bar
""", """
var temp, foo, bar;
temp = {"foo": 1, "bar": 2};
foo = temp.foo;
bar = temp.bar;
(foo + bar)"""
test """
{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{CodeStream} = require 'sembly/src/codestream'
Node = require('sembly/src/node').createNodeClazz('GrammarNode')
{pad, escape} = require 'sembly/lib/helpers'
[pad]
""", -> deepEqual @it, [require('sembly/lib/helpers').pad]
