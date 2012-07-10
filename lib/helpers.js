(function() {
  var extend, flatten;

  this.starts = function(string, literal, start) {
    return literal === string.substr(start, literal.length);
  };

  this.ends = function(string, literal, back) {
    var len;
    len = literal.length;
    return literal === string.substr(string.length - len - (back || 0), len);
  };

  this.compact = function(array) {
    var item, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      item = array[_i];
      if (item) _results.push(item);
    }
    return _results;
  };

  this.count = function(string, substr) {
    var num, pos;
    num = pos = 0;
    if (!substr.length) return 1 / 0;
    while (pos = 1 + string.indexOf(substr, pos)) {
      num++;
    }
    return num;
  };

  this.merge = function(options, overrides) {
    return extend(extend({}, options), overrides);
  };

  this.extend = extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };

  this.flatten = flatten = function(array) {
    var element, flattened, _i, _len;
    flattened = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      element = array[_i];
      if (element instanceof Array) {
        flattened = flattened.concat(flatten(element));
      } else {
        flattened.push(element);
      }
    }
    return flattened;
  };

  this.del = function(obj, key) {
    var val;
    val = obj[key];
    delete obj[key];
    return val;
  };

  this.last = function(array, back) {
    return array[array.length - (back || 0) - 1];
  };

  this.escape = function(str) {
    return ('' + str).replace(/\\/g, '\\\\').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/"/g, "\\\"");
  };

  this.htmlEscape = function(txt) {
    return String(txt).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  this.pad = function(_arg, str) {
    var left, right;
    left = _arg.left, right = _arg.right;
    str = '' + str;
    if ((right != null) && right > str.length) {
      return Array(right - str.length + 1).join(' ') + str;
    } else if (left > str.length) {
      return str + Array(left - str.length + 1).join(' ');
    }
    return str;
  };

  this.randid = function(len) {
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

  this.weave = function(items, join, options) {
    var i, item, itemsLength, result, _i, _len, _ref;
    result = [];
    itemsLength = items.length;
    for (i = _i = 0, _len = items.length; _i < _len; i = ++_i) {
      item = items[i];
      if (options != null ? options.flattenItems : void 0) {
        [].splice.apply(result, [(_ref = result.length), 9e9].concat(item)), item;
      } else {
        result.push(item);
      }
      if (i < itemsLength - 1) result.push(join);
    }
    return result;
  };

  if (Array.prototype.weave == null) {
    Object.defineProperty(Array.prototype, 'weave', {
      configurable: false,
      enumerable: false,
      value: function(join, options) {
        var i, item, length, result, _i, _len, _ref;
        result = [];
        length = this.length;
        for (i = _i = 0, _len = this.length; _i < _len; i = ++_i) {
          item = this[i];
          if (options != null ? options.flattenItems : void 0) {
            [].splice.apply(result, [(_ref = result.length), 9e9].concat(item)), item;
          } else {
            result.push(item);
          }
          if (i < length - 1) result.push(join);
        }
        return result;
      }
    });
  }

}).call(this);
