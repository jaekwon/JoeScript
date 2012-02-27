{Grammar} = require './joeson'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'

GRAMMAR = Grammar ({o}) ->
  START:                o "EXPRS"
  EXPRS:                o "EXPR*{NEWLINE;,}"
  EXPR:
    LOOP:               o "<words:1> 'loop' BLOCK"
    SIMPLE:             o "<words:1> /[a-zA-Z]+/"
  _BLOCKS:
    BLOCK:
      _INLINE:          o "__ THEN expr:EXPR"#, Block
      _INDENTED:        o "INDENT exprs:EXPR*{NEWLINE;1,}"#, Block
    INDENT:             o "TERM ws:__"#, ({ws}) -> @checkIndent ws
    NEWLINE:            o "TERM ws:__"#, ({ws}) -> @checkNewline ws; @cache = no
    TERM:               o "__ ('\r\n'|'\n')"
    THEN:               o "'then'"
  WHITESPACES:
                        # optional whitespaces
    __:                 o "<words:1> /[ ]*/"

console.log GRAMMAR.parse """foo
foo
loop
  indented
  bar"""
