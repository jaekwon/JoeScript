(function() {
  var GOD, GUEST, JArray, JNaN, JNull, JObject, JUndefined, JUser, USERS, WORLD, assert, async, black, blue, clazz, cyan, debug, ends, escape, fatal, green, info, inspect, joefn, loadJObject, magenta, nativ, normal, pad, red, saveJObject, starts, warn, white, yellow, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  async = require('async');

  _ref3 = require('joeson/lib/helpers'), pad = _ref3.pad, escape = _ref3.escape, starts = _ref3.starts, ends = _ref3.ends;

  _ref4 = require('nogg').logger('server'), debug = _ref4.debug, info = _ref4.info, warn = _ref4.warn, fatal = _ref4.error;

  _ref5 = require('joeson/src/interpreter/object'), JObject = _ref5.JObject, JArray = _ref5.JArray, JUser = _ref5.JUser, JUndefined = _ref5.JUndefined, JNull = _ref5.JNull, JNaN = _ref5.JNaN;

  _ref6 = require('joeson/src/interpreter/persistence'), joefn = _ref6.joefn, nativ = _ref6.nativ;

  GOD = this.GOD = new JUser({
    id: 'god',
    name: 'god'
  });

  GUEST = this.GUEST = new JUser({
    id: 'guest',
    name: 'guest'
  });

  USERS = this.USERS = new JObject({
    id: 'users',
    creator: GOD,
    data: {
      guest: GUEST,
      god: GOD
    }
  });

  WORLD = this.WORLD = new JObject({
    id: 'world',
    creator: GOD,
    data: {
      users: USERS,
      print: nativ('print', function($, _arg) {
        var obj;
        obj = _arg[0];
        $.output(obj.__html__($) + '<br/>');
        return JUndefined;
      }),
      login: joefn('login', GOD, "-> print [\n  \"username:\"\n\n  type:'string'\n  default:'louis'\n  enter: (text) -> print text\n\n  \"\npassword:\"\n\n  type:'password'\n  enter: (text) -> print text\n]")
    }
  });

  if (require.main === module) {
    _ref7 = require('joeson/src/interpreter/persistence'), saveJObject = _ref7.saveJObject, loadJObject = _ref7.loadJObject;
    saveJObject(WORLD, function(err) {
      if (err != null) return console.log("FAIL!" + err);
      console.log("done saving globals");
      return loadJObject('world', function(err, it) {
        return console.log("test loaded world:\n" + (inspect(it.data)));
      });
    });
  }

}).call(this);
