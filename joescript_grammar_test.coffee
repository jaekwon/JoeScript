{GRAMMAR, NODES} = require './joescript_grammar'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'
assert = require 'assert'

console.log "-=TEST=-"

counter = 0
test  = (code, expected) ->
  # hack to make tests easier to write.
  code = code.replace(/\\/g, '\\\\').replace(/\r/g, '\\r')
  try
    context = GRAMMAR.parse code, debug:no, returnContext:yes
    assert.equal (''+context.result).replace(/[\n ]+/g, ''), expected.replace(/[\n ]+/g, '')
  catch error
    if expected isnt null
      try
        GRAMMAR.parse code, debug:yes, returnContext:yes
      catch error
        # pass
      console.log "Failed to parse code:\n#{red code}\nExpected:\n#{expected}\nResult:\n#{yellow context?.result}"
      throw error
  console.log "t#{counter++} OK\t#{code}"

test  "a * b * c", "((a*b)*c)"
test  "a * b++ / c + d", "(((a*(b++))/c)+d)"
test  " a * b++ / c + d ", "(((a*(b++))/c)+d)"
test  "return foo", 'return(foo);'
test  "foo if bar if baz", "if(baz){if(bar){foo}}"
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
test  "foo[bar]", "(foo)[bar]"
test  "foo[bar][baz]", "((foo)[bar])[baz]"
test  "123", "123"
test  "123.456", "123.456"
test  "123.456.789", null
test  "123.456 + foo.bar", "(123.456+(foo).bar)"
test  "{foo: 1}", "{foo:(1)}"
test  "{'foo': 1}", "{\"foo\":(1)}"
test  "{foo: bar: 1}", "{foo:({bar:(1)})}"
test  "foo: bar: 1", "{foo:({bar:(1)})}"
test  "foo: bar: func param1", "{foo:({bar:(func(param1))})}"
test  "foo: bar: func param1, param2a:A, param2b:B", "{foo:({bar:(func(param1,{param2a:(A),param2b:(B)}))})}"
test  "aString = 'foo'", "aString=(\"foo\")"
test  "'foo'.length", "(\"foo\").length"
test  "[1, 2, 3]", "[1,2,3]"
test  "[1, 2, 3, [4, 5]]", "[1,2,3,[4,5]]"
test  "foo?.bar['baz']::", "((((foo)?).bar)[\"baz\"]).prototype"
test  "@foo == @bar.baz", "((@).foo==((@).bar).baz)"
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
      """, "x=(1)\nswitch(x){when 1{\"correct\"}//else{\"incorrect\"}}"
test  "foo.replace(bar).replace(baz)", "((foo).replace(bar)).replace(baz)"
test  "foo.replace(/\\/g, 'bar')", "(foo).replace(\"\\\\\",\"bar\")"
test  "a = () ->", "a=(()->{undefined})"
test  "a = (foo) -> foo", "a=((foo)->{foo})"
test  "a = (foo = 2) -> foo", "a=((foo=2)->{foo})"
test  "a = ({foo,bar}) -> foo", "a=(({foo,bar})->{foo})"
test  "a += 2", "a+=(2)"
test  "a = [0..2]", "a=(Range(start:0,end:2,type:'..', by:1))"
test  "for x in [0..10] then console.log x", "for x in Range(start:0,end:10,type:'..', by:1){(console).log(x)}"
test  "for x in array[0..10] then console.log x", "for x in array[Range(start:0,end:10,type:'..', by:1)]{(console).log(x)}"
test  "a = \"My Name is \#{user.name}\"", "a=(\"My Name is \#{(user).name}\")"
test  "a = \"My Name is \#{\"Mr. \#{user.name}\"}\"", "a=(\"My Name is \#{\"Mr. \#{(user).name}\"}\")"
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
      baz=(\"baz\")
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
foo(bar)
baz(bak)
"""
test """
"first line" if true
"next line"
""", """
if(true){"first line"}"next line"
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
""", "(@).stuff=({foo,bar,baz,bak})"

console.log "TESTING FILES:"
for filename in ['codestream.coffee', 'joeson.coffee', 'joeson_grammar.coffee', 'joescript_grammar.coffee', 'joescript_grammar.joe']
  console.log "FILE: #{filename}"
  chars = require('fs').readFileSync filename, 'utf8'
  try
    context = GRAMMAR.parse chars, debug:no
    console.log "FILE: #{filename} OK!"
  catch error
    console.log "ERROR: "+error
    break
