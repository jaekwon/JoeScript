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
  node = jsx.translate(node, {includeHelpers:no})
  if typeof expected is 'function'
    try
      result = eval(node)
      expected.call {it:result}, result
    catch error
      console.log "Error in evaluating node javascript: #{yellow node}.\nError:\n#{red error?.stack ? error}"
      process.exist(1)
    return
  if canon(node) isnt canon(expected)
    console.log "ERROR:\n  expected:\n#{green canon expected, no}\n  result:\n#{red canon node, no}" #\n  nodes:\n#{yellow node.serialize()}"
    process.exit(1)

test "foo::[bar] = baz", 'foo.prototype[bar] = baz;'
test """
a = 1
loop
  break if a > 2
  a += 1
print a
""", 'var a; a = 1; while (true) { if (a > 2) { break; } a = a + 1; } print(a);'
test """
a = 1
loop
  break if a > 2
  a += 1
""", 'var a; a = 1; while (true) { if (a > 2) { break; } a = a + 1; }'
test """
  a = 1
  b = loop
    break if a > 2
    a += 1
""", 'var a, b; a = 1; b = function() { var accum; accum = []; while (true) { if (a > 2) { break; } accum.push(a = a + 1); } return accum; }();'
test """if true then 1 + 1 else 2 + 2""", 'if (true) { 1 + 1; } else { 2 + 2; }'
test """
if true
  1 + 1
  b = 2
  2
""", 'var b; if (true) { 1 + 1; b = 2; 2; }'
test """1 + 1""", '1 + 1;'
test """
if 1
  2
else
  3""", 'if (1) { 2; } else { 3; }'
test """
foo =
  if 1
    2
  else
    3""", 'var foo; foo = 1 ? 2 : 3;'
test """(a) -> return a""", '(function(a) { return a; });'
test """(b) -> b""", '(function(b) { return b; });'
test """(a) -> if true then a""", '(function(a) { if(true) { return a; } });'
test """(a) -> if true then a else b""", '(function(a) { if(true) { return a; } else { return b; } });'
test """foo is bar""", 'foo === bar;'
test """if foo is bar then 'foo is bar'""", 'if(foo === bar) { \"foo is bar\"; }'
test """
loop
  foo = bar
  if res is null
    break
    results.push res
""", 'var foo; while (true) { foo = bar; if (res === null) { break; results.push(res); } }'
test """
loop
  a = b
""", 'var a; while(true) { a = b; }'
test """
({foo,bar}) -> foo+bar
""", """(function(arg) {var foo, bar; foo = arg.foo; bar = arg.bar; return foo + bar;});"""
test " foo = {bar, baz} ", 'var foo; foo = {bar: bar, baz: baz};'
test """
temp = {foo:1, bar:2}
{foo,bar} = temp
foo + bar
""", """
var temp, foo, bar;
temp = {foo: 1, bar: 2};
foo = temp.foo;
bar = temp.bar;
foo + bar;"""
test """
{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{CodeStream} = require 'sembly/src/codestream'
Node = require('sembly/src/node').createNodeClazz('GrammarNode')
{pad, escape} = require 'sembly/lib/helpers'
[pad]
""", -> deepEqual @it, [require('sembly/lib/helpers').pad]
test " x+1 for x, i in [0..10] ", 'var i, x, _to, _by; for (i = 0, x = 0, _to = 10, _by = 1; x <= _to; i = i + 1, x = x + _by) { x + 1; }'
# soak tests
test " bar? ", 'typeof bar !== "undefined" && bar !== null;'
test " foo = bar? ", 'var foo; foo = typeof bar !== "undefined" && bar !== null;'
test " foo = bar?.baz ", 'var foo; foo = typeof bar !== "undefined" && bar !== null ? bar.baz : undefined;'
test " foo = bar?.baz 1 ", 'var foo; foo = typeof bar !== "undefined" && bar !== null ? bar.baz(1) : undefined;'
test " foo = bbb.bar?.baz? 1 ", 'var foo, ref, ref; foo = (ref = bbb.bar) !== null && ref !== undefined ? (ref = ref.baz) !== null && ref !== undefined ? ref(1) : undefined : undefined;'
test " foo = base?.bar.baz 1 ", 'var foo; foo = typeof base !== "undefined" && base !== null ? base.bar.baz(1) : undefined;'
test " foo = base?.bar.baz?.blah 1 ", 'var foo, ref; foo = typeof base !== "undefined" && base !== null ? (ref = base.bar.baz) !== null && ref !== undefined ? ref.blah(1) : undefined : undefined;'
test " base?.bar.baz?.blah = foo?.foo = 1 ", """
  var ref;
  if (typeof base !== "undefined" && base !== null) {
    if ((ref = base.bar.baz) !== null && ref !== undefined) {
      ref.blah = typeof foo !== "undefined" && foo !== null ? foo.foo = 1 : undefined;
    } else {
      undefined;
    }
  } else {
    undefined;
  }
"""
test "foo ? bar", 'if (typeof foo !== "undefined" && foo !== null) { foo; } else { bar; }'
test "foo ?= bar", 'var foo; foo = typeof foo !== "undefined" && foo !== null ? foo : bar;'
test "foo = (opts={}) -> opts", 'var foo; foo = function(opts) { opts = typeof opts !== "undefined" && opts !== null ? opts : {}; return opts; };'
test "foo = ({foo}={foo:1}) -> opts", """
var foo;
foo = function(arg) {
  arg = typeof arg !== "undefined" && arg !== null ? arg : { foo: 1 };
  foo = arg.foo; return opts;
};
"""
test """
switch foo
  when "1", 2
    return "one or two"
  when "three"
    return "three"
  else
    return "default"
""", 'switch (foo) { case "1": case 2: return "one or two"; break; case "three": return "three"; break; default: return "default"; }'
test """
foo = switch bar
  when yes
    throw new Error "statement test 1"
  else
    throw new Error "statement test 2"
""", 'var foo; foo = function() { var temp; temp = undefined; switch (bar) { case true: throw new (Error("statement test 1")); break; default: throw new (Error("statement test 2")); } return temp; }();'
test """
for foo, bar of baz
  do (foo, bar) ->
    print foo + bar
""", 'var _obj, bar, foo; _obj = baz; for (foo in _obj) { bar = _obj[foo]; (function(foo, bar) { return print(foo + bar); })(foo, bar); }'
# splats...
test " [foo, bar] = something ", 'var foo, bar; foo = something[0]; bar = something[1];'
test " [foo, bar...] = something ", 'var foo, bar; foo = something[0]; bar = 2 <= something.length ? __slice.call(something, 1) : [];'
test " [foo, bar..., baz] = something ", 'var foo, bar, _i, baz; foo = something[0]; bar = (3 <= something.length ? __slice.call(something, 1, _i = something.length - 1) : _i = 1, []); baz = something[_i++];'
test " [foo1, foo2, bar..., baz1, baz2] = something ", 'var foo1, foo2, bar, _i, baz1, baz2; foo1 = something[0]; foo2 = something[1]; bar = (5 <= something.length ? __slice.call(something, 2, _i = something.length - 2) : _i = 2, []); baz1 = something[_i++]; baz2 = something[_i++];'
test " [foo, bar..., {baz}] = something ", 'var foo, bar, _i, _ref, baz; foo = something[0]; bar = (3 <= something.length ? __slice.call(something, 1, _i = something.length - 1) : _i = 1, []); _ref = something[_i++]; baz = _ref.baz;'
test " (args...) -> args ", '(function() { var args; args = 1 <= arguments.length ? __slice.call(arguments, 0) : []; return args; });'
test " (foo, [bar, baz..., bak]) -> baz ", '(function(foo, arg) { var bar, baz, _i, bak; bar = arg[0]; baz = (3 <= arg.length ? __slice.call(arg, 1, _i = arg.length - 1) : _i = 1, []); bak = arg[(_i = _i + 1) - 1]; return baz; });'
test " (foo, bar..., baz) -> bar ", '(function() { var foo, bar, _i, baz; foo = arguments[0]; bar = (3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : _i = 1, []); baz = arguments[(_i = _i + 1) - 1]; return bar; });'
test " foo = [baz...] ", 'var foo; foo = __slice.call(baz);'
test " foo = [bar, baz..., bak] ", 'var foo; foo = [bar].concat(__slice.call(baz), [bak]);'
test " foo = [bar, baz..., bak, duck] ", 'var foo; foo = [bar].concat(__slice.call(baz), [bak, duck]);'
test " func(baz...) ", ''
test " func(bar, baz..., bak) ", ''
# lifted blocks
test """
foo = loop
  bar()
""", 'var foo; foo = function() { var accum; accum = []; while (true) { accum.push(bar()); } return accum; }();'
test """
foo =
  loop
    loop
      1
""", 'var foo; foo = function() { var accum, accum; accum = []; while (true) { accum = []; while (true) { accum.push(1); } accum.push(accum); } return accum; }();'
test """
foo =
  switch bar
    when yes
      2
    else
      3
""", 'var foo; foo = function() { var temp; temp = undefined; switch (bar) { case true: temp = 2; break; default: temp = 3; } return temp; }();'
test """
foo =
  loop
    bar =
      loop
        1
    bar + bar
""", 'var foo; foo = function() { var accum, bar; accum = []; while (true) { bar = function() { var accum; accum = []; while (true) { accum.push(1); } return accum; }(); accum.push(bar + bar); } return accum; }();'
test """
foo = loop
  if true
    break
  2
""", 'var foo; foo = function() { var accum; accum = []; while (true) { if (true) { break; } accum.push(2); } return accum; }();'
test """
foo =
  switch bar
    when yes
      switch baz
        when yes
          bak
""", """
var foo;
foo = function() {
  var temp, temp;
  temp = undefined;
  switch (bar) {
    case true:
      temp = undefined;
      switch (baz) {
        case true:
          temp = bak;
          break;
        default:
          undefined;
      }
      temp = temp;
      break;
    default:
      undefined;
  }
  return temp;
}();"""
test """
foo =
  switch bar
    when yes
      blah = switch baz
        when yes
          bak
        else
          foo = ->
            bar = loop
              1
""", """
var foo;
foo = function() {
  var temp, blah;
  temp = undefined;
  switch (bar) {
    case true:
      blah = function() {
        var temp;
        temp = undefined;
        switch (baz) {
          case true:
            temp = bak;
            break;
          default:
            foo = function() {
              var bar;
              bar = function() {
                var accum;
                accum = [];
                while (true) {
                  accum.push(1);
                }
                return accum;
              }();
            };
        }
        return temp;
      }();
      break;
    default:
      undefined;
  }
  return temp;
}();
"""
