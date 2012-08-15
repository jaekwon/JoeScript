require './setup'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
{equal, deepEqual, ok} = require 'assert'
joe = require 'sembly/src/joescript'
{JThread, JKernel, GLOBALS:{KERNEL, ANON}} = require 'sembly/src/interpreter'

console.log blue "\n-= interpreter test =-"

tests = []
test = (code, callback) -> tests.push code:code, callback:callback

test ' not no ',                          -> equal @it, yes
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
#test ' null * undefined ',                -> ok isNaN @it
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
try
  func()
  func()
catch err
  return 'error'
''',                                      -> equal @it, 'error' #ok isNaN @it
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
test ' "QWEQWEQWE"[2...5].split("Q") ',   -> deepEqual @it, ['E', 'W']
test '''
foo = ({a,b:bb}) -> a + bb
foo(a:1,b:2)
''',                                      -> equal @it, 3
test '''
try
  foo = somethingUndefined
catch err
  return err
return 'wtf'
''',                                      -> deepEqual @it, {name:'ReferenceError', message:'somethingUndefined is not defined', stack:[]}
test '''
foo = {bar:1, baz:2}
accum = ''
for key of foo
  accum += key
accum
''',                                      -> equal @it, 'barbaz'
test '''
foo = 1
foo++
''',                                      -> equal @it, 1
test '''
foo = 1
foo++
foo
''',                                      -> equal @it, 2
test '''
foo = {bar:{baz:1}}
foo.bar.baz++
foo.bar.baz
''',                                      -> equal @it, 2
# short circuit
test '''
called = ''
foo = ->
  called += 'foo'
  123
bar = ->
  called += 'bar'
  234
result = (foo() or bar())
"#{called}/#{result}"
''',                                      -> equal @it, 'foo/123'
test '''
called = ''
foo = ->
  called += 'foo'
  0
bar = ->
  called += 'bar'
  234
result = (foo() or bar())
"#{called}/#{result}"
''',                                      -> equal @it, 'foobar/234'
test '''
foo = {bar:[]}
foo.bar?
''',                                      -> equal @it, yes
test 'foo = if false then 1',             -> equal @it, undefined
test '''
foo = {}
''+foo
''',                                      -> ok @it.startsWith '[object'
test ' undefined == undefined ',          -> equal @it, true
test ' undefined == null ',               -> equal @it, false
test ' undefined? ',                      -> equal @it, false
test ' null? ',                           -> equal @it, false
test ' 0? ',                              -> equal @it, true
test ' false? ',                          -> equal @it, true
test '''
foo = ->
  a = 0
  loop
    a++
    return a if a > 100000
  return 1
    
foo()
''', -> ok true

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
    callback: (err) ->
      if err?
        console.log red "TEST ERROR:"
        @printErrorStack()
        process.exit(1)
        return
      callback.call context:@, it:@last.jsValue(@)
      # callbacks are synchronous.
      # if it didn't throw, it was successful.
      runNextTest()
runNextTest()
