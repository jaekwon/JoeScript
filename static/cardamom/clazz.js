(function() {
  var SUPERKEY, bindMethods, ctor, extendProto, isPropertyDescriptor, _getThis, _makeSuper,
    __hasProp = Object.prototype.hasOwnProperty;

  isPropertyDescriptor = function(obj) {
    return typeof obj === 'object' && (obj.get || obj.set || obj.value);
  };

  ctor = function(proto, fn) {
    fn.prototype = proto;
    return fn;
  };

  SUPERKEY = {
    "const": 'SUPERKEY'
  };

  _getThis = function(obj) {
    if (obj.hasOwnProperty('__superKey__') && obj.__superKey__ === SUPERKEY) {
      return obj["this"];
    } else {
      return obj;
    }
  };

  _makeSuper = function(baseProto, that) {
    var _super;
    _super = new (ctor(baseProto, function() {
      this.__superKey__ = SUPERKEY;
      this["this"] = that;
      return this;
    }))();
    return _super;
  };

  bindMethods = function(that, proto) {
    var name, value, _results;
    _results = [];
    for (name in proto) {
      if (!(name[name.length - 1] === '$' && name.length > 1)) continue;
      value = that[name];
      name = name.slice(0, (name.length - 1));
      if (typeof value === 'function') {
        _results.push(that[name] = value.bind(that));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  extendProto = function(protoProto) {
    var name, value, _results,
      _this = this;
    _results = [];
    for (name in protoProto) {
      value = protoProto[name];
      _results.push((function(name, value) {
        var desc, getter, setter;
        if (name[name.length - 1] === '$' && name.length > 1) {
          name = name.slice(0, (name.length - 1));
          if (typeof value === 'function') {
            desc = {
              enumerable: true,
              configurable: true,
              get: function() {
                var boundFunc;
                boundFunc = value.bind(_getThis(this));
                boundFunc._name = name;
                return boundFunc;
              },
              set: function(newValue) {
                return Object.defineProperty(_getThis(this), name, {
                  writable: true,
                  enumerable: true,
                  configurable: true,
                  value: newValue
                });
              }
            };
            return Object.defineProperty(_this, name, desc);
          } else if (isPropertyDescriptor(value)) {
            getter = value.get;
            setter = value.set;
            desc = value;
            if (desc.enumerable == null) desc.enumerable = true;
            if (desc.configurable == null) desc.configurable = true;
            if (desc.value != null) {
              if (desc.writable == null) desc.writable = true;
            } else {
              desc.get = function() {
                return getter.call(_getThis(this));
              };
              desc.set = function(newValue) {
                if (setter != null) {
                  return setter.call(_getThis(this), newValue);
                } else {
                  return Object.defineProperty(_getThis(this), name, {
                    writable: true,
                    enumerable: true,
                    configurable: true,
                    value: newValue
                  });
                }
              };
            }
            return Object.defineProperty(_this, name, desc);
          }
        } else {
          if (typeof value === 'function') value._name = name;
          return _this[name] = value;
        }
      })(name, value));
    }
    return _results;
  };

  this.clazz = function(name, base, protoFn) {
    var clazzDefined, constructor, key, proto, protoCtor, protoProto, value, _ref, _ref2;
    if (typeof name !== 'string') {
      _ref = [void 0, name, base], name = _ref[0], base = _ref[1], protoFn = _ref[2];
    }
    if (protoFn === void 0) {
      _ref2 = [name, void 0, base], name = _ref2[0], base = _ref2[1], protoFn = _ref2[2];
    }
    protoFn || (protoFn = (function() {}));
    clazzDefined = false;
    proto = void 0;
    if (!(name != null)) {
      constructor = function() {
        var _ref3;
        if (!clazzDefined) {
          throw new Error("Can't create " + name + " clazz instances in the clazz body.");
        }
        if (this instanceof constructor) {
          bindMethods(this, proto);
          if ((_ref3 = proto.init) != null) _ref3.apply(this, arguments);
          if (this._newOverride !== void 0) return this._newOverride;
          return this;
        } else {
          return (function(func, args, ctor) {
            ctor.prototype = func.prototype;
            var child = new ctor, result = func.apply(child, args);
            return typeof result === "object" ? result : child;
          })(constructor, arguments, function() {});
        }
      };
    } else {
      constructor = eval("function " + name + "() {\n  if (!clazzDefined) throw new Error(\"Can't create " + name + " clazz instances in the clazz body.\");\n  if (this instanceof constructor) {\n    bindMethods(this, proto);\n    if (typeof proto.init !== 'undefined' && proto.init !== null) proto.init.apply(this, arguments);\n    if (this._newOverride !== void 0) return this._newOverride;\n    return this;\n  } else {\n    return (function(func, args, ctor) {\n      ctor.prototype = proto;\n      var child = new ctor, result = func.apply(child, args);\n      return typeof result === \"object\" ? result : child;\n    })(constructor, arguments, function() {});\n  }\n}; " + name);
    }
    if (base != null) {
      for (key in base) {
        if (!__hasProp.call(base, key)) continue;
        value = base[key];
        constructor[key] = value;
      }
    } else {
      base = Object;
    }
    protoCtor = ctor(base.prototype, function() {
      Object.defineProperty(this, 'constructor', {
        value: constructor,
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(this, 'super', {
        configurable: false,
        enumerable: false,
        get: function() {
          return _makeSuper(base.prototype, this);
        }
      });
      Object.defineProperty(this, 'extend', {
        value: extendProto,
        writable: true,
        configurable: true,
        enumerable: false
      });
      return this;
    });
    constructor.prototype = proto = new protoCtor();
    protoProto = protoFn.call(constructor, base.prototype);
    extendProto.call(proto, protoProto);
    clazzDefined = true;
    return constructor;
  };

  this.clazz.extend = function(_class, protoProto) {
    return extendProto.call(_class.prototype, protoProto);
  };

}).call(this);
