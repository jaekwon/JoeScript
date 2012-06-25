(function() {
  var Client, outBox, randid, replaceTabs, tabCache, tabSize, x;

  randid = function(len) {
    var i, possible;
    if (len == null) len = 12;
    possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return ((function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        _results.push(possible.charAt(Math.floor(Math.random() * possible.length)));
      }
      return _results;
    })()).join('');
  };

  outBox = "<div class='outbox'>\n  <div class='outbox-gutter'>\n    <div class='outbox-gutter-text'>→ </div>\n  </div>\n  <div class='outbox-stdout'>\n    <span class='marq2m4'>.</span><span class='marq1m4 marq3m4'>.</span><span class='marq0m4'>.</span>\n  </div>\n</div>";

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

  $('document').ready(function() {
    var client, marqueeLevel;
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
    window.client = client = new Client();
    return $(document).click(function() {
      return client.mirror.focus();
    });
  });

  Client = clazz('Client', function() {
    return {
      init: function() {
        this.threads = {};
        this.mirror = this.makeMirror();
        this.mirror.submit = this.onSave;
        this.socket = io.connect();
        this.socket.on('stdout', this.onStdout);
        this.socket.on('stderr', this.onStderr);
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
          var orig, tabReplaced;
          tabReplaced = replaceTabs(orig = mirror.getValue());
          mirror.setValue(tabReplaced);
          return tabReplaced;
        };
        mirror.setMarker(0, '●&nbsp;', 'cm-bracket');
        return mirror;
      },
      start: function(_arg) {
        var code, stdout, threadId;
        code = _arg.code;
        threadId = randid();
        stdout = this.makeStdout();
        this.threads[threadId] = {
          stdout: stdout
        };
        return this.socket.emit('start', {
          code: code,
          thread: threadId
        });
      },
      onSave$: function() {
        var value;
        value = this.mirror.sanitize();
        if (value.trim().length === 0) return;
        return this.start({
          code: value
        });
      },
      onStdout$: function(_arg) {
        var html, stdout, thread;
        html = _arg.html, thread = _arg.thread;
        stdout = this.threads[thread].stdout;
        return this.write({
          html: html,
          out: stdout
        });
      },
      onStderr$: function(_arg) {
        var html, stderr, stdout, thread, _ref;
        html = _arg.html, thread = _arg.thread;
        _ref = this.threads[thread], stderr = _ref.stderr, stdout = _ref.stdout;
        if (stderr == null) stderr = stdout;
        return this.write({
          html: html,
          out: stderr
        });
      },
      write: function(_arg) {
        var html, out;
        html = _arg.html, out = _arg.out;
        if (!out.data('initialized')) {
          out.data('initialized', true);
          out.empty();
        }
        out.append($('<span/>').html(html));
        return window.scroll(0, document.body.offsetHeight);
      },
      makeStdout: function() {
        var cloned, mirrorElement, stdoutBox, thing;
        mirrorElement = $(this.mirror.getWrapperElement());
        cloned = mirrorElement.clone(false);
        cloned.find('.CodeMirror-cursor, .CodeMirror-scrollbar, textarea').remove();
        thing = cloned.find('.CodeMirror-lines>div:first>div:first');
        if (thing.css('visibility') === 'hidden') {
          thing.remove();
        } else {
          console.log("where'd that thing go?");
        }
        mirrorElement.before(cloned);
        stdoutBox = $(outBox);
        cloned.after(stdoutBox);
        window.scroll(0, document.body.offsetHeight);
        return stdoutBox.find('.outbox-stdout');
      }
    };
  });

}).call(this);
