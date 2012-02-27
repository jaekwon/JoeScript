{Grammar} = require './joeson'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'
{clazz} = require 'cardamom'

Node = clazz 'Node'
Block = clazz 'Block', Node, ->
  init: ({expr, exprs}) ->
    @exprs = exprs or [expr]
  toString: ->
    @exprs.map((x)->''+x).join('\n')

GRAMMAR = Grammar ({o}) ->
  START:                o "EXPRS"
  EXPRS:                o "exprs:EXPR*{NEWLINE;,}", Block
  EXPR:
    LOOP:               o "<words:1> 'loop' BLOCK"
    SIMPLE:             o "<words:1> /[a-zA-Z]+/"
  _BLOCKS:
    BLOCK:
      _INLINE:          o "__ THEN expr:EXPR", Block
      _INDENTED:        o "INDENT exprs:EXPR*{NEWLINE;1,}", Block
    INDENT:             o "TERM &:__"#, (ws) -> @checkIndent ws
    NEWLINE:            o "TERM &:__", (ws) -> @storeCache = no; ws #, ({ws}) -> @checkNewline ws; @cache = no
    TERM:               o "__ ('\r\n'|'\n')"
    THEN:               o "'then'"
  _WHITESPACES:
                        # optional whitespaces
    __:                 o "<words:1> /[ ]*/"

context = GRAMMAR.parse """foo
foo
loop
  indented
  bar"""
console.log ''+context.result
