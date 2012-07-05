# converts an ANSI stream produced by Cardamom/src/colors into safe HTML.
{Grammar} = require 'joeson'
{htmlEscape} = require 'joeson/lib/helpers'

colors = {
  30:'#000000', # black
  31:'#e6312a', # red
  32:'#00cc00', # green
  33:'#cccc00', # yellow
  34:'#668ee2', # blue
  35:'#f062e7', # magenta
  36:'#00cccc', # cyan
  37:'#ffffff'  # white
}

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
