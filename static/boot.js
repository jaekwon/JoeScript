(function() {
  var Telecode;

  $('document').ready(function() {
    var mirror;
    console.log("booting...");
    Telecode.connect();
    mirror = CodeMirror(document.body, {
      value: '',
      mode: 'coffeescript',
      theme: 'joeson',
      autofocus: true,
      keyMap: 'vim'
    });
    mirror.submit = function() {
      return Telecode.pushCode(this.getValue());
    };
    return console.log("code mirror:", mirror);
  });

  Telecode = {
    connect: function() {
      var _this = this;
      this.socket = io.connect('http://localhost:1337/');
      this.socket.on('stdout', function(str) {
        return console.log("stdout: ", str);
      });
      this.socket.on('stderr', function(str) {
        return console.log("stderr: ", str);
      });
      return console.log("Telecode socket:", this.socket);
    },
    pushCode: function(code) {
      return this.socket.emit('code', {
        code: code,
        ixid: void 0
      });
    }
  };

}).call(this);
