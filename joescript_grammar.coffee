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
Loop = clazz 'Loop', Node, ->
  init: (@block) ->
  toString: -> "loop{#{@block}}"
Switch = clazz 'Switch', Node, ->
  init: ({@obj, @cases, @default}) ->
  toString: -> "switch(#{@obj}){#{@cases.join('//')}//else{#{@default}}}"
Case = clazz 'Case', Node, ->
  init: ({@matches, @block}) ->
  toString: -> "when #{@matches.join ','}{#{@block}}"
Operation = clazz 'Operation', Node, ->
  init: ({@left, @op, @right}) ->
  toString: -> "(#{@left or ''}#{@op}#{@right or ''})"
Statement = clazz 'Statement', Node, ->
  init: ({@type, @expr}) ->
  toString: -> "#{@type}(#{@expr});"
Invocation = clazz 'Invocation', Node, ->
  init: ({@func, @params}) ->
  toString: -> "#{@func}(#{@params})"
Assign = clazz 'Assign', Node, ->
  init: ({@target, @value}) ->
  toString: -> "#{@target}=(#{@value})"
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
  init: (@chars) ->
  toString: -> "'#{@chars.join('').replace /'/g, "\\'"}'"
Dummy = clazz 'Dummy', Node, ->
  init: (@args) ->
  toString: -> "{#{@args}}"

checkIndent = (ws) ->
  if @stack[@stack.length-2].name is 'SWITCH'
    blockIndex = @stack.length-2
    [block, indent] = @stack[blockIndex..@stack.length-1]
  else
    blockIndex = @stack.length-3
    [block, _, indent] = @stack[blockIndex..@stack.length-1]
  assert.ok block.name in ['BLOCK', 'SWITCH']
  assert.equal indent.name, 'INDENT'
  # find the last INDENT on the stack
  lastIndent = ''
  for i in [blockIndex-1..0] by -1
    if @stack[i].name in ['START', 'BLOCK', 'SWITCH']
      lastIndent = @stack[i].indent ? ''
      break
  # if ws starts with lastIndent
  if ws.length > lastIndent and ws.indexOf(lastIndent) is 0
    return block.indent=ws
  null

checkNewline = (ws) ->
  @storeCache = no
  newline = @stack[@stack.length-1]
  assert.equal newline.name, 'NEWLINE'
  # find the current INDENT on the stack
  currentIndent = ''
  for i in [@stack.length-2..0] by -1
    if @stack[i].name in ['START', 'BLOCK', 'SWITCH']
      currentIndent = @stack[i].indent ? ''
      break
  if ws is currentIndent
    return ws
  null

GRAMMAR = Grammar ({o, t}) ->
  START:                  o "__INIT__ &:LINES _"
  __INIT__:               o "''", -> # init
  LINES:                  o "LINE*{NEWLINE;,}", Block
  LINE:
    POSTIF:               o "block:$$ _IF cond:EXPR", If
    POSTFOR:              o "block:$$ _FOR keys:SYMBOL*{_COMMA;1,2} type:(_IN|_OF) obj:EXPR", For
    STMT:                 o "type:(_RETURN|_THROW) expr:$?", Statement
    EXPR:
      INVOC_IMPL:         o "func:ASSIGNABLE __ params:EXPR*{_COMMA;1,}", Invocation
      OBJ_IMPL:           o "___?  &:ITEM_IMPL*{_COMMA;1,}", Obj
      ASSIGN:             o "target:ASSIGNABLE _ '=' value:EXPR", Assign
      COMPLEX:
        IF:               o "_IF cond:EXPR block:BLOCK @:(NEWLINE? _ELSE elseBlock:BLOCK)?", If
        FOR:              o "_FOR keys:SYMBOL*{_COMMA;1,2} type:(_IN|_OF) obj:EXPR block:BLOCK", For
        LOOP:             o "_LOOP &:BLOCK", Loop
        SWITCH:           o "_SWITCH obj:EXPR INDENT cases:CASE*{NEWLINE;,} default:DEFAULT?", Switch
        ' CASE':          o "_WHEN matches:EXPR*{_COMMA;1,} block:BLOCK", Case
        ' DEFAULT':       o "NEWLINE _ELSE &:BLOCK"
      # ordered
      OP0:                o "left:$$ _ op:('=='|'!='|'<'|'<='|'>'|'>='|_IS|_ISNT) right:$", Operation
      OP1:                o "left:$$ _ op:('+'|'-')                               right:$", Operation
      OP2:                o "left:$$ _ op:('*'|'/'|'%')                           right:$", Operation
      OP3:                o "left:$  op:('--'|'++')        |       op:('--'|'++') right:$", Operation
      ASSIGNABLE:
        # left recursive
        INDEX_BR:         o "obj:ASSIGNABLE type:'['  attr:EXPR _ ']'", Index
        INDEX_DT:         o "obj:ASSIGNABLE type:'.'  attr:SYMBOL", Index
        INDEX_PR:         o "obj:ASSIGNABLE type:'::' attr:SYMBOL?", Index
        INVOC_EXPL:       o "func:ASSIGNABLE '(' params:EXPR*{_COMMA;0,} _ ')'", Invocation
        SOAK:             o "&:ASSIGNABLE '?'", Soak
        # rest 
        ARRAY:            o "_ '[' &:EXPR*{_COMMA;,} _']'", Arr
        OBJ_EXPL:         o "_ '{' &:ITEM_EXPL*{_COMMA;,} _ '}'", Obj
        PAREN:            o "_ '(' &:EXPR _ ')'"
        PROPERTY:         o "obj:THIS attr:SYMBOL", Index
        THIS:             o "_THISAT", This
        REGEX:            o "_ FSLASH &:(!FSLASH (ESC | .))* FSLASH <words:1> flags:/[a-zA-Z]*/", Str
        STRING:
          STRING1:        o "_ QUOTE  &:(!QUOTE  (ESC | .))* QUOTE",  Str
          STRING2:        o "_ DQUOTE &:(!DQUOTE (ESC | .))* DQUOTE", Str
        NUMBER:           o "_ <words:1> &:/[0-9]+(\\.[0-9]*)?/", Number
        SYMBOL:           o "_ !_KEYWORD <words:1> &:/[a-zA-Z\\$_][a-zA-Z\\$_0-9]*/", Symbol
  __OBJECTS:
    ITEM_EXPL:            o "this:_THISAT? key:SYMBOL value:(_COLON &:EXPR)?", Item
    ITEM_IMPL:            o "key:SYMBOL _COLON value:EXPR", Item
  __BLOCKS:
    BLOCK:
      __INLINE:           o "_THEN &:LINE", Block
      __INDENTED:         o "INDENT &:LINE*{NEWLINE;1,}", Block
    INDENT:               o "TERM &:_", checkIndent
    NEWLINE:              o "TERM &:_", checkNewline
    TERM:                 o "_ &:('\r\n'|'\n')"
  __TOKENS:
    _KEYWORD:             t 'if', 'else', 'for', 'in', 'loop', 'switch', 'when', 'return', 'throw', 'then', 'is', 'isnt'
    _COMMA:               o "_ ','"
    _COLON:               o "_ ':'"
    _THISAT:              o "_ '@'"
    QUOTE:                o "'\\''"
    DQUOTE:               o "'\"'"
    FSLASH:               o "'/'"
    SLASH:                o "'\\\\'"
  __WHITESPACES:
    _:                    o "<words:1> /[ ]*/"
    __:                   o "<words:1> /[ ]+/"
    ___:                  o "<words:1> /[ ]+/" # TODO also capture comments, etc.
  __OTHER:
    '.':                  o "<chars:1> /[\\s\\S]/"
    'ESC':                o "SLASH &:.", (chr) -> '\\'+chr


counter = 0
test  = (code, expected) ->
  # hack to make tests easier to write.
  code = code.replace(/\\/g, '\\\\').replace(/\r/g, '\\r')
  try
    context = GRAMMAR.parse code, debug:no
    assert.equal ''+context.result, expected
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
test  "aString = 'foo'", "aString=('foo')"
test  "'foo'.length", "('foo').length"
test  "[1, 2, 3]", "[1,2,3]"
test  "[1, 2, 3, [4, 5]]", "[1,2,3,[4,5]]"
test  "foo?.bar['baz']::", "((((foo)?).bar)['baz']).prototype"
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
      """, "x=(1)\nswitch(x){when 1{'correct'}//else{'incorrect'}}"
test  "foo.replace(bar).replace(baz)", "((foo).replace(bar)).replace(baz)"
test  "foo.replace(/\\/g, 'bar')", "(foo).replace('\\\\','bar')"
test  """
_ = require 'underscore'
assert = require 'assert'
{inspect, CodeStream} = require './codestream'
{clazz} = require 'cardamom'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'
escape = (str) - (''+str).replace(/\\/g, '\\\\').replace(/\r/g,'\\r').replace(/\n/g,'\\n').replace(/'/g, "\\'")
      """, "-scratchpad-"
