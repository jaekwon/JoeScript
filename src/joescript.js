(function() {
  var Arr, Assign, AssignItem, AssignList, AssignObj, Block, Case, Dummy, EXPR, For, Func, GRAMMAR, Grammar, Heredoc, If, Index, Invocation, Item, JSForC, JSForK, Loop, NativeExpression, Node, Not, Null, Obj, Operation, Range, Set, Slice, Soak, Statement, Str, Switch, This, Try, Undefined, Undetermined, Unless, Word, assert, black, blue, checkComma, checkCommaNewline, checkIndent, checkNewline, checkSoftline, clazz, cyan, extend, green, inspect, isVariable, magenta, normal, red, resetIndent, trace, white, yellow, _ref, _ref2, _ref3;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow), (_ref3 = _ref.collections, Set = _ref3.Set);

  inspect = require('util').inspect;

  assert = require('assert');

  Grammar = require('joeson').Grammar;

  Node = require('joeson/src/node').Node;

  extend = function(dest, source) {
    var x, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = source.length; _i < _len; _i++) {
      x = source[_i];
      _results.push(dest.push(x));
    }
    return _results;
  };

  isVariable = function(thing) {
    return typeof thing === 'string' || thing instanceof Word || thing instanceof Undetermined;
  };

  this.HELPERS = {
    extend: extend,
    isVariable: isVariable
  };

  Word = clazz('Word', Node, function() {
    return {
      init: function(key) {
        this.key = key;
        switch (this.key) {
          case 'undefined':
            return this._newOverride = Undefined.undefined;
          case 'null':
            return this._newOverride = Null["null"];
        }
      },
      toString: function() {
        return this.key;
      }
    };
  });

  Undetermined = clazz('Undetermined', Node, function() {
    return {
      init: function(prefix) {
        this.prefix = prefix;
      },
      toString: function() {
        return "[Undetermined prefix:" + this.prefix + "]";
      }
    };
  });

  Block = clazz('Block', Node, function() {
    return {
      children: {
        lines: {
          type: [
            {
              type: EXPR
            }
          ]
        }
      },
      init: function(lines) {
        assert.ok(lines, "lines must be defined");
        return this.lines = lines instanceof Array ? lines : [lines];
      },
      toString: function() {
        var line;
        return ((function() {
          var _i, _len, _ref4, _results;
          _ref4 = this.lines;
          _results = [];
          for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
            line = _ref4[_i];
            _results.push('' + line);
          }
          return _results;
        }).call(this)).join(';\n');
      }
    };
  });

  If = clazz('If', Node, function() {
    return {
      children: {
        cond: {
          type: EXPR,
          isValue: true
        },
        block: {
          type: Block,
          required: true
        },
        "else": {
          type: Block
        }
      },
      init: function(_arg) {
        this.cond = _arg.cond, this.block = _arg.block, this["else"] = _arg["else"];
        if (!(this.block instanceof Block)) return this.block = Block(this.block);
      },
      toString: function() {
        if (this["else"] != null) {
          return "if(" + this.cond + "){" + this.block + "}else{" + this["else"] + "}";
        } else {
          return "if(" + this.cond + "){" + this.block + "}";
        }
      }
    };
  });

  Unless = function(_arg) {
    var block, cond, _else;
    cond = _arg.cond, block = _arg.block, _else = _arg._else;
    return If({
      cond: Not(cond),
      block: block,
      "else": _else
    });
  };

  Loop = clazz('Loop', Node, function() {
    return {
      children: {
        label: {
          type: Word
        },
        cond: {
          type: EXPR,
          isValue: true
        },
        block: {
          type: Block,
          required: true
        }
      },
      init: function(_arg) {
        var _ref4;
        this.label = _arg.label, this.cond = _arg.cond, this.block = _arg.block;
        return (_ref4 = this.cond) != null ? _ref4 : this.cond = true;
      },
      toString: function() {
        return "while(" + this.cond + "){" + this.block + "}";
      }
    };
  });

  For = clazz('For', Loop, function() {
    return {
      children: {
        label: {
          type: Word
        },
        block: {
          type: Block
        },
        keys: {
          type: [
            {
              type: Node
            }
          ]
        },
        obj: {
          type: EXPR,
          isValue: true
        },
        cond: {
          type: EXPR,
          isValue: true
        }
      },
      init: function(_arg) {
        this.label = _arg.label, this.block = _arg.block, this.own = _arg.own, this.keys = _arg.keys, this.type = _arg.type, this.obj = _arg.obj, this.cond = _arg.cond;
      },
      toString: function() {
        return "for " + ((this.own != null) && 'own ' || '') + (this.keys.join(',')) + " " + this.type + " " + this.obj + " " + ((this.cond != null) && ("when " + this.cond + " ") || '') + "{" + this.block + "}";
      }
    };
  });

  JSForC = clazz('JSForC', Loop, function() {
    return {
      children: {
        label: {
          type: Word
        },
        block: {
          type: Block
        },
        setup: {
          type: Node
        },
        cond: {
          type: EXPR,
          isValue: true
        },
        counter: {
          type: Node
        }
      },
      init: function(_arg) {
        this.label = _arg.label, this.block = _arg.block, this.setup = _arg.setup, this.cond = _arg.cond, this.counter = _arg.counter;
      },
      toString: function() {
        return "for (" + (this.setup || '') + ";" + (this.cond || '') + ";" + (this.counter || '') + ") {" + this.block + "}";
      }
    };
  });

  JSForK = clazz('JSForK', Loop, function() {
    return {
      children: {
        label: {
          type: Word
        },
        block: {
          type: Block
        },
        key: {
          type: Word
        },
        obj: {
          type: EXPR,
          isValue: true
        }
      },
      init: function(_arg) {
        this.label = _arg.label, this.block = _arg.block, this.key = _arg.key, this.obj = _arg.obj;
      },
      toString: function() {
        return "for (" + this.key + " in " + this.obj + ") {" + this.block + "}";
      }
    };
  });

  Switch = clazz('Switch', Node, function() {
    return {
      children: {
        obj: {
          type: EXPR,
          isValue: true,
          required: true
        },
        cases: {
          type: [
            {
              type: Case
            }
          ]
        },
        "default": {
          type: EXPR,
          isValue: true
        }
      },
      init: function(_arg) {
        this.obj = _arg.obj, this.cases = _arg.cases, this["default"] = _arg["default"];
      },
      toString: function() {
        return "switch(" + this.obj + "){" + (this.cases.join('//')) + "//else{" + this["default"] + "}}";
      }
    };
  });

  Try = clazz('Try', Node, function() {
    return {
      children: {
        block: {
          type: Block,
          required: true
        },
        catchVar: {
          type: Word
        },
        "catch": {
          type: Block
        },
        "finally": {
          type: Block
        }
      },
      init: function(_arg) {
        this.block = _arg.block, this.catchVar = _arg.catchVar, this["catch"] = _arg["catch"], this["finally"] = _arg["finally"];
      },
      toString: function() {
        return "try {" + this.block + "}" + (((this.catchVar != null) || (this["catch"] != null)) && (" catch (" + (this.catchVar || '') + ") {" + this["catch"] + "}") || '') + (this["finally"] && ("finally {" + this["finally"] + "}") || '');
      }
    };
  });

  Case = clazz('Case', Node, function() {
    return {
      children: {
        matches: {
          type: [
            {
              type: EXPR
            }
          ],
          required: true
        },
        block: {
          type: Block
        }
      },
      init: function(_arg) {
        this.matches = _arg.matches, this.block = _arg.block;
      },
      toString: function() {
        return "when " + (this.matches.join(',')) + "{" + this.block + "}";
      }
    };
  });

  Operation = clazz('Operation', Node, function() {
    return {
      children: {
        left: {
          type: EXPR,
          isValue: true
        },
        right: {
          type: EXPR,
          isValue: true
        }
      },
      init: function(_arg) {
        this.left = _arg.left, this.op = _arg.op, this.right = _arg.right;
      },
      toString: function() {
        return "(" + (this.left != null ? this.left + ' ' : '') + this.op + (this.right != null ? ' ' + this.right : '') + ")";
      }
    };
  });

  Not = function(it) {
    return Operation({
      op: 'not',
      right: it
    });
  };

  Statement = clazz('Statement', Node, function() {
    return {
      children: {
        expr: {
          type: EXPR,
          isValue: true
        }
      },
      init: function(_arg) {
        this.type = _arg.type, this.expr = _arg.expr;
      },
      toString: function() {
        var _ref4;
        return "" + this.type + "(" + ((_ref4 = this.expr) != null ? _ref4 : '') + ");";
      }
    };
  });

  Invocation = clazz('Invocation', Node, function() {
    return {
      children: {
        func: {
          type: EXPR,
          isValue: true
        },
        params: {
          type: [
            {
              type: EXPR,
              isValue: true
            }
          ]
        }
      },
      init: function(_arg) {
        this.func = _arg.func, this.params = _arg.params;
        return this.type = '' + this.func === 'new' ? 'new' : void 0;
      },
      toString: function() {
        return "" + this.func + "(" + (this.params.map(function(p) {
          return "" + p + (p.splat && '...' || '');
        })) + ")";
      }
    };
  });

  Assign = clazz('Assign', Node, function() {
    return {
      children: {
        target: {
          type: Node,
          required: true
        },
        value: {
          type: EXPR,
          isValue: true,
          required: true
        }
      },
      init: function(_arg) {
        var type;
        this.target = _arg.target, type = _arg.type, this.op = _arg.op, this.value = _arg.value;
        assert.ok(this.value != null, "need value");
        if (type != null) return this.op = type.slice(0, (type.length - 1));
      },
      toString: function() {
        return "" + this.target + " " + (this.op || '') + "= (" + this.value + ")";
      }
    };
  });

  Slice = clazz('Slice', Node, function() {
    return {
      children: {
        obj: {
          type: EXPR,
          isValue: true
        },
        range: {
          type: Range,
          required: true
        }
      },
      init: function(_arg) {
        this.obj = _arg.obj, this.range = _arg.range;
      },
      toString: function() {
        return "" + this.obj + "[" + this.range + "]";
      }
    };
  });

  Index = clazz('Index', Node, function() {
    return {
      children: {
        obj: {
          type: EXPR,
          isValue: true
        },
        key: {
          type: EXPR,
          isValue: true
        }
      },
      init: function(_arg) {
        var key, obj, type;
        obj = _arg.obj, key = _arg.key, type = _arg.type;
        if (type == null) type = key instanceof Word ? '.' : '[';
        if (type === '::') {
          if (key != null) {
            obj = Index({
              obj: obj,
              key: 'prototype',
              type: '.'
            });
          } else {
            key = 'prototype';
          }
          type = '.';
        }
        this.obj = obj;
        this.key = key;
        return this.type = type;
      },
      toString: function() {
        var close;
        close = this.type === '[' ? ']' : '';
        return "" + this.obj + this.type + this.key + close;
      }
    };
  });

  Soak = clazz('Soak', Node, function() {
    return {
      children: {
        obj: {
          type: EXPR,
          isValue: true
        }
      },
      init: function(obj) {
        this.obj = obj;
      },
      toString: function() {
        return "(" + this.obj + ")?";
      }
    };
  });

  Obj = clazz('Obj', Node, function() {
    return {
      children: {
        items: {
          type: [
            {
              type: Item
            }
          ]
        }
      },
      init: function(items) {
        this.items = items;
      },
      toString: function() {
        return "{" + (this.items != null ? this.items.join(',') : '') + "}";
      }
    };
  });

  Null = clazz('Null', Node, function() {
    return {
      init: function(construct) {
        if (construct !== true) return this._newOverride = Null["null"];
      },
      toString: function() {
        return "null";
      }
    };
  });

  Null["null"] = new Null(true);

  Undefined = clazz('Undefined', Node, function() {
    return {
      init: function(construct) {
        if (construct !== true) return this._newOverride = Undefined.undefined;
      },
      toString: function() {
        return "undefined";
      }
    };
  });

  Undefined.undefined = new Undefined(true);

  This = clazz('This', Node, function() {
    return {
      init: function() {},
      toString: function() {
        return "@";
      }
    };
  });

  Arr = clazz('Arr', Obj, function() {
    return {
      children: {
        items: {
          type: [
            {
              type: Item
            }
          ]
        }
      },
      toString: function() {
        return "[" + (this.items != null ? this.items.join(',') : '') + "]";
      }
    };
  });

  Item = clazz('Item', Node, function() {
    return {
      children: {
        key: {
          type: Node
        },
        value: {
          type: EXPR,
          isValue: true
        }
      },
      init: function(_arg) {
        this.key = _arg.key, this.value = _arg.value;
      },
      toString: function() {
        return this.key + (this.value != null ? ":(" + this.value + ")" : '');
      }
    };
  });

  Str = clazz('Str', Node, function() {
    return {
      children: {
        parts: {
          type: [
            {
              type: EXPR,
              isValue: true
            }
          ]
        }
      },
      init: function(parts) {
        var chars, item, _i, _len;
        this.parts = [];
        chars = [];
        for (_i = 0, _len = parts.length; _i < _len; _i++) {
          item = parts[_i];
          if (typeof item === 'string') {
            chars.push(item);
          } else if (item instanceof Node) {
            if (chars.length > 0) {
              this.parts.push(chars.join(''));
              chars = [];
            }
            this.parts.push(item);
          } else {
            throw new Error("Dunno how to handle part of Str: " + item + " (" + item.constructor.name + ")");
          }
        }
        if (chars.length > 0) return this.parts.push(chars.join(''));
      },
      isStatic: {
        get: function() {
          return this.parts.every(function(part) {
            return typeof part === 'string';
          });
        }
      },
      toString: function() {
        var parts;
        if (typeof this.parts === 'string') {
          return '"' + this.parts.replace(/"/g, "\\\"") + '"';
        } else {
          parts = this.parts.map(function(x) {
            if (x instanceof Node) {
              return '#{' + x + '}';
            } else {
              return x.replace(/"/g, "\\\"");
            }
          });
          return '"' + parts.join('') + '"';
        }
      }
    };
  });

  Func = clazz('Func', Node, function() {
    return {
      children: {
        params: {
          type: AssignList
        },
        block: {
          type: Block
        }
      },
      init: function(_arg) {
        this.params = _arg.params, this.type = _arg.type, this.block = _arg.block;
      },
      toString: function() {
        return "" + (this.params != null ? '(' + this.params.toString(false) + ')' : '()') + this.type + ('{' + this.block + '}');
      }
    };
  });

  AssignObj = clazz('AssignObj', Node, function() {
    return {
      children: {
        items: {
          type: [
            {
              type: AssignItem
            }
          ]
        }
      },
      init: function(items) {
        this.items = items;
      },
      targetNames$: {
        get: function() {
          var item, names, target, _i, _len, _ref4, _ref5;
          names = [];
          _ref4 = this.items;
          for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
            item = _ref4[_i];
            target = (_ref5 = item.target) != null ? _ref5 : item.key;
            if (isVariable(target)) {
              names.push(target);
            } else if (target instanceof AssignObj) {
              extend(names, target.targetNames);
            } else if (target instanceof Index) {
              "pass";

            } else {
              throw new Error("Unexpected AssignObj target " + target + " (" + (target != null ? target.constructor.name : void 0) + ")");
            }
          }
          return names;
        }
      },
      toString: function() {
        return "{" + (this.items != null ? this.items.join(',') : '') + "}";
      }
    };
  });

  AssignList = clazz('AssignList', AssignObj, function() {
    return {
      init: function(items) {
        var item, _i, _len, _ref4, _results;
        this.items = items;
        _ref4 = this.items;
        _results = [];
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          item = _ref4[_i];
          if (item.splat) {
            throw new Error("Implement me");
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      },
      toString: function(braces) {
        if (braces == null) braces = true;
        return "" + (braces ? '[' : '') + (this.items != null ? this.items.join(',') : '') + (braces ? ']' : '');
      }
    };
  });

  AssignItem = clazz('AssignItem', Node, function() {
    return {
      children: {
        key: {
          type: Word
        },
        target: {
          type: Node
        },
        "default": {
          type: EXPR,
          isValue: true
        }
      },
      init: function(_arg) {
        this.key = _arg.key, this.target = _arg.target, this["default"] = _arg["default"];
      },
      toString: function() {
        return "" + (this.key != null ? this.key : '') + ((this.key != null) && (this.target != null) ? ':' : '') + (this.target != null ? this.target : '') + (this.splat ? '...' : '') + (this["default"] != null ? '=' + this["default"] : '');
      }
    };
  });

  Range = clazz('Range', Node, function() {
    return {
      children: {
        start: {
          type: EXPR,
          isValue: true
        },
        end: {
          type: EXPR,
          isValue: true
        },
        by: {
          type: EXPR,
          isValue: true
        }
      },
      init: function(_arg) {
        var _ref4;
        this.start = _arg.start, this.type = _arg.type, this.end = _arg.end, this.by = _arg.by;
        return (_ref4 = this.by) != null ? _ref4 : this.by = 1;
      },
      toString: function() {
        return ("Range(" + ((this.start != null) && ("start:" + this.start + ",") || '')) + ("" + ((this.end != null) && ("end:" + this.end + ",") || '')) + ("type:'" + this.type + "', by:" + this.by + ")");
      }
    };
  });

  NativeExpression = clazz('NativeExpression', Node, function() {
    return {
      init: function(exprStr) {
        this.exprStr = exprStr;
      },
      toString: function() {
        return "`" + this.exprStr + "`";
      }
    };
  });

  Heredoc = clazz('Heredoc', Node, function() {
    return {
      init: function(text) {
        this.text = text;
      },
      toString: function() {
        return "###" + this.text + "###";
      }
    };
  });

  Dummy = clazz('Dummy', Node, function() {
    return {
      init: function(args) {
        this.args = args;
      },
      toString: function() {
        return "{" + this.args + "}";
      }
    };
  });

  this.NODES = {
    Node: Node,
    Word: Word,
    Block: Block,
    If: If,
    Loop: Loop,
    For: For,
    Switch: Switch,
    Try: Try,
    Case: Case,
    Operation: Operation,
    Statement: Statement,
    Invocation: Invocation,
    Assign: Assign,
    Slice: Slice,
    Index: Index,
    Soak: Soak,
    Obj: Obj,
    This: This,
    Null: Null,
    Undefined: Undefined,
    Arr: Arr,
    Item: Item,
    Str: Str,
    Func: Func,
    Range: Range,
    NativeExpression: NativeExpression,
    Heredoc: Heredoc,
    Dummy: Dummy,
    AssignList: AssignList,
    AssignObj: AssignObj,
    AssignItem: AssignItem,
    Undetermined: Undetermined,
    JSForC: JSForC,
    JSForK: JSForK
  };

  trace = {
    indent: false
  };

  checkIndent = function(ws, $) {
    var container, i, pContainer, pIndent, _base, _i, _ref4, _ref5;
    if ((_base = $.stack[0]).indent == null) _base.indent = '';
    container = $.stack[$.stackLength - 2];
    if (trace.indent) {
      $.log("[In] container (@" + ($.stackLength - 2) + ":" + container.name + ") indent:'" + container.indent + "', softline:'" + container.softline + "'");
    }
    if (container.softline != null) {
      pIndent = container.softline;
    } else {
      for (i = _i = _ref4 = $.stackLength - 3; _i >= 0; i = _i += -1) {
        if (($.stack[i].softline != null) || ($.stack[i].indent != null)) {
          pContainer = $.stack[i];
          pIndent = (_ref5 = pContainer.softline) != null ? _ref5 : pContainer.indent;
          if (trace.indent) {
            $.log("[In] parent pContainer (@" + i + ":" + pContainer.name + ") indent:'" + pContainer.indent + "', softline:'" + pContainer.softline + "'");
          }
          break;
        }
      }
    }
    if (ws.length > pIndent.length && ws.indexOf(pIndent) === 0) {
      if (trace.indent) $.log("Setting container.indent to '" + ws + "'");
      container.indent = ws;
      return container.indent;
    }
    return null;
  };

  checkNewline = function(ws, $) {
    var container, containerIndent, i, isNewline, _i, _ref4, _ref5;
    for (i = _i = _ref4 = $.stackLength - 2; _i >= 0; i = _i += -1) {
      if (($.stack[i].softline != null) || ($.stack[i].indent != null)) {
        container = $.stack[i];
        break;
      }
    }
    containerIndent = (_ref5 = container.softline) != null ? _ref5 : container.indent;
    isNewline = ws === containerIndent;
    if (trace.indent) {
      $.log("[NL] container (@" + i + ":" + container.name + ") indent:'" + container.indent + "', softline:'" + container.softline + "', isNewline:'" + isNewline + "'");
    }
    if (isNewline) return ws;
    return null;
  };

  checkSoftline = function(ws, $) {
    var container, i, topContainer, _i, _ref4, _ref5;
    container = null;
    for (i = _i = _ref4 = $.stackLength - 2; _i >= 0; i = _i += -1) {
      if (i < $.stackLength - 2 && ($.stack[i].softline != null)) {
        container = $.stack[i];
        if (trace.indent) {
          $.log("[SL] (@" + i + ":" + container.name + ") indent(ignored):'" + container.indent + "', **softline**:'" + container.softline + "'");
        }
        break;
      } else if ($.stack[i].indent != null) {
        container = $.stack[i];
        if (trace.indent) {
          $.log("[SL] (@" + i + ":" + container.name + ") **indent**:'" + container.indent + "', softline(ignored):'" + container.softline + "'");
        }
        break;
      }
    }
    assert.ok(container !== null);
    if (ws.indexOf((_ref5 = container.softline) != null ? _ref5 : container.indent) === 0) {
      topContainer = $.stack[$.stackLength - 2];
      if (trace.indent) {
        $.log("[SL] Setting topmost container (@" + ($.stackLength - 2) + ":" + topContainer.name + ")'s softline to '" + ws + "'");
      }
      topContainer.softline = ws;
      return ws;
    }
    return null;
  };

  checkComma = function(_arg, $) {
    var afterBlanks, afterWS, beforeBlanks, beforeWS, container;
    beforeBlanks = _arg.beforeBlanks, beforeWS = _arg.beforeWS, afterBlanks = _arg.afterBlanks, afterWS = _arg.afterWS;
    container = $.stack[$.stackLength - 2];
    if ((afterBlanks != null ? afterBlanks.length : void 0) > 0) {
      container.trailingComma = true;
    }
    if (afterBlanks.length > 0) {
      if (checkSoftline(afterWS, $) === null) return null;
    } else if (beforeBlanks.length > 0) {
      if (checkSoftline(beforeWS, $) === null) return null;
    }
    return ',';
  };

  checkCommaNewline = function(ws, $) {
    var container, i, pContainer, pIndent, _i, _ref4, _ref5;
    container = $.stack[$.stackLength - 2];
    if (!container.trailingComma) return null;
    for (i = _i = _ref4 = $.stackLength - 3; _i >= 0; i = _i += -1) {
      if (($.stack[i].softline != null) || ($.stack[i].indent != null)) {
        pContainer = $.stack[i];
        pIndent = (_ref5 = pContainer.softline) != null ? _ref5 : pContainer.indent;
        break;
      }
    }
    if (ws.length > pIndent.length && ws.indexOf(pIndent) === 0) return true;
    return null;
  };

  resetIndent = function(ws, $) {
    var container;
    container = $.stack[$.stackLength - 2];
    assert.ok(container != null);
    if (trace.indent) {
      $.log("setting container(=" + container.name + ").indent to '" + ws + "'");
    }
    container.indent = ws;
    return container.indent;
  };

  this.GRAMMAR = GRAMMAR = Grammar(function(_arg) {
    var i, make, o, tokens;
    o = _arg.o, i = _arg.i, tokens = _arg.tokens, make = _arg.make;
    return [
      o(" _SETUP _BLANKLINE* LINES ___ "), i({
        _SETUP: " '' "
      }, function(dontcare, $) {
        return $.stack[0].indent = '';
      }), i({
        LINES: " LINE*_NEWLINE _ _SEMICOLON? "
      }, make(Block)), i({
        LINE: [
          o({
            HEREDOC: " _ '###' !'#' (!'###' .)* '###' "
          }, function(it) {
            return Heredoc(it.join(''));
          }), o({
            LINEEXPR: [
              o({
                POSTIF: " block:LINEEXPR _IF cond:EXPR "
              }, make(If)), o({
                POSTUNLESS: " block:LINEEXPR _UNLESS cond:EXPR "
              }, make(Unless)), o({
                POSTFOR: " block:LINEEXPR _FOR own:_OWN? __ keys:ASSIGNABLE*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)? "
              }, make(For)), o({
                POSTWHILE: " block:LINEEXPR _WHILE cond:EXPR "
              }, make(Loop)), o({
                STMT: " type:(_RETURN|_THROW|_BREAK|_CONTINUE) expr:EXPR? "
              }, make(Statement)), o({
                EXPR: [
                  o({
                    FUNC: " params:PARAM_LIST? _ type:('->'|'=>') block:BLOCK? "
                  }, make(Func)), o({
                    OBJ_IMPL: " _INDENT? &:OBJ_IMPL_ITEM+(_COMMA|_NEWLINE) "
                  }, make(Obj)), i({
                    OBJ_IMPL_ITEM: [o(" _ key:(WORD|STRING|NUMBER) _ ':' _SOFTLINE? value:EXPR ", make(Item)), o(" HEREDOC ")]
                  }), o({
                    ASSIGN: " _ target:ASSIGNABLE _ type:('='|'+='|'-='|'*='|'/='|'?='|'||='|'or='|'and=') value:BLOCKEXPR "
                  }, make(Assign)), o({
                    INVOC_IMPL: " _ func:VALUE (__|_INDENT (? OBJ_IMPL_ITEM) ) params:(&:EXPR splat:'...'?)+(_COMMA|_COMMA_NEWLINE) "
                  }, make(Invocation)), o({
                    COMPLEX: " (? _KEYWORD) &:_COMPLEX "
                  }), i({
                    _COMPLEX: [
                      o({
                        IF: " _IF cond:EXPR block:BLOCK ((_NEWLINE|_INDENT)? _ELSE else:BLOCK)? "
                      }, make(If)), o({
                        UNLESS: " _UNLESS cond:EXPR block:BLOCK ((_NEWLINE|_INDENT)? _ELSE else:BLOCK)? "
                      }, make(Unless)), o({
                        FOR: " _FOR own:_OWN? __ keys:ASSIGNABLE*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)? block:BLOCK "
                      }, make(For)), o({
                        LOOP: " _LOOP block:BLOCK "
                      }, make(Loop)), o({
                        WHILE: " _WHILE cond:EXPR block:BLOCK "
                      }, make(Loop)), o({
                        SWITCH: " _SWITCH obj:EXPR _INDENT cases:CASE*_NEWLINE default:DEFAULT? "
                      }, make(Switch)), i({
                        CASE: " _WHEN matches:EXPR+_COMMA block:BLOCK "
                      }, make(Case)), i({
                        DEFAULT: " _NEWLINE _ELSE BLOCK "
                      }), o({
                        TRY: " _TRY block:BLOCK                                      (_NEWLINE? _CATCH catchVar:EXPR? catch:BLOCK?)?                                      (_NEWLINE? _FINALLY finally:BLOCK)? "
                      }, make(Try))
                    ]
                  }), o({
                    OP_OPTIMIZATION: " OP40 _ !/[&\\|\\^=\\!\\<\\>\\+\\-\\*\\/\\%]|(and|or|is|isnt|not|in|instanceof)[^a-zA-Z\\$_0-9]/ "
                  }), o({
                    OP00: [
                      i({
                        OP00_OP: " '&&' | '||' | '&' | '|' | '^' | _AND | _OR "
                      }), o(" left:OP00 _ op:OP00_OP _SOFTLINE? right:OP05 ", make(Operation)), o({
                        OP05: [
                          i({
                            OP05_OP: " '==' | '!=' | '<=' | '<' | '>=' | '>' | _IS | _ISNT "
                          }), o(" left:OP05 _ op:OP05_OP _SOFTLINE? right:OP10 ", make(Operation)), o({
                            OP10: [
                              i({
                                OP10_OP: " '+' | '-' "
                              }), o(" left:OP10 _ op:OP10_OP _SOFTLINE? right:OP20 ", make(Operation)), o({
                                OP20: [
                                  i({
                                    OP20_OP: " '*' | '/' | '%' "
                                  }), o(" left:OP20 _ op:OP20_OP _SOFTLINE? right:OP30 ", make(Operation)), o({
                                    OP30: [
                                      i({
                                        OP30_OP: " _not:_NOT? op:(_IN|_INSTANCEOF) "
                                      }), o(" left:OP30 _  @:OP30_OP _SOFTLINE? right:OP40 ", function(_arg2) {
                                        var invo, left, op, right, _not;
                                        left = _arg2.left, _not = _arg2._not, op = _arg2.op, right = _arg2.right;
                                        invo = new Invocation({
                                          func: op,
                                          params: [left, right]
                                        });
                                        if (_not) {
                                          return new Not(invo);
                                        } else {
                                          return invo;
                                        }
                                      }), o({
                                        OP40: [
                                          i({
                                            OP40_OP: " _NOT | '!' | '~' "
                                          }), o(" _ op:OP40_OP right:OP40 ", make(Operation)), o({
                                            OP45: [
                                              i({
                                                OP45_OP: " '?' "
                                              }), o(" left:OP45 _ op:OP45_OP _SOFTLINE? right:OP50 ", make(Operation)), o({
                                                OP50: [
                                                  i({
                                                    OP50_OP: " '--' | '++' "
                                                  }), o(" left:OPATOM op:OP50_OP ", make(Operation)), o(" _ op:OP50_OP right:OPATOM ", make(Operation)), o({
                                                    OPATOM: " FUNC | OBJ_IMPL | ASSIGN | INVOC_IMPL | COMPLEX | _ VALUE "
                                                  })
                                                ]
                                              })
                                            ]
                                          })
                                        ]
                                      })
                                    ]
                                  })
                                ]
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }), i({
        ASSIGNABLE: " ASSIGN_LIST | ASSIGN_OBJ | VALUE "
      }), i({
        PARAM_LIST: " _ '(' &:ASSIGN_LIST_ITEM*_COMMA _ ')' "
      }, make(AssignList)), i({
        ASSIGN_LIST: " _ '[' &:ASSIGN_LIST_ITEM*_COMMA _ ']' "
      }, make(AssignList)), i({
        ASSIGN_LIST_ITEM: " _ target:(                              | &:SYMBOL   splat:'...'?                              | &:PROPERTY splat:'...'?                              | ASSIGN_OBJ                              | ASSIGN_LIST                            )                            default:(_ '=' LINEEXPR)? "
      }, make(AssignItem)), i({
        ASSIGN_OBJ: " _ '{' &:ASSIGN_OBJ_ITEM*_COMMA _ '}'"
      }, make(AssignObj)), i({
        ASSIGN_OBJ_ITEM: " _ key:(SYMBOL|PROPERTY|NUMBER)                            target:(_ ':' _ (SYMBOL|PROPERTY|ASSIGN_OBJ|ASSIGN_LIST))?                            default:(_ '=' LINEEXPR)?"
      }, make(AssignItem)), i({
        VALUE: [
          o({
            SLICE: " obj:VALUE range:RANGE "
          }, make(Slice)), o({
            INDEX0: " obj:VALUE type:'['  key:LINEEXPR _ ']' "
          }, make(Index)), o({
            INDEX1: " obj:VALUE _SOFTLINE? type:'.'  key:WORD "
          }, make(Index)), o({
            PROTO: " obj:VALUE _SOFTLINE? type:'::' key:WORD? "
          }, make(Index)), o({
            INVOC_EXPL: " func:VALUE '(' ___ params:(&:LINEEXPR splat:'...'?)*(_COMMA|_SOFTLINE) ___ ')' "
          }, make(Invocation)), o({
            SOAK: " VALUE '?' "
          }, make(Soak)), o({
            NUMBER: " /-?[0-9]+(\\.[0-9]+)?/ "
          }, make(Number)), o({
            SYMBOL: " !_KEYWORD WORD "
          }), o({
            BOOLEAN: " _TRUE | _FALSE "
          }, function(it) {
            return it === 'true';
          }), o({
            TYPEOF: [o(" func:_TYPEOF '(' ___ params:LINEEXPR{1,1} ___ ')' ", make(Invocation)), o(" func:_TYPEOF __ params:LINEEXPR{1,1} ", make(Invocation))]
          }), o({
            ARR_EXPL: " '[' _SOFTLINE? ARR_EXPR_ITEM*(_COMMA|_SOFTLINE) ___ (',' ___)? ']' "
          }, make(Arr)), i({
            ARR_EXPL_ITEM: " LINEEXPR splat:'...'? "
          }, make(Item)), o({
            RANGE: " '[' start:LINEEXPR? _ type:('...'|'..') end:LINEEXPR? _ ']' by:(_BY EXPR)? "
          }, make(Range)), o({
            OBJ_EXPL: " '{' _SOFTLINE? &:OBJ_EXPL_ITEM*(_COMMA|_SOFTLINE) ___ '}' "
          }, make(Obj)), i({
            OBJ_EXPL_ITEM: " _ key:(PROPERTY|WORD|STRING|NUMBER) value:(_ ':' LINEEXPR)? "
          }, make(Item)), o({
            PROPERTY: " '@' (WORD|STRING) "
          }, function(key) {
            return Index({
              obj: This(),
              key: key
            });
          }), o({
            THIS: " '@' "
          }, make(This)), o({
            PAREN: " '(' _RESETINDENT BLOCK ___ ')' "
          }), o({
            STRING: [
              o(" _TQUOTE  (!_TQUOTE  &:(_ESCSTR | _INTERP | .))* _TQUOTE  ", make(Str)), o(" _TDQUOTE (!_TDQUOTE &:(_ESCSTR | _INTERP | .))* _TDQUOTE ", make(Str)), o(" _DQUOTE  (!_DQUOTE  &:(_ESCSTR | _INTERP | .))* _DQUOTE  ", make(Str)), o(" _QUOTE   (!_QUOTE   &:(_ESCSTR | .))* _QUOTE            ", make(Str)), i({
                _ESCSTR: " _SLASH . "
              }, function(it) {
                return {
                  n: '\n',
                  t: '\t',
                  r: '\r'
                }[it] || it;
              }), i({
                _INTERP: " '\#{' _RESETINDENT BLOCK ___ '}' "
              })
            ]
          }), o({
            REGEX: " _FSLASH !__ &:(!_FSLASH !_TERM (ESC2 | .))* _FSLASH flags:/[a-zA-Z]*/ "
          }, make(Str)), o({
            NATIVE: " _BTICK (!_BTICK .)* _BTICK "
          }, make(NativeExpression))
        ]
      }), i({
        _: " /( |\\\\\\n)*/ ",
        skipLog: true
      }, function(ws) {
        return ws.replace(/\\\\\\n/g, '');
      }), i({
        __: " /( |\\\\\\n)+/ ",
        skipLog: true
      }, function(ws) {
        return ws.replace(/\\\\\\n/g, '');
      }), i({
        _TERM: " _ ('\r\n'|'\n') ",
        skipLog: false
      }), i({
        _COMMENT: " _ !HEREDOC '#' (!_TERM .)* ",
        skipLog: false
      }), i({
        _BLANKLINE: " _COMMENT? _TERM ",
        skipLog: false
      }), i({
        ___: " _BLANKLINE* _ ",
        skipLog: true
      }), i({
        BLOCK: [
          o(" _INDENT LINE+_NEWLINE ", make(Block)), o(" _THEN?  LINE+(_ ';') ", make(Block)), o(" _INDENTED_COMMENT+ ", function() {
            return new Block([]);
          }), i({
            _INDENTED_COMMENT: " _BLANKLINE ws:_ _COMMENT "
          }, function(_arg2, $) {
            var ws;
            ws = _arg2.ws;
            if (checkIndent(ws, $) === null) return null;
          })
        ]
      }), i({
        BLOCKEXPR: " _INDENT? EXPR "
      }), i({
        _INDENT: " _BLANKLINE+ &:_ "
      }, checkIndent, {
        skipCache: true
      }), i({
        _RESETINDENT: " _BLANKLINE* &:_ "
      }, resetIndent, {
        skipCache: true
      }), i({
        _NEWLINE: [
          o({
            _NEWLINE_STRICT: " _BLANKLINE+ &:_ "
          }, checkNewline, {
            skipCache: true
          }), o(" _ _SEMICOLON _NEWLINE_STRICT? ", {
            skipCache: true
          })
        ],
        skipCache: true
      }), i({
        _SOFTLINE: " _BLANKLINE+ &:_ "
      }, checkSoftline, {
        skipCache: true
      }), i({
        _COMMA: " beforeBlanks:_BLANKLINE* beforeWS:_ ','                      afterBlanks:_BLANKLINE*  afterWS:_ "
      }, checkComma, {
        skipCache: true
      }), i({
        _COMMA_NEWLINE: " _BLANKLINE+ &:_ "
      }, checkCommaNewline, {
        skipCache: true
      }), i({
        WORD: " _ /[a-zA-Z\\$_][a-zA-Z\\$_0-9]*/ "
      }, make(Word)), i({
        _KEYWORD: tokens('if', 'unless', 'else', 'for', 'own', 'in', 'of', 'loop', 'while', 'break', 'continue', 'switch', 'when', 'return', 'throw', 'then', 'is', 'isnt', 'true', 'false', 'by', 'not', 'and', 'or', 'instanceof', 'typeof', 'try', 'catch', 'finally')
      }), i({
        _BTICK: " '`'         "
      }), i({
        _QUOTE: " '\\''       "
      }), i({
        _DQUOTE: " '\"'        "
      }), i({
        _TQUOTE: " '\\'\\'\\'' "
      }), i({
        _TDQUOTE: " '\"\"\"'    "
      }), i({
        _FSLASH: " '/'         "
      }), i({
        _SLASH: " '\\\\'      "
      }), i({
        _SEMICOLON: " ';'         "
      }), i({
        '.': " /[\\s\\S]/ ",
        skipLog: true
      }), i({
        ESC1: " _SLASH . ",
        skipLog: true
      }), i({
        ESC2: " _SLASH . "
      }, (function(chr) {
        return '\\' + chr;
      }), {
        skipLog: true
      })
    ];
  });

  EXPR = new Set([Node, Boolean, String, Number]);

  this.parse = GRAMMAR.parse;

}).call(this);
