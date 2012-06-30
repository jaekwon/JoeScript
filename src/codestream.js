(function() {
  var CodeStream, assert, bisect_right, clazz, _ref, _ref2;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.bisect, bisect_right = _ref2.bisect_right);

  assert = require('assert');

  this.inspect = function(x) {
    return require('util').inspect(x, false, 100);
  };

  this.CodeStream = CodeStream = clazz('CodeStream', function() {
    return {
      init: function(text) {
        this.text = text;
        this.pos = 0;
        this.numLines = 0;
        this.lineStarts = [0];
        while (this.getUntil("\n").length > 0) {
          this.lineStarts.push(this.pos);
        }
        this.lineStarts.pop();
        return this.pos = 0;
      },
      posToLine: function(pos) {
        return bisect_right(this.lineStarts, pos) - 1;
      },
      posToCol: function(pos) {
        return pos - this.lineStarts[this.posToLine(pos)];
      },
      line$: {
        get: function() {
          return this.posToLine(this.pos);
        }
      },
      col$: {
        get: function() {
          return this.posToCol(this.pos);
        }
      },
      getUntil: function(end, ignoreEOF) {
        var index;
        if (ignoreEOF == null) ignoreEOF = true;
        index = this.text.indexOf(end, this.pos);
        if (index === -1) {
          if (ignoreEOF) {
            index = this.text.length;
          } else {
            throw new EOFError;
          }
        } else {
          index += end.length;
        }
        return this.text.slice(this.pos, (this.pos = index));
      },
      peek: function(_arg) {
        var afterChars, afterLines, beforeChars, beforeLines, end, endLine, start, startLine;
        beforeChars = _arg.beforeChars, beforeLines = _arg.beforeLines, afterChars = _arg.afterChars, afterLines = _arg.afterLines;
        if (!(beforeLines != null) && !(beforeChars != null)) beforeChars = 0;
        if (!(afterLines != null) && !(afterChars != null)) afterChars = 0;
        if (beforeChars === 0 && afterChars === 0) return '';
        if (beforeLines != null) {
          startLine = Math.max(0, this.line - beforeLines);
          start = this.lineStarts[startLine];
        } else {
          start = this.pos - beforeChars;
        }
        if (afterLines != null) {
          endLine = Math.min(this.lineStarts.length - 1, this.line + afterLines);
          if (endLine < this.lineStarts.length - 1) {
            end = this.lineStarts[endLine + 1] - 1;
          } else {
            end = this.text.length;
          }
        } else {
          end = this.pos + afterChars;
        }
        return this.text.slice(start, end);
      },
      match: function(_arg) {
        var match, peek, regex, string;
        regex = _arg.regex, string = _arg.string;
        if (string != null) {
          peek = this.text.slice(this.pos, (this.pos + string.length));
          if (peek !== string) return null;
          this.pos += string.length;
          return string;
        } else if (regex != null) {
          regex.lastIndex = this.pos;
          match = regex.exec(this.text);
          if (!match || match.index !== this.pos) return null;
          this.pos = regex.lastIndex;
          return match[0];
        }
      }
    };
  });

}).call(this);
