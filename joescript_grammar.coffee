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
  init: ({@obj, @attr, @attrStr, protoAttrStr, soak}) ->
    if protoAttrStr?
      @obj = Index obj:@obj, attrStr:'prototype'
    if soak?
      @_newOverride = Soak obj:@obj
  toString: ->
    if @attr?
      "(#{@obj})[#{@attr}]"
    else
      "(#{@obj}).#{@attrStr}"
Soak = clazz 'Soak', Node, ->
  init: ({@obj}) ->
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
  [block, _, indent] = @stack[@stack.length-3..@stack.length-1]
  assert.ok block.name is 'BLOCK'
  assert.equal indent.name, 'INDENT'
  # find the last INDENT on the stack
  lastIndent = ''
  for i in [@stack.length-4..0] by -1
    if @stack[i].name in ['START', 'BLOCK']
      lastIndent = @stack[i].indent ? ''
      break
  if ws.length > lastIndent and ws.indexOf(lastIndent) is 0
    return block.indent=ws
  null

checkNewline = (ws) ->
  @storeCache = no
  newline = @stack[@stack.length-1]
  assert.equal newline.name, 'NEWLINE'
  # find the current INDENT on the stack
  currentIndent = ''
  for i in [@stack.length-4..0] by -1
    if @stack[i].name in ['START', 'BLOCK']
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
    POSTIF:               o "block:$$ IF cond:EXPR", If
    POSTFOR:              o "block:$$ FOR keys:SYMBOL*{_ ',';1,2} type:(IN|OF) obj:EXPR", For
    STMT:                 o "type:(RETURN|THROW) expr:$?", Statement
    EXPR:
      INVOC:              o "func:ASSIGNABLE params:PARAMS", Invocation
      ' PARAMS':
          PARAMS0:        o "_ '(' _ &:PARAMS1 _ ')'"
          PARAMS1:        o "__ &:EXPR*{_ ',';1,}"
      OBJ_IMPL:           o "___?  &:ITEM_IMPL*{COMMA;1,}", Obj
      ASSIGN:             o "target:ASSIGNABLE _ '=' value:EXPR", Assign
      COMPLEX:
        IF_:              o "IF cond:EXPR block:BLOCK @:(NEWLINE? ELSE elseBlock:BLOCK)?", If
        FOR_:             o "FOR keys:SYMBOL*{_ ',';1,2} type:(IN|OF) obj:EXPR block:BLOCK", For
        LOOP_:            o "LOOP &:BLOCK", Loop
      OP0:                o "left:$$ _ op:('=='|'!='|'<'|'<='|'>'|'>='|IS|ISNT) right:$", Operation
      OP1:                o "left:$$ _ op:('+'|'-')                             right:$", Operation
      OP2:                o "left:$$ _ op:('*'|'/'|'%')                         right:$", Operation
      OP3:                o "left:$  op:('--'|'++')       |      op:('--'|'++') right:$", Operation
      ASSIGNABLE:
        NUMBER:           o "_ <words:1> &:/[0-9]+(\\.[0-9]*)?/", Number
        PROTO:            o "&:$ '::'", (obj) -> Index obj:obj, attrStr:'prototype'
        INDEX:            o "obj:$$ &:(IDX_BR|IDX_DT|IDX_PR|SOAK)", Index
        ' IDX_BR':        o "'['  attr:EXPR _ ']'"
        ' IDX_DT':        o "'.'  attrStr:SYMBOL"
        ' IDX_PR':        o "'::' protoAttrStr:SYMBOL"
        ' SOAK':          o "soak:'?'"
        ARRAY:            o "_ '[' &:EXPR*{COMMA;,} _']'", Arr
        OBJ_EXPL:         o "_ '{' &:ITEM_EXPL*{COMMA;,} _ '}'", Obj
        PAREN:            o "_ '(' &:EXPR _ ')'"
        PROPERTY:         o "obj:THIS attrStr:SYMBOL", Index
        THIS:             o "THISAT", This
        STRING:
          STRING1:        o "_ QUOTE  &:(!QUOTE  (ESC | .))* QUOTE",  Str
          STRING2:        o "_ DQUOTE &:(!DQUOTE (ESC | .))* DQUOTE", Str
          ' ESC':         o "SLASH &:.", (chr) -> '\\'+chr
        SYMBOL:           o "_ !KEYWORD <words:1> &:/[a-zA-Z\\$_][a-zA-Z\\$_0-9]*/", Symbol
  _OBJECTS:
    ITEM_EXPL:            o "this:THISAT? key:SYMBOL value:(COLON &:EXPR)?", Item
    ITEM_IMPL:            o "key:SYMBOL COLON value:EXPR", Item
  _BLOCKS:
    BLOCK:
      _INLINE:            o "THEN &:LINE", Block
      _INDENTED:          o "INDENT &:LINE*{NEWLINE;1,}", Block
    INDENT:               o "TERM &:_", checkIndent
    NEWLINE:              o "TERM &:_", checkNewline
    TERM:                 o "_ &:('\r\n'|'\n')"
  _TOKENS:
    KEYWORD:              t(prefix:'_')('if', 'else', 'for', 'in', 'loop', 'return', 'throw', 'then', 'is', 'isnt')
    COMMA:                o "_ ','"
    COLON:                o "_ ':'"
    THISAT:               o "_ '@'"
    QUOTE:                o "'\\''"
    DQUOTE:               o "'\"'"
    FSLSH:                o "'/'"
    SLASH:                o "'\\\\'"
  _WHITESPACES:
    _:                    o "<words:1> /[ ]*/"
    __:                   o "<words:1> /[ ]+/"
    ___:                  o "<words:1> /[ ]+/" # TODO also capture comments, etc.
  _OTHER:
    '.':                  o "<chars:1> /[\\s\\S]/"


counter = 0
test  = (code, expected) ->
  try
    context = GRAMMAR.parse code, debug:no
    assert.equal ''+context.result, expected
  catch error
    if expected isnt null
      try
        GRAMMAR.parse code, debug:yes
      catch error
        # pass
      console.log "failed to parse code '#{code}', expected '#{expected}'"
      console.log "result: #{context.result}" if context?
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
