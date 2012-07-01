(function() {
  var Client, GOD, GUEST, JKernel, WORLD, clazz, domLog, kern, outBoxHtml, randid, replaceTabs, tabCache, tabSize, toHTML, x, _ref;

  this.require = require;

  clazz = require('cardamom').clazz;

  randid = require('joeson/lib/helpers').randid;

  toHTML = require('joeson/src/parsers/ansi').toHTML;

  domLog = window.domLog = $('<pre/>');

  require('nogg').configure({
    "default": {
      file: {
        write: function(line) {
          return domLog.append(toHTML(line));
        }
      },
      level: 'debug'
    }
  });

  _ref = require('joeson/src/interpreter'), GOD = _ref.GOD, WORLD = _ref.WORLD, GUEST = _ref.GUEST, JKernel = _ref.JKernel;

  kern = new JKernel;

  outBoxHtml = "<div class='outbox'>\n  <div class='outbox-gutter'>\n    <div class='outbox-gutter-text'>→ </div>\n  </div>\n  <div class='outbox-lines'><span class='marq2m4'>.</span><span class='marq1m4 marq3m4'>.</span><span class='marq0m4'>.</span></div>\n</div>";

  tabSize = 2;

  tabCache = (function() {
    var _i, _results;
    _results = [];
    for (x = _i = 0; 0 <= tabSize ? _i <= tabSize : _i >= tabSize; x = 0 <= tabSize ? ++_i : --_i) {
      _results.push(Array(x + 1).join(' '));
    }
    return _results;
  })();

  replaceTabs = function(str) {
    var accum, col, i1, i2, insertWs, line, lines, part, parts, _i, _j, _len, _len2;
    accum = [];
    lines = str.split('\n');
    for (i1 = _i = 0, _len = lines.length; _i < _len; i1 = ++_i) {
      line = lines[i1];
      parts = line.split('\t');
      col = 0;
      for (i2 = _j = 0, _len2 = parts.length; _j < _len2; i2 = ++_j) {
        part = parts[i2];
        col += part.length;
        accum.push(part);
        if (i2 < parts.length - 1) {
          insertWs = tabSize - col % tabSize;
          col += insertWs;
          accum.push(tabCache[insertWs]);
        }
      }
      if (i1 < lines.length - 1) accum.push('\n');
    }
    return accum.join('');
  };

  $(document).ready(function() {
    var marqueeLevel;
    $(document.body).append(domLog);
    console.log("booting...");
    marqueeLevel = 0;
    setInterval((function() {
      var m4Off, m4On;
      m4Off = marqueeLevel % 4;
      $(".marq" + m4Off + "m4").css({
        opacity: 1
      });
      m4On = (++marqueeLevel) % 4;
      return $(".marq" + m4On + "m4").css({
        opacity: 0.7
      });
    }), 300);
    return kern.run({
      user: GUEST,
      code: 'login()',
      output: void 0
    });
  });

  Client = clazz('Client', function() {
    return {
      init: function() {
        this.threads = {};
        this.mirror = this.makeMirror();
        this.socket = io.connect();
        this.socket.on('output', this.onOutput);
        console.log("Client socket:", this.socket);
        return this.start({
          code: 'help()'
        });
      },
      makeMirror: function() {
        var mirror;
        mirror = CodeMirror(document.body, {
          value: '',
          mode: 'coffeescript',
          theme: 'joeson',
          keyMap: 'vim',
          autofocus: true,
          gutter: true,
          fixedGutter: true,
          tabSize: 2
        });
        mirror.sanitize = function() {
          var cursor, orig, tabReplaced;
          cursor = mirror.getCursor();
          tabReplaced = replaceTabs(orig = mirror.getValue());
          mirror.setValue(tabReplaced);
          mirror.setCursor(cursor);
          return tabReplaced;
        };
        mirror.setMarker(0, '● ', 'cm-bracket');
        $(mirror.getWrapperElement()).addClass('active');
        mirror.submit = this.onSave;
        return mirror;
      },
      start: function(_arg) {
        var code, threadId;
        code = _arg.code;
        threadId = randid();
        this.makeOutputForThread(threadId);
        return this.socket.emit('start', {
          code: code,
          threadId: threadId
        });
      },
      onSave$: function() {
        var cloned, mirrorElement, thing, value;
        value = this.mirror.sanitize();
        if (value.trim().length === 0) return;
        mirrorElement = $(this.mirror.getWrapperElement());
        cloned = mirrorElement.clone(false);
        cloned.removeClass('active');
        cloned.find('.CodeMirror-cursor, .CodeMirror-scrollbar, textarea').remove();
        thing = cloned.find('.CodeMirror-lines>div:first>div:first');
        if (thing.css('visibility') === 'hidden') {
          thing.remove();
        } else {
          console.log("where'd that thing go?");
        }
        this.append(cloned);
        return this.start({
          code: value
        });
      },
      onOutput$: function(_arg) {
        var command, html, output, threadId;
        command = _arg.command, html = _arg.html, threadId = _arg.threadId;
        output = this.threads[threadId].output;
        switch (command) {
          case 'close':
            return this.close({
              output: output
            });
          case void 0:
            return this.write({
              output: output,
              html: html
            });
          default:
            throw new Error("Unexpected command " + command);
        }
      },
      write: function(_arg) {
        var html, output;
        html = _arg.html, output = _arg.output;
        if (!output.data('initialized')) {
          output.data('initialized', true);
          output.empty();
        }
        output.append($('<span/>').html(html));
        return window.scroll(0, document.body.offsetHeight);
      },
      close: function(_arg) {
        var output;
        output = _arg.output;
        if (!output.data('initialized')) {
          output.data('initialized', true);
          return output.empty();
        }
      },
      makeOutputForThread: function(threadId) {
        var outputBox;
        outputBox = $(outBoxHtml);
        this.append(outputBox);
        this.threads[threadId] = {
          output: outputBox.find('.outbox-lines')
        };
        return window.scroll(0, document.body.offsetHeight);
      },
      append: function(elem) {
        var mirrorElement;
        mirrorElement = $(this.mirror.getWrapperElement());
        return mirrorElement.before(elem);
      }
    };
  });

}).call(this);
