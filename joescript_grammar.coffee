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
  init: ({@block, @keys, @type, @obj}) ->
  toString: -> "for #{@keys.join ','} in #{@obj}{#{@block}}"
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
  init: ({@left, @op, @right}) ->
  toString: -> "(#{@left or ''} #{@op} #{@right or ''})"
Statement = clazz 'Statement', Node, ->
  init: ({@type, @expr}) ->
  toString: -> "#{@type}(#{@expr ? ''});"
Invocation = clazz 'Invocation', Node, ->
  init: ({@func, @params}) ->
  toString: -> "#{@func}(#{@params})"
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
  init: ({@this, @key, @value}) ->
  toString: -> "#{if @this then '@' else ''}#{@key}:(#{@value})"
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

INDENT_CONTAINERS = ['START', 'BLOCK', 'SWITCH', 'OBJ_IMPL', 'INVOC_IMPL']
debugIndent = yes

checkIndent = (ws) ->
  @storeCache = no
  @stack[0].indent ?= '' # set default lazily
  indent = @stack[@stack.length-1]
  assert.equal indent.name, 'INDENT'
  for idx in [@stack.length-2..0] by -1
    if @stack[idx].name in INDENT_CONTAINERS
      containerIndex = idx
      container = @stack[idx]
      break
  assert.ok container.name in INDENT_CONTAINERS
  @log "INDENT CONTAINER IS #{container.name}, containerIndex=#{containerIndex}" if debugIndent
  # get the parent container's indent string
  lastIndent = ''
  for i in [containerIndex-1..0] by -1
    if @stack[i].name in INDENT_CONTAINERS
      if @stack[i].indent?
        @log "PARENT CONTAINER's index is #{i}" if debugIndent
        lastIndent = @stack[i].indent ? ''
        break
      else
        # INDENT_CONTAINERs need not always use an INDENT.
  # if ws starts with lastIndent... valid
  if ws.length > lastIndent.length and ws.indexOf(lastIndent) is 0
    container.indent = ws
    if debugIndent
      @log "#{ws.length} > #{lastIndent.length} and #{ws.indexOf(lastIndent) is 0}"
      for idx in [0..@stack.length-1]
        @log "#{idx}: #{@stack[idx].name}\t[#{@stack[idx].indent}]"
    return container.indent
  null

checkNewline = (ws) ->
  @storeCache = no
  newline = @stack[@stack.length-1]
  assert.equal newline.name, 'NEWLINE'
  # find the current INDENT on the stack
  currentIndent = ''
  for i in [@stack.length-2..0] by -1
    if @stack[i].indent? and @stack[i].name in INDENT_CONTAINERS
      currentIndent = @stack[i].indent
      @log "currentIndent='#{currentIndent}', i=#{i}, @stack.length=#{@stack.length}, ws='#{ws}'" if debugIndent
      break
  if ws is currentIndent
    return ws
  null

GRAMMAR = Grammar ({o, t}) ->
  START:                  o "__INIT__ &:LINES __EXIT__ _"
  __INIT__:               o "BLANK*", -> # init code
  __EXIT__:               o "BLANK*", -> # exit code
  LINES:                  o "LINE*NEWLINE", Block
  LINE:
    HEREDOC:              o "_ '###' !'#' &:(!'###' .)* '###'", (it) -> Heredoc it.join ''
    POSTIF:               o "block:$$ _IF cond:EXPR", If
    POSTFOR:              o "block:$$ _FOR keys:SYMBOL*_COMMA{1,2} type:(_IN|_OF) obj:EXPR", For
    STMT:                 o "type:(_RETURN|_THROW) expr:$? | type:_BREAK", Statement
    EXPR:
      FUNC:               o "params:PARAMS? _ type:('->'|'=>') block:BLOCK?", Func
      INVOC_IMPL:         o "func:ASSIGNABLE __ params:EXPR*_COMMA{1,}", Invocation
      OBJ_IMPL:           o "| INDENT &:ITEM_IMPL*(_COMMA | NEWLINE){1,}
                             |          ITEM_IMPL*_COMMA{1,}", Obj
      ASSIGN:             o "target:ASSIGNABLE _ type:('='|'+='|'-='|'*='|'/='|'?=') value:EXPR", Assign
      COMPLEX:
        IF:               o "_IF cond:EXPR block:BLOCK @:(NEWLINE? _ELSE elseBlock:BLOCK)?", If
        FOR:              o "_FOR keys:SYMBOL*_COMMA{1,2} type:(_IN|_OF) obj:EXPR block:BLOCK", For
        LOOP:             o "_LOOP block:BLOCK", While
        WHILE:            o "_WHILE cond:EXPR block:BLOCK", While
        SWITCH:           o "_SWITCH obj:EXPR INDENT cases:CASE*NEWLINE default:DEFAULT?", Switch
        ' CASE':          o "_WHEN matches:EXPR*_COMMA{1,} block:BLOCK", Case
        ' DEFAULT':       o "NEWLINE _ELSE &:BLOCK"
      # ordered
      OP0:                o "left:$$ _ op:('=='|'!='|'<'|'<='|'>'|'>='|_IS|_ISNT) right:$", Operation
      OP1:                o "left:$$ _ op:('+'|'-')                               right:$", Operation
      OP2:                o "left:$$ _ op:('*'|'/'|'%')                           right:$", Operation
      OP3:                o "left:$  op:('--'|'++')        |       op:('--'|'++') right:$", Operation
      ' PARAMS':          o "_ '(' &:PARAM*_COMMA _ ')'"
      ' PARAM':           o "ASSIGN | ASSIGNABLE"
      ASSIGNABLE:
        # left recursive
        RANGED_OBJ:       o "obj:ASSIGNABLE !__ &:RANGE"
        INDEX_BR:         o "obj:ASSIGNABLE type:'['  attr:EXPR _ ']'", Index
        INDEX_DT:         o "obj:ASSIGNABLE type:'.'  attr:SYMBOL", Index
        INDEX_PR:         o "obj:ASSIGNABLE type:'::' attr:SYMBOL?", Index
        INVOC_EXPL:       o "func:ASSIGNABLE '(' params:EXPR*_COMMA{0,} _ ')'", Invocation
        SOAK:             o "&:ASSIGNABLE '?'", Soak
        # rest 
        RANGE:            o "_ '[' start:EXPR? _ type:('...'|'..') end:EXPR? _ ']' by:(_BY &:EXPR)?", Range
        ARRAY:            o "_ '[' &:EXPR*_COMMA _']'", Arr
        OBJ_EXPL:         o "_ '{' &:ITEM_EXPL*_COMMA _ '}'", Obj
        PAREN:            o "_ '(' &:EXPR _ ')'"
        PROPERTY:         o "obj:THIS attr:SYMBOL", Index
        THIS:             o "_THISAT", This
        REGEX:            o "_ FSLASH &:(!FSLASH (ESC2 | .))* FSLASH <words:1> flags:/[a-zA-Z]*/", Str
        STRING:
          STRING1:        o "_ QUOTE  &:(!QUOTE  (ESC2 | .))* QUOTE",  Str
          STRING2:        o "_ DQUOTE &:(!DQUOTE (ESC2 | ESCSTR | .))* DQUOTE", Str
          ' ESCSTR':      o "'\#{' &:EXPR _ '}'"
        BOOLEAN:          o "_TRUE | _FALSE", (it) -> it is 'true'
        NUMBER:           o "_ <words:1> &:/-?[0-9]+(\\.[0-9]+)?/", Number
        SYMBOL:           o "_ !_KEYWORD <words:1> &:/[a-zA-Z\\$_][a-zA-Z\\$_0-9]*/", Symbol
  __OBJECTS:
    ITEM_EXPL:            o "this:_THISAT? key:SYMBOL value:(_COLON &:EXPR)?", Item
    ITEM_IMPL:            o "key:SYMBOL _COLON value:EXPR", Item
  __BLOCKS:
    BLOCK:
      __INLINE:           o "_THEN? &:LINE", Block
      __INDENTED:         o "INDENT &:LINE*NEWLINE{1,}", Block
    INDENT:               o "BLANK*{1,} &:_", checkIndent
    NEWLINE:              o "BLANK*{1,} &:_", checkNewline
    TERM:                 o "_ &:('\r\n'|'\n')"
  __TOKENS:
    _KEYWORD:             t 'if', 'else', 'for', 'in', 'loop', 'while', 'break', 'switch', 'when', 'return', 'throw', 'then', 'is', 'isnt', 'true', 'false', 'by'
    _COMMA:               o "TERM? _ ',' TERM?"
    _COLON:               o "_ ':'"
    _THISAT:              o "_ '@'"
    QUOTE:                o "'\\''"
    DQUOTE:               o "'\"'"
    FSLASH:               o "'/'"
    SLASH:                o "'\\\\'"
  __WHITESPACES:
    _:                    o "<words:1> /[ ]*/"
    __:                   o "<words:1> /[ ]+/"
    BLANK:                o "_ COMMENT? TERM"
    COMMENT:              o "_ !HEREDOC '#' (!TERM .)*"
    #___:                  o "(__ | BLANK)*"
  __OTHER:
    '.':                  o "<chars:1> /[\\s\\S]/"
    ESC2:                 o "SLASH &:.", (chr) -> '\\'+chr
# ENDGRAMMAR


counter = 0
test  = (code, expected) ->
  # hack to make tests easier to write.
  code = code.replace(/\\/g, '\\\\').replace(/\r/g, '\\r')
  try
    context = GRAMMAR.parse code, debug:no
    assert.equal (''+context.result).replace(/[\n ]+/g, ''), expected.replace(/[\n ]+/g, '')

  catch error
    if expected isnt null
      try
        GRAMMAR.parse code, debug:yes
      catch error
        # pass
      console.log "Failed to parse code:\n#{red code}\nExpected:\n#{expected}\nResult:\n#{yellow context?.result}"
      throw error
  console.log "t#{counter++} OK\t#{code}"

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
test  "foo[bar]", "(foo)[bar]"
test  "foo[bar][baz]", "((foo)[bar])[baz]"
test  "123", "123"
test  "123.456", "123.456"
test  "123.456.789", null
test  "123.456 + foo.bar", "(123.456+(foo).bar)"
test  "{foo: 1}", "{foo:(1)}"
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
test  "a = ({foo,bar}) -> foo", "a=(({foo:(undefined),bar:(undefined)})->{foo})"
test  "a += 2", "a+=(2)"
test  "a = [0..2]", "a=(Range(start:0,end:2,type:'..', by:1))"
test  "for x in [0..10] then console.log x", "for x in Range(start:0,end:10,type:'..', by:1){(console).log(x)}"
test  "for x in array[0..10] then console.log x", "for x in Range(obj:array,start:0,end:10,type:'..', by:1){(console).log(x)}"
test  "a = \"My Name is \#{user.name}\"", "a=(\"My Name is \#{(user).name}\")"
test  "a = \"My Name is \#{\"Mr. \#{user.name}\"}\"", "a=(\"My Name is \#{\"Mr. \#{(user).name}\"}\")"
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
