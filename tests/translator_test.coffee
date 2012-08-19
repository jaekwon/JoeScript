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
    console.log "ERROR:\n  expected:\n#{green canon expected, no}\n  result:\n#{red canon translated, no}" #\n  nodes:\n#{yellow node.serialize()}"
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
  while(true) {if((a > 2)){return }; accum.push(a = (a + 1))};
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
""", """function(arg) {var foo, bar; foo = arg.foo; bar = arg.bar; return (foo + bar)}"""
test " foo = {bar, baz} ", 'var foo; foo = {"bar": bar, "baz": baz}'
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
test """
x+1 for x, i in [0..10]
""", 'var i, x, _to, _by; for(i = 0; x = 0; _to = 10; _by = 1;(x <= _to);i = (i + 1); x = (x + _by)){(x + 1)}'
# soak tests
test " bar? ", '((typeof bar !== "undefined") && (bar !== null))'
test " foo = bar? ", 'var foo; foo = ((typeof bar !== "undefined") && (bar !== null))'
test " foo = bar?.baz ", 'var foo; foo = (((typeof bar !== "undefined") && (bar !== null)) ? bar.baz : undefined)'
test " foo = bar?.baz 1 ", 'var foo; foo = (((typeof bar !== "undefined") && (bar !== null)) ? bar.baz(1) : undefined)'
test " foo = bbb.bar?.baz? 1 ", 'var foo, ref, ref; foo = ((((ref = bbb.bar) !== null) && (ref !== undefined)) ? ((((ref = ref.baz) !== null) && (ref !== undefined)) ? ref(1) : undefined) : undefined)'
test " foo = base?.bar.baz 1 ", 'var foo; foo = (((typeof base !== "undefined") && (base !== null)) ? base.bar.baz(1) : undefined)'
test " foo = base?.bar.baz?.blah 1 ", 'var foo, ref; foo = (((typeof base !== "undefined") && (base !== null)) ? ((((ref = base.bar.baz) !== null) && (ref !== undefined)) ? ref.blah(1) : undefined) : undefined)'
test " base?.bar.baz?.blah = foo?.foo = 1 ", """
  var ref;
  if(((typeof base !== "undefined") && (base !== null))){
    if((((ref = base.bar.baz) !== null) && (ref !== undefined))){
      ref.blah = (((typeof foo !== "undefined") && (foo !== null)) ? (foo.foo = 1) : undefined)
    }else{
      undefined
    }
  }else{
    undefined
  }
"""
test "foo ? bar", 'if(((typeof foo !== "undefined") && (foo !== null))){foo}else{bar}'
test "foo ?= bar", 'var foo; foo = (((typeof foo !== "undefined") && (foo !== null)) ? foo : bar)'
test "foo = (opts={}) -> opts", 'var foo; foo = function(opts) {opts = (((typeof opts !== "undefined") && (opts !== null)) ? opts : {}); return opts}'
test "foo = ({foo}={foo:1}) -> opts", """
var foo;
foo = function(arg) {
  arg = (((typeof arg !== "undefined") && (arg !== null)) ? arg : {"foo": 1});
  foo = arg.foo;
  return opts
}
"""
test """
switch foo
  when "1", 2
    return "one or two"
  when "three"
    return "three"
  else
    return "default"
""", 'switch (foo) { case "1": case 2: return "one or two"; case "three": return "three"; default: return "default" }'
test """
foo = switch bar
  when yes
    throw new Error "statement test 1"
  else
    throw new Error "statement test 2"
""", 'var foo, temp; foo = temp = undefined; switch (bar) { case true: throw new(Error("statement test 1")); default: throw new(Error("statement test 2")) }; temp'
