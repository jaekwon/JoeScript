(function() {
  var assert, black, blue, clazz, compact, cyan, escape, extend, flatten, green, inspect, install, isVariable, isWord, joe, js, magenta, normal, red, translate, trigger, white, yellow, _ref, _ref2, _ref3, _ref4,
    __slice = Array.prototype.slice;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  joe = require('joeson/src/joescript').NODES;

  _ref3 = require('joeson/src/joescript').HELPERS, extend = _ref3.extend, isWord = _ref3.isWord, isVariable = _ref3.isVariable;

  _ref4 = require('joeson/lib/helpers'), escape = _ref4.escape, compact = _ref4.compact, flatten = _ref4.flatten;

  js = function(obj) {
    var _ref5;
    return (_ref5 = obj != null ? typeof obj.toJavascript === "function" ? obj.toJavascript() : void 0 : void 0) != null ? _ref5 : obj;
  };

  trigger = function(obj, msg) {
    if (obj instanceof joe.Node) {
      return obj.trigger(msg);
    } else {
      return obj;
    }
  };

  this.install = install = function() {
    var TO_JS_OPS;
    if (joe.Node.prototype.toJSNode != null) return;
    require('joeson/src/translators/scope').install();
    joe.Node.prototype.extend({
      toJSNode: function(_arg) {
        var toReturn, toValue, _ref5;
        _ref5 = _arg != null ? _arg : {}, toValue = _ref5.toValue, toReturn = _ref5.toReturn;
        if (toReturn && !(this instanceof joe.Statement)) {
          return joe.Statement({
            type: 'return',
            expr: this
          }).toJSNode();
        } else {
          return this.childrenToJSNode();
        }
      },
      childrenToJSNode: function() {
        var that;
        that = this;
        this.withChildren(function(child, parent, key, desc, index) {
          if (index != null) {
            return that[key][index] = child.toJSNode({
              toValue: desc.isValue
            });
          } else {
            return that[key] = child.toJSNode({
              toValue: desc.isValue
            });
          }
        });
        return this;
      },
      toJavascript: function() {
        throw new Error("" + this.constructor.name + ".toJavascript not defined");
      }
    });
    joe.Word.prototype.extend({
      toJavascript: function() {
        return '' + this;
      }
    });
    joe.Block.prototype.extend({
      toJSNode: function(_arg) {
        var i, line, toReturn, toValue, _i, _len, _ref5, _ref6;
        _ref5 = _arg != null ? _arg : {}, toValue = _ref5.toValue, toReturn = _ref5.toReturn;
        this.isValue = toValue;
        _ref6 = this.lines;
        for (i = _i = 0, _len = _ref6.length; _i < _len; i = ++_i) {
          line = _ref6[i];
          if (i < this.lines.length - 1) {
            this.lines[i] = this.lines[i].toJSNode();
          } else {
            this.lines[i] = this.lines[i].toJSNode({
              toValue: toValue,
              toReturn: toReturn
            });
          }
        }
        return this;
      },
      toJavascript: function() {
        var line, lines, toDeclare, _ref5;
        if ((this.ownScope != null) && ((_ref5 = (toDeclare = this.ownScope.nonparameterVariables)) != null ? _ref5.length : void 0) > 0) {
          lines = [joe.NativeExpression("var " + (toDeclare.map(function(x) {
              return '' + x;
            }).join(', ')))].concat(__slice.call(this.lines));
        } else {
          lines = this.lines;
        }
        if (this.isValue && this.lines.length > 1) {
          return "(" + (((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = lines.length; _i < _len; _i++) {
              line = lines[_i];
              _results.push(js(line));
            }
            return _results;
          })()).join('; ')) + ")";
        } else {
          return ((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = lines.length; _i < _len; _i++) {
              line = lines[_i];
              _results.push(js(line));
            }
            return _results;
          })()).join(';\n');
        }
      }
    });
    joe.If.prototype.extend({
      toJSNode: function(_arg) {
        var toReturn, toValue, _ref5;
        _ref5 = _arg != null ? _arg : {}, toValue = _ref5.toValue, toReturn = _ref5.toReturn;
        this.isValue = toValue;
        this.hasStatement || (this.hasStatement = toReturn);
        this.cond = this.cond.toJSNode({
          toValue: true
        });
        this.block = this.block.toJSNode({
          toValue: toValue,
          toReturn: toReturn
        });
        if (this["else"] != null) {
          this["else"] = this["else"].toJSNode({
            toValue: toValue,
            toReturn: toReturn
          });
        }
        return this;
      },
      hasStatement$: {
        get: function() {
          var hasStatement;
          if (this instanceof joe.Statement) {
            this.hasStatement = true;
            return true;
          }
          hasStatement = false;
          this.withChildren(function(child) {
            if (!(child instanceof joe.Node)) return;
            if (child.hasStatement) return hasStatement = true;
          });
          return this.hasStatement = hasStatement;
        }
      },
      toJavascript: function() {
        if (this.isValue && !this.hasStatement) {
          if (this["else"] != null) {
            return "(" + (js(this.cond)) + " ? " + (js(this.block)) + " : " + (js(this["else"])) + ")";
          } else {
            return "(" + (js(this.cond)) + " ? " + (js(this.block)) + " : undefined)";
          }
        } else {
          if (this["else"] != null) {
            return "if(" + (js(this.cond)) + "){" + (js(this.block)) + "}else{" + (js(this["else"])) + "}";
          } else {
            return "if(" + (js(this.cond)) + "){" + (js(this.block)) + "}";
          }
        }
      }
    });
    joe.Try.prototype.extend({
      toJSNode: function(_arg) {
        var target, toReturn, toValue, _ref5;
        _ref5 = _arg != null ? _arg : {}, toValue = _ref5.toValue, toReturn = _ref5.toReturn;
        if (toValue || toReturn) {
          target = joe.Undetermined('temp');
          this.block = joe.Assign({
            target: target,
            value: this.block
          }).toJSNode();
          if (this["catch"] != null) {
            this["catch"] = joe.Assign({
              target: target,
              value: this["catch"]
            }).toJSNode();
          }
          return joe.Block([
            this, target.toJSNode({
              toReturn: toReturn
            })
          ]);
        } else {
          return this;
        }
      },
      toJavascript: function() {
        return "try {" + (js(this.block)) + "}" + (((this.catchVar != null) || (this["catch"] != null)) && (" catch(" + (js(this.catchVar) || '') + ") {" + (js(this["catch"])) + "}") || '') + (this["finally"] && ("finally {" + (js(this["finally"])) + "}") || '');
      }
    });
    joe.Loop.prototype.extend({
      toJSNode: function(_arg) {
        var lines, target, toReturn, toValue, _ref5;
        _ref5 = _arg != null ? _arg : {}, toValue = _ref5.toValue, toReturn = _ref5.toReturn;
        if (toValue || toReturn) {
          lines = [];
          lines.push(joe.Assign({
            target: (target = joe.Undetermined('accum')),
            value: joe.Arr()
          }));
          this.block = joe.Invocation({
            func: joe.Index({
              obj: target,
              key: joe.Word('push')
            }),
            params: [
              joe.Item({
                value: this.block
              })
            ]
          }).toJSNode();
          lines.push(this);
          lines.push(target.toJSNode({
            toReturn: toReturn
          }));
          return joe.Block(lines);
        } else {
          return this;
        }
      },
      toJavascript: function() {
        return "while(" + (js(this.cond)) + ") {" + (js(this.block)) + "}";
      }
    });
    joe.For.prototype.extend({
      toJSNode: function(_arg) {
        var accum, block, cond, counter, key, node, setup, toReturn, toValue, _i, _len, _obj, _ref5;
        _ref5 = _arg != null ? _arg : {}, toValue = _ref5.toValue, toReturn = _ref5.toReturn;
        if (toValue || toReturn) {
          accum = this["super"].toJSNode.call(this, {
            toValue: toValue,
            toReturn: toReturn
          });
          return accum.toJSNode();
        }
        switch (this.type) {
          case 'in':
            setup = joe.Block(compact([
              joe.Assign({
                target: _obj = joe.Undetermined('_obj'),
                value: this.obj
              }), this.keys.length > 1 ? joe.Assign({
                target: this.keys[1],
                value: joe.Assign({
                  target: _i = joe.Undetermined('_i'),
                  value: 0
                })
              }) : joe.Assign({
                target: _i = joe.Undetermined('_i'),
                value: 0
              }), joe.Assign({
                target: _len = joe.Undetermined('_len'),
                value: joe.Index({
                  obj: _obj,
                  key: joe.Word('length'),
                  type: '.'
                })
              })
            ]));
            cond = joe.Operation({
              left: _i,
              op: '<',
              right: _len
            });
            counter = this.keys.length > 1 ? joe.Assign({
              target: this.keys[1],
              value: joe.Operation({
                left: _i,
                op: '++'
              })
            }) : joe.Operation({
              left: _i,
              op: '++'
            });
            block = joe.Block([
              joe.Assign({
                target: this.keys[0],
                value: joe.Index({
                  obj: _obj,
                  key: _i
                })
              }), this.cond != null ? joe.If({
                cond: this.cond,
                block: this.block
              }) : this.block
            ]);
            node = joe.JSForC({
              label: this.label,
              block: block,
              setup: setup,
              cond: cond,
              counter: counter
            });
            return node.childrenToJSNode();
          case 'of':
            key = this.keys[0];
            block = joe.Block(compact([
              joe.Assign({
                target: _obj = joe.Undetermined('_obj'),
                value: this.obj
              }), this.keys[1] ? joe.Assign({
                target: this.keys[1],
                value: joe.Index({
                  obj: _obj,
                  key: key
                })
              }) : void 0, this.cond != null ? joe.If({
                cond: this.cond,
                block: this.block
              }) : this.block
            ]));
            node = joe.JSForK({
              label: this.label,
              block: this.block,
              key: key,
              obj: _obj
            });
            return node.childrenToJSNode();
          default:
            throw new Error("Unexpected For type " + this.type);
        }
        return assert.ok(false, 'should not happen');
      }
    });
    joe.Switch.prototype.extend({
      toJSNode: function(_arg) {
        var lines, target, toReturn, toValue, _case, _i, _len, _ref5;
        toValue = _arg.toValue, toReturn = _arg.toReturn;
        if (toValue || toReturn) {
          lines = [];
          lines.push(joe.Assign({
            target: (target = joe.Undetermined('temp')),
            value: joe.Undefined()
          }));
          _ref5 = this.cases;
          for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
            _case = _ref5[_i];
            _case.block = joe.Assign({
              target: target,
              value: _case.block
            }).toJSNode({
              toValue: true
            });
          }
          lines.push(this);
          lines.push(target.toJSNode({
            toReturn: toReturn
          }));
          return joe.Block(lines);
        } else {
          return this;
        }
      }
    });
    TO_JS_OPS = {
      'is': '===',
      '==': '==='
    };
    joe.Operation.prototype.extend({
      toJavascript: function() {
        var _ref5;
        return "(" + (this.left != null ? js(this.left) + ' ' : '') + ((_ref5 = TO_JS_OPS[this.op]) != null ? _ref5 : this.op) + (this.right != null ? ' ' + js(this.right) : '') + ")";
      }
    });
    joe.Statement.prototype.extend({
      toJavascript: function() {
        return "" + this.type + " " + (this.expr != null ? js(this.expr) : '');
      }
    });
    joe.Assign.prototype.extend({
      toJSNode: function(_arg) {
        var lines, toReturn, toValue, valueVar, _ref5;
        _ref5 = _arg != null ? _arg : {}, toValue = _ref5.toValue, toReturn = _ref5.toReturn;
        if (this.target instanceof joe.AssignObj) {
          lines = [];
          if (isVariable(this.value)) {
            valueVar = this.value;
          } else {
            valueVar = joe.Undetermined('temp');
            lines.push(joe.Assign({
              target: valueVar,
              value: this.value
            }));
            this.value = valueVar;
          }
          this.target.destructLines(valueVar, lines);
          if (toValue || toReturn) {
            lines.push(valueVar.toJSNode({
              toReturn: toReturn
            }));
          }
          return joe.Block(lines);
        } else {
          return this.childrenToJSNode();
        }
      },
      toJavascript: function() {
        return "" + (js(this.target)) + " " + (this.op || '') + "= " + (js(this.value));
      }
    });
    joe.AssignObj.prototype.extend({
      destructLines: function(source, lines) {
        var default_, i, item, key, target, temp, _i, _len, _ref5, _ref6, _ref7;
        if (lines == null) lines = [];
        _ref5 = this.items;
        for (i = _i = 0, _len = _ref5.length; _i < _len; i = ++_i) {
          item = _ref5[i];
          target = (_ref6 = item.target) != null ? _ref6 : item.key;
          key = (_ref7 = item.key) != null ? _ref7 : i;
          default_ = item["default"];
          if (target instanceof joe.Word || target instanceof joe.Index) {
            lines.push(joe.Assign({
              target: target,
              value: joe.Index({
                obj: source,
                key: key
              })
            }));
            if (default_ != null) {
              lines.push(joe.Assign({
                target: target,
                value: default_,
                type: '?='
              }));
            }
          } else if (target instanceof joe.AssignObj) {
            temp = joe.Undetermined('_assign');
            lines.push(joe.Assign({
              target: temp,
              value: joe.Index({
                obj: source,
                key: key
              })
            }));
            if (default_ != null) {
              lines.push(joe.Assign({
                target: temp,
                value: default_,
                type: '?='
              }));
            }
            target.destructLines(temp, lines);
          } else {
            throw new Error("Unexpected AssignObj target: " + target + " (" + (target != null ? target.constructor.name : void 0) + ")");
          }
        }
      }
    });
    joe.Str.prototype.extend({
      getParts: function() {
        var nodes, part, _i, _len, _ref5;
        if (typeof this.parts === 'string') return [this];
        nodes = [];
        _ref5 = this.parts;
        for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
          part = _ref5[_i];
          if (part instanceof joe.Node) {
            nodes.push(part);
          } else {
            nodes.push(new String(part));
          }
        }
        return nodes;
      },
      toJSNode: function() {
        var node, part, _i, _len, _ref5;
        node = void 0;
        _ref5 = this.getParts();
        for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
          part = _ref5[_i];
          if (part) {
            if (node === void 0) {
              node = part;
              continue;
            } else {
              node = joe.Operation({
                left: node,
                op: '+',
                right: part
              });
            }
          }
        }
        return node || '';
      },
      toJavascript: function() {
        assert.ok(typeof this.parts === 'string', "Str.toJavascript can only handle a string part.");
        return '"' + escape(this.parts) + '"';
      }
    });
    joe.Func.prototype.extend({
      toJSNode: function() {
        var arg, destructs, i, param, _i, _len, _ref5, _ref6;
        if (this.params != null) {
          destructs = [];
          _ref5 = this.params.items;
          for (i = _i = 0, _len = _ref5.length; _i < _len; i = ++_i) {
            param = _ref5[i].target;
            if (!isVariable(param)) {
              arg = joe.Undetermined('arg');
              this.params.items[i] = joe.AssignItem({
                target: arg
              });
              param.destructLines(arg, destructs);
            }
          }
          [].splice.apply(this.block.lines, [0, 0 - 0].concat(destructs)), destructs;
        }
        this.block = (_ref6 = this.block) != null ? _ref6.toJSNode({
          toValue: true,
          toReturn: true
        }) : void 0;
        return this;
      },
      toJavascript: function() {
        return "function" + (this.params != null ? '(' + this.params.toString(false) + ')' : '()') + " {" + (this.block != null ? js(this.block) : '') + "}";
      }
    });
    joe.NativeExpression.prototype.extend({
      toJavascript: function() {
        return this.exprStr;
      }
    });
    joe.Null.prototype.extend({
      toJavascript: function() {
        return 'null';
      }
    });
    joe.Undefined.prototype.extend({
      toJavascript: function() {
        return 'undefined';
      }
    });
    joe.Invocation.prototype.extend({
      toJavascript: function() {
        return "" + (js(this.func)) + "(" + (this.params.map(function(p) {
          return js(p.value);
        })) + ")";
      }
    });
    joe.Index.prototype.extend({
      toJavascript: function() {
        var close;
        close = this.type === '[' ? ']' : '';
        return "" + (js(this.obj)) + this.type + (js(this.key)) + close;
      }
    });
    joe.Obj.prototype.extend({
      toJavascript: function() {
        var key, value;
        return "{" + (((function() {
          var _i, _len, _ref5, _ref6, _results;
          _ref5 = this.items;
          _results = [];
          for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
            _ref6 = _ref5[_i], key = _ref6.key, value = _ref6.value;
            _results.push("\"" + (escape(key)) + "\": " + (js(value)));
          }
          return _results;
        }).call(this)).join(', ')) + "}";
      }
    });
    joe.Arr.prototype.extend({
      toJavascript: function() {
        var key, value;
        return "[" + (((function() {
          var _i, _len, _ref5, _ref6, _results;
          _ref5 = this.items;
          _results = [];
          for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
            _ref6 = _ref5[_i], key = _ref6.key, value = _ref6.value;
            _results.push(js(value));
          }
          return _results;
        }).call(this)).join(', ')) + "]";
      }
    });
    clazz.extend(Boolean, {
      toJSNode: function() {
        return this;
      }
    });
    clazz.extend(String, {
      toJSNode: function() {
        return this;
      },
      toJavascript: function() {
        return '"' + escape(this) + '"';
      }
    });
    return clazz.extend(Number, {
      toJSNode: function() {
        return this;
      }
    });
  };

  this.translate = translate = function(node) {
    install();
    node = node.toJSNode().installScope().determine();
    node.validate();
    return node.toJavascript();
  };

}).call(this);
