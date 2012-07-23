require './setup'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
{equal, deepEqual, ok} = require 'assert'
joe = require 'joeson/src/joescript'
{JThread, JKernel, GLOBALS:{KERNEL, ANON}} = require 'joeson/src/interpreter'

console.log blue "\n-= interpreter test =-"

tests = []
test = (code, callback) -> tests.push code:code, callback:callback

test '''
a = 1
b = 1
a += b
a
''',                                      -> equal @it, 2
test '''
(foo = {bar:1}; foo).bar += 1
''',                                      -> equal @it, 2
test '''
counter = 0
(counter += 1; foo = {bar:1}; foo).bar += 1
counter
''',                                      -> equal @it, 1
test ''' "foo" ''',                       -> equal @it, 'foo'
test " \"\#{1} \#{'2'} \#{\"three\"}\" ", -> equal @it, "1 2 three"
test '''
a = 1
b = 1
for i in [0..10]
  c = b
  a += b
  b = c
a
''',                                      -> equal @it, 12
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

counter = 0
runNextTest = ->
  if tests.length is 0
    KERNEL.shutdown()
    return
  {code, callback} = tests.shift()
  console.log "#{red "test #{counter++}:"}\n#{normal code}"
  KERNEL.run
    user:ANON
    code:code
    callback: ->
      if @error?
        console.log red "TEST ERROR:"
        @printErrorStack()
        process.exit(1)
        return
      callback.call context:@, it:@last.jsValue(@)
      # callbacks are synchronous.
      # if it didn't throw, it was successful.
      runNextTest()
runNextTest()
