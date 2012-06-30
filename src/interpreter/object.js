(function() {
  var JAccessControlItem, JArray, JBoundFunc, JNaN, JNull, JObject, JSingleton, JStub, JUndefined, JUser, SimpleIterator, assert, black, blue, clazz, cyan, debug, ends, escape, extend, fatal, green, htmlEscape, info, inspect, isInteger, isVariable, joe, magenta, normal, pad, randid, red, setLast, starts, warn, white, yellow, _, _ref, _ref2, _ref3, _ref4, _ref5,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = Array.prototype.slice,
    _this = this;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  _ = require('underscore');

  joe = require('joeson/src/joescript').NODES;

  _ref3 = require('joeson/lib/helpers'), randid = _ref3.randid, pad = _ref3.pad, htmlEscape = _ref3.htmlEscape, escape = _ref3.escape, starts = _ref3.starts, ends = _ref3.ends;

  _ref4 = require('joeson/src/joescript').HELPERS, extend = _ref4.extend, isVariable = _ref4.isVariable;

  _ref5 = require('nogg').logger('server'), debug = _ref5.debug, info = _ref5.info, warn = _ref5.warn, fatal = _ref5.error;

  isInteger = function(n) {
    return n % 1 === 0;
  };

  /* Simple Instructions:
  */

  setLast = function($, i9n, last) {
    $.pop();
    assert.ok(i9n.key != null, "setLast requires set key.");
    if (i9n.index != null) {
      this[i9n.key][i9n.index] = last;
    } else {
      this[i9n.key] = last;
    }
    return last;
  };

  setLast._name = "setLast";

  JStub = this.JStub = clazz('JStub', function() {
    return {
      init: function(id) {
        this.id = id;
        return assert.ok(this.id != null, "Stub wants id");
      }
    };
  });

  JObject = this.JObject = clazz('JObject', function() {
    return {
      init: function(_arg) {
        this.id = _arg.id, this.creator = _arg.creator, this.data = _arg.data, this.acl = _arg.acl, this.proto = _arg.proto;
        assert.ok(!(this.proto != null) || this.proto instanceof JObject, "JObject wants JObject proto or null");
        assert.ok(this.creator instanceof JObject, "JObject wants JObject creator");
        if (this.id == null) this.id = randid();
        if (this.data == null) this.data = {};
        return this.data.__proto__ = null;
      },
      __get__: function($, key, required) {
        var nativeValue, value;
        if (required == null) required = false;
        assert.ok(key = typeof key.__key__ === "function" ? key.__key__($) : void 0, "Key couldn't be stringified");
        $.will('read', this);
        if (key === '__proto__') {
          value = this.proto;
        } else {
          value = this.data[key];
        }
        if (value != null) {
          if (value instanceof JStub) {
            console.log("WORKING");
            return $.wait(value.key);
          } else {
            return value;
          }
        } else if (this.proto != null) {
          if (this.proto instanceof JStub) {
            $.push({
              func: function($, i9n, proto) {
                $.pop();
                return proto.__get__($, key, required);
              }
            });
            return this.__get__($, '__proto__');
          } else {
            return this.proto.__get__($, key, required);
          }
        } else {
          if (starts(key, '__') && ends(key, '__') && (nativeValue = this[key])) {
            return nativeValue;
          }
          if (required) {
            return $["throw"]('ReferenceError', "" + key + " is not defined");
          }
          return JUndefined;
        }
      },
      __create__: function($, newData) {
        return new JObject({
          creator: $.user,
          data: newData,
          proto: this
        });
      },
      __hasOwn__: function($, key) {
        $.will('read', this);
        return this.data[key] != null;
      },
      __set__: function($, key, value) {
        assert.ok(key = typeof key.__key__ === "function" ? key.__key__($) : void 0, "Key couldn't be stringified");
        $.will('write', this);
        this.data[key] = value;
      },
      __update__: function($, key, value) {
        assert.ok(key = typeof key.__key__ === "function" ? key.__key__($) : void 0, "Key couldn't be stringified");
        $.will('write', this);
        if (key === '__proto__') {
          this.proto = value;
        } else if (this.data[key] != null) {
          this.data[key] = value;
        } else if (this.proto != null) {
          if (this.proto instanceof JStub) {
            $.push({
              func: function($, i9n, proto) {
                $.pop();
                return proto.__update__($, key, value);
              }
            });
            return this.__get__($, '__proto__');
          } else {
            return this.proto.__update__($, key, value);
          }
        } else {
          return $["throw"]('ReferenceError', "" + key + " is not defined, cannot update.");
        }
      },
      __keys__: function($) {
        $.will('read', this);
        return _.keys(this.data);
      },
      __iter__: function($) {
        $.will('read', this);
        return new SimpleIterator(_.keys(this.data));
      },
      __num__: function($) {
        return JNaN;
      },
      __add__: function($, other) {
        return $["throw"]('TypeError', "Can't add to object yet");
      },
      __sub__: function($, other) {
        return $["throw"]('TypeError', "Can't subtract from object yet");
      },
      __mul__: function($, other) {
        return $["throw"]('TypeError', "Can't multiply with object yet");
      },
      __div__: function($, other) {
        return $["throw"]('TypeError', "Can't divide an object yet");
      },
      __cmp__: function($, other) {
        return $["throw"]('TypeError', "Can't compare objects yet");
      },
      __bool__: function($, other) {
        return true;
      },
      __key__: function($) {
        return $["throw"]('TypeError', "Can't use object as a key");
      },
      __str__: function($, $$) {
        var dataPart, key, value;
        if ($$ == null) $$ = {};
        if ((this.id != null) && $$[this.id]) {
          return "{<\#" + this.id + ">}";
        } else {
          $$[this.id] = true;
          dataPart = ((function() {
            var _ref6, _results;
            _ref6 = this.data;
            _results = [];
            for (key in _ref6) {
              value = _ref6[key];
              _results.push("" + (key.__str__($)) + ":" + (value.__str__($, $$)));
            }
            return _results;
          }).call(this)).join(',');
          return "{" + (this.id ? '#' + this.id + ' ' : '') + dataPart + "}";
        }
      },
      __repr__: function($) {
        var key, value;
        return $.jml('{', $.jml(((function() {
          var _ref6, _results;
          _ref6 = this.data;
          _results = [];
          for (key in _ref6) {
            value = _ref6[key];
            _results.push([key, ':', value.__repr__($)]);
          }
          return _results;
        }).call(this)).weave(', ', {
          flattenItems: true
        })), '}');
      },
      jsValue$: {
        get: function() {
          var key, tmp, value, _ref6;
          tmp = {};
          _ref6 = this.data;
          for (key in _ref6) {
            value = _ref6[key];
            tmp[key] = value.jsValue;
          }
          return tmp;
        }
      },
      toString: function() {
        return "[JObject]";
      }
    };
  });

  JArray = this.JArray = clazz('JArray', JObject, function() {
    var protoKeys;
    protoKeys = ['push'];
    return {
      init: function(_arg) {
        var acl, creator, data, id;
        id = _arg.id, creator = _arg.creator, data = _arg.data, acl = _arg.acl;
        if (data == null) data = [];
        data.__proto__ = null;
        return this["super"].init.call(this, {
          id: id,
          creator: creator,
          data: data,
          acl: acl
        });
      },
      __get__: function($, key) {
        var value, _ref6, _ref7;
        $.will('read', this);
        if (isInteger(key)) {
          return (_ref6 = this.data[key]) != null ? _ref6 : JUndefined;
        } else {
          assert.ok(key = typeof key.__key__ === "function" ? key.__key__($) : void 0, "Key couldn't be stringified");
          value = this.data[key];
          if (value != null) return value;
          if (starts(key, '__') && ends(key, '__')) {
            return (_ref7 = this[key]) != null ? _ref7 : JUndefined;
          }
          if (__indexOf.call(protoKeys, key) >= 0) return this[key];
          return JUndefined;
        }
      },
      __set__: function($, key, value) {
        $.will('write', this);
        if (isInteger(key)) {
          this.data[key] = value;
          return;
        }
        assert.ok(key = typeof key.__key__ === "function" ? key.__key__($) : void 0, "Key couldn't be stringified");
        this.data[key] = value;
      },
      __keys__: function($) {
        $.will('read', this);
        return _.keys(this.data);
      },
      __num__: function($) {
        return JNaN;
      },
      __add__: function($, other) {
        return $["throw"]('TypeError', "Can't add to array yet");
      },
      __sub__: function($, other) {
        return $["throw"]('TypeError', "Can't subtract from array yet");
      },
      __mul__: function($, other) {
        return $["throw"]('TypeError', "Can't multiply with array yet");
      },
      __div__: function($, other) {
        return $["throw"]('TypeError', "Can't divide an array yet");
      },
      __cmp__: function($, other) {
        return $["throw"]('TypeError', "Can't compare arrays yet");
      },
      __bool__: function($, other) {
        return true;
      },
      __key__: function($) {
        return $["throw"]('TypeError', "Can't use an array as a key");
      },
      __str__: function($, $$) {
        var key, value;
        if ($$ == null) $$ = {};
        if ((this.id != null) && $$[this.id]) {
          return "[<\#" + this.id + ">]";
        } else {
          $$[this.id] = true;
          return "[" + (this.id ? '#' + this.id + ' ' : '') + (((function() {
            var _ref6, _results;
            _ref6 = this.data;
            _results = [];
            for (key in _ref6) {
              value = _ref6[key];
              _results.push("" + (isInteger(key) ? '' + key : key.__str__($)) + ":" + (value.__str__($, $$)));
            }
            return _results;
          }).call(this)).join(',')) + "]";
        }
      },
      __repr__: function($) {
        var arrayPart, dataPart, item, key, value;
        arrayPart = ((function() {
          var _i, _len, _ref6, _results;
          _ref6 = this.data;
          _results = [];
          for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
            item = _ref6[_i];
            _results.push(item.__repr__($));
          }
          return _results;
        }).call(this)).weave(',');
        dataPart = $.jml(((function() {
          var _ref6, _results;
          _ref6 = this.data;
          _results = [];
          for (key in _ref6) {
            value = _ref6[key];
            if (!isInteger(key)) _results.push([key, ':', value.__repr__($)]);
          }
          return _results;
        }).call(this)).weave(', '));
        if (dataPart.length > 0) {
          return $.jml.apply($, ['['].concat(__slice.call(arrayPart), [' '], [dataPart], [']']));
        } else {
          return $.jml.apply($, ['['].concat(__slice.call(arrayPart), [']']));
        }
      },
      jsValue$: {
        get: function() {
          var key, tmp, value, _ref6;
          tmp = [];
          _ref6 = this.data;
          for (key in _ref6) {
            value = _ref6[key];
            tmp[key] = value.jsValue;
          }
          return tmp;
        }
      },
      toString: function() {
        return "[JArray]";
      },
      push: function($, _arg) {
        var value;
        value = _arg[0];
        Array.prototype.push.call(this.data, value);
        return JUndefined;
      }
    };
  });

  JAccessControlItem = this.JAccessControlItem = clazz('JAccessControlItem', function() {
    return {
      init: function(who, what) {
        this.who = who;
        this.what = what;
      },
      toString: function() {
        return "[JAccessControlItem " + this.who + ": " + this.what + "]";
      }
    };
  });

  JUser = this.JUser = clazz('JUser', JObject, function() {
    return {
      init: function(_arg) {
        var GOD, id;
        id = _arg.id, this.name = _arg.name;
        assert.equal(typeof this.name, 'string', "@name not string");
        GOD = require('joeson/src/interpreter/global').GOD;
        if (GOD == null) assert.ok(this.name === 'god', "Who else could it be?");
        if (GOD == null) GOD = this;
        return this["super"].init.call(this, {
          id: id,
          creator: GOD,
          data: {
            name: this.name
          }
        });
      },
      toString: function() {
        return "[JUser " + this.name + "]";
      }
    };
  });

  JSingleton = this.JSingleton = clazz('JSingleton', function() {
    return {
      init: function(name, jsValue) {
        this.name = name;
        this.jsValue = jsValue;
      },
      __get__: function($, key) {
        return $["throw"]('TypeError', "Cannot read property '" + key + "' of " + this.name);
      },
      __set__: function($, key, value) {
        return $["throw"]('TypeError', "Cannot set property '" + key + "' of " + this.name);
      },
      __keys__: function($) {
        return $["throw"]('TypeError', "Cannot get keys of " + this.name);
      },
      __iter__: function($) {
        return $["throw"]('TypeError', "Cannot get iterator of " + this.name);
      },
      __num__: function($) {
        return JNaN;
      },
      __add__: function($, other) {
        return JNaN;
      },
      __sub__: function($, other) {
        return JNaN;
      },
      __mul__: function($, other) {
        return JNaN;
      },
      __div__: function($, other) {
        return JNaN;
      },
      __bool__: function($, other) {
        return false;
      },
      __key__: function($) {
        return $["throw"]('TypeError', "Can't use object as a key");
      },
      __str__: function($) {
        return this.name;
      },
      __repr__: function($) {
        return this.name;
      },
      toString: function() {
        return "Singleton(" + this.name + ")";
      }
    };
  });

  JNull = this.JNull = new JSingleton('null', null);

  JUndefined = this.JUndefined = new JSingleton('undefined', void 0);

  JNaN = this.JNaN = new Number(NaN);

  JBoundFunc = this.JBoundFunc = clazz('JBoundFunc', JObject, function() {
    return {
      init: function(_arg) {
        var acl, creator, id;
        id = _arg.id, creator = _arg.creator, acl = _arg.acl, this.func = _arg.func, this.scope = _arg.scope;
        this["super"].init.call(this, {
          id: id,
          creator: creator,
          acl: acl
        });
        assert.ok(this.func instanceof joe.Func, "func not Func");
        return assert.ok((this.scope != null) && this.scope instanceof JObject, "scope not a JObject");
      },
      __str__: function($) {
        return "(<\#" + this.id + ">)";
      },
      __repr__: function($) {
        var dataPart, key, value;
        dataPart = ((function() {
          var _ref6, _results;
          _ref6 = this.data;
          _results = [];
          for (key in _ref6) {
            value = _ref6[key];
            _results.push([key, ':', value.__repr__($)]);
          }
          return _results;
        }).call(this)).weave(', ', {
          flattenItems: true
        });
        if (dataPart.length > 0) {
          return $.jml('[JBoundFunc ', $.jml(dataPart), ']');
        } else {
          return "[JBoundFunc]";
        }
      },
      toString: function() {
        return "[JBoundFunc]";
      }
    };
  });

  SimpleIterator = clazz('SimpleIterator', function() {
    return {
      init: function(items) {
        this.items = items;
        this.length = this.items.length;
        return this.idx = 0;
      },
      next: function() {
        if (this.idx < this.length) {
          return this.items[this.idx];
        } else {
          throw 'StopIteration';
        }
      }
    };
  });

  if (joe.Node.prototype.interpret == null) {
    (function() {
      require('joeson/src/translators/scope').install();
      require('joeson/src/translators/javascript').install();
      joe.Node.prototype.extend({
        interpret: function($) {
          throw new Error("Dunno how to evaluate a " + this.constructor.name + ".");
        }
      });
      joe.Word.prototype.extend({
        interpret: function($) {
          $.pop();
          return $.scope.__get__($, this, true);
        },
        __key__: function($) {
          return this.key;
        },
        __str__: function($) {
          return $["throw"]('TypeError', "This shouldn't happen");
        }
      });
      joe.Undetermined.prototype.extend({
        __key__: function($) {
          assert.ok(this.word != null, "Undetermined not yet determined!");
          return this.word.key;
        },
        __str__: function($) {
          return $["throw"]('TypeError', "This shouldn't happen");
        }
      });
      joe.Block.prototype.extend({
        interpret: function($) {
          var firstLine, length, variable, _i, _len, _ref6;
          $.pop();
          if (this.ownScope != null) {
            _ref6 = this.ownScope.nonparameterVariables;
            for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
              variable = _ref6[_i];
              $.scope.__set__($, variable, JUndefined);
            }
          }
          if ((length = this.lines.length) > 1) {
            $.push({
              "this": this,
              func: joe.Block.prototype.interpretLoop,
              length: length,
              idx: 0
            });
          }
          firstLine = this.lines[0];
          $.push({
            "this": firstLine,
            func: firstLine.interpret
          });
        },
        interpretLoop: function($, i9n, last) {
          var nextLine;
          assert.ok(typeof i9n.idx === 'number');
          if (i9n.idx === i9n.length - 2) $.pop();
          nextLine = this.lines[++i9n.idx];
          $.push({
            "this": nextLine,
            func: nextLine.interpret
          });
        }
      });
      joe.If.prototype.extend({
        interpret: function($) {
          $.pop();
          $.push({
            "this": this,
            func: joe.If.prototype.interpret2
          });
          $.push({
            "this": this.cond,
            func: this.cond.interpret
          });
        },
        interpret2: function($, i9n, cond) {
          $.pop();
          if ((typeof cond.__isTrue__ === "function" ? cond.__isTrue__() : void 0) || cond) {
            $.push({
              "this": this.block,
              func: this.block.interpret
            });
          } else if (this["else"]) {
            $.push({
              "this": this["else"],
              func: this["else"].interpret
            });
          }
        }
      });
      joe.Assign.prototype.extend({
        interpret: function($, i9n) {
          var key, targetObj, type, _ref6;
          i9n.func = joe.Assign.prototype.interpret2;
          $.push({
            "this": this.value,
            func: this.value.interpret
          });
          if (this.target instanceof joe.Index) {
            _ref6 = this.target, targetObj = _ref6.obj, type = _ref6.type, key = _ref6.key;
            $.push({
              "this": i9n,
              func: setLast,
              key: 'targetObj'
            });
            $.push({
              "this": targetObj,
              func: targetObj.interpret
            });
            if (type === '.') {
              assert.ok(key instanceof joe.Word, "Unexpected key of type " + (key != null ? key.constructor.name : void 0));
              i9n.key = key;
            } else {
              $.push({
                "this": i9n,
                func: setLast,
                key: 'key'
              });
              $.push({
                "this": key,
                func: key.interpret
              });
            }
          }
        },
        interpret2: function($, i9n, value) {
          $.pop();
          if (isVariable(this.target)) {
            $.scope.__update__($, this.target, value);
          } else if (this.target instanceof joe.Index) {
            i9n.targetObj.__set__($, i9n.key, value);
          } else {
            throw new Error("Dunno how to assign to " + this.target + " (" + this.target.constructor.name + ")");
          }
          return value;
        }
      });
      joe.Obj.prototype.extend({
        interpret: function($, i9n) {
          var length, _ref6, _ref7;
          length = (_ref6 = (_ref7 = this.items) != null ? _ref7.length : void 0) != null ? _ref6 : 0;
          if (length > 0) {
            i9n.obj = new JObject({
              creator: $.user
            });
            i9n.idx = 0;
            i9n.length = this.items.length;
            i9n.func = joe.Obj.prototype.interpretKV;
          } else {
            $.pop();
            return new JObject({
              creator: $.user
            });
          }
        },
        interpretKV: function($, i9n) {
          var key, value, _ref6;
          if (0 < i9n.idx) i9n.obj.__set__($, i9n.key, i9n.value);
          if (i9n.idx < i9n.length) {
            _ref6 = this.items[i9n.idx], key = _ref6.key, value = _ref6.value;
            if (key instanceof joe.Word) {
              i9n.key = key;
            } else if (key instanceof joe.Str) {
              $.push({
                "this": i9n,
                func: setLast,
                key: 'key'
              });
              $.push({
                "this": key,
                func: key.interpret
              });
            } else {
              throw new Error("Unexpected object key of type " + (key != null ? key.constructor.name : void 0));
            }
            $.push({
              "this": i9n,
              func: setLast,
              key: 'value'
            });
            $.push({
              "this": value,
              func: value.interpret
            });
            i9n.idx++;
          } else {
            $.pop();
            return i9n.obj;
          }
        }
      });
      joe.Arr.prototype.extend({
        interpret: function($, i9n) {
          var length, _ref6, _ref7;
          length = (_ref6 = (_ref7 = this.items) != null ? _ref7.length : void 0) != null ? _ref6 : 0;
          if (length > 0) {
            i9n.arr = new JArray({
              creator: $.user
            });
            i9n.idx = 0;
            i9n.length = this.items.length;
            i9n.func = joe.Arr.prototype.interpretKV;
          } else {
            $.pop();
            return new JArray({
              creator: $.user
            });
          }
        },
        interpretKV: function($, i9n, value) {
          if (0 < i9n.idx) i9n.arr.__set__($, i9n.idx - 1, value);
          if (i9n.idx < i9n.length) {
            value = this.items[i9n.idx];
            $.push({
              "this": value,
              func: value.interpret
            });
            i9n.idx++;
          } else {
            $.pop();
            return i9n.arr;
          }
        }
      });
      joe.Operation.prototype.extend({
        interpret: function($, i9n) {
          var key, targetObj, _ref6, _ref7;
          i9n.func = joe.Operation.prototype.interpret2;
          if (this.left != null) {
            $.push({
              "this": i9n,
              func: setLast,
              key: 'left'
            });
            $.push({
              "this": this.left,
              func: this.left.interpret
            });
            if (this.left instanceof joe.Index && ((_ref6 = this.op) === '--' || _ref6 === '++')) {
              _ref7 = this.left, targetObj = _ref7.obj, key = _ref7.key;
              $.push({
                "this": i9n,
                func: setLast,
                key: 'targetObj'
              });
              $.push({
                "this": targetObj,
                func: targetObj.interpret
              });
              if (key instanceof joe.Word) {
                i9n.key = key;
              } else if (key instanceof joe.Str) {
                $.push({
                  "this": i9n,
                  func: setLast,
                  key: 'key'
                });
                $.push({
                  "this": key,
                  func: key.interpret
                });
              } else {
                throw new Error("Unexpected object key of type " + (key != null ? key.constructor.name : void 0));
              }
            }
          }
          if (this.right != null) {
            $.push({
              "this": i9n,
              func: setLast,
              key: 'right'
            });
            $.push({
              "this": this.right,
              func: this.right.interpret
            });
          }
        },
        interpret2: function($, i9n) {
          var left, right, value;
          $.pop();
          if (this.left != null) {
            left = i9n.left;
            if (this.right != null) {
              right = i9n.right;
              switch (this.op) {
                case '+':
                  return left.__add__($, right);
                case '-':
                  return left.__sub__($, right);
                case '*':
                  return left.__mul__($, right);
                case '/':
                  return left.__div__($, right);
                case '<':
                  return left.__cmp__($, right) < 0;
                case '>':
                  return left.__cmp__($, right) > 0;
                case '<=':
                  return left.__cmp__($, right) <= 0;
                case '>=':
                  return left.__cmp__($, right) >= 0;
                default:
                  throw new Error("Unexpected operation " + this.op);
              }
            } else {
              switch (this.op) {
                case '++':
                  value = left.__add__($, 1);
                  break;
                case '--':
                  value = left.__sub__($, 1);
                  break;
                default:
                  throw new Error("Unexpected operation " + this.op);
              }
              if (isVariable(this.left)) {
                $.scope.__update__($, this.left, value);
              } else if (this.left instanceof joe.Index) {
                i9n.targetObj.__set__($, i9n.key, value);
              } else {
                throw new Error("Dunno how to operate with " + left + " (" + left.constructor.name + ")");
              }
              return value;
            }
          } else {
            throw new Error("implement me!");
          }
        }
      });
      joe.Null.prototype.extend({
        interpret: function($) {
          $.pop();
          return JNull;
        }
      });
      joe.Undefined.prototype.extend({
        interpret: function($) {
          $.pop();
          return JUndefined;
        }
      });
      joe.Index.prototype.extend({
        interpret: function($, i9n) {
          i9n.func = joe.Index.prototype.interpretTarget;
          $.push({
            "this": this.obj,
            func: this.obj.interpret
          });
        },
        interpretTarget: function($, i9n, obj) {
          var _ref6;
          if (i9n.setSource != null) i9n.setSource.source = obj;
          if (this.type === '.') {
            assert.ok(this.key instanceof joe.Word, "Unexpected key of type " + ((_ref6 = this.key) != null ? _ref6.constructor.name : void 0));
            $.pop();
            return obj.__get__($, this.key);
          } else {
            i9n.obj = obj;
            i9n.func = joe.Index.prototype.interpretKey;
            $.push({
              "this": this.key,
              func: this.key.interpret
            });
          }
        },
        interpretKey: function($, i9n, key) {
          $.pop();
          return i9n.obj.__get__($, key);
        }
      });
      joe.Func.prototype.extend({
        interpret: function($, i9n) {
          $.pop();
          return new JBoundFunc({
            func: this,
            creator: $.user,
            scope: $.scope
          });
        }
      });
      joe.Invocation.prototype.extend({
        interpret: function($, i9n) {
          i9n.oldScope = $.scope;
          i9n.func = joe.Invocation.prototype.interpretParams;
          i9n.invokedFunctionRepr = '' + this.func;
          $.push({
            "this": this.func,
            func: this.func.interpret,
            setSource: i9n
          });
        },
        interpretParams: function($, i9n, func) {
          var i, param, _i, _len, _ref6;
          if (!(func instanceof JBoundFunc || func instanceof Function)) {
            return $["throw"]('TypeError', "" + this.func + " cannot be called.");
          }
          i9n.invokedFunction = func;
          i9n.paramValues = [];
          _ref6 = this.params;
          for (i = _i = 0, _len = _ref6.length; _i < _len; i = ++_i) {
            param = _ref6[i];
            $.push({
              "this": i9n,
              func: setLast,
              key: 'paramValues',
              index: i
            });
            $.push({
              "this": param,
              func: param.interpret
            });
          }
          i9n.func = joe.Invocation.prototype.interpretCall;
        },
        interpretCall: function($, i9n) {
          var argName, block, i, paramValues, params, scope, _i, _len, _ref10, _ref11, _ref6, _ref7, _ref8, _ref9;
          i9n.func = joe.Invocation.prototype.interpretFinal;
          if (i9n.invokedFunction instanceof JBoundFunc) {
            i9n.oldScope = $.scope;
            _ref6 = i9n.invokedFunction, (_ref7 = _ref6.func, block = _ref7.block, params = _ref7.params), scope = _ref6.scope;
            paramValues = i9n.paramValues;
            if (i9n.source != null) {
              $.scope = scope.__create__($, {
                "this": i9n.source
              });
            } else {
              $.scope = scope.__create__($);
            }
            if (params != null) {
              assert.ok(params instanceof joe.AssignList);
              _ref8 = params.items;
              for (i = _i = 0, _len = _ref8.length; _i < _len; i = ++_i) {
                argName = _ref8[i].target;
                assert.ok(isVariable(argName, "Expected variable but got " + argName + " (" + (argName != null ? argName.constructor.name : void 0) + ")"));
                $.scope.__set__($, argName, (_ref9 = paramValues[i]) != null ? _ref9 : JUndefined);
              }
            }
            if (block != null) {
              $.push({
                "this": block,
                func: block.interpret
              });
            } else {
              return JUndefined;
            }
          } else if (i9n.invokedFunction instanceof Function) {
            try {
              return i9n.invokedFunction.call(i9n.source, $, i9n.paramValues);
            } catch (error) {
              return $["throw"]((_ref10 = error != null ? error.name : void 0) != null ? _ref10 : 'UnknownError', (_ref11 = error != null ? error.message : void 0) != null ? _ref11 : '' + error);
            }
          }
        },
        interpretFinal: function($, i9n, result) {
          $.pop();
          $.scope = i9n.oldScope;
          return result;
        }
      });
      joe.AssignObj.prototype.extend({
        interpret: function($, i9n, rhs) {
          assert.ok(false, "AssignObjs aren't part of javascript. Why didn't they get transformed away?");
        }
      });
      joe.Statement.prototype.extend({
        interpret: function($, i9n) {
          if (this.expr != null) {
            i9n.func = joe.Statement.prototype.interpretResult;
            $.push({
              "this": this.expr,
              func: this.expr.interpret
            });
          } else {
            return $["return"](joe.JUndefined);
          }
        },
        interpretResult: function($, i9n, result) {
          return $["return"](result);
        }
      });
      joe.Loop.prototype.extend({
        interpret: function($, i9n) {
          $.push({
            "this": this.block,
            func: this.block.interpret
          });
        }
      });
      joe.JSForC.prototype.extend({
        interpret: function($, i9n) {
          if (this.cond != null) {
            i9n.func = joe.JSForC.prototype.interpretConditionalLoop;
            $.push({
              "this": this.cond,
              func: this.cond.interpret
            });
          } else {
            i9n.func = joe.JSForC.prototype.interpretUnconditionalLoop;
          }
          if (this.setup != null) {
            $.push({
              "this": this.setup,
              func: this.setup.interpret
            });
          }
        },
        interpretConditionalLoop: function($, i9n, cond) {
          if (cond.__bool__().jsValue) {
            $.push({
              "this": this.cond,
              func: this.cond.interpret
            });
            $.push({
              "this": this.counter,
              func: this.counter.interpret
            });
            return $.push({
              "this": this.block,
              func: this.block.interpret
            });
          } else {
            $.pop();
          }
        },
        interpretUnconditionalLoop: function($, i9n) {
          $.push({
            "this": this.counter,
            func: this.counter.interpret
          });
          $.push({
            "this": this.block,
            func: this.block.interpret
          });
        }
      });
      joe.Range.prototype.extend({
        interpret: function($, i9n) {
          i9n.func = joe.Range.prototype.interpret2;
          if (this.start != null) {
            $.push({
              "this": i9n,
              func: setLast,
              key: 'start'
            });
            $.push({
              "this": this.start,
              func: this.start.interpret
            });
          }
          if (this.end != null) {
            $.push({
              "this": i9n,
              func: setLast,
              key: 'end'
            });
            $.push({
              "this": this.end,
              func: this.end.interpret
            });
          }
          if (this.by != null) {
            $.push({
              "this": i9n,
              func: setLast,
              key: 'by'
            });
            $.push({
              "this": this.by,
              func: this.by.interpret
            });
          }
        },
        interpret2: function($, i9n) {
          var array, x, _i, _j, _ref6, _ref7, _ref8, _ref9, _results, _results2;
          $.pop();
          if (i9n.by != null) {
            if (this.type === '..') {
              array = (function() {
                var _i, _ref6, _ref7, _ref8, _results;
                _results = [];
                for (x = _i = _ref6 = i9n.start, _ref7 = i9n.end, _ref8 = i9n.by; _ref6 <= _ref7 ? _i <= _ref7 : _i >= _ref7; x = _i += _ref8) {
                  _results.push(x);
                }
                return _results;
              })();
            } else {
              array = (function() {
                var _i, _ref6, _ref7, _ref8, _results;
                _results = [];
                for (x = _i = _ref6 = i9n.start, _ref7 = i9n.end, _ref8 = i9n.by; _ref6 <= _ref7 ? _i < _ref7 : _i > _ref7; x = _i += _ref8) {
                  _results.push(x);
                }
                return _results;
              })();
            }
          } else {
            if (this.type === '..') {
              array = (function() {
                _results = [];
                for (var _i = _ref6 = i9n.start, _ref7 = i9n.end; _ref6 <= _ref7 ? _i <= _ref7 : _i >= _ref7; _ref6 <= _ref7 ? _i++ : _i--){ _results.push(_i); }
                return _results;
              }).apply(this);
            } else {
              array = (function() {
                _results2 = [];
                for (var _j = _ref8 = i9n.start, _ref9 = i9n.end; _ref8 <= _ref9 ? _j < _ref9 : _j > _ref9; _ref8 <= _ref9 ? _j++ : _j--){ _results2.push(_j); }
                return _results2;
              }).apply(this);
            }
          }
          return JArray({
            creator: $.user,
            data: array
          });
        }
      });
      clazz.extend(String, {
        interpret: function($) {
          $.pop();
          return this.valueOf();
        },
        __get__: function($, key) {
          return JUndefined;
        },
        __set__: function($, key, value) {},
        __keys__: function($) {
          return $["throw"]('TypeError', "Object.keys called on non-object");
        },
        __iter__: function($) {
          return new SimpleIterator(this.valueOf());
        },
        __num__: function($) {
          return JNaN;
        },
        __add__: function($, other) {
          if (typeof other === 'string' || other instanceof String) {
            return this + other;
          } else {
            return this + other.__str__($);
          }
        },
        __sub__: function($, other) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __mul__: function($, other) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __div__: function($, other) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __cmp__: function($, other) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __bool__: function($) {
          return this.length > 0;
        },
        __key__: function($) {
          return this.valueOf();
        },
        __str__: function($) {
          return "\"" + (escape(this)) + "\"";
        },
        __repr__: function($) {
          return "\"" + (escape(this)) + "\"";
        },
        jsValue$: {
          get: function() {
            return this.valueOf();
          }
        }
      });
      clazz.extend(Number, {
        interpret: function($) {
          $.pop();
          return this.valueOf();
        },
        __get__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __set__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __keys__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __iter__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __num__: function($) {
          return this.valueOf();
        },
        __add__: function($, other) {
          return this + other.__num__();
        },
        __sub__: function($, other) {
          return this - other.__num__();
        },
        __mul__: function($, other) {
          return this * other.__num__();
        },
        __div__: function($, other) {
          return this / other.__num__();
        },
        __cmp__: function($, other) {
          return this - other.__num__();
        },
        __bool__: function($) {
          return this !== 0;
        },
        __key__: function($) {
          return this.valueOf();
        },
        __str__: function($) {
          return '' + this;
        },
        __repr__: function($) {
          return '' + this;
        },
        jsValue$: {
          get: function() {
            return this.valueOf();
          }
        }
      });
      clazz.extend(Boolean, {
        interpret: function($) {
          $.pop();
          return this.valueOf();
        },
        __get__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __set__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __keys__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __iter__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __num__: function($) {
          return JNaN;
        },
        __add__: function($, other) {
          return JNaN;
        },
        __sub__: function($, other) {
          return JNaN;
        },
        __mul__: function($, other) {
          return JNaN;
        },
        __div__: function($, other) {
          return JNaN;
        },
        __cmp__: function($, other) {
          return JNaN;
        },
        __bool__: function($) {
          return this.valueOf();
        },
        __key__: function($) {
          return $["throw"]('TypeError', "Can't use a boolean as a key");
        },
        __str__: function($) {
          return '' + this;
        },
        __repr__: function($) {
          return '' + this;
        },
        jsValue$: {
          get: function() {
            return this.valueOf();
          }
        }
      });
      return clazz.extend(Function, {
        __get__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __set__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __keys__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __iter__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        },
        __num__: function($) {
          return JNaN;
        },
        __add__: function($, other) {
          return JNaN;
        },
        __sub__: function($, other) {
          return JNaN;
        },
        __mul__: function($, other) {
          return JNaN;
        },
        __div__: function($, other) {
          return JNaN;
        },
        __cmp__: function($, other) {
          return JNaN;
        },
        __bool__: function($) {
          return true;
        },
        __key__: function($) {
          return $["throw"]('TypeError', "Can't use a function as a key");
        },
        __str__: function($) {
          return "(<\#" + this.id + ">)";
        },
        __repr__: function($) {
          var name, _ref6;
          name = (_ref6 = this.name) != null ? _ref6 : this._name;
          if (name) {
            return "[NativeFunction: " + name + "]";
          } else {
            return "[NativeFunction]";
          }
        },
        jsValue$: {
          get: function() {
            return this.valueOf();
          }
        }
      });
    })();
  }

}).call(this);
