# Joescript Serialization Language
# Joeson is the parser, so this is called something else. JSL, why not?
{Grammar} = require 'joeson'

JSL = Grammar ({o, i, tokens, make}) -> [
  i NUMBER:       " /-?[0-9]+(\\.[0-9]+)?/ ", make Number
  i STRING: [
    o             " _DQUOTE  (!_DQUOTE  &:(_ESCSTR | .))* _DQUOTE ", make Str
    o             " _QUOTE   (!_QUOTE   &:(_ESCSTR | .))* _QUOTE  ", make Str
  ]
  i OBJ:          " '{' ('#' id:ID ' ')? &:OBJ_ITEM*_COMMA '}' ", make Obj
  i OBJ_ITEM:     " key:STRING value:ANY ", make Item
  i ARR:          " '[' ('#' id:ID ' ')? &:ARR_ITEM*_COMMA ']' ", make Arr
  i ARR_ITEM:     " key:(STRING | NUMBER) value:ANY ", make Item
  i BOOLEAN:      " 'true' | 'false' ", make Bool
  i ID:           " [a-zA-Z0-9]{12,128} ", make Id
  i _QUOTE:       " '\\''       "
  i _DQUOTE:      " '\"'        "
  i _ESCSTR:    " _SLASH . ", (it) -> {n:'\n', t:'\t', r:'\r'}[it] or it

  o ANY:     " ( NORMAL | STYLED )* ",                              (it) -> it.join ''
  i NORMAL:  " ( !ESCAPE . )+ ",                                    (it) -> htmlEscape it.join ''
  i STYLED:  " !END ESCAPE ( sgr:INT ';' )? color:INT 'm' any:ANY END ", ({sgr, color, any}) ->
    "<span style='color:#{colors[color] ? 'white'}'>#{any}</span>"
  i ESCAPE:  " '\x1b[' "
  i END:     " '\x1b[0m' "
  i '.':     " /[\\s\\S]/ "
  i INT:     " /[0-9]+/ ",                                          (it) -> new Number it
]

@toHTML = ANSI.parse
