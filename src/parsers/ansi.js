(function() {
  var ANSI, Grammar, colors, htmlEscape;

  Grammar = require('joeson').Grammar;

  htmlEscape = require('joeson/lib/helpers').htmlEscape;

  colors = {
    30: '#000000',
    31: '#e6312a',
    32: '#00cc00',
    33: '#cccc00',
    34: '#668ee2',
    35: '#f062e7',
    36: '#00cccc',
    37: '#ffffff'
  };

  ANSI = Grammar(function(_arg) {
    var i, make, o, tokens;
    o = _arg.o, i = _arg.i, tokens = _arg.tokens, make = _arg.make;
    return [
      o({
        ANY: " ( NORMAL | STYLED )* "
      }, function(it) {
        return it.join('');
      }), i({
        NORMAL: " ( !ESCAPE . )+ "
      }, function(it) {
        return htmlEscape(it.join(''));
      }), i({
        STYLED: " !END ESCAPE ( sgr:INT ';' )? color:INT 'm' any:ANY END "
      }, function(_arg2) {
        var any, color, sgr, _ref;
        sgr = _arg2.sgr, color = _arg2.color, any = _arg2.any;
        return "<span style='color:" + ((_ref = colors[color]) != null ? _ref : 'white') + "'>" + any + "</span>";
      }), i({
        ESCAPE: " '\x1b[' "
      }), i({
        END: " '\x1b[0m' "
      }), i({
        '.': " /[\\s\\S]/ "
      }), i({
        INT: " /[0-9]+/ "
      }, function(it) {
        return new Number(it);
      })
    ];
  });

  this.toHTML = ANSI.parse;

}).call(this);
