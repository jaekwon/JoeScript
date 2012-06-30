(function() {
  var GOD, JArray, JNaN, JNull, JObject, JStub, JUndefined, JUser, NATIVE_FUNCTIONS, OBJECTS, USERS, WORLD, assert, async, black, blue, clazz, client, cyan, debug, ends, escape, fatal, getClient, getOrStub, globals, green, info, inspect, key, loadJObject, magenta, nativ, normal, pad, red, saveJObject, saveJObjectItem, starts, value, warn, white, yellow, _, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  _ = require('underscore');

  async = require('async');

  _ref3 = require('joeson/lib/helpers'), pad = _ref3.pad, escape = _ref3.escape, starts = _ref3.starts, ends = _ref3.ends;

  _ref4 = require('nogg').logger('server'), debug = _ref4.debug, info = _ref4.info, warn = _ref4.warn, fatal = _ref4.error;

  _ref5 = require('joeson/src/interpreter/object'), JObject = _ref5.JObject, JArray = _ref5.JArray, JUser = _ref5.JUser, JUndefined = _ref5.JUndefined, JNull = _ref5.JNull, JNaN = _ref5.JNaN, JStub = _ref5.JStub;

  client = void 0;

  getClient = function() {
    return client != null ? client : client = require('redis').createClient();
  };

  NATIVE_FUNCTIONS = {};

  nativ = this.nativ = function(id, f) {
    assert.ok(id != null, "nativ wants an id");
    f.id = id;
    NATIVE_FUNCTIONS[id] = f;
    return f;
  };

  OBJECTS = {};

  getOrStub = function(id) {
    var cached;
    if (cached = OBJECTS[id]) {
      return cached;
    } else {
      return new JStub(id);
    }
  };

  _ref6 = globals = require('joeson/src/interpreter/global'), GOD = _ref6.GOD, WORLD = _ref6.WORLD, USERS = _ref6.USERS;

  for (key in globals) {
    value = globals[key];
    if (value instanceof JObject) OBJECTS[value.id] = value;
  }

  saveJObject = this.saveJObject = function(jobj, cb) {
    assert.ok(jobj instanceof JObject, "Dunno how to save anything but a JObject type");
    assert.ok(jobj.id, "JObject needs an id for it to be saved.");
    jobj._saving = true;
    return getClient().hmset(jobj.id + ':meta', {
      type: jobj.constructor.name,
      creator: jobj.creator.id
    }, function(err, res) {
      var dataKeys;
      dataKeys = _.keys(jobj.data);
      return async.forEach(dataKeys, function(key, next) {
        value = jobj.data[key];
        return saveJObjectItem(jobj, key, value, next);
      }, function(err) {
        delete jobj._saving;
        if (err != null) {
          if (err != null) return console.log("ERROR: " + err);
        } else {
          return typeof cb === "function" ? cb() : void 0;
        }
      });
    });
  };

  saveJObjectItem = this.saveJObjectItem = function(jobj, key, value, cb) {
    if (value instanceof JObject) {
      if (value._saving) return cb();
      saveJObject(value, function() {
        return getClient().hset(jobj.id, key, 'o:' + value.id, cb);
      });
      return;
    }
    switch (typeof value) {
      case 'string':
        value = 's:' + value;
        break;
      case 'number':
        value = 'n:' + value;
        break;
      case 'bool':
        value = 'b:' + value;
        break;
      case 'function':
        assert.ok(value.id != null, "Cannot persist a native function with no id");
        value = 'f:' + value.id;
        break;
      case 'object':
        assert.ok(value instanceof JObject, "Unexpected value of " + (value != null ? value.constructor.name : void 0));
        assert.ok(value.id, "Cannot persist a JObject without id");
        value = 'o:' + value.id;
        break;
      default:
        throw new Error("dunno how to persist value " + value + " (" + (typeof value) + ")");
    }
    return getClient().hset(jobj.id, key, value, cb);
  };

  loadJObject = this.loadJObject = function(id, cb) {
    var cached;
    console.log("loading " + id);
    assert.ok(id, "loadJObject wants an id to load");
    if (cached = OBJECTS[id]) return cb(null, cached);
    return getClient().hgetall(id + ':meta', function(err, meta) {
      if (err != null) return cb(err);
      assert.ok(meta.creator != null, "user had no creator?");
      assert.ok(meta.creator !== id, "heresy!");
      return loadJObject(meta.creator, function(err, creator) {
        var obj;
        if (err != null) return cb(err);
        switch (meta.type) {
          case 'JObject':
            obj = new JObject({
              creator: creator
            });
            break;
          case 'JArray':
            obj = new JArray({
              creator: creator
            });
            break;
          case 'JUser':
            obj = new JUser({
              name: id
            });
            break;
          default:
            return cb("Unexpected type of object w/ id " + id + ": " + meta.type);
        }
        return getClient().hgetall(id, function(err, _data) {
          var data, key, t, value, _ref7;
          if (meta.type === 'JArray') {
            if (_data.length == null) return cb("Loadded JArray had no length?");
            data = new Array(data.length);
          } else {
            data = _data;
          }
          for (key in _data) {
            value = _data[key];
            t = value[0];
            value = value.slice(2);
            switch (t) {
              case 's':
                value = value;
                break;
              case 'n':
                value = Number(value);
                break;
              case 'b':
                value = Bool(value);
                break;
              case 'f':
                value = (_ref7 = NATIVE_FUNCTIONS[value]) != null ? _ref7 : function() {
                  throw new Error("Invalid native function");
                };
                break;
              case 'o':
                value = getOrStub(value);
            }
            data[key] = value;
          }
          obj.data = data;
          return cb(null, obj);
        });
      });
    });
  };

}).call(this);
