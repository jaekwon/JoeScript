# converts an ANSI stream produced by Cardamom/src/colors into safe HTML.
#_ = require("underscore")
{Grammar} = require 'joeson'
{htmlEscape} = require 'joeson/lib/helpers'

colors = {30:'black', 31:'red', 32:'green', 33:'yellow', 34:'blue', 35:'magenta', 36:'cyan', 37:'yellow'}

ANSI = Grammar ({o, i, tokens, make}) -> [
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
