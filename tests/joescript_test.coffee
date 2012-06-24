{GRAMMAR, NODES} = require 'joeson/src/joescript'
{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'

console.log blue "\n-= basic test =-"

counter = 0
test  = (code, expected) ->
  console.log "#{red "test #{counter++}:"}\n#{normal code}"
  # hack to make tests easier to write.
  code = code.replace(/\\/g, '\\\\').replace(/\r/g, '\\r')
  try
    context = GRAMMAR.parse code, debug:no, returnContext:yes
    assert.equal (''+context.result).replace(/[\n ]+/g, ''), expected.replace(/[\n ]+/g, '')
  catch error
    try
      GRAMMAR.parse code, debug:yes, returnContext:yes
    catch error
      # pass
    console.log "Failed to parse code:\n#{red code}\nExpected:\n#{expected}\nResult:\n#{yellow context?.result}"
    console.log error.stack
    process.exit(1)

test  "!!a", "(! (! a))"
test  "a * b * c", "((a*b)*c)"
test  "a * b++ / c + d", "(((a*(b++))/c)+d)"
test  " a * b++ / c + d ", "(((a*(b++))/c)+d)"
test  "return foo", 'return(foo);'
test  "foo if bar if baz", "if(baz){if(bar){foo}}"
test  """
      a = 1; b = 2;
      """, "a = (1);b = (2)"
test  """
      a = 1; b = 2
      """, "a = (1);b = (2)"
test  """
      a = 1;
      b = 2
      """, "a = (1);b = (2)"
test  """
      a = 1
      b = 2
      """, "a = (1);b = (2)"
test  """
      if condition
        func true
      """, "if(condition){func(true)}"
test  """
      if condition
        func true
      else
        func false
      """, "if(condition){func(true)}else{func(false)}"
test  """
      if condition1
        func true
      else if condition2
        func false
      else
        func undefined
      """, "if(condition1){func(true)}else{if(condition2){func(false)}else{func(undefined)}}"
test  "foo[bar]", "foo[bar]"
test  "foo[bar][baz]", "foo[bar][baz]"
test  "123", "123"
test  "123.456", "123.456"
test  "123.456 + foo.bar", "(123.456+foo.bar)"
test  "{foo: 1}", "{foo:(1)}"
test  "{'foo': 1}", "{\"foo\":(1)}"
test  "{foo: bar: 1}", "{foo:({bar:(1)})}"
test  "foo: bar: 1", "{foo:({bar:(1)})}"
test  "foo: bar: func param1", "{foo:({bar:(func(param1))})}"
test  "foo: bar: func param1, param2a:A, param2b:B", "{foo:({bar:(func(param1,{param2a:(A),param2b:(B)}))})}"
test  "aString = 'foo'", "aString=(\"foo\")"
test  "'foo'.length", "\"foo\".length"
test  "[1, 2, 3]", "[1,2,3]"
test  "[1, 2, 3, [4, 5]]", "[1,2,3,[4,5]]"
test  "foo?.bar['baz']::", "(foo)?.bar[\"baz\"].prototype"
test  "@foo == @bar.baz", "(@.foo==@.bar.baz)"
test  "x for x in [1,2,3]", "for x in [1,2,3]{x}"
test  """
      for x in [1,2,3]
        x+1
      """, "for x in [1,2,3]{(x+1)}"
test  "for x in [1,2,3] then x + 1", "for x in [1,2,3]{(x+1)}"
test  "for x in [1,2,3] then x + 1 for y in [1,2,3]", "for x in [1,2,3]{for y in [1,2,3]{(x+1)}}"
test  "for x in [1,2,3] then x + 1 for y in [1,2,3] if true", "for x in [1,2,3]{if(true){for y in [1,2,3]{(x+1)}}}"
test  """
      x = 1
      switch x
        when 1
          "correct"
        else
          "incorrect"
      """, "x=(1);\nswitch(x){when 1{\"correct\"}//else{\"incorrect\"}}"
test  "foo.replace(bar).replace(baz)", "foo.replace(bar).replace(baz)"
test  "foo.replace(/\\/g, 'bar')", "foo.replace(\"\\\\\",\"bar\")"
test  "a = () ->", "a=(()->{undefined})"
test  "a = (foo) -> foo", "a=((foo)->{foo})"
test  "a = (foo = 2) -> foo", "a=((foo=2)->{foo})"
test  "a = ({foo,bar}) -> foo", "a=(({foo,bar})->{foo})"
test  "a += 2", "a+=(2)"
test  "a = [0..2]", "a=(Range(start:0,end:2,type:'..', by:1))"
test  "for x in [0..10] then console.log x", "for x in Range(start:0,end:10,type:'..', by:1){console.log(x)}"
test  "for x in array[0..10] then console.log x", "for x in array[Range(start:0,end:10,type:'..', by:1)]{console.log(x)}"
test  "a = \"My Name is \#{user.name}\"", "a=(\"My Name is \#{user.name}\")"
test  "a = \"My Name is \#{\"Mr. \#{user.name}\"}\"", "a=(\"My Name is \#{\"Mr. \#{user.name}\"}\")"
test  "line instanceof Object and 'true'", '(instanceof(line,Object) and "true")'
test  "lines.length-1", '(lines.length - 1)'
test  "foo( func x for x in items )", 'foo(for x in items {func(x)})'
test  """
foo: FOO
bar: BAR
""", "{foo:(FOO),bar:(BAR)}"
test  """
a =
  foo: FOO
  bar: BAR
""", "
a=({foo:(FOO),bar:(BAR)})"
test  "func = -> x ?= -> if true then 'hi'", "func=(()->{x?=(()->{if(true){\"hi\"}})})"
test  """
while foo
  loop
    while bar
      baz = 'baz'
      break
""", """
while(foo){
  while(true){
    while(bar){
      baz=(\"baz\");
      break();}}}
"""
test  """
if foo?
  return foo
else if bar?
  return bar
else
  return undefined
""", "if((foo)?){return(foo);}else{if((bar)?){return(bar);}else{return(undefined);}}"
test """
foo = ->
  if foo
    return 111
  else if bar
    return 222
  else
    return 333
""", "foo=(()->{if(foo){return(111);}else{if(bar){return(222);}else{return(333);}}})"
test """
foo bar
baz bak
""", """
foo(bar);
baz(bak)
"""
test """
"first line" if true
"next line"
""", """
if(true){"first line"}; "next line"
"""
test """
func arguments...
""", "func(arguments...)"
test """
[
  o
  o
]""", '[o,o]'
test """
try
  foo bar
catch
  # pass
""", 'try{foo(bar)}catch(){}'
test """
function(
  # comment
)
""", 'function()'
test """
@stuff = {
  foo, bar,
  baz, bak
}
""", "@.stuff=({foo,bar,baz,bak})"
test """
loop
  log one
  , two
""", 'while(true){log(one,two)}'
test """
foo bar1,
  log one
  , two
, bar2
""", 'foo(bar1,log(one,two),bar2)'
test  """
foo bar,
  if true
    'true'
  else
    'false'""", 'foo(bar,if(true){"true"}else{"false"})'
test  """
foo bar,
  if true
      'true'
    else
      'false'""", 'foo(bar,if(true){"true"}else{"false"})'
test  """
foo bar,
  if true
    'true'
  else if maybe
    'maybe'
  else
    'false'""", 'foo(bar,if(true){"true"}else{if(maybe){"maybe"}else{"false"}})'
test """
foo: ->
  blah
pos:
  bar:2
""", '{foo:(()->{blah}),pos:({bar:(2)})}'
test """
if true
  "qwe"
else if line instanceof Object and idx is lines.length - 1
  "Qwe"
""", 'if(true){"qwe"}else{if((instanceof(line, Object) and (idx is (lines.length - 1)))){"Qwe"}}'
test """
{
  get: -> (foo)
  set: ->
}
""", '{get:(()->{foo}),set:(()->{undefined})}'
test """
{
  get: ->
  set: ->
}
""", '{get:(()->{undefined}),set:(()->{undefined})}'
test """
{
  foo: ->
  bar: ->
   baz: ->
  bak: ->
}
""", '{foo:(()->{undefined}),bar:(()->{{baz:(()->{undefined})}}),bak:(()->{undefined})}'
test """
console.log
  pre: "qwe"
  post: "qwe"
""", 'console.log({pre:("qwe"),post:("qwe")})'
test """
collect = (thing) =>
  if func param
    foo
  else
    bar
""", 'collect=((thing)=>{if(func(param)){foo}else{bar}})'
test """
console.log "foo1", "foo2",
  "bar"
    "baz"
  "bak"
""", 'console.log("foo1","foo2","bar","baz","bak")'
test """
collect = (thing) =>
  if func param
    foo
  else
    bar
""", 'collect=((thing)=>{if(func(param)){foo}else{bar}})'
test """
function foo,
    bar
    baz
""", 'function(foo,bar,baz)'
test """
function foo,
  bar
baz
""", 'function(foo,bar); baz'
test """
foo[bar] = 2
""", 'foo[bar] = (2)'


console.log blue "\n-= parse project files =-"

fs = require 'fs'
walkFiles = (dir, cb) ->
  fs.readdir dir, (err, files) ->
    throw err if err?
    for filename in files then do (filename) ->
      filepath = dir+'/'+filename
      fs.lstat filepath, (err, stat) ->
        throw err if err?
        cb(filepath, filename)
        walkFiles filepath, cb if stat.isDirectory() and not stat.isSymbolicLink()

walkFiles '.', (filepath, filename) ->
  return if filename[0] is '.'
  return if filepath[filepath.length-7...] isnt '.coffee'
  return if filepath.indexOf('node_modules') isnt -1
  console.log "FILE: #{filepath}"
  chars = require('fs').readFileSync filepath, 'utf8'
  context = GRAMMAR.parse chars, debug:no
  console.log "FILE: #{filepath} OK!"
