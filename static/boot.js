(function() {
  var Telecode, randid, writeTo;

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

  $('document').ready(function() {
    var marqueeLevel, mirror;
    console.log("booting...");
    Telecode.connect();
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
      keyMap: 'vim'
    });
    mirror.submit = function() {
      var cloned, ixid, thing;
      cloned = $('.CodeMirror:last').clone(false);
      cloned.find('.CodeMirror-cursor, .CodeMirror-scrollbar, textarea').remove();
      thing = cloned.find('.CodeMirror-lines>div:first>div:first');
      if (thing.css('visibility') === 'hidden') {
        thing.remove();
      } else {
        console.log("where'd that thing go?");
      }
      ixid = 'ixid' + randid();
      cloned.find('.CodeMirror-lines').append("<span class=\"stdout\">-&gt; <span id='" + ixid + "'><span class='marq2m4'>.</span><span class='marq1m4 marq3m4'>.</span><span class='marq0m4'>.</span></span></span>");
      $('.CodeMirror:last').before(cloned);
      window.scroll(0, document.body.offsetHeight);
      return Telecode.pushCode({
        code: this.getValue(),
        ixid: ixid
      });
    };
    return console.log("code mirror:", mirror);
  });

  writeTo = function(ixid, text) {
    var span, textElement;
    span = $('#' + ixid);
    if (span.length > 0) {
      textElement = $('<span/>').text(text);
      console.log(textElement);
      return span.replaceWith(textElement);
    }
  };

  Telecode = {
    connect: function() {
      var _this = this;
      this.socket = io.connect('http://localhost:1337/');
      this.socket.on('stdout', function(data) {
        return writeTo(data.ixid, data.text);
      });
      this.socket.on('stderr', function(data) {
        return writeTo(data.ixid, data.text);
      });
      return console.log("Telecode socket:", this.socket);
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
