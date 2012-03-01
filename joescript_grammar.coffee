{Grammar} = require './joeson'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'
{clazz} = require 'cardamom'
assert = require 'assert'

Node = clazz 'Node'
Block = clazz 'Block', Node, ->
  init: (lines) ->
    @lines = if lines instanceof Array then lines else [lines]
  toString: ->
    @lines.map((x)->''+x).join('; ')
Loop = clazz 'Loop', Node, ->
  init: (@block) ->
  toString: ->
    "loop {#{@block}}"
Operation = clazz 'Operation', Node, ->
  init: ({@left, @op, @right}) ->
  toString: -> "(#{@left or ''}#{@op}#{@right or ''})"
Dummy = clazz 'Dummy', Node, ->
  init: (@args) ->
  toString: -> "{#{@args}}"
Statement = clazz 'Statement', Node, ->
  init: ({@type, @expr}) ->
  toString: -> "#{@type}(#{@expr});"
If = clazz 'If', Node, ->
  init: ({@cond, @block}) ->
    @block = Block @block if @block not instanceof Block
  toString: -> "if(#{@cond}){#{@block}}"

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
  [block, _, newline] = @stack[@stack.length-3..@stack.length-1]
  assert.ok block.name in ['START', 'BLOCK']
  assert.equal newline.name, 'NEWLINE'
  if ws is (block.indent ? '')
    return ws
  null

GRAMMAR = Grammar ({o, t}) ->
  START:                o "__INIT__ &:LINES __"
  __INIT__:             o "''", -> # init
  LINES:                o "LINE*{NEWLINE;,}", Block
  LINE:
    POSTIF:             o "block:$$ IF cond:EXPR", If
    #POSTFOR:           o "block:$$ FOR cond:EXPR"
    STMT:               o "type:(RETURN|THROW) expr:$?", Statement
    EXPR:
      INVOC:            o "func:INVOCABLE __ params:(INVOC|PARAMS)"
      ' PARAMS':
          PARAMS0:      o "__ '(' __ &:PARAMS1 __ ')'"
          PARAMS1:      o "EXPR*{__ ',';1,}"
      ASSIGN:           o "target:INVOCABLE __ '=' source:$$"
      COMPLEX:
        IF_:            o "IF cond:EXPR block:BLOCK", If
      OP0:              o "left:$$ __ op:('=='|'!='|'<'|'<='|'>'|'>=') right:$", Operation
      OP1:              o "left:$$ __ op:('+'|'-')                     right:$", Operation
      OP2:              o "left:$$ __ op:('*'|'/'|'%')                 right:$", Operation
      OP3:              o "left:$  op:('--'|'++')   |   op:('--'|'++') right:$", Operation
      INVOCABLE:
        SIMPLE:         o "!KEYWORD __ <words:1> &:/[a-zA-Z]+/"
  _BLOCKS:
    BLOCK:
      _INLINE:          o "THEN &:LINE", Block
      _INDENTED:        o "INDENT &:LINE*{NEWLINE;1,}", Block
    INDENT:             o "TERM &:__", checkIndent
    NEWLINE:            o "TERM &:__", checkNewline
    TERM:               o "__ &:('\r\n'|'\n')"
  _TOKENS:
    KEYWORD:            t 'if', 'loop', 'return', 'throw', 'then'
  _WHITESPACES:
                        # optional whitespaces
    __:                 o "<words:1> /[ ]*/"

counter = 0
assertParse = (code, expected) ->
  try
    context = GRAMMAR.parse code
    assert.equal ''+context.result, expected
    console.log "t#{counter++} OK\t#{code}"
  catch error
    GRAMMAR.parse code, 'START', true # show debug trace
    console.log "failed to parse code '#{code}', expected '#{expected}'"

assertParse "a * b++ / c + d", "(((a*(b++))/c)+d)"
assertParse " a * b++ / c + d ", "(((a*(b++))/c)+d)"
assertParse "return foo", 'return(foo);'
assertParse "foo if bar if baz", "if(baz){if(bar){foo}}"
