require './setup'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
{equal, deepEqual, ok} = require 'assert'
joe = require 'joeson/src/joescript'
{JThread, JKernel, GOD} = require 'joeson/src/interpreter'

console.log blue "\n-= interpreter test =-"

tests = []
test = (code, callback) -> tests.push code:code, callback:callback

test '''
foo = ->
  a = 0
  loop
    a++
    return a if a > 10000
  return 1
    
foo()
''', -> ok true
test '''
a = 'A'
foo = ->
  b = 'B'
  bar = ->
    c = 'C'
    car = ->
      a+b+c
foo()()()
''',                                      -> equal @it, 'ABC'
test ' null ',                            -> equal @it, null
test ' undefined ',                       -> equal @it, undefined
test ' null * undefined ',                -> ok isNaN @it
test ' {} ',                              -> ok @it instanceof Object;\
                                             equal Object.keys(@it).length, 0
test ' {foo:1} ',                         -> ok @it instanceof Object;\
                                             equal Object.keys(@it).length, 1;\
                                             equal @it.foo, 1
test ' a = {foo:1}; a.foo ',              -> equal @it, 1
test ' if true then 1 else 2 ',           -> equal @it, 1
test ' if false then 1 else 2 ',          -> equal @it, 2
test ' a = "bar" ',                       -> equal @it, 'bar'
test ' a = "bar"; a ',                    -> equal @it, 'bar'
test '''
a = 'foo'
b = 'bar'
a + b
''',                                      -> equal @it, 'foobar'
test ' 1 + 2 * 3 + 4 ',                   -> equal @it, 11
test '''
foo = (bar) -> return bar + 1
foo(1)
''',                                      -> equal @it, 2
test '''
outer = (foo) ->
  inner = ->
    return foo + 1
func = outer(1)
func()
''',                                      -> equal @it, 2
test '''
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
''',                                      -> equal @it, 6
test '''
outer = (foo) ->
  inner = ->
    bar = bar + 1
  bar = foo
  return inner
func = outer(1)
func()
func()
''',                                      -> ok isNaN @it
test ' [1..5].length ',                   -> equal @it, 5
test ' [1...5].length ',                  -> equal @it, 4
test '''
outer = (foo) ->
  bar = foo
  inner = ->
    bar = bar + 1
func = outer(1)
a = func() for i in [1..5]
a
''',                                      -> equal @it, 6
test '''
a = [1,2,3]
a[3] = 4
a
''',                                      -> deepEqual @it, [1,2,3,4]
test ' (x for x in [1,2,3]) ',            -> deepEqual @it, [1,2,3]

canon = (str) -> str.replace /#[a-zA-Z0-9]{12}/g, '#'
test " ''+[1,2,3] ",                      -> equal canon(@it), '[# 0:1,1:2,2:3]'
test " ''+[] ",                           -> equal canon(@it), '[# ]'
test " ''+{foo:'bar'} ",                  -> equal canon(@it), '{# "foo":"bar"}'
test """
foo = {}
foo.bar = 1
foo.baz = ->
''+foo
""",                                      -> equal canon(@it), '{# \"bar\":1,\"baz\":(<#>)}'
test """
foo = {}
foo.bar = 1
foo.foo = foo
''+foo
""",                                      -> equal canon(@it), '{# \"bar\":1,\"foo\":{<#>}}'

###
test "Array", Array
test """
foo = ->
  1 + 1
foo()""", 2

# construction tests
test """
a = ->
new a""", (it) ->
  assert.ok it instanceof Object
  assert.ok Object.keys(it).length is 0
  yes

test """
Foo = ->
  this.a = 'A'
  this.b = 'B'
f = new Foo()""", (it) ->
  assert.ok it instanceof Object
  assert.ok Object.keys(it).length is 2
  assert.ok it.a is 'A' and it.b is 'B'
  yes

test """
p = {key:'value'}
Foo = ->
Foo.prototype = p
f = new Foo
f.key""", 'value'

test """
_ = require('underscore')
Object.keys(foo:1, bar:2, baz:3).join(',')""", 'foo,bar,baz'
###

counter = 0
runNextTest = ->
  return if tests.length is 0
  {code, callback} = tests.shift()
  console.log "#{red "test #{counter++}:"}\n#{normal code}"
  kernel = new JKernel()
  try
    kernel.run
      code:code
      stdin:undefined
      stdout: (msg) -> process.stdout.write(msg)
      stderr: (msg) -> process.stderr.write(msg)
      callback: ->
        try
          ok not @error?, "Thread errored out: #{inspect @error}"
          callback.call context:@, it:@last.jsValue
          # callbacks are synchronous.
          # if it didn't throw, it was successful.
          runNextTest()
        catch err
          console.log red "TEST ERROR:"
          console.log red err.stack ? err
          process.exit(1)
  catch err
    console.log red "KERNEL ERROR:"
    console.log red err.stack ? err
    process.exit(1)
runNextTest()
