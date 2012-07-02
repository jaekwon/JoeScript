(function() {
  var Node, Set, assert, black, blue, clazz, cyan, green, indent, inspect, magenta, normal, red, validateType, white, yellow, _ref, _ref2, _ref3;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow), (_ref3 = _ref.collections, Set = _ref3.Set);

  inspect = require('util').inspect;

  assert = require('assert');

  indent = function(c) {
    return Array(c + 1).join('  ');
  };

  this.Node = Node = clazz('Node', function() {
    return {
      withChildren: function(cb, options) {
        var desc, i, item, key, skipUndefined, value, _i, _key, _len, _ref4, _ref5, _value;
        skipUndefined = (_ref4 = options != null ? options.skipUndefined : void 0) != null ? _ref4 : true;
        _ref5 = this.children || {};
        for (key in _ref5) {
          desc = _ref5[key];
          value = this[key];
          if (!(value != null) && !desc.required) {
            continue;
          } else if (desc.type instanceof Array) {
            assert.ok(value instanceof Array, "Expected ( " + this + " (" + this.constructor.name + ") )." + key + " to be an Array but got " + value + " (" + (value != null ? value.constructor.name : void 0) + ")");
            for (i = _i = 0, _len = value.length; _i < _len; i = ++_i) {
              item = value[i];
              if (item != null) cb(item, this, key, desc.type[0], i);
            }
          } else if (desc.type instanceof Object && (desc.type.value != null)) {
            for (_key in value) {
              _value = value[_key];
              if (_value != null) cb(_value, this, key, desc.type.value, _key);
            }
          } else if ((value != null) || !skipUndefined) {
            cb(value, this, key, desc);
          }
        }
      },
      walk: function(_arg, parent, key, desc, key2) {
        var post, pre;
        pre = _arg.pre, post = _arg.post;
        if (parent == null) parent = void 0;
        if (key == null) key = void 0;
        if (desc == null) desc = void 0;
        if (key2 == null) key2 = void 0;
        if (pre != null) pre(this, parent, key, desc, key2);
        this.withChildren(function(child, parent, key, desc, key2) {
          if (!(child instanceof Node)) {
            throw Error("Unexpected object encountered walking children: " + child + " (" + (child != null ? child.constructor.name : void 0) + ")");
          }
          return child.walk({
            pre: pre,
            post: post
          }, parent, key, desc, key2);
        });
        if (post != null) return post(this, parent, key, desc, key2);
      },
      validate: function() {
        return this.withChildren(function(child, parent, key, desc) {
          var error;
          error = validateType(child, desc);
          if (error != null) {
            throw new Error("Error in validation (key='" + key + "'): " + error);
          }
          if (child instanceof Node) return child.validate();
        }, {
          skipUndefined: false
        });
      },
      serialize: function(_indent) {
        var str, valueStr, _ref4, _ref5;
        if (_indent == null) _indent = 0;
        valueStr = this.toString();
        if (((_ref4 = this.ownScope) != null ? (_ref5 = _ref4.variables) != null ? _ref5.length : void 0 : void 0) > 0) {
          valueStr += yellow(this.ownScope.variables.join(' '));
        }
        str = "" + (green(this.constructor.name)) + " " + valueStr + "\n";
        this.withChildren(function(child, parent, key, desc, key2) {
          str += "" + (indent(_indent + 1)) + (red('@' + key)) + (key2 != null ? red('[' + key2 + ']') : '') + ": ";
          if (child.serialize != null) {
            return str += "" + (child.serialize(_indent + 1)) + "\n";
          } else {
            return str += "" + ('' + child) + " " + ("(" + child.constructor.name + ")") + "\n";
          }
        });
        return str.trimRight();
      }
    };
  });

  validateType = function(obj, descriptor) {
    var error, item, type, _i, _j, _len, _len2, _ref4;
    if (!(obj != null)) {
      if (!descriptor.required) return;
      return "missing value";
    }
    if (descriptor.type instanceof Array) {
      assert.ok(descriptor.type.length === 1, "Dunno how to handle cases where the type is an Array of length != 1");
      type = descriptor.type[0];
      if (!obj instanceof Array) {
        return "Expected " + obj + " to be an Array of " + (inspect(type)) + " but got " + (obj != null ? obj.constructor.name : void 0);
      }
      for (_i = 0, _len = obj.length; _i < _len; _i++) {
        item = obj[_i];
        error = validateType(item, type);
        if (error != null) return error;
      }
      return;
    } else if (descriptor.type instanceof Set) {
      _ref4 = descriptor.type.elements;
      for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
        type = _ref4[_j];
        error = validateType(obj, type);
        if (!(error != null)) return;
      }
      return "Expected one of " + (((function() {
        var _k, _len3, _ref5, _results;
        _ref5 = descriptor.type.elements;
        _results = [];
        for (_k = 0, _len3 = _ref5.length; _k < _len3; _k++) {
          type = _ref5[_k];
          _results.push(inspect(type));
        }
        return _results;
      })()).join(', ')) + " but got " + obj.constructor.name;
    }
    if (descriptor.type instanceof Function) {
      if (obj instanceof descriptor.type) return;
      return "Expected type of " + descriptor.type.name + " but got " + obj.constructor.name;
    } else if (typeof descriptor.type === 'string') {
      if (typeof obj === descriptor.type) return;
      return "Expected native type of " + descriptor.type + " but got " + (typeof obj);
    } else if (descriptor.type != null) {
      return assert.ok(false, "Should not happen. Dunno how to handle descriptor type " + (inspect(descriptor.type)));
    }
  };

}).call(this);
