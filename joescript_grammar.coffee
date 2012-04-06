{Grammar} = require './joeson'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'
{clazz} = require 'cardamom'
assert = require 'assert'

Node = clazz 'Node'
Symbol = clazz 'Symbol', Node, ->
  init: (@sym) ->
  toString: -> @sym
Block = clazz 'Block', Node, ->
  init: (lines) ->
    @lines = if lines instanceof Array then lines else [lines]
  toString: ->
    (''+line for line in @lines).join '\n'
  toStringWithIndent: ->
    '\n  '+((''+line).replace(/\n/g, '\n  ') for line in @lines).join('\n  ')+'\n'
If = clazz 'If', Node, ->
  init: ({@cond, @block, @elseBlock}) ->
    @block = Block @block if @block not instanceof Block
  toString: ->
    if @elseBlock?
      "if(#{@cond}){#{@block}}else{#{@elseBlock}}"
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
  toString: -> "#{@func}(#{@params.map((p)->if p.splat then p+'...' else p)})"
Assign = clazz 'Assign', Node, ->
  init: ({@target, @type, @value}) ->
  toString: -> "#{@target}#{@type}(#{@value})"
Index = clazz 'Index', Node, ->
  init: ({obj, attr, type}) ->
    type ?= '.'
    if type is '::'
      if attr?
        obj = Index obj:obj, attr:'prototype', type:'.'
      else
        attr = 'prototype'
      type = '.'
    else if type is '.'
      attr = attr.sym
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
  init: ({@this, @key, @value, @default, @splat}) ->
  toString: -> (if @this     then '@'              else '')+@key+
               (if @value?   then ":(#{@value})"   else '')+
               (if @default? then "=(#{@default})" else '')+
               (if @splat    then "..."            else '')
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
  toString: -> "(#{if @params then @params.join ',' else ''})#{@type}{#{@block}}"
Range = clazz 'Range', Node, ->
  init: ({@obj, @start, @type, @end, @by}) ->
    @by ?= 1
  toString: -> "Range(#{@obj?   and "obj:#{@obj},"     or ''}"+
                     "#{@start? and "start:#{@start}," or ''}"+
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

GRAMMAR = Grammar ({o, i, t}) -> [
  o "__INIT__ LINES __EXIT__ _"
  i
    __INIT__: o "BLANKLINE*", -> # init code
    __EXIT__: o "BLANKLINE*", -> # exit code
    LINES: o "LINE*NEWLINE", Block
    LINE: [
      o HEREDOC: "_ '###' !'#' (!'###' .)* '###'", (it) -> Heredoc it.join ''
      o POSTIF: "block:(POSTIF|POSTFOR) &:(POSTIF1|POSTIF2)"
      i   POSTIF1: o "_IF cond:EXPR", If
      i   POSTIF2: o "_UNLESS cond:EXPR", ({cond}) -> If cond:Operation(op:'not', right:cond)
      o POSTFOR: [
        o "block:STMT _FOR own:_OWN? keys:SYMBOL*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)?", For
        o STMT: [
          o "type:(_RETURN|_THROW) expr:EXPR? | type:_BREAK", Statement
          o EXPR: [
            o FUNC: [
              o "params:PARAMS? _ type:('->'|'=>') block:BLOCK?", Func
              i
                PARAMS:           o "_ '(' &:PARAM*_COMMA _ ')'"
                PARAM:            o "&:PARAM_KEY splat:'...'
                                   | &:(PARAM_KEY|PARAM_CONTAINER) (_ '=' default:EXPR)?"
                PARAM_KEY:        o "this:_THISAT? key:SYMBOL", Item
                PARAM_CONTAINER:  o "PARAM_OBJ | PARAM_ARRAY"
                PARAM_OBJ:        o "_ '{' &:PARAM_OBJ_ITEM*_COMMA _ '}'", Obj
                PARAM_OBJ_ITEM:   o "&:PARAM_KEY @:(_COLON value:PARAM_CONTAINER | _ '=' default:EXPR)?"
                PARAM_ARRAY:      o "_ '[' &:PARAM_ARRAY_ITEM*_COMMA _ ']'", Arr
                PARAM_ARRAY_ITEM: o "&:PARAM_KEY @:(_ '=' default:EXPR)?"
            ]
            o RIGHT_RECURSIVE: [
              o INVOC_IMPL: "func:(ASSIGNABLE|_TYPEOF) params:(&:EXPR splat:'...'?)*_COMMA{1,}", Invocation
              o OBJ_IMPL:   "INDENT? &:ITEM_IMPL*(_COMMA | NEWLINE){1,}
                           | ITEM_IMPL*_COMMA{1,}", Obj
              i   ITEM_IMPL: o "key:(SYMBOL|STRING) _COLON value:EXPR", Item
              o ASSIGN:     "target:ASSIGNABLE _ type:('='|'+='|'-='|'*='|'/='|'?='|'||=') value:BLOCKEXPR", Assign
            ]
            o COMPLEX: [
              o IF:      "_IF cond:EXPR block:BLOCK (NEWLINE? _ELSE elseBlock:BLOCK)?", If
              o FOR:     "_FOR own:_OWN? keys:SYMBOL*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)? block:BLOCK", For
              o LOOP:    "_LOOP block:BLOCK", While
              o WHILE:   "_WHILE cond:EXPR block:BLOCK", While
              o SWITCH:  "_SWITCH obj:EXPR INDENT cases:CASE*NEWLINE default:DEFAULT?", Switch
              i   CASE: o "_WHEN matches:EXPR*_COMMA{1,} block:BLOCK", Case
              i   DEFAULT: "NEWLINE _ELSE &:BLOCK"
            ]
            # optimization
            o OP_OPTIMIZATION: "OP40 _ !(OP00_OP|OP10_OP|OP20_OP|OP30_OP)"
            o OP00: [
              i OP00_OP: " '==' | '!=' | '<=' | '<' | '>=' | '>' | _IS | _ISNT "
              o "left:(OP00|OP10) _ op:OP00_OP SOFTLINE? right:OP10", Operation
              o OP10: [
                i OP10_OP: "not:_NOT? op:(_IN|_INSTANCEOF)"
                o "left:(OP10|OP20) _ @:OP10_OP SOFTLINE? right:OP20", Operation
                o OP20: [
                  i OP20_OP: " '+' | '-' | _OR | '?' "
                  o "left:(OP20|OP30) _ op:OP20_OP SOFTLINE? right:OP30", Operation
                  o OP30: [
                    i OP30_OP: " '*' | '/' | '%' | '&' | '&&' | _AND "
                    o "left:(OP30|OP40) _ op:OP30_OP SOFTLINE? right:OP40", Operation
                    o OP40: [
                      i OP40_OP: " _NOT | '!' | '~' "
                      o "_ op:OP40_OP right:OP50", Operation
                      o OP50: [
                        i OP50_OP: " '--' | '++' "
                        o "left:OPATOM op:OP50_OP", Operation
                        o "_ op:OP50_OP right:OPATOM", Operation
                        o OPATOM: [
                          o "FUNC | RIGHT_RECURSIVE | COMPLEX"
                          o ASSIGNABLE: [
                            # left recursive
                            o RANGED_OBJ:       o "obj:ASSIGNABLE !__ &:RANGE"
                            o INDEX_BR:         o "obj:ASSIGNABLE type:'['  attr:EXPR _ ']'", Index
                            o INDEX_DT:         o "obj:ASSIGNABLE type:'.'  attr:SYMBOL", Index
                            o INDEX_PR:         o "obj:ASSIGNABLE type:'::' attr:SYMBOL?", Index
                            o INVOC_EXPL:       o "func:(ASSIGNABLE|_TYPEOF) '(' params:(&:EXPR splat:'...'?)*_COMMA{0,} _ ')'", Invocation
                            o SOAK:             o "&:ASSIGNABLE '?'", Soak
                            # rest
                            o RANGE:            o "_ '[' start:EXPR? _ type:('...'|'..') end:EXPR? _ ']' by:(_BY &:EXPR)?", Range
                            o ARRAY:            o "_ '[' ___ &:EXPR*(_COMMA|SOFTLINE) ___ ']'", Arr
                            o OBJ_EXPL: [
                              o "_ '{' &:ITEM_EXPL*_COMMA _ '}'", Obj
                              i ITEM_EXPL: o "this:_THISAT? key:(SYMBOL|STRING) value:(_COLON &:EXPR)?", Item
                            ]
                            o PAREN:            o "_ '(' &:POSTFOR _ ')'"
                            o PROPERTY:         o "obj:THIS attr:SYMBOL", Index
                            o THIS:             o "_THISAT", This
                            o REGEX:            o "_ FSLASH &:(!FSLASH (ESC2 | .))* FSLASH <words:1> flags:/[a-zA-Z]*/", Str
                            o STRING: [
                              o "_ QUOTE  &:(!QUOTE  (ESC2 | .))* QUOTE",  Str
                              o "_ DQUOTE &:(!DQUOTE (ESC2 | ESCSTR | .))* DQUOTE", Str
                              o "_ TQUOTE &:(!TQUOTE (ESC2 | ESCSTR | .))* TQUOTE", Str
                              i ESCSTR: "'\#{' BLANKLINE* RESETINDENT &:EXPR ___ '}'"
                            ]
                            o BOOLEAN:          o "_TRUE | _FALSE", (it) -> it is 'true'
                            o NUMBER:           o "_ <words:1> &:/-?[0-9]+(\\.[0-9]+)?/", Number
                            o SYMBOL:           o "_ !_KEYWORD <words:1> &:/[a-zA-Z\\$_][a-zA-Z\\$_0-9]*/", Symbol
                          ] # end ASSIGNABLE
                        ] # end OPATOM
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

    # BLOCKS:
    BLOCK: [
      o "INDENT &:LINES", Block
      o "_THEN? &:LINE*(_ ';'){1,}", Block
    ]
    BLOCKEXPR:  o "INDENT? &:EXPR"
    INDENT:     o "BLANKLINE*{1,} &:_", checkIndent
    NEWLINE: o [
      o "BLANKLINE*{1,} &:_", checkNewline
      o "_ ';'"
      # HACK to make the NEWLINE rank always return something, so we can set @storeCache=no
      # TODO make this process more sane
      o "''", -> 'dummy'
    ], (result) -> @storeCache = no; return null if result is 'dummy'; result
    SOFTLINE:   o "BLANKLINE*{1,} &:_", checkSoftline
    RESETINDENT:o "BLANKLINE*     &:_", resetIndent

    # TOKENS:
    _KEYWORD:  t 'if', 'unless', 'else', 'for', 'own', 'in', 'of', 'loop', 'while', 'break', 'switch',
                 'when', 'return', 'throw', 'then', 'is', 'isnt', 'true', 'false', 'by',
                 'not', 'and', 'or', 'instanceof', 'typeof'
    _COMMA:    o "TERM? _ ',' TERM?"
    _COLON:    o "_ ':'"
    _THISAT:   o "_ '@'"
    QUOTE:     o "'\\''"
    DQUOTE:    o "'\"'"
    TQUOTE:    o "'\"\"\"'"
    FSLASH:    o "'/'"
    SLASH:     o "'\\\\'"
    '.':       o "<chars:1> /[\\s\\S]/"
    ESC2:      o "SLASH &:.", (chr) -> '\\'+chr

    # WHITESPACES:
    _:         o "<words:1> /[ ]*/"
    __:        o "<words:1> /[ ]+/"
    TERM:      o "_ &:('\r\n'|'\n')"
    COMMENT:   o "_ !HEREDOC '#' (!TERM .)*"
    BLANKLINE: o "_ COMMENT? TERM"
    ___:       o "BLANKLINE* _"
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
test  "a = (foo = 2) -> foo", "a=((foo=(2))->{foo})"
test  "a = ({foo,bar}) -> foo", "a=(({foo,bar})->{foo})"
test  "a += 2", "a+=(2)"
test  "a = [0..2]", "a=(Range(start:0,end:2,type:'..', by:1))"
test  "for x in [0..10] then console.log x", "for x in Range(start:0,end:10,type:'..', by:1){(console).log(x)}"
test  "for x in array[0..10] then console.log x", "for x in Range(obj:array,start:0,end:10,type:'..', by:1){(console).log(x)}"
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


console.log "TESTING FILES:"
for filename in ['codestream.coffee', 'joeson.coffee']
  console.log "FILE: #{filename}"
  chars = require('fs').readFileSync filename, 'utf8'
  try
    context = GRAMMAR.parse chars, debug:no
    console.log "FILE: #{filename} OK!"
  catch error
    console.log "ERROR: "+error
    break
