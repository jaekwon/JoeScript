(function() {
  var Client, randid, replaceTabs, tabCache, tabSize, writeTo, x;

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
    var marqueeLevel, mirror;
    console.log("booting...");
    Client.connect();
    console.log("marquee...");
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
    mirror = CodeMirror(document.body, {
      value: '',
      mode: 'coffeescript',
      theme: 'joeson',
      autofocus: true,
      tabSize: 2,
      keyMap: 'vim'
    });
    mirror.replaceTabs = function() {
      var orig, tabReplaced;
      tabReplaced = replaceTabs(orig = mirror.getValue());
      return mirror.setValue(tabReplaced);
    };
    mirror.submit = function() {
      var cloned, ixid, thing;
      if (this.getValue().trim().length === 0) return;
      mirror.replaceTabs();
      cloned = $('.CodeMirror:last').clone(false);
      cloned.css({
        marginBottom: 10
      });
      cloned.find('.CodeMirror-cursor, .CodeMirror-scrollbar, textarea').remove();
      thing = cloned.find('.CodeMirror-lines>div:first>div:first');
      if (thing.css('visibility') === 'hidden') {
        thing.remove();
      } else {
        console.log("where'd that thing go?");
      }
      ixid = 'ixid' + randid();
      cloned.find('.CodeMirror-lines').append("<span class=\"stdout\"><span class='cm-bracket'>&gt;&gt;</span> <span id='" + ixid + "'><span class='marq2m4'>.</span><span class='marq1m4 marq3m4'>.</span><span class='marq0m4'>.</span></span></span>");
      $('.CodeMirror:last').before(cloned);
      window.scroll(0, document.body.offsetHeight);
      return Client.pushCode({
        code: this.getValue(),
        ixid: ixid
      });
    };
    console.log("code mirror:", mirror);
    return $(document).click(function() {
      return mirror.focus();
    });
  });

  writeTo = function(ixid, html) {
    var outputElement, span;
    span = $('#' + ixid);
    console.log(ixid);
    if (!span.data('initialized')) {
      span.data('initialized', true);
      span.empty();
    }
    if (span.length > 0) {
      outputElement = $('<span/>').html(html);
      console.log("stdout:", outputElement);
      span.append(outputElement);
      return window.scroll(0, document.body.offsetHeight);
    }
  };

  Client = {
    connect: function() {
      var _this = this;
      this.socket = io.connect();
      this.socket.on('stdout', function(data) {
        return writeTo(data.ixid, data.html);
      });
      this.socket.on('stderr', function(data) {
        return writeTo(data.ixid, data.html);
      });
      this.socket.on('_', function() {
        return _this.login();
      });
      return console.log("Client socket:", this.socket);
    },
    login: function() {
      return this.socket.emit('login', {
        name: 'joe',
        password: 'dontcare'
      });
    },
    pushCode: function(_arg) {
      var code, ixid;
      ixid = _arg.ixid, code = _arg.code;
      return this.socket.emit('code', {
        code: code,
        ixid: ixid
      });
    }
  };

}).call(this);
