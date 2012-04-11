{Grammar} = require './joeson'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'
{clazz} = require 'cardamom'
assert = require 'assert'

Node = clazz 'Node'
Word = clazz 'Word', Node, ->
  init: (@word) ->
  toString: -> @word
Block = clazz 'Block', Node, ->
  init: (lines) ->
    @lines = if lines instanceof Array then lines else [lines]
  toString: ->
    (''+line for line in @lines).join '\n'
  toStringWithIndent: ->
    '\n  '+((''+line).replace(/\n/g, '\n  ') for line in @lines).join('\n  ')+'\n'
If = clazz 'If', Node, ->
  init: ({@cond, @block, @else}) ->
    @block = Block @block if @block not instanceof Block
  toString: ->
    if @else?
      "if(#{@cond}){#{@block}}else{#{@else}}"
    else
      "if(#{@cond}){#{@block}}"
For = clazz 'For', Node, ->
  init: ({@block, @own, @keys, @type, @obj, @cond}) ->
  toString: -> "for #{@own? and 'own ' or ''}#{@keys.join ','} #{@type} #{@obj} #{@cond? and "when #{@cond} " or ''}{#{@block}}"
While = clazz 'While', Node, ->
  init: ({@cond, @block}) -> @cond ?= true
  toString: -> "while(#{@cond}){#{@block}}"
Switch = clazz 'Switch', Node, ->
  init: ({@obj, @cases, @default}) ->
  toString: -> "switch(#{@obj}){#{@cases.join('//')}//else{#{@default}}}"
Try = clazz 'Try', Node, ->
  init: ({@block, @doCatch, @catchVar, @catchBlock, @finally}) ->
  toString: -> "try{#{@block}}#{
                @doCatch and "catch(#{@catchVar or ''}){#{@catchBlock}}" or ''}#{
                @finally and "finally{#{@finally}}" or ''}"
Case = clazz 'Case', Node, ->
  init: ({@matches, @block}) ->
  toString: -> "when #{@matches.join ','}{#{@block}}"
Operation = clazz 'Operation', Node, ->
  init: ({@left, @not, @op, @right}) ->
  toString: -> "(#{@left or ''} #{@not and 'not ' or ''}#{@op} #{@right or ''})"
Statement = clazz 'Statement', Node, ->
  init: ({@type, @expr}) ->
  toString: -> "#{@type}(#{@expr ? ''});"
Invocation = clazz 'Invocation', Node, ->
  init: ({@func, @params}) ->
  toString: -> "#{@func}(#{@params.map((p)->"#{p}#{p.splat and '...' or ''}")})"
Assign = clazz 'Assign', Node, ->
  init: ({@target, @type, @value}) ->
  toString: -> "#{@target}#{@type}(#{@value})"
Slice = clazz 'Slice', Node, ->
  init: ({@obj, @range}) ->
  toString: -> "#{@obj}[#{@range}]"
Index = clazz 'Index', Node, ->
  init: ({obj, attr, type}) ->
    type ?= '.'
    if type is '::'
      if attr?
        obj = Index obj:obj, attr:'prototype', type:'.'
      else
        attr = 'prototype'
      type = '.'
    @obj = obj
    @attr = attr
    @type = type
  toString: ->
    close = if @type is '[' then ']' else ''
    "(#{@obj})#{@type}#{@attr}#{close}"
Soak = clazz 'Soak', Node, ->
  init: (@obj) ->
  toString: -> "(#{@obj})?"
Obj = clazz 'Obj', Node, ->
  init: (@items) ->
  toString: -> "{#{@items.join ','}}"
This = clazz 'This', Node, ->
  init: ->
  toString: -> "@"
Arr = clazz 'Arr', Obj, ->
  toString: -> "[#{@items.join ','}]"
Item = clazz 'Item', Node, ->
  init: ({@key, @value}) ->
  toString: -> @key+(if @value?   then ":(#{@value})"   else '')
Str = clazz 'Str', Node, ->
  init: (@parts) ->
  toString: ->
    parts = @parts.map (x) ->
      if x instanceof Node
        '#{'+x+'}'
      else
        x.replace /"/g, "\\\""
    '"' + parts.join('') + '"'
Func = clazz 'Func', Node, ->
  init: ({@params, @type, @block}) ->
  toString: -> "(#{if @params then @params.map(
      (p)->"#{p}#{p.splat and '...' or ''}#{p.default and '='+p.default or ''}"
    ).join ',' else ''})#{@type}{#{@block}}"
Range = clazz 'Range', Node, ->
  init: ({@start, @type, @end, @by}) ->
    @by ?= 1
  toString: -> "Range(#{@start? and "start:#{@start}," or ''}"+
                     "#{@end?   and "end:#{@end},"     or ''}"+
                     "type:'#{@type}', by:#{@by})"
Heredoc = clazz 'Heredoc', Node, ->
  init: (@text) ->
  toString: -> "####{@text}###"
Dummy = clazz 'Dummy', Node, ->
  init: (@args) ->
  toString: -> "{#{@args}}"

debugIndent = yes

checkIndent = (ws) ->
  @storeCache = no
  @stack[0].indent ?= '' # set default lazily
  container = @stack[@stack.length-2]
  assert.ok container?
  @log "INDENT CONTAINER IS #{container.name}" if debugIndent
  # get the parent container's indent string
  lastIndent = ''
  for i in [@stack.length-3..0] by -1
    if @stack[i].indent?
      @log "PARENT CONTAINER's index is #{i}" if debugIndent
      lastIndent = @stack[i].indent ? ''
      break
  # if ws starts with lastIndent... valid
  @log "ws.length #{ws.length} > lastIndent.length #{lastIndent.length}, #{ws.indexOf(lastIndent)}=0?"
  if ws.length > lastIndent.length and ws.indexOf(lastIndent) is 0
    @log "setting container.indent to #{ws}"
    container.indent = ws
    return container.indent
  null

checkNewline = (ws) ->
  @storeCache = no
  # find the current INDENT on the stack
  currentIndent = ''
  for i in [@stack.length-2..0] by -1
    if @stack[i].indent?
      currentIndent = @stack[i].indent
      @log "currentIndent='#{currentIndent}', i=#{i}, @stack.length=#{@stack.length}, ws='#{ws}'" if debugIndent
      break
  if ws is currentIndent
    return ws
  null

# like a newline, but allows additional padding
checkSoftline = (ws) ->
  @storeCache = no
  # find the current INDENT on the stack
  currentIndent = ''
  for i in [@stack.length-2..0] by -1
    if @stack[i].indent?
      currentIndent = @stack[i].indent
      @log "currentIndent='#{currentIndent}', i=#{i}, @stack.length=#{@stack.length}, ws='#{ws}'" if debugIndent
      break
  if ws.indexOf currentIndent is 0
    return resetIndent.call this, ws
  null

resetIndent = (ws) ->
  @storeCache = no
  @stack[0].indent ?= '' # set default lazily
  # find any container
  container = @stack[@stack.length-2]
  assert.ok container?
  @log "setting container.indent to #{ws}"
  container.indent = ws
  return container.indent

GRAMMAR = Grammar ({o, i, tokens}) -> [
  o "__INIT__ LINES __EXIT__ _"
  i __INIT__:                     "_BLANKLINE*", -> # init code
  i __EXIT__:                     "_BLANKLINE*", -> # exit code
  i LINES:                        "LINE*_NEWLINE", Block
  i LINE: [
    o HEREDOC:                    "_ '###' !'#' (!'###' .)* '###'", (it) -> Heredoc it.join ''
    o POSTIF:                     "block:(POSTIF|POSTFOR) &:(POSTIF_IF|POSTIF_UNLESS)"
    i POSTIF_IF:                  "_IF cond:EXPR", If
    i POSTIF_UNLESS:              "_UNLESS cond:EXPR", ({cond}) -> If cond:Operation(op:'not', right:cond)
    o POSTFOR: [
      o                           "block:STMT _FOR own:_OWN? keys:SYMBOL*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)?", For
      o STMT: [
        o                         "type:(_RETURN|_THROW) expr:EXPR? | type:_BREAK", Statement
        o EXPR: [
          o FUNC: [
            o                     "params:PARAMS? _ type:('->'|'=>') block:BLOCK?", Func
            i PARAMS:             "_ '(' (&:PARAM default:(_ '=' EXPR)?)*_COMMA _ ')'"
            i PARAM:              "&:SYMBOL splat:'...'?
                                 | &:PROPERTY splat:'...'?
                                 | OBJ_EXPL
                                 | ARRAY"
          ]
          o RIGHT_RECURSIVE: [
            o INVOC_IMPL:         "func:(ASSIGNABLE|_TYPEOF) params:(&:EXPR splat:'...'?)+_COMMA", Invocation
            o OBJ_IMPL:           "_INDENT? OBJ_IMPL_ITEM+(_COMMA | _NEWLINE)
                                   | OBJ_IMPL_ITEM+_COMMA", Obj
            o OBJ_IMPL_ITEM:      "key:(WORD|STRING) _ ':' value:EXPR", Item
            o ASSIGN:             "target:ASSIGNABLE _ type:('='|'+='|'-='|'*='|'/='|'?='|'||=') value:BLOCKEXPR", Assign
          ]
          o COMPLEX: [
            o IF:                 "_IF cond:EXPR block:BLOCK else:(_NEWLINE? _ELSE BLOCK)?", If
            o FOR:                "_FOR own:_OWN? keys:SYMBOL*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)? block:BLOCK", For
            o LOOP:               "_LOOP block:BLOCK", While
            o WHILE:              "_WHILE cond:EXPR block:BLOCK", While
            o SWITCH:             "_SWITCH obj:EXPR _INDENT cases:CASE*_NEWLINE default:DEFAULT?", Switch
            i CASE:               "_WHEN matches:EXPR+_COMMA block:BLOCK", Case
            i DEFAULT:            "_NEWLINE _ELSE BLOCK"
            o TRY:                "_TRY block:BLOCK
                                   (_NEWLINE? doCatch:_CATCH catchVar:EXPR? catchBlock:BLOCK?)?
                                   (_NEWLINE? _FINALLY finally:BLOCK)?", Try
          ]
          o OP_OPTIMIZATION:      "OP40 _ !(OP00_OP|OP10_OP|OP20_OP|OP30_OP)"
          o OP00: [
            i OP00_OP:            " '==' | '!=' | '<=' | '<' | '>=' | '>' | _IS | _ISNT "
            o                     "left:(OP00|OP10) _ op:OP00_OP _SOFTLINE? right:OP10", Operation
            o OP10: [
              i OP10_OP:          "not:_NOT? op:(_IN|_INSTANCEOF)"
              o                   "left:(OP10|OP20) _ @:OP10_OP  _SOFTLINE? right:OP20", Operation
              o OP20: [
                i OP20_OP:        " '+' | '-' | _OR | '?' "
                o                 "left:(OP20|OP30) _ op:OP20_OP _SOFTLINE? right:OP30", Operation
                o OP30: [
                  i OP30_OP:      " '*' | '/' | '%' | '&' | '&&' | _AND "
                  o               "left:(OP30|OP40) _ op:OP30_OP _SOFTLINE? right:OP40", Operation
                  o OP40: [
                    i OP40_OP:    " _NOT | '!' | '~' "
                    o             "_ op:OP40_OP right:OP50", Operation
                    o OP50: [
                      i OP50_OP:  " '--' | '++' "
                      o           "left:OPATOM op:OP50_OP", Operation
                      o           "_ op:OP50_OP right:OPATOM", Operation
                      o OPATOM:   "FUNC | RIGHT_RECURSIVE | COMPLEX | ASSIGNABLE"
                    ] # end OP50
                  ] # end OP40
                ] # end OP30
              ] # end OP20
            ] # end OP10
          ] # end OP00
        ] # end EXPR
      ] # end STMT
    ] # end POSTFOR
  ] # end LINE

  o ASSIGNABLE: [
    # left recursive
    o SLICE:        "obj:ASSIGNABLE !__ range:RANGE", Slice
    o INDEX0:       "obj:ASSIGNABLE type:'['  attr:EXPR _ ']'", Index
    o INDEX1:       "obj:ASSIGNABLE type:'.'  attr:WORD", Index
    o PROTO:        "obj:ASSIGNABLE type:'::' attr:WORD?", Index
    o INVOC_EXPL:   "func:(ASSIGNABLE|_TYPEOF) '(' ___ params:(&:EXPR splat:'...'?)*_COMMA ___ ')'", Invocation
    o SOAK:         "ASSIGNABLE '?'", Soak
    # rest
    o RANGE:        "_ '[' start:EXPR? _ type:('...'|'..') end:EXPR? _ ']' by:(_BY EXPR)?", Range
    o ARRAY:        "_ '[' ___ (&:EXPR splat:'...'?)*(_COMMA|_SOFTLINE) ___ ']'", Arr
    o OBJ_EXPL: [
      o             "_ '{' OBJ_EXPL_ITEM*_COMMA _ '}'", Obj
      i OBJ_EXPL_ITEM: "key:(PROPERTY|WORD|STRING) value:(_ ':' EXPR)?", Item
    ]
    o PARENT:       "_ '(' POSTFOR _ ')'"
    o PROPERTY:     "_ '@' (WORD|STRING)", (attr) -> Index obj:This(), attr:attr
    o THIS:         "_ '@'", This
    o REGEX:        "_ _FSLASH &:(!_FSLASH (ESC2 | .))* _FSLASH <words:1> flags:/[a-zA-Z]*/", Str
    o STRING: [
      o             "_ _QUOTE  (!_QUOTE  (ESC2 | .))* _QUOTE",  Str
      o             "_ _DQUOTE (!_DQUOTE (ESC2 | ESCSTR | .))* _DQUOTE", Str
      o             "_ _TQUOTE (!_TQUOTE (ESC2 | ESCSTR | .))* _TQUOTE", Str
      i ESCSTR:     "'\#{' _BLANKLINE* _RESETINDENT EXPR ___ '}'"
    ]
    o BOOLEAN:      "_TRUE | _FALSE", (it) -> it is 'true'
    o NUMBER:       "_ <words:1> /-?[0-9]+(\\.[0-9]+)?/", Number
    o SYMBOL:       "_ !_KEYWORD WORD"
  ]

  # BLOCKS:
  i BLOCK: [
    o               "_INDENT LINES", Block
    o               "_THEN? LINE+(_ ';')", Block
  ]
  i BLOCKEXPR:      "_INDENT? EXPR"
  i _INDENT:        "_BLANKLINE+ &:_", checkIndent
  i _NEWLINE: [
    o               "_BLANKLINE+ &:_", checkNewline
    o               "_ ';'"
  ], {skipCache: yes}
  i _SOFTLINE:      "_BLANKLINE+ &:_", checkSoftline
  i _RESETINDENT:   "_BLANKLINE* &:_", resetIndent

  # TOKENS:
  i _KEYWORD:       tokens 'if', 'unless', 'else', 'for', 'own', 'in', 'of', 'loop', 'while', 'break', 'switch',
                      'when', 'return', 'throw', 'then', 'is', 'isnt', 'true', 'false', 'by',
                      'not', 'and', 'or', 'instanceof', 'typeof', 'try', 'catch', 'finally'
  i _COMMA:         "___ ',' ___"
  i _QUOTE:         "'\\''"
  i _DQUOTE:        "'\"'"
  i _TQUOTE:        "'\"\"\"'"
  i _FSLASH:        "'/'"
  i _SLASH:         "'\\\\'"
  i '.':            "<chars:1> /[\\s\\S]/", {skipLog:yes}
  i ESC2:           "_SLASH .", ((chr) -> '\\'+chr), {skipLog:yes}
  i WORD:           "_ <words:1> /[a-zA-Z\\$_][a-zA-Z\\$_0-9]*/", Word

  # WHITESPACES:
  i _:              "<words:1> /[ ]*/", {skipLog:yes}
  i __:             "<words:1> /[ ]+/", {skipLog:yes}
  i _TERM:          "_ ('\r\n'|'\n')",  {skipLog:yes}
  i _COMMENT:       "_ !HEREDOC '#' (!_TERM .)*", {skipLog:yes}
  i _BLANKLINE:     "_ _COMMENT? _TERM", {skipLog:yes}
  i ___:            "_BLANKLINE* _", {skipLog:yes}
]
# ENDGRAMMAR

console.log "-=-=-"

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

console.log "TESTING FILES:"
for filename in ['codestream.coffee', 'joeson.coffee', 'joeson_grammar.coffee', 'joescript_grammar.coffee']
  console.log "FILE: #{filename}"
  chars = require('fs').readFileSync filename, 'utf8'
  try
    context = GRAMMAR.parse chars, debug:no
    console.log "FILE: #{filename} OK!"
  catch error
    console.log "ERROR: "+error
    break
