(function() {
  var GLOBALS, JArray, JBoundFunc, JNaN, JNull, JObject, JStub, JUndefined, JUser, assert, black, blue, clazz, cyan, debug, ends, escape, fatal, green, htmlEscape, info, inspect, isInteger, isObject, magenta, normal, pad, randid, red, setLast, starts, warn, white, yellow, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7,
    _this = this;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  _ref3 = require('joeson/lib/helpers'), randid = _ref3.randid, pad = _ref3.pad, htmlEscape = _ref3.htmlEscape, escape = _ref3.escape, starts = _ref3.starts, ends = _ref3.ends;

  _ref4 = require('nogg').logger(__filename.split('/').last()), debug = _ref4.debug, info = _ref4.info, warn = _ref4.warn, fatal = _ref4.fatal;

  _ref5 = require('joeson/src/interpreter'), (_ref6 = _ref5.NODES, JObject = _ref6.JObject, JArray = _ref6.JArray, JUser = _ref6.JUser, JUndefined = _ref6.JUndefined, JNull = _ref6.JNull, JNaN = _ref6.JNaN, JBoundFunc = _ref6.JBoundFunc, JStub = _ref6.JStub), GLOBALS = _ref5.GLOBALS, (_ref7 = _ref5.HELPERS, isInteger = _ref7.isInteger, isObject = _ref7.isObject, setLast = _ref7.setLast);

  if (JObject.prototype.toDom == null) {
    (function() {
      JObject.prototype.extend;
      Block.prototype.extend({
        interpret: function($) {
          var firstLine, length, variable, _i, _len, _ref8;
          $.pop();
          if (this.ownScope != null) {
            _ref8 = this.ownScope.nonparameterVariables;
            for (_i = 0, _len = _ref8.length; _i < _len; _i++) {
              variable = _ref8[_i];
              $.scope.__set__($, variable, JUndefined);
            }
          }
          if ((length = this.lines.length) > 1) {
            $.push({
              "this": this,
              func: Block.prototype.interpretLoop,
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
      return clazz.extend(Function, {
        __get__: function($) {
          return $["throw"]('NotImplementedError', "Implement me");
        }
      });
    })();
  }

}).call(this);
