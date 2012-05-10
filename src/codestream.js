(function() {
  var CodeStream, clazz;

  clazz = require('cardamom').clazz;

  this.inspect = function(x) {
    return require('util').inspect(x, false, 100);
  };

  this.CodeStream = CodeStream = clazz('CodeStream', function() {
    return {
      init: function(text, pos, buffer) {
        this.text = text;
        this.pos = pos != null ? pos : 0;
        this.buffer = buffer != null ? buffer : null;
        return this.maxSeen = 0;
      },
      pos$: {
        "enum": true,
        conf: true,
        get: function() {
          return this._pos;
        },
        set: function(newPos) {
          if (this._pos !== newPos) {
            this.buffer = null;
            this._pos = newPos;
          }
          if (newPos > this.maxSeen) this.maxSeen = newPos;
          return this._pos;
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
        var chars, lines, origPos, result, words;
        chars = _arg.chars, words = _arg.words, lines = _arg.lines;
        if (chars != null) {
          return this.buffer = this.text.slice(this.pos, (this.pos + chars));
        } else if (words != null) {
          origPos = this.pos;
          while (words > 0) {
            if (this.getUntil(' ') !== ' ') words -= 1;
          }
          if (this.pos > origPos && this.text[this.pos] === ' ') this.pos -= 1;
          result = this.text.slice(origPos, this.pos);
          this.pos = origPos;
          return this.buffer = result;
        } else if (lines != null) {
          throw new Error('Not implemented yet');
        } else {
          return this.buffer = this.text[this.pos];
        }
      },
      match: function(_arg) {
        var matched, peek, regex, string;
        regex = _arg.regex, string = _arg.string;
        if (string != null) {
          peek = this.peek({
            chars: string.length
          });
          if (peek !== string) return null;
          this.pos += string.length;
          return string;
        } else if (regex != null) {
          if (!(this.buffer != null)) {
            throw new Error('Buffer was null during regex match. Forget to peek?');
          }
          matched = this.buffer.match(regex);
          if (matched === null) return null;
          this.pos += matched[0].length;
          return matched[0];
        }
      }
    };
  });

}).call(this);
