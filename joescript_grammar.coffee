{Grammar} = require './joeson'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'
{clazz} = require 'cardamom'
assert = require 'assert'

Node = clazz 'Node'
Block = clazz 'Block', Node, ->
  init: ({thing, things}) ->
    @things = things or [thing]
  toString: ->
    @things.map((x)->''+x).join('; ')
Loop = clazz 'Loop', Node, ->
  init: (@block) ->
  toString: ->
    "loop {#{@block}}"
Dummy = clazz 'Dummy', Node, ->
  init: (@args) ->
  toString: -> '{'+@args+'}'

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

GRAMMAR = Grammar ({o}) ->
  START:                o "__INIT__ &:THINGS"
  __INIT__:             o "''", -> # init
  THINGS:               o "things:THING*{NEWLINE;,}", Block
  THING:
    POSTCTRL:           o "expr:(POSTCTRL|$) __ type:('if'|'for') cond:EXPR"
    STMT:               o "__ type:('return'|'throw') expr:$?"
    EXPR:
      INVOC:            o "func:INVOCABLE __ params:(INVOC|PARAMS)"
      ' PARAMS':
          PARAMS0:      o "__ '(' __ &:PARAMS1 __ ')'"
          PARAMS1:      o "EXPR*{__ ',';1,}"
      ASSIGN:           o "target:INVOCABLE __ '=' source:(ASSIGN|$)"
      #COMPLEX:          o "CLASS | SWITCH | IF | LOOP"
      OP0:              o "$*{__ ('=='|'!='|'<'|'<='|'>'|'>=');2,}", Dummy
      OP1:              o "$*{__ ('+'|'-');2,}", Dummy
      OP2:              o "$*{__ ('*'|'/'|'%');2,}", Dummy
      OP3:              o "$ ('--'|'++') | ('--'|'++') $", Dummy
      INVOCABLE:
        SIMPLE:         o "__ <words:1> &:/[a-zA-Z]+/"
  _BLOCKS:
    BLOCK:
      _INLINE:          o "__ THEN thing:THING", Block
      _INDENTED:        o "INDENT things:THING*{NEWLINE;1,}", Block
    INDENT:             o "TERM &:__", checkIndent
    NEWLINE:            o "TERM &:__", checkNewline
    TERM:               o "__ &:('\r\n'|'\n')"
    THEN:               o "'then'"
  _WHITESPACES:
                        # optional whitespaces
    __:                 o "<words:1> /[ ]*/"

context = GRAMMAR.parse """foo + foo"""
console.log ''+context.result
