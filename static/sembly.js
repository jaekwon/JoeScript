(function(root) {
  var Sembly = function() {
    function require(path){
      var module = require[path];
      console.log("+"+path);
      if (!module) {
        throw new Error("Can't find module "+path);
      }
      if (module.nonce === nonce) {
        module = module();
        console.log("!"+path, typeof module);
        return module;
      } else {
        console.log("."+path, typeof module);
        return module;
      }
    }
    nonce = {nonce:'nonce'};require['joeson'] = function() {
  return new function() {
    var exports = require['joeson'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "src/joeson.js";
    
/*
JoeSon Parser
Jae Kwon 2012

Unfortunately, there is an issue with with the implementation of Joeson where "transient" cached values
like those derived from a loopify iteration, that do not get wiped out of the cache between iterations.
What we want is a way to "taint" the cache results, and wipe all the tainted results...
We could alternatively wipe out all cache items for a given position, but this proved to be
significantly slower.

Either figure out a way to taint results and clear tainted values, in a performant fasion
while maintaining readability of the joeson code, or
just admit that the current implementation is imperfect, and limit grammar usage.

- June, 2012
*/

(function() {
  var C, Choice, CodeStream, E, Existential, Frame, GNode, GRAMMAR, Grammar, ILine, L, La, Line, Lookahead, MACROS, N, Node, Not, OLine, P, ParseContext, Pattern, R, Rank, Re, Ref, Regex, S, Sequence, St, Str, assert, black, blue, clazz, cyan, escape, green, i, inspect, magenta, normal, o, pad, red, tokens, trace, white, yellow, _loopStack, _ref, _ref2, _ref3,
    __hasProp = Object.prototype.hasOwnProperty,
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  CodeStream = require('joeson/src/codestream').CodeStream;

  Node = require('joeson/src/node').Node;

  _ref3 = require('joeson/lib/helpers'), pad = _ref3.pad, escape = _ref3.escape;

  this.trace = trace = {
    stack: false,
    loop: false,
    skipSetup: true
  };

  _loopStack = [];

  this.Frame = Frame = clazz('Frame', function() {
    return {
      init: function(_arg) {
        this.result = _arg.result, this.pos = _arg.pos, this.endPos = _arg.endPos, this.id = _arg.id, this.loopStage = _arg.loopStage, this.wipemask = _arg.wipemask;
      },
      cacheSet: function(result, endPos) {
        this.result = result;
        this.endPos = endPos;
      },
      toString: function() {
        var _ref4;
        return "[F|result:" + this.result + " " + (yellow(this.id)) + "@" + (blue(this.pos)) + "..." + (blue((_ref4 = this.endPos) != null ? _ref4 : '')) + " lS:" + (this.loopStage || '_') + " m:" + (this.wipemask != null) + "]";
      }
    };
  });

  this.ParseContext = ParseContext = clazz('ParseContext', function() {
    return {
      init: function(_arg) {
        var i, _ref4;
        _ref4 = _arg != null ? _arg : {}, this.code = _ref4.code, this.grammar = _ref4.grammar, this.env = _ref4.env;
        this.stack = new Array(1024);
        this.stackLength = 0;
        this.frames = (function() {
          var _i, _ref5, _results;
          _results = [];
          for (i = _i = 0, _ref5 = this.code.text.length + 1; 0 <= _ref5 ? _i < _ref5 : _i > _ref5; i = 0 <= _ref5 ? ++_i : --_i) {
            _results.push(new Array(this.grammar.numRules));
          }
          return _results;
        }).call(this);
        return this.counter = 0;
      },
      "try": function(fn) {
        var pos, result;
        pos = this.code.pos;
        result = fn(this);
        if (result === null) this.code.pos = pos;
        return result;
      },
      log: function(message) {
        var codeSgmnt, line, p;
        if (!this.skipLog) {
          line = this.code.line;
          if ((trace.filterLine != null) && line !== trace.filterLine) return;
          codeSgmnt = "" + (white('' + line + ',' + this.code.col)) + "\t" + (black(pad({
            right: 5
          }, (p = escape(this.code.peek({
            beforeChars: 5
          }))).slice(p.length - 5)))) + (green(pad({
            left: 20
          }, (p = escape(this.code.peek({
            afterChars: 20
          }))).slice(0, 20)))) + (this.code.pos + 20 < this.code.text.length ? black('>') : black(']'));
          return console.log("" + codeSgmnt + " " + (cyan(Array(this.stackLength).join('| '))) + message);
        }
      },
      stackPeek: function() {
        return this.stack[this.stackLength - 1];
      },
      stackPush: function(node) {
        return this.stack[this.stackLength++] = this.getFrame(node);
      },
      stackPop: function(node) {
        return --this.stackLength;
      },
      getFrame: function(node) {
        var frame, id, pos, posFrames;
        id = node.id;
        pos = this.code.pos;
        posFrames = this.frames[pos];
        if (!((frame = posFrames[id]) != null)) {
          return posFrames[id] = new Frame({
            pos: pos,
            id: id
          });
        } else {
          return frame;
        }
      },
      wipeWith: function(frame, makeStash) {
        var i, pos, posFrames, stash, stashCount, wipe, _i, _len, _ref4;
        if (makeStash == null) makeStash = true;
        assert.ok(frame.wipemask != null, "Need frame.wipemask to know what to wipe");
        if (makeStash) stash = new Array(this.grammar.numRules);
        stashCount = 0;
        pos = frame.pos;
        posFrames = this.frames[pos];
        _ref4 = frame.wipemask;
        for (i = _i = 0, _len = _ref4.length; _i < _len; i = ++_i) {
          wipe = _ref4[i];
          if (!(wipe)) continue;
          if (makeStash) stash[i] = posFrames[i];
          posFrames[i] = void 0;
          stashCount++;
        }
        if (stash != null) stash.count = stashCount;
        return stash;
      },
      restoreWith: function(stash) {
        var frame, i, stashCount, _i, _len, _results;
        stashCount = stash.count;
        _results = [];
        for (i = _i = 0, _len = stash.length; _i < _len; i = ++_i) {
          frame = stash[i];
          if (!(frame)) continue;
          if (typeof pos === "undefined" || pos === null) pos = frame.pos;
          if (typeof posFrames === "undefined" || posFrames === null) {
            posFrames = this.frames[pos];
          }
          posFrames[i] = frame;
          stashCount--;
          if (stashCount === 0) {
            break;
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };
  });

  /*
    In addition to the attributes defined by subclasses,
      the following attributes exist for all nodes.
    node.rule = The topmost node of a rule.
    node.rule = rule # sometimes true.
    node.name = name of the rule, if this is @rule.
  */

  this.GNode = GNode = clazz('GNode', Node, function() {
    this.optionKeys = ['skipLog', 'skipCache', 'cb'];
    this.$stack = function(fn) {
      return function($) {
        var result;
        if (this !== this.rule) return fn.call(this, $);
        $.stackPush(this);
        result = fn.call(this, $);
        $.stackPop(this);
        return result;
      };
    };
    this.$loopify = function(fn) {
      return function($) {
        var bestEndPos, bestResult, bestStash, frame, i, i_frame, key, line, pos, result, startPos, _i, _ref4;
        if (this !== this.rule) return fn.call(this, $);
        if (trace.stack) {
          $.log("" + (blue('*')) + " " + this + " " + (black($.counter)));
        }
        if (this.skipCache) {
          result = fn.call(this, $);
          if (trace.stack) {
            $.log("" + (cyan("`->:")) + " " + (escape(result)) + " " + (black(typeof result)));
          }
          return result;
        }
        frame = $.getFrame(this);
        pos = startPos = $.code.pos;
        key = "" + this.name + "@" + pos;
        switch (frame.loopStage) {
          case 0:
          case void 0:
            if (frame.endPos != null) {
              if (trace.stack) {
                $.log("" + (cyan("`-hit:")) + " " + (escape(frame.result)) + " " + (black(typeof frame.result)));
              }
              $.code.pos = frame.endPos;
              return frame.result;
            }
            frame.loopStage = 1;
            frame.cacheSet(null);
            result = fn.call(this, $);
            switch (frame.loopStage) {
              case 1:
                frame.loopStage = 0;
                frame.cacheSet(result, $.code.pos);
                if (trace.stack) {
                  $.log("" + (cyan("`-set:")) + " " + (escape(result)) + " " + (black(typeof result)));
                }
                return result;
              case 2:
                if (result === null) {
                  if (trace.stack) {
                    $.log("" + (yellow("`--- loop null ---")) + " ");
                  }
                  frame.loopStage = 0;
                  return result;
                } else {
                  frame.loopStage = 3;
                  if (trace.loop && (!(trace.filterLine != null) || $.code.line === trace.filterLine)) {
                    line = $.code.line;
                    _loopStack.push(this.name);
                    console.log("" + (((function() {
                      switch (line % 6) {
                        case 0:
                          return blue;
                        case 1:
                          return cyan;
                        case 2:
                          return white;
                        case 3:
                          return yellow;
                        case 4:
                          return red;
                        case 5:
                          return magenta;
                      }
                    })())('@' + line)) + "\t" + (red((function() {
                      var _i, _len, _ref4, _results;
                      _ref4 = $.stack.slice(0, $.stackLength);
                      _results = [];
                      for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                        frame = _ref4[_i];
                        _results.push(frame.id);
                      }
                      return _results;
                    })())) + " - " + _loopStack + " - " + (yellow(escape('' + result))) + ": " + (blue(escape($.code.peek({
                      beforeChars: 10,
                      afterChars: 10
                    })))));
                  }
                  while (result !== null) {
                    assert.ok(frame.wipemask != null, "where's my wipemask");
                    bestStash = $.wipeWith(frame, true);
                    bestResult = result;
                    bestEndPos = $.code.pos;
                    frame.cacheSet(bestResult, bestEndPos);
                    if (trace.stack) {
                      $.log("" + (yellow("|`--- loop iteration ---")) + " " + frame);
                    }
                    $.code.pos = startPos;
                    result = fn.call(this, $);
                    if (!($.code.pos > bestEndPos)) break;
                  }
                  if (trace.loop) _loopStack.pop();
                  $.wipeWith(frame, false);
                  $.restoreWith(bestStash);
                  $.code.pos = bestEndPos;
                  if (trace.stack) {
                    $.log("" + (yellow("`--- loop done! ---")) + " best result: " + (escape(bestResult)));
                  }
                  frame.loopStage = 0;
                  return bestResult;
                }
                break;
              default:
                throw new Error("Unexpected stage " + stages[pos]);
            }
            break;
          case 1:
          case 2:
          case 3:
            if (frame.loopStage === 1) frame.loopStage = 2;
            if (trace.stack) {
              $.log("" + (yellow("`-base:")) + " " + (escape(frame.result)) + " " + (black(typeof frame.result)));
            }
            if (frame.wipemask == null) {
              frame.wipemask = new Array($.grammar.numRules);
            }
            for (i = _i = _ref4 = $.stackLength - 2; _i >= 0; i = _i += -1) {
              i_frame = $.stack[i];
              assert.ok(i_frame.pos <= startPos);
              if (i_frame.pos < startPos) break;
              if (i_frame.id === this.id) break;
              frame.wipemask[i_frame.id] = true;
            }
            if (frame.endPos != null) $.code.pos = frame.endPos;
            return frame.result;
          default:
            throw new Error("Unexpected stage " + stage + " (B)");
        }
      };
    };
    this.$prepareResult = function(fn) {
      return function($) {
        var it, result, resultPos, _ref4;
        $.counter++;
        result = fn.call(this, $);
        if (result !== null) {
          if ((this.label != null) && !((_ref4 = this.parent) != null ? _ref4.handlesChildLabel : void 0)) {
            result = ((it = {})[this.label] = result, it);
          }
          if (result instanceof Object) {
            resultPos = $.stackPeek().pos;
            result._origin = {
              line: $.code.posToLine(resultPos),
              col: $.code.posToLine(resultPos)
            };
          }
          if (this.cb != null) result = this.cb.call(this, result, $);
        }
        return result;
      };
    };
    this.$wrap = function(fn) {
      var wrapped1, wrapped2;
      wrapped1 = this.$stack(this.$loopify(this.$prepareResult(fn)));
      wrapped2 = this.$prepareResult(fn);
      return function($) {
        var parse, _ref4;
        if (this === this.rule) {
          this.parse = parse = wrapped1.bind(this);
        } else if ((this.label != null) && !((_ref4 = this.parent) != null ? _ref4.handlesChildLabel : void 0) || (this.cb != null)) {
          this.parse = parse = wrapped2.bind(this);
        } else {
          this.parse = parse = fn.bind(this);
        }
        return parse($);
      };
    };
    return {
      children: {
        rules: {
          type: {
            key: void 0,
            value: {
              type: GNode
            }
          }
        }
      },
      capture: true,
      labels$: {
        get: function() {
          var _ref4;
          return (_ref4 = this._labels) != null ? _ref4 : this._labels = (this.label ? [this.label] : []);
        }
      },
      captures$: {
        get: function() {
          var _ref4;
          return (_ref4 = this._captures) != null ? _ref4 : this._captures = (this.capture ? [this] : []);
        }
      },
      prepare: function() {},
      toString: function() {
        return "" + (this === this.rule ? red(this.name + ': ') : this.label != null ? cyan(this.label + ':') : '') + (this.contentString());
      },
      include: function(name, rule) {
        if (this.rules == null) this.rules = {};
        if (!(rule.name != null)) rule.name = name;
        return this.rules[name] = rule;
      },
      findParent: function(condition) {
        var parent;
        parent = this.parent;
        while (true) {
          if (condition(parent)) return parent;
          parent = parent.parent;
        }
      }
    };
  });

  this.Choice = Choice = clazz('Choice', GNode, function() {
    return {
      children: {
        rules: {
          type: {
            key: void 0,
            value: {
              type: GNode
            }
          }
        },
        choices: {
          type: [
            {
              type: GNode
            }
          ]
        }
      },
      init: function(choices) {
        this.choices = choices != null ? choices : [];
      },
      prepare: function() {
        return this.capture = this.choices.every(function(choice) {
          return choice.capture;
        });
      },
      parse$: this.$wrap(function($) {
        var choice, result, _i, _len, _ref4;
        _ref4 = this.choices;
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          choice = _ref4[_i];
          result = $["try"](choice.parse);
          if (result !== null) return result;
        }
        return null;
      }),
      contentString: function() {
        return blue("(") + (this.choices.join(blue(' | '))) + blue(")");
      }
    };
  });

  this.Rank = Rank = clazz('Rank', Choice, function() {
    this.fromLines = function(name, lines) {
      var choice, idx, line, rank, rule, _i, _len, _ref4;
      rank = Rank(name);
      for (idx = _i = 0, _len = lines.length; _i < _len; idx = ++_i) {
        line = lines[idx];
        if (line instanceof OLine) {
          choice = line.toRule(rank, {
            index: rank.choices.length
          });
          rank.choices.push(choice);
        } else if (line instanceof ILine) {
          _ref4 = line.toRules();
          for (name in _ref4) {
            if (!__hasProp.call(_ref4, name)) continue;
            rule = _ref4[name];
            rank.include(name, rule);
          }
        } else if (line instanceof Object && idx === lines.length - 1) {
          assert.ok(GNode.optionKeys.intersect(Object.keys(line)).length > 0, "Invalid options? " + line.constructor.name);
          Object.merge(rank, line);
        } else {
          throw new Error("Unknown line type, expected 'o' or 'i' line, got '" + line + "' (" + (typeof line) + ")");
        }
      }
      return rank;
    };
    return {
      children: {
        rules: {
          type: {
            key: void 0,
            value: {
              type: GNode
            }
          }
        },
        choices: {
          type: [
            {
              type: GNode
            }
          ]
        }
      },
      init: function(name, choices, includes) {
        var choice, i, rule, _i, _len, _ref4, _results;
        this.name = name;
        this.choices = choices != null ? choices : [];
        if (includes == null) includes = {};
        this.rules = {};
        _ref4 = this.choices;
        for (i = _i = 0, _len = _ref4.length; _i < _len; i = ++_i) {
          choice = _ref4[i];
          this.choices.push(choice);
        }
        _results = [];
        for (name in includes) {
          rule = includes[name];
          _results.push(this.include(name, rule));
        }
        return _results;
      },
      contentString: function() {
        return blue("Rank(") + (this.choices.map(function(c) {
          return red(c.name);
        }).join(blue(','))) + blue(")");
      }
    };
  });

  this.Sequence = Sequence = clazz('Sequence', GNode, function() {
    return {
      handlesChildLabel: true,
      children: {
        rules: {
          type: {
            key: void 0,
            value: {
              type: GNode
            }
          }
        },
        sequence: {
          type: [
            {
              type: GNode
            }
          ]
        }
      },
      init: function(sequence) {
        this.sequence = sequence;
      },
      labels$: {
        get: function() {
          var child, _ref4;
          return (_ref4 = this._labels) != null ? _ref4 : this._labels = (this.label != null ? [this.label] : ((function() {
            var _i, _len, _ref5, _results;
            _ref5 = this.sequence;
            _results = [];
            for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
              child = _ref5[_i];
              _results.push(child.labels);
            }
            return _results;
          }).call(this)).flatten());
        }
      },
      captures$: {
        get: function() {
          var child, _ref4;
          return (_ref4 = this._captures) != null ? _ref4 : this._captures = ((function() {
            var _i, _len, _ref5, _results;
            _ref5 = this.sequence;
            _results = [];
            for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
              child = _ref5[_i];
              _results.push(child.captures);
            }
            return _results;
          }).call(this)).flatten();
        }
      },
      type$: {
        get: function() {
          var _ref4;
          return (_ref4 = this._type) != null ? _ref4 : this._type = (this.labels.length === 0 ? this.captures.length > 1 ? 'array' : 'single' : 'object');
        }
      },
      parse$: this.$wrap(function($) {
        var child, res, result, results, _i, _j, _k, _len, _len2, _len3, _ref4, _ref5, _ref6;
        switch (this.type) {
          case 'array':
            results = [];
            _ref4 = this.sequence;
            for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
              child = _ref4[_i];
              res = child.parse($);
              if (res === null) return null;
              if (child.capture) results.push(res);
            }
            return results;
          case 'single':
            result = void 0;
            _ref5 = this.sequence;
            for (_j = 0, _len2 = _ref5.length; _j < _len2; _j++) {
              child = _ref5[_j];
              res = child.parse($);
              if (res === null) return null;
              if (child.capture) result = res;
            }
            return result;
          case 'object':
            results = void 0;
            _ref6 = this.sequence;
            for (_k = 0, _len3 = _ref6.length; _k < _len3; _k++) {
              child = _ref6[_k];
              res = child.parse($);
              if (res === null) return null;
              if (child.label === '&') {
                results = results != null ? Object.merge(res, results) : res;
              } else if (child.label === '@') {
                results = results != null ? Object.merge(results, res) : res;
              } else if (child.label != null) {
                (results != null ? results : results = {})[child.label] = res;
              }
            }
            return results;
          default:
            throw new Error("Unexpected type " + this.type);
        }
        throw new Error;
      }),
      contentString: function() {
        var labeledStrs, node;
        labeledStrs = (function() {
          var _i, _len, _ref4, _results;
          _ref4 = this.sequence;
          _results = [];
          for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
            node = _ref4[_i];
            _results.push('' + node);
          }
          return _results;
        }).call(this);
        return blue("(") + (labeledStrs.join(' ')) + blue(")");
      }
    };
  });

  this.Lookahead = Lookahead = clazz('Lookahead', GNode, function() {
    return {
      capture: false,
      children: {
        rules: {
          type: {
            key: void 0,
            value: {
              type: GNode
            }
          }
        },
        expr: {
          type: GNode
        }
      },
      init: function(_arg) {
        this.expr = _arg.expr;
      },
      parse$: this.$wrap(function($) {
        var pos, result;
        pos = $.code.pos;
        result = this.expr.parse($);
        $.code.pos = pos;
        return result;
      }),
      contentString: function() {
        return "" + (blue("(?")) + this.expr + (blue(")"));
      }
    };
  });

  this.Existential = Existential = clazz('Existential', GNode, function() {
    return {
      handlesChildLabel$: {
        get: function() {
          var _ref4;
          return (_ref4 = this.parent) != null ? _ref4.handlesChildLabel : void 0;
        }
      },
      children: {
        rules: {
          type: {
            key: void 0,
            value: {
              type: GNode
            }
          }
        },
        it: {
          type: GNode
        }
      },
      init: function(it) {
        this.it = it;
      },
      prepare: function() {
        var captures, labels, _ref4;
        labels = (this.label != null) && ((_ref4 = this.label) !== '@' && _ref4 !== '&') ? [this.label] : this.it.labels;
        if (labels.length > 0) if (this.label == null) this.label = '@';
        captures = this.it.captures;
        this.capture = (captures != null ? captures.length : void 0) > 0;
        this.labels = labels;
        return this.captures = captures;
      },
      parse$: this.$wrap(function($) {
        var res;
        res = $["try"](this.it.parse);
        return res != null ? res : void 0;
      }),
      contentString: function() {
        return '' + this.it + blue("?");
      }
    };
  });

  this.Pattern = Pattern = clazz('Pattern', GNode, function() {
    return {
      children: {
        rules: {
          type: {
            key: void 0,
            value: {
              type: GNode
            }
          }
        },
        value: {
          type: GNode
        },
        join: {
          type: GNode
        }
      },
      init: function(_arg) {
        this.value = _arg.value, this.join = _arg.join, this.min = _arg.min, this.max = _arg.max;
        return this.capture = this.value.capture;
      },
      parse$: this.$wrap(function($) {
        var matches, result,
          _this = this;
        matches = [];
        result = $["try"](function() {
          var action, resV;
          resV = _this.value.parse($);
          if (resV === null) {
            if ((_this.min != null) && _this.min > 0) return null;
            return [];
          }
          matches.push(resV);
          while (true) {
            action = $["try"](function() {
              var resJ;
              if (_this.join != null) {
                resJ = _this.join.parse($);
                if (resJ === null) return null;
              }
              resV = _this.value.parse($);
              if (resV === null) return null;
              matches.push(resV);
              if ((_this.max != null) && matches.length >= _this.max) {
                return 'break';
              }
            });
            if (action === 'break' || action === null) break;
          }
          if ((_this.min != null) && _this.min > matches.length) return null;
          return matches;
        });
        return result;
      }),
      contentString: function() {
        return "" + this.value + (cyan("*")) + (this.join || '') + (cyan((this.min != null) || (this.max != null) ? "{" + (this.min || '') + "," + (this.max || '') + "}" : ''));
      }
    };
  });

  this.Not = Not = clazz('Not', GNode, function() {
    return {
      capture: false,
      children: {
        rules: {
          type: {
            key: void 0,
            value: {
              type: GNode
            }
          }
        },
        it: {
          type: GNode
        }
      },
      init: function(it) {
        this.it = it;
      },
      parse$: this.$wrap(function($) {
        var pos, res;
        pos = $.code.pos;
        res = this.it.parse($);
        $.code.pos = pos;
        if (res !== null) {
          return null;
        } else {

        }
      }),
      contentString: function() {
        return "" + (yellow('!')) + this.it;
      }
    };
  });

  this.Ref = Ref = clazz('Ref', GNode, function() {
    return {
      init: function(ref) {
        this.ref = ref;
        if (this.ref[0] === '_') return this.capture = false;
      },
      labels$: {
        get: function() {
          var _ref4;
          return (_ref4 = this._labels) != null ? _ref4 : this._labels = this.label === '@' ? this.grammar.rules[this.ref].labels : this.label ? [this.label] : [];
        }
      },
      parse$: this.$wrap(function($) {
        var node;
        node = this.grammar.rules[this.ref];
        if (!(node != null)) throw Error("Unknown reference " + this.ref);
        return node.parse($);
      }),
      contentString: function() {
        return red(this.ref);
      }
    };
  });

  this.Str = Str = clazz('Str', GNode, function() {
    return {
      capture: false,
      init: function(str) {
        this.str = str;
      },
      parse$: this.$wrap(function($) {
        return $.code.match({
          string: this.str
        });
      }),
      contentString: function() {
        return green("'" + (escape(this.str)) + "'");
      }
    };
  });

  this.Regex = Regex = clazz('Regex', GNode, function() {
    return {
      init: function(reStr) {
        this.reStr = reStr;
        if (typeof this.reStr !== 'string') {
          throw Error("Regex node expected a string but got: " + this.reStr);
        }
        return this.re = RegExp('(' + this.reStr + ')', 'g');
      },
      parse$: this.$wrap(function($) {
        return $.code.match({
          regex: this.re
        });
      }),
      contentString: function() {
        return magenta('' + this.re);
      }
    };
  });

  this.Grammar = Grammar = clazz('Grammar', GNode, function() {
    return {
      children: {
        rank: {
          type: Rank
        }
      },
      init: function(rank) {
        var _this = this;
        if (typeof rank === 'function') rank = rank(MACROS);
        if (rank instanceof Array) this.rank = Rank.fromLines("__grammar__", rank);
        this.rules = {};
        this.numRules = 0;
        this.id2Rule = {};
        this.walk({
          pre: function(node, parent, key, desc, key2) {
            var _base, _base2, _ref4;
            if (node instanceof Choice && node.choices.length === 1) {
              if ((_base = node.choices[0]).label == null) {
                _base.label = node.label;
              }
              if (node.rules != null) {
                Object.merge(((_ref4 = (_base2 = node.choices[0]).rules) != null ? _ref4 : _base2.rules = {}), node.rules);
              }
              if (key2 != null) {
                return parent[key][key2] = node.choices[0];
              } else {
                return parent[key] = node.choices[0];
              }
            }
          }
        });
        this.walk({
          pre: function(node, parent) {
            if ((node.parent != null) && node !== node.rule) {
              throw Error('Grammar tree should be a DAG, nodes should not be referenced more than once.');
            }
            node.grammar = _this;
            node.parent = parent;
            if (node.inlineLabel != null) {
              node.rule = node;
              return parent.rule.include(node.inlineLabel, node);
            } else {
              return node.rule || (node.rule = parent != null ? parent.rule : void 0);
            }
          },
          post: function(node, parent) {
            if (node === node.rule) {
              _this.rules[node.name] = node;
              node.id = _this.numRules++;
              _this.id2Rule[node.id] = node;
              if (trace.loop) {
                return console.log("" + (red(node.id)) + ":\t" + node);
              }
            }
          }
        });
        return this.walk({
          post: function(node, parent) {
            return node.prepare();
          }
        });
      },
      parse$: function(code, _arg) {
        var $, debug, env, frame, id, maxAttempt, maxSuccess, oldTrace, parseError, pos, posFrames, returnContext, _i, _j, _len, _len2, _ref4, _ref5, _ref6;
        _ref4 = _arg != null ? _arg : {}, returnContext = _ref4.returnContext, env = _ref4.env, debug = _ref4.debug;
        if (returnContext == null) returnContext = false;
        assert.ok(code, "Parser wants code");
        if (!(code instanceof CodeStream)) code = CodeStream(code);
        $ = ParseContext({
          code: code,
          grammar: this,
          env: env
        });
        if (debug) {
          oldTrace = Object.clone(trace);
          trace.stack = true;
        }
        $.result = this.rank.parse($);
        if ((_ref5 = $.result) != null) _ref5.code = code;
        if (debug) trace = oldTrace;
        if ($.code.pos !== $.code.text.length) {
          maxAttempt = $.code.pos;
          maxSuccess = $.code.pos;
          _ref6 = $.frames.slice($.code.pos);
          for (pos = _i = 0, _len = _ref6.length; _i < _len; pos = ++_i) {
            posFrames = _ref6[pos];
            if (pos < maxAttempt) continue;
            for (id = _j = 0, _len2 = posFrames.length; _j < _len2; id = ++_j) {
              frame = posFrames[id];
              if (frame) {
                maxAttempt = pos;
                if (frame.result !== null) {
                  maxSuccess = pos;
                  break;
                }
              }
            }
          }
          parseError = new Error("Error parsing at char:" + maxSuccess + "=(line:" + ($.code.posToLine(maxSuccess)) + ",col:" + ($.code.posToCol(maxSuccess)) + ").");
          parseError.details = "" + (green('OK')) + "/" + (yellow('Parsing')) + "/" + (red('Suspect')) + "/" + (white('Unknown')) + ")\n\n" + (green($.code.peek({
            beforeLines: 2
          }))) + (yellow($.code.peek({
            afterChars: maxSuccess - $.code.pos
          }))) + ($.code.pos = maxSuccess, red($.code.peek({
            afterChars: maxAttempt - $.code.pos
          }))) + ($.code.pos = maxAttempt, white($.code.peek({
            afterLines: 2
          }))) + "\n";
          throw parseError;
        }
        if (returnContext) {
          return $;
        } else {
          return $.result;
        }
      },
      contentString: function() {
        return magenta('GRAMMAR{') + this.rank + magenta('}');
      }
    };
  });

  Line = clazz('Line', function() {
    return {
      init: function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        this.args = args;
      },
      getRule: function(name, rule, parentRule, attrs) {
        var oldTrace;
        if (typeof rule === 'string') {
          try {
            oldTrace = trace;
            if (trace.skipSetup) {
              trace = {
                stack: false,
                loop: false
              };
            }
            rule = GRAMMAR.parse(rule);
            trace = oldTrace;
          } catch (err) {
            console.log("Error in rule " + name + ": " + rule);
            console.log(err.stack);
            GRAMMAR.parse(rule);
          }
        } else if (rule instanceof Array) {
          rule = Rank.fromLines(name, rule);
        } else if (rule instanceof OLine) {
          rule = rule.toRule(parentRule, {
            name: name
          });
        }
        assert.ok(!(rule.rule != null) || rule.rule === rule);
        rule.rule = rule;
        assert.ok(!(rule.name != null) || rule.name === name);
        rule.name = name;
        if (attrs != null) Object.merge(rule, attrs);
        return rule;
      },
      getArgs: function() {
        var key, next, rest, rule, value, _a_, _i, _len, _ref4;
        _ref4 = this.args, rule = _ref4[0], rest = 2 <= _ref4.length ? __slice.call(_ref4, 1) : [];
        _a_ = {
          rule: rule,
          attrs: {}
        };
        for (key in rule) {
          if (!__hasProp.call(rule, key)) continue;
          value = rule[key];
          if (__indexOf.call(GNode.optionKeys, key) >= 0) {
            _a_.attrs[key] = value;
            delete rule[key];
          }
        }
        for (_i = 0, _len = rest.length; _i < _len; _i++) {
          next = rest[_i];
          if (next instanceof Function) {
            _a_.attrs.cb = next;
          } else if (next instanceof Object && next.constructor.name === 'Func') {
            _a_.attrs.cbAST = next;
          } else if (next instanceof Object && next.constructor.name === 'Word') {
            _a_.attrs.cbName = next;
          } else {
            Object.merge(_a_.attrs, next);
          }
        }
        return _a_;
      },
      toString: function() {
        return "" + this.type + " " + (this.args.join(','));
      }
    };
  });

  ILine = clazz('ILine', Line, function() {
    return {
      type: 'i',
      toRules: function(parentRule) {
        var attrs, name, rule, rules, _ref4, _rule;
        _ref4 = this.getArgs(), rule = _ref4.rule, attrs = _ref4.attrs;
        rules = {};
        for (name in rule) {
          if (!__hasProp.call(rule, name)) continue;
          _rule = rule[name];
          rules[name] = this.getRule(name, _rule, parentRule, attrs);
        }
        return rules;
      }
    };
  });

  OLine = clazz('OLine', Line, function() {
    return {
      type: 'o',
      toRule: function(parentRule, _arg) {
        var attrs, index, name, rule, _ref4;
        index = _arg.index, name = _arg.name;
        _ref4 = this.getArgs(), rule = _ref4.rule, attrs = _ref4.attrs;
        if (!name && typeof rule !== 'string' && !(rule instanceof Array) && !(rule instanceof GNode)) {
          assert.ok(Object.keys(rule).length === 1, "Named rule should only have one key-value pair");
          name = Object.keys(rule)[0];
          rule = rule[name];
        } else if (!(name != null) && (index != null) && (parentRule != null)) {
          name = parentRule.name + ("[" + index + "]");
        } else if (!(name != null)) {
          throw new Error("Name undefined for 'o' line");
        }
        rule = this.getRule(name, rule, parentRule, attrs);
        rule.parent = parentRule;
        rule.index = index;
        return rule;
      }
    };
  });

  this.MACROS = MACROS = {
    o: OLine,
    i: ILine,
    tokens: function() {
      var cb, name, oldTrace, regexAll, rule, token, tokens, _i, _len;
      tokens = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (typeof tokens[tokens.length - 1] === 'function') cb = tokens.pop();
      regexAll = Regex("[ ]*(" + (tokens.join('|')) + ")[^a-zA-Z\\$_0-9]");
      for (_i = 0, _len = tokens.length; _i < _len; _i++) {
        token = tokens[_i];
        name = '_' + token.toUpperCase();
        oldTrace = trace;
        trace = {
          stack: false
        };
        rule = GRAMMAR.parse("/[ ]*/ &:'" + token + "' !/[a-zA-Z\\$_0-9]/");
        trace = oldTrace;
        rule.rule = rule;
        rule.skipLog = true;
        rule.skipCache = true;
        if (cb != null) rule.cb = cb;
        regexAll.include(name, rule);
      }
      return OLine(regexAll);
    },
    make: function(clazz) {
      return function(it) {
        return new clazz(it);
      };
    }
  };

  C = function() {
    var x;
    return Choice((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
        x = arguments[_i];
        _results.push(x);
      }
      return _results;
    }).apply(this, arguments));
  };

  E = function() {
    return Existential.apply(null, arguments);
  };

  L = function(label, node) {
    node.label = label;
    return node;
  };

  La = function() {
    return Lookahead.apply(null, arguments);
  };

  N = function() {
    return Not.apply(null, arguments);
  };

  P = function(value, join, min, max) {
    return Pattern({
      value: value,
      join: join,
      min: min,
      max: max
    });
  };

  R = function() {
    return Ref.apply(null, arguments);
  };

  Re = function() {
    return Regex.apply(null, arguments);
  };

  S = function() {
    var x;
    return Sequence((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
        x = arguments[_i];
        _results.push(x);
      }
      return _results;
    }).apply(this, arguments));
  };

  St = function() {
    return Str.apply(null, arguments);
  };

  o = MACROS.o, i = MACROS.i, tokens = MACROS.tokens;

  this.GRAMMAR = GRAMMAR = Grammar([
    o({
      EXPR: [
        o(S(R("CHOICE"), R("_"))), o({
          "CHOICE": [
            o(S(P(R("_PIPE")), P(R("SEQUENCE"), R("_PIPE"), 2), P(R("_PIPE"))), function(it) {
              return new Choice(it);
            }), o({
              "SEQUENCE": [
                o(P(R("UNIT"), null, 2), function(it) {
                  return new Sequence(it);
                }), o({
                  "UNIT": [
                    o(S(R("_"), R("LABELED"))), o({
                      "LABELED": [
                        o(S(E(S(L("label", R("LABEL")), St(':'))), L('&', C(R("DECORATED"), R("PRIMARY"))))), o({
                          "DECORATED": [
                            o(S(R("PRIMARY"), St('?')), function(it) {
                              return new Existential(it);
                            }), o(S(L("value", R("PRIMARY")), St('*'), L("join", E(S(N(R("__")), R("PRIMARY")))), L("@", E(R("RANGE")))), function(it) {
                              return new Pattern(it);
                            }), o(S(L("value", R("PRIMARY")), St('+'), L("join", E(S(N(R("__")), R("PRIMARY"))))), function(_arg) {
                              var join, value;
                              value = _arg.value, join = _arg.join;
                              return new Pattern({
                                value: value,
                                join: join,
                                min: 1
                              });
                            }), o(S(L("value", R("PRIMARY")), L("@", R("RANGE"))), function(it) {
                              return new Pattern(it);
                            }), o(S(St('!'), R("PRIMARY")), function(it) {
                              return new Not(it);
                            }), o(C(S(St('(?'), L("expr", R("EXPR")), St(')')), S(St('?'), L("expr", R("EXPR")))), function(it) {
                              return new Lookahead(it);
                            }), i({
                              "RANGE": o(S(St('{'), R("_"), L("min", E(R("INT"))), R("_"), St(','), R("_"), L("max", E(R("INT"))), R("_"), St('}')))
                            })
                          ]
                        }), o({
                          "PRIMARY": [
                            o(R("WORD"), function(it) {
                              return new Ref(it);
                            }), o(S(St('('), L("inlineLabel", E(S(R('WORD'), St(': ')))), L("expr", R("EXPR")), St(')'), E(S(R('_'), St('->'), R('_'), L("code", R("CODE"))))), function(_arg) {
                              var BoundFunc, Context, Func, cbBFunc, cbFunc, code, expr, params, _ref4, _ref5;
                              expr = _arg.expr, code = _arg.code;
                              if (code != null) {
                                Func = require('joeson/src/joescript').NODES.Func;
                                _ref4 = require('joeson/src/interpreter'), BoundFunc = _ref4.BoundFunc, Context = _ref4.Context;
                                params = expr.labels;
                                cbFunc = new Func({
                                  params: params,
                                  type: '->',
                                  block: code
                                });
                                cbBFunc = new BoundFunc({
                                  func: cbFunc,
                                  context: Context({
                                    global: (_ref5 = this.env) != null ? _ref5.global : void 0
                                  })
                                });
                                expr.cb = cbBFunc["function"];
                              }
                              return expr;
                            }), i({
                              "CODE": o(S(St("{"), P(S(N(St("}")), C(R("ESC1"), R(".")))), St("}")), function(it) {
                                return require('joeson/src/joescript').parse(it.join(''));
                              })
                            }), o(S(St("'"), P(S(N(St("'")), C(R("ESC1"), R(".")))), St("'")), function(it) {
                              return new Str(it.join(''));
                            }), o(S(St("/"), P(S(N(St("/")), C(R("ESC2"), R(".")))), St("/")), function(it) {
                              return new Regex(it.join(''));
                            }), o(S(St("["), P(S(N(St("]")), C(R("ESC2"), R(".")))), St("]")), function(it) {
                              return new Regex("[" + (it.join('')) + "]");
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
      LABEL: C(St('&'), St('@'), R("WORD"))
    }), i({
      WORD: Re("[a-zA-Z\\._][a-zA-Z\\._0-9]*")
    }), i({
      INT: Re("[0-9]+")
    }, function(it) {
      return new Number(it);
    }), i({
      _PIPE: S(R("_"), St('|'))
    }), i({
      _: P(C(St(' '), St('\n')))
    }), i({
      __: P(C(St(' '), St('\n')), null, 1)
    }), i({
      '.': Re("[\\s\\S]")
    }), i({
      ESC1: S(St('\\'), R("."))
    }), i({
      ESC2: S(St('\\'), R("."))
    }, function(chr) {
      return '\\' + chr;
    })
  ]);

  this.NODES = {
    GNode: GNode,
    Choice: Choice,
    Rank: Rank,
    Sequence: Sequence,
    Lookahead: Lookahead,
    Existential: Existential,
    Pattern: Pattern,
    Not: Not,
    Ref: Ref,
    Regex: Regex,
    Grammar: Grammar
  };

}).call(this);

    return (require['joeson'] = module.exports);
  };
};
require['joeson'].nonce = nonce;

require['joeson/src/codestream'] = function() {
  return new function() {
    var exports = require['joeson/src/codestream'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "src/codestream.js";
    (function() {
  var CodeStream, assert, bisect_right, clazz, _ref, _ref2;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.bisect, bisect_right = _ref2.bisect_right);

  assert = require('assert');

  this.inspect = function(x) {
    return require('util').inspect(x, false, 100);
  };

  this.CodeStream = CodeStream = clazz('CodeStream', function() {
    return {
      init: function(text) {
        this.text = text;
        this.pos = 0;
        this.numLines = 0;
        this.lineStarts = [0];
        while (this.getUntil("\n").length > 0) {
          this.lineStarts.push(this.pos);
        }
        this.lineStarts.pop();
        return this.pos = 0;
      },
      posToLine: function(pos) {
        return bisect_right(this.lineStarts, pos) - 1;
      },
      posToCol: function(pos) {
        return pos - this.lineStarts[this.posToLine(pos)];
      },
      line$: {
        get: function() {
          return this.posToLine(this.pos);
        }
      },
      col$: {
        get: function() {
          return this.posToCol(this.pos);
        }
      },
      getUntil: function(end, ignoreEOF) {
        var index;
        if (ignoreEOF == null) ignoreEOF = true;
        index = this.text.indexOf(end, this.pos);
        if (index === -1) {
          if (ignoreEOF) {
            index = this.text.length;
          } else {
            throw new EOFError;
          }
        } else {
          index += end.length;
        }
        return this.text.slice(this.pos, (this.pos = index));
      },
      peek: function(_arg) {
        var afterChars, afterLines, beforeChars, beforeLines, end, endLine, start, startLine;
        beforeChars = _arg.beforeChars, beforeLines = _arg.beforeLines, afterChars = _arg.afterChars, afterLines = _arg.afterLines;
        if (!(beforeLines != null) && !(beforeChars != null)) beforeChars = 0;
        if (!(afterLines != null) && !(afterChars != null)) afterChars = 0;
        if (beforeChars === 0 && afterChars === 0) return '';
        if (beforeLines != null) {
          startLine = Math.max(0, this.line - beforeLines);
          start = this.lineStarts[startLine];
        } else {
          start = this.pos - beforeChars;
        }
        if (afterLines != null) {
          endLine = Math.min(this.lineStarts.length - 1, this.line + afterLines);
          if (endLine < this.lineStarts.length - 1) {
            end = this.lineStarts[endLine + 1] - 1;
          } else {
            end = this.text.length;
          }
        } else {
          end = this.pos + afterChars;
        }
        return this.text.slice(start, end);
      },
      match: function(_arg) {
        var match, peek, regex, string;
        regex = _arg.regex, string = _arg.string;
        if (string != null) {
          peek = this.text.slice(this.pos, (this.pos + string.length));
          if (peek !== string) return null;
          this.pos += string.length;
          return string;
        } else if (regex != null) {
          regex.lastIndex = this.pos;
          match = regex.exec(this.text);
          if (!match || match.index !== this.pos) return null;
          this.pos = regex.lastIndex;
          return match[0];
        }
      }
    };
  });

}).call(this);

    return (require['joeson/src/codestream'] = module.exports);
  };
};
require['joeson/src/codestream'].nonce = nonce;

require['joeson/src/joescript'] = function() {
  return new function() {
    var exports = require['joeson/src/joescript'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "src/joescript.js";
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
        this.key = _arg.key, this.value = _arg.value, this.splat = _arg.splat;
      },
      toString: function() {
        return "" + (this.key != null ? this.key : '') + ((this.key != null) && (this.value != null) ? ':' : '') + (this.value != null ? '(' + this.value + ')' : '') + (this.splat ? '...' : '');
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
        this.key = _arg.key, this.target = _arg.target, this.splat = _arg.splat, this["default"] = _arg["default"];
      },
      toString: function() {
        return "" + (this.key != null ? this.key : '') + ((this.key != null) && (this.target != null) ? ':' : '') + (this.target != null ? this.target : '') + (this.splat ? '...' : '') + (this["default"] != null ? '=' + this["default"] : '');
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
      children: {
        items: {
          type: AssignItem
        }
      },
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
                    INVOC_IMPL: " _ func:VALUE (__|_INDENT (? OBJ_IMPL_ITEM) ) params:ARR_IMPL_ITEM+(_COMMA|_COMMA_NEWLINE) "
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
        ASSIGN_LIST_ITEM: " _ target:(                              | SYMBOL                              | PROPERTY                              | ASSIGN_OBJ                              | ASSIGN_LIST                            )                            splat:'...'?                            default:(_ '=' LINEEXPR)? "
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
            INVOC_EXPL: " func:VALUE '(' ___ params:ARR_EXPL_ITEM*(_COMMA|_SOFTLINE) ___ ')' "
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
            ARR_EXPL: " '[' _SOFTLINE? ARR_EXPL_ITEM*(_COMMA|_SOFTLINE) ___ (',' ___)? ']' "
          }, make(Arr)), i({
            ARR_EXPL_ITEM: " value:LINEEXPR splat:'...'? "
          }, make(Item)), i({
            ARR_IMPL_ITEM: " value:EXPR splat:'...'? "
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

    return (require['joeson/src/joescript'] = module.exports);
  };
};
require['joeson/src/joescript'].nonce = nonce;

require['joeson/src/node'] = function() {
  return new function() {
    var exports = require['joeson/src/node'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "src/node.js";
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

    return (require['joeson/src/node'] = module.exports);
  };
};
require['joeson/src/node'].nonce = nonce;

require['joeson/src/interpreter'] = function() {
  return new function() {
    var exports = require['joeson/src/interpreter'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "src/interpreter/index.js";
    
/*
Concerns:
  * permissions (ACL)
  * concurrency (interwoven within a line of process,
                 simultaneous amongst processes.)
  * performance
  * networking  (future)

i9n: short for instruction
*/

(function() {
  var GOD, GUEST, JArray, JBoundFunc, JKernel, JNaN, JNull, JObject, JStackItem, JThread, JUndefined, JUser, WORLD, assert, black, blue, clazz, cyan, debug, ends, escape, extend, fatal, green, info, inspect, isVariable, joe, magenta, normal, pad, randid, red, starts, trace, warn, white, yellow, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7,
    __slice = Array.prototype.slice;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  joe = require('joeson/src/joescript').NODES;

  _ref3 = require('joeson/lib/helpers'), randid = _ref3.randid, pad = _ref3.pad, escape = _ref3.escape, starts = _ref3.starts, ends = _ref3.ends;

  _ref4 = require('joeson/src/joescript').HELPERS, extend = _ref4.extend, isVariable = _ref4.isVariable;

  _ref5 = require('nogg').logger('interpreter'), debug = _ref5.debug, info = _ref5.info, warn = _ref5.warn, fatal = _ref5.error;

  trace = {
    debug: true,
    logCode: true
  };

  _ref6 = this.JTypes = require('joeson/src/interpreter/object'), JObject = _ref6.JObject, JArray = _ref6.JArray, JUser = _ref6.JUser, JUndefined = _ref6.JUndefined, JNull = _ref6.JNull, JNaN = _ref6.JNaN, JBoundFunc = _ref6.JBoundFunc;

  _ref7 = this.GLOBALS = require('joeson/src/interpreter/global'), GOD = _ref7.GOD, WORLD = _ref7.WORLD, GUEST = _ref7.GUEST;

  JStackItem = this.JStackItem = clazz('JStackItem', function() {
    return {
      init: function(_arg) {
        var declaringFunc;
        this.node = _arg.node;
        declaringFunc = this.node.parent;
        while ((declaringFunc != null) && !(declaringFunc instanceof joe.Func)) {
          declaringFunc = declaringFunc.parent;
        }
        return this.declaringFunc = declaringFunc;
      },
      toString: function() {
        var _ref10, _ref8, _ref9;
        return "'" + ((_ref8 = this.node) != null ? typeof _ref8.toJavascript === "function" ? _ref8.toJavascript() : void 0 : void 0) + "' (source:" + this.declaringFunc + ", line:" + ((_ref9 = this.node._origin) != null ? _ref9.line : void 0) + ", col:" + ((_ref10 = this.node._origin) != null ? _ref10.col : void 0) + ")";
      }
    };
  });

  JThread = this.JThread = clazz('JThread', function() {
    return {
      init: function(_arg) {
        this.kernel = _arg.kernel, this.start = _arg.start, this.user = _arg.user, this.scope = _arg.scope, this.input = _arg.input, this.output = _arg.output, this.callback = _arg.callback;
        assert.ok(this.kernel instanceof JKernel, "JThread wants kernel");
        assert.ok(this.start instanceof joe.Node, "JThread wants function");
        assert.ok(this.user instanceof JObject, "JThread wants user");
        if (this.scope == null) {
          this.scope = new JObject({
            creator: this.user
          });
        }
        assert.ok(this.scope instanceof JObject, "JThread scope not JObject");
        this.id = randid();
        this.i9ns = [];
        this.last = JUndefined;
        this.state = null;
        this.push({
          "this": this.start,
          func: this.start.interpret
        });
        if (this.user === GOD) {
          return this.will = function() {
            return true;
          };
        }
      },
      runStep: function() {
        var dontcare, existing, func, i9n, last, target, targetIndex, targetKey, that, _ref8;
        if (this.i9ns.length === 0) return this.state = 'return';
        _ref8 = i9n = this.i9ns[this.i9ns.length - 1], func = _ref8.func, that = _ref8["this"], target = _ref8.target, targetKey = _ref8.targetKey, targetIndex = _ref8.targetIndex;
        if (trace.debug) info(blue("             -- runStep --"));
        if (trace.debug) this.printScope(this.scope);
        if (trace.debug) this.printStack();
        if (!(func != null)) throw new Error("Last i9n.func undefined!");
        if (((target != null) || (targetKey != null)) && !((target != null) && (targetKey != null))) {
          throw new Error("target and targetKey must be present together");
        }
        this.last = func.call(that != null ? that : i9n, this, i9n, this.last);
        switch (this.state) {
          case null:
            if (trace.debug) {
              info("             " + (blue('last ->')) + " " + this.last);
            }
            if (targetIndex != null) {
              target[targetKey][targetIndex] = this.last;
            } else if (target != null) {
              target[targetKey] = this.last;
            }
            return null;
          case 'error':
            if (trace.debug) {
              info("             " + (red('throw ->')) + " " + this.last);
            }
            while (true) {
              dontcare = this.pop();
              i9n = this.peek();
              if (!(i9n != null)) {
                return 'error';
              } else if (i9n["this"] instanceof joe.Try && !i9n.isHandlingError) {
                i9n.isHandlingError = true;
                i9n.func = joe.Try.prototype.interpretCatch;
                last = this.error;
                return this.state = null;
              }
            }
            break;
          case 'return':
            if (trace.debug) {
              info("             " + (yellow('return ->')) + " " + this.last);
            }
            while (true) {
              dontcare = this.pop();
              i9n = this.peek();
              if (!(i9n != null)) {
                return 'return';
              } else if (i9n["this"] instanceof joe.Invocation) {
                assert.ok(i9n.func === joe.Invocation.prototype.interpretFinal);
                return this.state = null;
              }
            }
            break;
          case 'wait':
            if (trace.debug) {
              info("             " + (yellow('wait ->')) + " " + (inspect(this.waitKey)));
            }
            existing = this.kernel.waitlist[waitKey];
            if (existing != null) {
              this.kernel.waitlist[waitKey].push(thread);
            } else {
              this.kernel.waitlist[waitKey] = [thread];
            }
            return 'wait';
          default:
            throw new Error("Unexpected state " + this.state);
        }
      },
      /* STACKS
      */
      pop: function() {
        return this.i9ns.pop();
      },
      peek: function() {
        return this.i9ns[this.i9ns.length - 1];
      },
      push: function(i9n) {
        return this.i9ns.push(i9n);
      },
      callStack: function() {
        var item, stack, _i, _len, _ref8;
        stack = [];
        _ref8 = this.i9ns;
        for (_i = 0, _len = _ref8.length; _i < _len; _i++) {
          item = _ref8[_i];
          if (item["this"] instanceof joe.Invocation) {
            stack.push(JStackItem({
              node: item["this"]
            }));
          }
        }
        return stack;
      },
      /* FLOW CONTROL
      */
      "throw": function(name, message) {
        this.error = {
          name: name,
          message: message,
          stack: this.callStack()
        };
        this.state = 'error';
      },
      "return": function(result) {
        this.state = 'return';
        return result;
      },
      wait: function(waitKey) {
        this.waitKey = waitKey;
        this.state = 'wait';
      },
      awaken: function(waitKey) {
        throw new Error("TODO");
      },
      exit: function() {
        if (this.callback != null) {
          return this.callback();
        } else {
          return this.cleanup();
        }
      },
      cleanup: function() {
        var _ref8, _ref9;
        if ((_ref8 = this.input) != null) {
          if (typeof _ref8.close === "function") _ref8.close();
        }
        return (_ref9 = this.output) != null ? typeof _ref9.close === "function" ? _ref9.close() : void 0 : void 0;
      },
      /* ACCESS CONTROL
      */
      will: function(action, obj) {
        return true;
      },
      toString: function() {
        return "[JThread]";
      },
      /* DEBUG
      */
      printStack: function(stack) {
        var i, i9n, i9nCopy, _i, _len, _ref8, _ref9, _results;
        if (stack == null) stack = this.i9ns;
        assert.ok(stack instanceof Array);
        _results = [];
        for (i = _i = 0, _len = stack.length; _i < _len; i = ++_i) {
          i9n = stack[i];
          i9nCopy = Object.clone(i9n);
          delete i9nCopy["this"];
          delete i9nCopy.func;
          _results.push(info("" + (blue(pad({
            right: 12
          }, "" + ((_ref8 = i9n["this"]) != null ? _ref8.constructor.name : void 0)))) + "." + (yellow((_ref9 = i9n.func) != null ? _ref9._name : void 0)) + "($, {" + (white(Object.keys(i9nCopy).join(','))) + "}, _) " + (black(escape(i9n["this"])))));
        }
        return _results;
      },
      printScope: function(scope, lvl) {
        var key, value, valueStr, _ref8;
        if (lvl == null) lvl = 0;
        _ref8 = scope.data;
        for (key in _ref8) {
          value = _ref8[key];
          if (!(key !== '__proto__')) continue;
          try {
            valueStr = value.__str__(this);
          } catch (error) {
            valueStr = "<ERROR IN __STR__: " + error + ">";
          }
          info("" + (black(pad({
            left: 13
          }, lvl))) + (red(key)) + (blue(':')) + " " + valueStr);
        }
        if (scope.data.__proto__ != null) {
          return this.printScope(scope.data.__proto__, lvl + 1);
        }
      },
      jml: function() {
        var args, attributes, elements, key, value;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        attributes = void 0;
        if (args[0] instanceof Object && !(args[0] instanceof JObject)) {
          attributes = args.shift();
        }
        if (args.length === 1 && args[0] instanceof Array) {
          elements = args[0];
        } else {
          elements = args;
        }
        if (attributes != null) {
          for (key in attributes) {
            value = attributes[key];
            elements['' + key] = value;
          }
        }
        return new JArray({
          creator: this.user,
          data: elements
        });
      }
    };
  });

  this.JKernel = JKernel = clazz('JKernel', function() {
    return {
      init: function() {
        this.threads = [];
        this.users = {};
        this.userScopes = {};
        this.index = 0;
        this.ticker = 0;
        return this.login({
          name: 'guest'
        });
      },
      login: function(_arg) {
        var name, password, scope, user;
        name = _arg.name, password = _arg.password;
        user = this.users[name];
        if (user == null) {
          user = new JUser({
            name: name
          });
          this.users[name] = user;
          scope = new JObject({
            creator: user,
            proto: WORLD
          });
          this.userScopes[name] = scope;
        }
        return user;
      },
      run: function(_arg) {
        var callback, code, input, node, output, scope, thread, user;
        user = _arg.user, code = _arg.code, input = _arg.input, output = _arg.output, callback = _arg.callback;
        if (user == null) user = GUEST;
        assert.ok(user != null, "User must be provided.");
        assert.ok(user instanceof JUser, "User not instanceof JUser, got " + (user != null ? user.constructor.name : void 0));
        scope = this.userScopes[user.name];
        assert.ok(scope != null, "Scope missing for user " + user.name);
        try {
          if (typeof code === 'string') {
            if (trace.debug || trace.logCode) info("received code:\n" + code);
            node = require('joeson/src/joescript').parse(code);
            if (trace.debug || trace.logCode) {
              info("unparsed node:\n" + node.serialize());
            }
            node = node.toJSNode({
              toValue: true
            }).installScope().determine();
            if (trace.debug || trace.logCode) {
              info("parsed node:\n" + node.serialize());
            }
          } else {
            assert.ok(code instanceof joe.Node);
            node = code;
          }
          thread = new JThread({
            kernel: this,
            start: node,
            user: user,
            scope: scope,
            input: input,
            output: output,
            callback: callback
          });
          this.threads.push(thread);
          if (this.threads.length === 1) {
            this.index = 0;
            return this.runloop();
          }
        } catch (error) {
          if (node != null) {
            warn("Error in user code start:", error.stack, "\nfor node:\n", node.serialize());
          } else {
            warn("Error parsing code:", error.stack, "\nfor code text:\n", code);
          }
          return output('InternalError:' + error);
        }
      },
      runloop$: function() {
        var exitCode, i, thread, _i, _ref10, _ref11, _ref12, _ref8, _ref9;
        this.ticker++;
        thread = this.threads[this.index];
        if (trace.debug) {
          debug("tick " + this.ticker + ". " + this.threads.length + " threads, try " + thread.id);
        }
        try {
          for (i = _i = 0; _i <= 20; i = ++_i) {
            exitCode = thread.runStep();
            if (exitCode != null) {
              [].splice.apply(this.threads, [(_ref8 = this.index), this.index - _ref8 + 1].concat(_ref9 = [])), _ref9;
              this.index = this.index % this.threads.length;
              if (this.threads.length > 0) process.nextTick(this.runloop);
              thread.exit();
              return;
            }
          }
          this.index = (this.index + 1) % this.threads.length;
          return process.nextTick(this.runloop);
        } catch (error) {
          fatal("Error thrown in runStep. Stopping execution, setting error. stack:\n" + ((_ref10 = error.stack) != null ? _ref10 : error));
          thread["throw"]('InternalError', "" + error.name + ":" + error.message);
          [].splice.apply(this.threads, [(_ref11 = this.index), this.index - _ref11 + 1].concat(_ref12 = [])), _ref12;
          this.index = this.index % this.threads.length;
          if (this.threads.length > 0) process.nextTick(this.runloop);
          thread.exit();
        }
      }
    };
  });

}).call(this);

    return (require['joeson/src/interpreter'] = module.exports);
  };
};
require['joeson/src/interpreter'].nonce = nonce;

require['joeson/src/interpreter/global'] = function() {
  return new function() {
    var exports = require['joeson/src/interpreter/global'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "src/interpreter/global.js";
    (function() {
  var GOD, GUEST, JArray, JNaN, JNull, JObject, JUndefined, JUser, USERS, WORLD, assert, async, black, blue, clazz, cyan, debug, ends, escape, fatal, green, info, inspect, joefn, loadJObject, magenta, nativ, normal, pad, red, saveJObject, starts, warn, white, yellow, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  async = require('async');

  _ref3 = require('joeson/lib/helpers'), pad = _ref3.pad, escape = _ref3.escape, starts = _ref3.starts, ends = _ref3.ends;

  _ref4 = require('nogg').logger(__filename.split('/').last()), debug = _ref4.debug, info = _ref4.info, warn = _ref4.warn, fatal = _ref4.fatal;

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

    return (require['joeson/src/interpreter/global'] = module.exports);
  };
};
require['joeson/src/interpreter/global'].nonce = nonce;

require['joeson/src/interpreter/object'] = function() {
  return new function() {
    var exports = require['joeson/src/interpreter/object'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "src/interpreter/object.js";
    (function() {
  var JAccessControlItem, JArray, JBoundFunc, JNaN, JNull, JObject, JSingleton, JStub, JUndefined, JUser, SimpleIterator, assert, black, blue, clazz, cyan, debug, ends, escape, extend, fatal, green, htmlEscape, info, inspect, isInteger, isVariable, joe, magenta, normal, pad, parse, randid, red, setLast, starts, warn, white, yellow, _ref, _ref2, _ref3, _ref4, _ref5, _ref6,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = Array.prototype.slice,
    _this = this;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  _ref3 = require('joeson/src/joescript'), joe = _ref3.NODES, parse = _ref3.parse;

  _ref4 = require('joeson/lib/helpers'), randid = _ref4.randid, pad = _ref4.pad, htmlEscape = _ref4.htmlEscape, escape = _ref4.escape, starts = _ref4.starts, ends = _ref4.ends;

  _ref5 = require('joeson/src/joescript').HELPERS, extend = _ref5.extend, isVariable = _ref5.isVariable;

  _ref6 = require('nogg').logger(__filename.split('/').last()), debug = _ref6.debug, info = _ref6.info, warn = _ref6.warn, fatal = _ref6.fatal;

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
        return Object.keys(this.data);
      },
      __iter__: function($) {
        $.will('read', this);
        return new SimpleIterator(Object.keys(this.data));
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
            var _ref7, _results;
            _ref7 = this.data;
            _results = [];
            for (key in _ref7) {
              value = _ref7[key];
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
          var _ref7, _results;
          _ref7 = this.data;
          _results = [];
          for (key in _ref7) {
            value = _ref7[key];
            _results.push([key, ':', value.__repr__($)]);
          }
          return _results;
        }).call(this)).weave(', ', {
          flattenItems: true
        })), '}');
      },
      jsValue$: {
        get: function() {
          var key, tmp, value, _ref7;
          tmp = {};
          _ref7 = this.data;
          for (key in _ref7) {
            value = _ref7[key];
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
        var value, _ref7, _ref8;
        $.will('read', this);
        if (isInteger(key)) {
          return (_ref7 = this.data[key]) != null ? _ref7 : JUndefined;
        } else {
          assert.ok(key = typeof key.__key__ === "function" ? key.__key__($) : void 0, "Key couldn't be stringified");
          value = this.data[key];
          if (value != null) return value;
          if (starts(key, '__') && ends(key, '__')) {
            return (_ref8 = this[key]) != null ? _ref8 : JUndefined;
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
        return Object.keys(this.data);
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
            var _ref7, _results;
            _ref7 = this.data;
            _results = [];
            for (key in _ref7) {
              value = _ref7[key];
              _results.push("" + (isInteger(key) ? '' + key : key.__str__($)) + ":" + (value.__str__($, $$)));
            }
            return _results;
          }).call(this)).join(',')) + "]";
        }
      },
      __repr__: function($) {
        var arrayPart, dataPart, item, key, value;
        arrayPart = ((function() {
          var _i, _len, _ref7, _results;
          _ref7 = this.data;
          _results = [];
          for (_i = 0, _len = _ref7.length; _i < _len; _i++) {
            item = _ref7[_i];
            _results.push(item.__repr__($));
          }
          return _results;
        }).call(this)).weave(',');
        dataPart = $.jml(((function() {
          var _ref7, _results;
          _ref7 = this.data;
          _results = [];
          for (key in _ref7) {
            value = _ref7[key];
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
          var key, tmp, value, _ref7;
          tmp = [];
          _ref7 = this.data;
          for (key in _ref7) {
            value = _ref7[key];
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
        var acl, creator, func, id;
        id = _arg.id, creator = _arg.creator, acl = _arg.acl, func = _arg.func, this.scope = _arg.scope;
        this["super"].init.call(this, {
          id: id,
          creator: creator,
          acl: acl
        });
        assert.ok((this.scope === null) || this.scope instanceof JObject, "scope, if present, must be a JObject");
        if (func instanceof joe.Func) {
          return this.func = func;
        } else if (typeof func === 'string') {
          return this._func = func;
        } else {
          throw new Error("funky func");
        }
      },
      func$: {
        get: function() {
          var node, _ref7;
          node = parse(this._func);
          node = node.toJSNode({
            toValue: true
          }).installScope().determine();
          assert.ok(node instanceof joe.Block, "Expected Block at root node, but got " + (node != null ? (_ref7 = node.constructor) != null ? _ref7.name : void 0 : void 0));
          assert.ok(node.lines.length === 1 && node.lines[0] instanceof joe.Func, "Expected one Func");
          return this.func = node.lines[0];
        }
      },
      __str__: function($) {
        return "(<\#" + this.id + ">)";
      },
      __repr__: function($) {
        var dataPart, key, value;
        dataPart = ((function() {
          var _ref7, _results;
          _ref7 = this.data;
          _results = [];
          for (key in _ref7) {
            value = _ref7[key];
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
          var firstLine, length, variable, _i, _len, _ref7;
          $.pop();
          if (this.ownScope != null) {
            _ref7 = this.ownScope.nonparameterVariables;
            for (_i = 0, _len = _ref7.length; _i < _len; _i++) {
              variable = _ref7[_i];
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
          var key, targetObj, type, _ref7;
          i9n.func = joe.Assign.prototype.interpret2;
          $.push({
            "this": this.value,
            func: this.value.interpret
          });
          if (this.target instanceof joe.Index) {
            _ref7 = this.target, targetObj = _ref7.obj, type = _ref7.type, key = _ref7.key;
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
          var length, _ref7, _ref8;
          length = (_ref7 = (_ref8 = this.items) != null ? _ref8.length : void 0) != null ? _ref7 : 0;
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
          var key, value, _ref7;
          if (0 < i9n.idx) i9n.obj.__set__($, i9n.key, i9n.value);
          if (i9n.idx < i9n.length) {
            _ref7 = this.items[i9n.idx], key = _ref7.key, value = _ref7.value;
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
          var length, _ref7, _ref8;
          length = (_ref7 = (_ref8 = this.items) != null ? _ref8.length : void 0) != null ? _ref7 : 0;
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
            value = this.items[i9n.idx].value;
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
          var key, targetObj, _ref7, _ref8;
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
            if (this.left instanceof joe.Index && ((_ref7 = this.op) === '--' || _ref7 === '++')) {
              _ref8 = this.left, targetObj = _ref8.obj, key = _ref8.key;
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
          var _ref7;
          if (i9n.setSource != null) i9n.setSource.source = obj;
          if (this.type === '.') {
            assert.ok(this.key instanceof joe.Word, "Unexpected key of type " + ((_ref7 = this.key) != null ? _ref7.constructor.name : void 0));
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
          var i, param, _i, _len, _ref7;
          if (!(func instanceof JBoundFunc || func instanceof Function)) {
            return $["throw"]('TypeError', "" + this.func + " cannot be called.");
          }
          i9n.invokedFunction = func;
          i9n.paramValues = [];
          _ref7 = this.params;
          for (i = _i = 0, _len = _ref7.length; _i < _len; i = ++_i) {
            param = _ref7[i];
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
          var argName, block, i, paramValues, params, scope, _i, _len, _ref10, _ref11, _ref12, _ref7, _ref8, _ref9;
          i9n.func = joe.Invocation.prototype.interpretFinal;
          if (i9n.invokedFunction instanceof JBoundFunc) {
            i9n.oldScope = $.scope;
            _ref7 = i9n.invokedFunction, (_ref8 = _ref7.func, block = _ref8.block, params = _ref8.params), scope = _ref7.scope;
            paramValues = i9n.paramValues;
            if (i9n.source != null) {
              if (scope != null) {
                $.scope = scope.__create__($, {
                  "this": i9n.source
                });
              } else {
                $.scope = new JObject({
                  creator: $.user,
                  data: {
                    "this": i9n.source
                  }
                });
              }
            } else {
              if (scope != null) {
                $.scope = scope.__create__($);
              } else {
                $.scope = new JObject({
                  creator: $.user
                });
              }
            }
            if (params != null) {
              assert.ok(params instanceof joe.AssignList);
              _ref9 = params.items;
              for (i = _i = 0, _len = _ref9.length; _i < _len; i = ++_i) {
                argName = _ref9[i].target;
                assert.ok(isVariable(argName, "Expected variable but got " + argName + " (" + (argName != null ? argName.constructor.name : void 0) + ")"));
                $.scope.__set__($, argName, (_ref10 = paramValues[i]) != null ? _ref10 : JUndefined);
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
              return $["throw"]((_ref11 = error != null ? error.name : void 0) != null ? _ref11 : 'UnknownError', (_ref12 = error != null ? error.message : void 0) != null ? _ref12 : '' + error);
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
          var array, x, _i, _j, _ref10, _ref7, _ref8, _ref9, _results, _results2;
          $.pop();
          if (i9n.by != null) {
            if (this.type === '..') {
              array = (function() {
                var _i, _ref7, _ref8, _ref9, _results;
                _results = [];
                for (x = _i = _ref7 = i9n.start, _ref8 = i9n.end, _ref9 = i9n.by; _ref7 <= _ref8 ? _i <= _ref8 : _i >= _ref8; x = _i += _ref9) {
                  _results.push(x);
                }
                return _results;
              })();
            } else {
              array = (function() {
                var _i, _ref7, _ref8, _ref9, _results;
                _results = [];
                for (x = _i = _ref7 = i9n.start, _ref8 = i9n.end, _ref9 = i9n.by; _ref7 <= _ref8 ? _i < _ref8 : _i > _ref8; x = _i += _ref9) {
                  _results.push(x);
                }
                return _results;
              })();
            }
          } else {
            if (this.type === '..') {
              array = (function() {
                _results = [];
                for (var _i = _ref7 = i9n.start, _ref8 = i9n.end; _ref7 <= _ref8 ? _i <= _ref8 : _i >= _ref8; _ref7 <= _ref8 ? _i++ : _i--){ _results.push(_i); }
                return _results;
              }).apply(this);
            } else {
              array = (function() {
                _results2 = [];
                for (var _j = _ref9 = i9n.start, _ref10 = i9n.end; _ref9 <= _ref10 ? _j < _ref10 : _j > _ref10; _ref9 <= _ref10 ? _j++ : _j--){ _results2.push(_j); }
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
          var name, _ref7;
          name = (_ref7 = this.name) != null ? _ref7 : this._name;
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

    return (require['joeson/src/interpreter/object'] = module.exports);
  };
};
require['joeson/src/interpreter/object'].nonce = nonce;

require['joeson/src/interpreter/persistence'] = function() {
  return new function() {
    var exports = require['joeson/src/interpreter/persistence'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "src/interpreter/persistence.js";
    (function() {
  var GLOBALS, JArray, JBoundFunc, JNaN, JNull, JObject, JStub, JUndefined, JUser, NATIVE_FUNCTIONS, OBJECTS, assert, async, black, blue, clazz, client, cyan, debug, ends, escape, fatal, getClient, getOrStub, green, info, inspect, joefn, key, loadJObject, magenta, nativ, normal, pad, red, saveJObject, saveJObjectItem, starts, value, warn, white, yellow, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  async = require('async');

  _ref3 = require('joeson/lib/helpers'), pad = _ref3.pad, escape = _ref3.escape, starts = _ref3.starts, ends = _ref3.ends;

  _ref4 = require('nogg').logger(__filename.split('/').last()), debug = _ref4.debug, info = _ref4.info, warn = _ref4.warn, fatal = _ref4.fatal;

  _ref5 = require('joeson/src/interpreter'), (_ref6 = _ref5.JTypes, JObject = _ref6.JObject, JArray = _ref6.JArray, JUser = _ref6.JUser, JUndefined = _ref6.JUndefined, JNull = _ref6.JNull, JNaN = _ref6.JNaN, JBoundFunc = _ref6.JBoundFunc, JStub = _ref6.JStub), GLOBALS = _ref5.GLOBALS;

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

  joefn = this.joefn = function(id, creator, fCode) {
    assert.ok(id != null, "joefn wants an id");
    console.log("joefn with code " + fCode);
    return new JBoundFunc({
      id: id,
      creator: creator,
      func: fCode,
      scope: null
    });
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

  for (key in GLOBALS) {
    value = GLOBALS[key];
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
      dataKeys = Object.keys(jobj.data);
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

    return (require['joeson/src/interpreter/persistence'] = module.exports);
  };
};
require['joeson/src/interpreter/persistence'].nonce = nonce;

require['joeson/src/translators/javascript'] = function() {
  return new function() {
    var exports = require['joeson/src/translators/javascript'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "src/translators/javascript.js";
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
            params: [this.block]
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
          return js(p);
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

    return (require['joeson/src/translators/javascript'] = module.exports);
  };
};
require['joeson/src/translators/javascript'].nonce = nonce;

require['joeson/src/translators/scope'] = function() {
  return new function() {
    var exports = require['joeson/src/translators/scope'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "src/translators/scope.js";
    (function() {
  var LScope, assert, black, blue, clazz, cyan, extend, green, inspect, isVariable, isWord, joe, magenta, normal, randid, red, white, yellow, _ref, _ref2, _ref3,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  joe = require('joeson/src/joescript').NODES;

  _ref3 = require('joeson/src/joescript').HELPERS, extend = _ref3.extend, isWord = _ref3.isWord, isVariable = _ref3.isVariable;

  randid = require('joeson/lib/helpers').randid;

  this.LScope = LScope = clazz('LScope', function() {
    return {
      init: function(parent) {
        Object.defineProperty(this, 'parent', {
          value: parent,
          enumerable: false
        });
        this.variables = [];
        this.parameters = [];
        this.children = [];
        if (this.parent != null) return this.parent.children.push(this);
      },
      declares: function(name) {
        if (!(name instanceof joe.Undetermined)) name = '' + name;
        return __indexOf.call(this.variables, name) >= 0;
      },
      isDeclared: function(name) {
        var _ref4;
        if (!(name instanceof joe.Undetermined)) name = '' + name;
        if (__indexOf.call(this.variables, name) >= 0) return true;
        if ((_ref4 = this.parent) != null ? _ref4.isDeclared(name) : void 0) {
          return true;
        }
        return false;
      },
      willDeclare: function(name) {
        if (!(name instanceof joe.Undetermined)) name = '' + name;
        if (__indexOf.call(this.variables, name) >= 0) return true;
        if (this.children.some(function(child) {
          return child.willDeclare(name);
        })) {
          return true;
        }
        return false;
      },
      ensureVariable: function(name) {
        if (!(name instanceof joe.Undetermined)) name = '' + name;
        if (!this.isDeclared(name)) return this.variables.push(name);
      },
      declareVariable: function(name, isParameter) {
        if (isParameter == null) isParameter = false;
        if (!(name instanceof joe.Undetermined)) name = '' + name;
        if (__indexOf.call(this.variables, name) < 0) this.variables.push(name);
        if (!(isParameter ? __indexOf.call(this.parameters, name) >= 0 : void 0)) {
          return this.parameters.push(name);
        }
      },
      nonparameterVariables$: {
        get: function() {
          return this.variables.subtract(this.parameters);
        }
      }
    };
  });

  this.install = function() {
    var init;
    if (joe.Node.prototype.installScope != null) return;
    init = function(node, options) {
      var _ref4;
      if (options.create || !(options.parent != null)) {
        return node.scope = node.ownScope = new LScope((_ref4 = options.parent) != null ? _ref4.scope : void 0);
      } else {
        return node.scope = options.parent.scope;
      }
    };
    joe.Node.prototype.extend({
      installScope: function(options) {
        if (options == null) options = {};
        init(this, options);
        this.withChildren(function(child, parent) {
          return typeof child.installScope === "function" ? child.installScope({
            create: false,
            parent: parent
          }) : void 0;
        });
        return this;
      },
      determine: function() {
        var that;
        that = this;
        this.withChildren(function(child, parent, key, desc, index) {
          if (child instanceof joe.Undetermined) {
            child.determine();
            if (index != null) {
              return that[key][index] = child.word;
            } else {
              return that[key] = child.word;
            }
          } else if (child instanceof joe.Node) {
            return child.determine();
          }
        });
        return this;
      }
    });
    joe.Try.prototype.extend({
      installScope: function(options) {
        if (options == null) options = {};
        init(this, options);
        if ((this.catchVar != null) && (this.catchBlock != null)) {
          this.catchBlock.installScope({
            create: true,
            parent: this
          });
        }
        if (this.catchVar != null) {
          this.catchBlock.scope.declareVariable(this.catchVar);
        }
        this.withChildren(function(child, parent, key) {
          if (key !== 'catchBlock') {
            return typeof child.installScope === "function" ? child.installScope({
              create: false,
              parent: parent
            }) : void 0;
          }
        });
        return this;
      }
    });
    joe.Func.prototype.extend({
      installScope: function(options) {
        var name, _i, _len, _ref4, _ref5;
        if (options == null) options = {};
        init(this, options);
        if (this.block != null) {
          this.block.installScope({
            create: true,
            parent: this
          });
        }
        _ref5 = ((_ref4 = this.params) != null ? _ref4.targetNames : void 0) || [];
        for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
          name = _ref5[_i];
          this.block.scope.declareVariable(name, true);
        }
        this.withChildren(function(child, parent, key) {
          if (key !== 'block') {
            return typeof child.installScope === "function" ? child.installScope({
              create: false,
              parent: parent
            }) : void 0;
          }
        });
        return this;
      }
    });
    joe.Assign.prototype.extend({
      installScope: function(options) {
        if (options == null) options = {};
        init(this, options);
        if (isVariable(this.target)) this.scope.ensureVariable(this.target);
        this.withChildren(function(child, parent) {
          return typeof child.installScope === "function" ? child.installScope({
            create: false,
            parent: parent
          }) : void 0;
        });
        return this;
      }
    });
    return joe.Undetermined.prototype.extend({
      determine: function() {
        var word;
        if (this.word != null) return;
        assert.ok(this.scope != null, "Scope must be available to determine an Undetermined");
        while (true) {
          word = this.prefix + '_' + randid(4);
          if (!this.scope.isDeclared(word) && !this.scope.willDeclare(word)) {
            return this.word = joe.Word(word);
          }
        }
      }
    });
  };

}).call(this);

    return (require['joeson/src/translators/scope'] = module.exports);
  };
};
require['joeson/src/translators/scope'].nonce = nonce;

require['joeson/src/client'] = function() {
  return new function() {
    var exports = require['joeson/src/client'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "src/client/index.js";
    (function() {
  var GOD, GUEST, JKernel, KERNEL, WORLD, clazz, debug, domLog, fatal, info, randid, toHTML, warn, _ref, _ref2;

  this.require = require;

  clazz = require('cardamom').clazz;

  randid = require('joeson/lib/helpers').randid;

  toHTML = require('joeson/src/parsers/ansi').toHTML;

  _ref = require('nogg').logger(__filename.split('/').last()), debug = _ref.debug, info = _ref.info, warn = _ref.warn, fatal = _ref.fatal;

  domLog = window.domLog = $('<pre/>');

  require('nogg').configure({
    "default": {
      file: {
        write: function(line) {
          return domLog.append(toHTML(line));
        }
      },
      level: 'debug'
    }
  });

  _ref2 = require('joeson/src/interpreter'), GOD = _ref2.GOD, WORLD = _ref2.WORLD, GUEST = _ref2.GUEST, JKernel = _ref2.JKernel;

  KERNEL = new JKernel;

  $(document).ready(function() {
    var marqueeLevel;
    $(document.body).append(domLog);
    console.log("booting...");
    marqueeLevel = 0;
    setInterval((function() {
      var m4Off, m4On;
      m4Off = marqueeLevel % 4;
      $(".marq" + m4Off + "m4").css({
        opacity: 1
      });
      m4On = (++marqueeLevel) % 4;
      return $(".marq" + m4On + "m4").css({
        opacity: 0.7
      });
    }), 300);
    return KERNEL.run({
      user: GUEST,
      code: 'login()',
      output: void 0,
      callback: function() {
        var stackTrace, _ref3, _ref4, _ref5, _ref6;
        switch (this.state) {
          case 'return':
            info(this.last.__str__(this));
            break;
          case 'error':
            if (this.error.stack.length) {
              stackTrace = this.error.stack.map(function(x) {
                return '  at ' + x;
              }).join('\n');
              warn("" + ((_ref3 = this.error.name) != null ? _ref3 : 'UnknownError') + ": " + ((_ref4 = this.error.message) != null ? _ref4 : '') + "\n  Most recent call last:\n" + stackTrace);
            } else {
              warn("" + ((_ref5 = this.error.name) != null ? _ref5 : 'UnknownError') + ": " + ((_ref6 = this.error.message) != null ? _ref6 : ''));
            }
            break;
          default:
            throw new Error("Unexpected state " + this.state + " during kernel callback");
        }
        return this.cleanup();
      }
    });
  });

  /*
  
    # connect to client.
    #window.client = client = new Client()
    # click page to focus
    #$(document).click -> client.mirror.focus()
  
  
  outBoxHtml = """
  <div class='outbox'>
    <div class='outbox-gutter'>
      <div class='outbox-gutter-text'>→ </div>
    </div>
    <div class='outbox-lines'><span class='marq2m4'>.</span><span class='marq1m4 marq3m4'>.</span><span class='marq0m4'>.</span></div>
  </div>
  """
  
  # replace all tabs with spaces
  tabSize = 2
  tabCache = (Array(x+1).join(' ') for x in [0..tabSize])
  replaceTabs = (str) ->
    accum = []
    lines = str.split '\n'
    for line, i1 in lines
      parts = line.split('\t')
      col = 0
      for part, i2 in parts
        col += part.length
        accum.push part
        if i2 < parts.length-1
          insertWs = tabSize - col%tabSize
          col += insertWs
          accum.push tabCache[insertWs]
      if i1 < lines.length-1
        accum.push '\n'
    return accum.join ''
  
  Client = clazz 'Client', ->
    init: ->
      @threads = {}
      @mirror = @makeMirror()
      # connect
      @socket = io.connect()
      @socket.on 'output', @onOutput
      console.log "Client socket:", @socket
      # run help()
      @start code:'help()'
  
    makeMirror: ->
      # Setup CodeMirror instance.
      mirror = CodeMirror document.body,
        value:      ''
        mode:       'coffeescript'
        theme:      'joeson'
        keyMap:     'vim'
        autofocus:  yes
        gutter:     yes
        fixedGutter:yes
        tabSize:    2
      # Sanitization.
      mirror.sanitize = ->
        cursor = mirror.getCursor()
        tabReplaced = replaceTabs orig=mirror.getValue()
        mirror.setValue tabReplaced
        mirror.setCursor cursor
        return tabReplaced
      # Gutter
      mirror.setMarker 0, '● ', 'cm-bracket'
      # Blah
      $(mirror.getWrapperElement()).addClass 'active'
      # Events
      mirror.submit = @onSave
      return mirror
  
    start: ({code}) ->
      threadId = randid()
      @makeOutputForThread(threadId)
      @socket.emit 'start', code:code, threadId:threadId
  
    onSave$: ->
      value = @mirror.sanitize()
      return if value.trim().length is 0
      # Clone the current mirror and prepare
      mirrorElement = $(@mirror.getWrapperElement())
      cloned = mirrorElement.clone no
      cloned.removeClass 'active'
      cloned.find('.CodeMirror-cursor, .CodeMirror-scrollbar, textarea').remove()
      thing = cloned.find('.CodeMirror-lines>div:first>div:first')
      if thing.css('visibility') is 'hidden'
        thing.remove()
      else
        console.log "where'd that thing go?"
      @append cloned
      @start code:value
  
    onOutput$: ({command, html, threadId}) ->
      {output} = @threads[threadId]
      switch command
        when 'close'
          @close output:output
        when undefined
          @write output:output, html:html
        else
          throw new Error "Unexpected command #{command}"
  
    write: ({html, output}) ->
      unless output.data('initialized')
        output.data('initialized', yes)
        output.empty()
      output.append $('<span/>').html(html)
      # hack
      window.scroll 0, document.body.offsetHeight
  
    close: ({output}) ->
      unless output.data('initialized')
        output.data('initialized', yes)
        output.empty()
  
    makeOutputForThread: (threadId) ->
      # Insert response box
      outputBox = $(outBoxHtml)
      @append outputBox
      @threads[threadId] = output:outputBox.find '.outbox-lines'
      # Scroll to bottom.
      window.scroll(0, document.body.offsetHeight)
  
    append: (elem) ->
      mirrorElement = $(@mirror.getWrapperElement())
      mirrorElement.before elem
  */

}).call(this);

    return (require['joeson/src/client'] = module.exports);
  };
};
require['joeson/src/client'].nonce = nonce;

require['joeson/src/parsers/ansi'] = function() {
  return new function() {
    var exports = require['joeson/src/parsers/ansi'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "src/parsers/ansi.js";
    (function() {
  var ANSI, Grammar, colors, htmlEscape;

  Grammar = require('joeson').Grammar;

  htmlEscape = require('joeson/lib/helpers').htmlEscape;

  colors = {
    30: '#000000',
    31: '#e6312a',
    32: '#00cc00',
    33: '#cccc00',
    34: '#668ee2',
    35: '#f062e7',
    36: '#00cccc',
    37: '#ffffff'
  };

  ANSI = Grammar(function(_arg) {
    var i, make, o, tokens;
    o = _arg.o, i = _arg.i, tokens = _arg.tokens, make = _arg.make;
    return [
      o({
        ANY: " ( NORMAL | STYLED )* "
      }, function(it) {
        return it.join('');
      }), i({
        NORMAL: " ( !ESCAPE . )+ "
      }, function(it) {
        return htmlEscape(it.join(''));
      }), i({
        STYLED: " !END ESCAPE ( sgr:INT ';' )? color:INT 'm' any:ANY END "
      }, function(_arg2) {
        var any, color, sgr, _ref;
        sgr = _arg2.sgr, color = _arg2.color, any = _arg2.any;
        return "<span style='color:" + ((_ref = colors[color]) != null ? _ref : 'white') + "'>" + any + "</span>";
      }), i({
        ESCAPE: " '\x1b[' "
      }), i({
        END: " '\x1b[0m' "
      }), i({
        '.': " /[\\s\\S]/ "
      }), i({
        INT: " /[0-9]+/ "
      }, function(it) {
        return new Number(it);
      })
    ];
  });

  this.toHTML = ANSI.parse;

}).call(this);

    return (require['joeson/src/parsers/ansi'] = module.exports);
  };
};
require['joeson/src/parsers/ansi'].nonce = nonce;

require['joeson/lib/helpers'] = function() {
  return new function() {
    var exports = require['joeson/lib/helpers'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "lib/helpers.js";
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
    return ('' + str).replace(/\\/g, '\\\\').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/'/g, "\\'");
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

    return (require['joeson/lib/helpers'] = module.exports);
  };
};
require['joeson/lib/helpers'].nonce = nonce;

require['_process'] = function() {
  return new function() {
    var exports = require['_process'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/browserify/builtins/__browserify_process.js";
    var process = module.exports = {};

process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

process.stderr = process.stdout = require('fs').createWriteStream('stdout.log', {flags: 'a', mode: 0666});
//process.stderr = require('fs').createWriteStream('stderr.log', {flags: 'a', mode: 0666});

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

    return (require['_process'] = module.exports);
  };
};
require['_process'].nonce = nonce;

require['assert'] = function() {
  return new function() {
    var exports = require['assert'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/browserify/builtins/assert.js";
    // UTILITY
var util = require('util');
var Buffer = require("buffer").Buffer;
var pSlice = Array.prototype.slice;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.message = options.message;
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
};
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (value === undefined) {
    return '' + value;
  }
  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (typeof value === 'function' || value instanceof RegExp) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (typeof s == 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

assert.AssertionError.prototype.toString = function() {
  if (this.message) {
    return [this.name + ':', this.message].join(' ');
  } else {
    return [
      this.name + ':',
      truncate(JSON.stringify(this.actual, replacer), 128),
      this.operator,
      truncate(JSON.stringify(this.expected, replacer), 128)
    ].join(' ');
  }
};

// assert.AssertionError instanceof Error

assert.AssertionError.__proto__ = Error.prototype;

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!!!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = Object.keys(a),
        kb = Object.keys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (expected instanceof RegExp) {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail('Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail('Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

    return (require['assert'] = module.exports);
  };
};
require['assert'].nonce = nonce;

require['util'] = function() {
  return new function() {
    var exports = require['util'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/browserify/builtins/util.js";
    var events = require('events');

exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

    return (require['util'] = module.exports);
  };
};
require['util'].nonce = nonce;

require['events'] = function() {
  return new function() {
    var exports = require['events'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/browserify/builtins/events.js";
    if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

    return (require['events'] = module.exports);
  };
};
require['events'].nonce = nonce;

require['buffer'] = function() {
  return new function() {
    var exports = require['buffer'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/browserify/builtins/buffer.js";
    function SlowBuffer (size) {
    this.length = size;
};

var assert = require('assert');

exports.INSPECT_MAX_BYTES = 50;


function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}


SlowBuffer.prototype.inspect = function() {
  var out = [],
      len = this.length;
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }
  return '<SlowBuffer ' + out.join(' ') + '>';
};


SlowBuffer.prototype.hexSlice = function(start, end) {
  var len = this.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; i++) {
    out += toHex(this[i]);
  }
  return out;
};


SlowBuffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();
  start = +start || 0;
  if (typeof end == 'undefined') end = this.length;

  // Fastpath empty strings
  if (+end == start) {
    return '';
  }

  switch (encoding) {
    case 'hex':
      return this.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.utf8Slice(start, end);

    case 'ascii':
      return this.asciiSlice(start, end);

    case 'binary':
      return this.binarySlice(start, end);

    case 'base64':
      return this.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


SlowBuffer.prototype.hexWrite = function(string, offset, length) {
  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2) {
    throw new Error('Invalid hex string');
  }
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(byte)) throw new Error('Invalid hex string');
    this[offset + i] = byte;
  }
  SlowBuffer._charsWritten = i * 2;
  return i;
};


SlowBuffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  switch (encoding) {
    case 'hex':
      return this.hexWrite(string, offset, length);

    case 'utf8':
    case 'utf-8':
      return this.utf8Write(string, offset, length);

    case 'ascii':
      return this.asciiWrite(string, offset, length);

    case 'binary':
      return this.binaryWrite(string, offset, length);

    case 'base64':
      return this.base64Write(string, offset, length);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Write(string, offset, length);

    default:
      throw new Error('Unknown encoding');
  }
};


// slice(start, end)
SlowBuffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;

  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  return new Buffer(this, end - start, +start);
};


function coerce(length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length);
  return length < 0 ? 0 : length;
}


// Buffer

function Buffer(subject, encoding, offset) {
  if (!(this instanceof Buffer)) {
    return new Buffer(subject, encoding, offset);
  }

  var type;

  // Are we slicing?
  if (typeof offset === 'number') {
    this.length = coerce(encoding);
    this.parent = subject;
    this.offset = offset;
  } else {
    // Find the length
    switch (type = typeof subject) {
      case 'number':
        this.length = coerce(subject);
        break;

      case 'string':
        this.length = Buffer.byteLength(subject, encoding);
        break;

      case 'object': // Assume object is an array
        this.length = coerce(subject.length);
        break;

      default:
        throw new Error('First argument needs to be a number, ' +
                        'array or string.');
    }

    if (this.length > Buffer.poolSize) {
      // Big buffer, just alloc one.
      this.parent = new SlowBuffer(this.length);
      this.offset = 0;

    } else {
      // Small buffer.
      if (!pool || pool.length - pool.used < this.length) allocPool();
      this.parent = pool;
      this.offset = pool.used;
      pool.used += this.length;
    }

    // Treat array-ish objects as a byte array.
    if (isArrayIsh(subject)) {
      for (var i = 0; i < this.length; i++) {
        this.parent[i + this.offset] = subject[i];
      }
    } else if (type == 'string') {
      // We are a string
      this.length = this.write(subject, 0, encoding);
    }
  }

}

function isArrayIsh(subject) {
  return Array.isArray(subject) || Buffer.isBuffer(subject) ||
         subject && typeof subject === 'object' &&
         typeof subject.length === 'number';
}

exports.SlowBuffer = SlowBuffer;
exports.Buffer = Buffer;

Buffer.poolSize = 8 * 1024;
var pool;

function allocPool() {
  pool = new SlowBuffer(Buffer.poolSize);
  pool.used = 0;
}


// Static methods
Buffer.isBuffer = function isBuffer(b) {
  return b instanceof Buffer || b instanceof SlowBuffer;
};


// Inspect
Buffer.prototype.inspect = function inspect() {
  var out = [],
      len = this.length;

  for (var i = 0; i < len; i++) {
    out[i] = toHex(this.parent[i + this.offset]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }

  return '<Buffer ' + out.join(' ') + '>';
};


Buffer.prototype.get = function get(i) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i];
};


Buffer.prototype.set = function set(i, v) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i] = v;
};


// write(string, offset = 0, length = buffer.length-offset, encoding = 'utf8')
Buffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  var ret;
  switch (encoding) {
    case 'hex':
      ret = this.parent.hexWrite(string, this.offset + offset, length);
      break;

    case 'utf8':
    case 'utf-8':
      ret = this.parent.utf8Write(string, this.offset + offset, length);
      break;

    case 'ascii':
      ret = this.parent.asciiWrite(string, this.offset + offset, length);
      break;

    case 'binary':
      ret = this.parent.binaryWrite(string, this.offset + offset, length);
      break;

    case 'base64':
      // Warning: maxLength not taken into account in base64Write
      ret = this.parent.base64Write(string, this.offset + offset, length);
      break;

    case 'ucs2':
    case 'ucs-2':
      ret = this.parent.ucs2Write(string, this.offset + offset, length);
      break;

    default:
      throw new Error('Unknown encoding');
  }

  Buffer._charsWritten = SlowBuffer._charsWritten;

  return ret;
};


// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();

  if (typeof start == 'undefined' || start < 0) {
    start = 0;
  } else if (start > this.length) {
    start = this.length;
  }

  if (typeof end == 'undefined' || end > this.length) {
    end = this.length;
  } else if (end < 0) {
    end = 0;
  }

  start = start + this.offset;
  end = end + this.offset;

  switch (encoding) {
    case 'hex':
      return this.parent.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.parent.utf8Slice(start, end);

    case 'ascii':
      return this.parent.asciiSlice(start, end);

    case 'binary':
      return this.parent.binarySlice(start, end);

    case 'base64':
      return this.parent.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.parent.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


// byteLength
Buffer.byteLength = SlowBuffer.byteLength;


// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill(value, start, end) {
  value || (value = 0);
  start || (start = 0);
  end || (end = this.length);

  if (typeof value === 'string') {
    value = value.charCodeAt(0);
  }
  if (!(typeof value === 'number') || isNaN(value)) {
    throw new Error('value is not a number');
  }

  if (end < start) throw new Error('end < start');

  // Fill 0 bytes; we're done
  if (end === start) return 0;
  if (this.length == 0) return 0;

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds');
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds');
  }

  return this.parent.fill(value,
                          start + this.offset,
                          end + this.offset);
};


// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function(target, target_start, start, end) {
  var source = this;
  start || (start = 0);
  end || (end = this.length);
  target_start || (target_start = 0);

  if (end < start) throw new Error('sourceEnd < sourceStart');

  // Copy 0 bytes; we're done
  if (end === start) return 0;
  if (target.length == 0 || source.length == 0) return 0;

  if (target_start < 0 || target_start >= target.length) {
    throw new Error('targetStart out of bounds');
  }

  if (start < 0 || start >= source.length) {
    throw new Error('sourceStart out of bounds');
  }

  if (end < 0 || end > source.length) {
    throw new Error('sourceEnd out of bounds');
  }

  // Are we oob?
  if (end > this.length) {
    end = this.length;
  }

  if (target.length - target_start < end - start) {
    end = target.length - target_start + start;
  }

  return this.parent.copy(target.parent,
                          target_start + target.offset,
                          start + this.offset,
                          end + this.offset);
};


// slice(start, end)
Buffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;
  if (end > this.length) throw new Error('oob');
  if (start > end) throw new Error('oob');

  return new Buffer(this.parent, end - start, +start + this.offset);
};


// Legacy methods for backwards compatibility.

Buffer.prototype.utf8Slice = function(start, end) {
  return this.toString('utf8', start, end);
};

Buffer.prototype.binarySlice = function(start, end) {
  return this.toString('binary', start, end);
};

Buffer.prototype.asciiSlice = function(start, end) {
  return this.toString('ascii', start, end);
};

Buffer.prototype.utf8Write = function(string, offset) {
  return this.write(string, offset, 'utf8');
};

Buffer.prototype.binaryWrite = function(string, offset) {
  return this.write(string, offset, 'binary');
};

Buffer.prototype.asciiWrite = function(string, offset) {
  return this.write(string, offset, 'ascii');
};

Buffer.prototype.readUInt8 = function(offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  return buffer[offset];
};

function readUInt16(buffer, offset, isBigEndian, noAssert) {
  var val = 0;


  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (isBigEndian) {
    val = buffer[offset] << 8;
    val |= buffer[offset + 1];
  } else {
    val = buffer[offset];
    val |= buffer[offset + 1] << 8;
  }

  return val;
}

Buffer.prototype.readUInt16LE = function(offset, noAssert) {
  return readUInt16(this, offset, false, noAssert);
};

Buffer.prototype.readUInt16BE = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};

function readUInt32(buffer, offset, isBigEndian, noAssert) {
  var val = 0;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (isBigEndian) {
    val = buffer[offset + 1] << 16;
    val |= buffer[offset + 2] << 8;
    val |= buffer[offset + 3];
    val = val + (buffer[offset] << 24 >>> 0);
  } else {
    val = buffer[offset + 2] << 16;
    val |= buffer[offset + 1] << 8;
    val |= buffer[offset];
    val = val + (buffer[offset + 3] << 24 >>> 0);
  }

  return val;
}

Buffer.prototype.readUInt32LE = function(offset, noAssert) {
  return readUInt32(this, offset, false, noAssert);
};

Buffer.prototype.readUInt32BE = function(offset, noAssert) {
  return readUInt32(this, offset, true, noAssert);
};


/*
 * Signed integer types, yay team! A reminder on how two's complement actually
 * works. The first bit is the signed bit, i.e. tells us whether or not the
 * number should be positive or negative. If the two's complement value is
 * positive, then we're done, as it's equivalent to the unsigned representation.
 *
 * Now if the number is positive, you're pretty much done, you can just leverage
 * the unsigned translations and return those. Unfortunately, negative numbers
 * aren't quite that straightforward.
 *
 * At first glance, one might be inclined to use the traditional formula to
 * translate binary numbers between the positive and negative values in two's
 * complement. (Though it doesn't quite work for the most negative value)
 * Mainly:
 *  - invert all the bits
 *  - add one to the result
 *
 * Of course, this doesn't quite work in Javascript. Take for example the value
 * of -128. This could be represented in 16 bits (big-endian) as 0xff80. But of
 * course, Javascript will do the following:
 *
 * > ~0xff80
 * -65409
 *
 * Whoh there, Javascript, that's not quite right. But wait, according to
 * Javascript that's perfectly correct. When Javascript ends up seeing the
 * constant 0xff80, it has no notion that it is actually a signed number. It
 * assumes that we've input the unsigned value 0xff80. Thus, when it does the
 * binary negation, it casts it into a signed value, (positive 0xff80). Then
 * when you perform binary negation on that, it turns it into a negative number.
 *
 * Instead, we're going to have to use the following general formula, that works
 * in a rather Javascript friendly way. I'm glad we don't support this kind of
 * weird numbering scheme in the kernel.
 *
 * (BIT-MAX - (unsigned)val + 1) * -1
 *
 * The astute observer, may think that this doesn't make sense for 8-bit numbers
 * (really it isn't necessary for them). However, when you get 16-bit numbers,
 * you do. Let's go back to our prior example and see how this will look:
 *
 * (0xffff - 0xff80 + 1) * -1
 * (0x007f + 1) * -1
 * (0x0080) * -1
 */
Buffer.prototype.readInt8 = function(offset, noAssert) {
  var buffer = this;
  var neg;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  neg = buffer[offset] & 0x80;
  if (!neg) {
    return (buffer[offset]);
  }

  return ((0xff - buffer[offset] + 1) * -1);
};

function readInt16(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt16(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x8000;
  if (!neg) {
    return val;
  }

  return (0xffff - val + 1) * -1;
}

Buffer.prototype.readInt16LE = function(offset, noAssert) {
  return readInt16(this, offset, false, noAssert);
};

Buffer.prototype.readInt16BE = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};

function readInt32(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt32(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x80000000;
  if (!neg) {
    return (val);
  }

  return (0xffffffff - val + 1) * -1;
}

Buffer.prototype.readInt32LE = function(offset, noAssert) {
  return readInt32(this, offset, false, noAssert);
};

Buffer.prototype.readInt32BE = function(offset, noAssert) {
  return readInt32(this, offset, true, noAssert);
};

function readFloat(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.readFloatLE = function(offset, noAssert) {
  return readFloat(this, offset, false, noAssert);
};

Buffer.prototype.readFloatBE = function(offset, noAssert) {
  return readFloat(this, offset, true, noAssert);
};

function readDouble(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 7 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.readDoubleLE = function(offset, noAssert) {
  return readDouble(this, offset, false, noAssert);
};

Buffer.prototype.readDoubleBE = function(offset, noAssert) {
  return readDouble(this, offset, true, noAssert);
};


/*
 * We have to make sure that the value is a valid integer. This means that it is
 * non-negative. It has no fractional component and that it does not exceed the
 * maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint(value, max) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value >= 0,
      'specified a negative value for writing an unsigned value');

  assert.ok(value <= max, 'value is larger than maximum value for type');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xff);
  }

  buffer[offset] = value;
};

function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffff);
  }

  if (isBigEndian) {
    buffer[offset] = (value & 0xff00) >>> 8;
    buffer[offset + 1] = value & 0x00ff;
  } else {
    buffer[offset + 1] = (value & 0xff00) >>> 8;
    buffer[offset] = value & 0x00ff;
  }
}

Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, true, noAssert);
};

function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffffffff);
  }

  if (isBigEndian) {
    buffer[offset] = (value >>> 24) & 0xff;
    buffer[offset + 1] = (value >>> 16) & 0xff;
    buffer[offset + 2] = (value >>> 8) & 0xff;
    buffer[offset + 3] = value & 0xff;
  } else {
    buffer[offset + 3] = (value >>> 24) & 0xff;
    buffer[offset + 2] = (value >>> 16) & 0xff;
    buffer[offset + 1] = (value >>> 8) & 0xff;
    buffer[offset] = value & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, true, noAssert);
};


/*
 * We now move onto our friends in the signed number category. Unlike unsigned
 * numbers, we're going to have to worry a bit more about how we put values into
 * arrays. Since we are only worrying about signed 32-bit values, we're in
 * slightly better shape. Unfortunately, we really can't do our favorite binary
 * & in this system. It really seems to do the wrong thing. For example:
 *
 * > -32 & 0xff
 * 224
 *
 * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of
 * this aren't treated as a signed number. Ultimately a bad thing.
 *
 * What we're going to want to do is basically create the unsigned equivalent of
 * our representation and pass that off to the wuint* functions. To do that
 * we're going to do the following:
 *
 *  - if the value is positive
 *      we can pass it directly off to the equivalent wuint
 *  - if the value is negative
 *      we do the following computation:
 *         mb + val + 1, where
 *         mb   is the maximum unsigned value in that byte size
 *         val  is the Javascript negative integer
 *
 *
 * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If
 * you do out the computations:
 *
 * 0xffff - 128 + 1
 * 0xffff - 127
 * 0xff80
 *
 * You can then encode this value as the signed version. This is really rather
 * hacky, but it should work and get the job done which is our goal here.
 */

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifIEEE754(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');
}

Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7f, -0x80);
  }

  if (value >= 0) {
    buffer.writeUInt8(value, offset, noAssert);
  } else {
    buffer.writeUInt8(0xff + value + 1, offset, noAssert);
  }
};

function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fff, -0x8000);
  }

  if (value >= 0) {
    writeUInt16(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};

function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fffffff, -0x80000000);
  }

  if (value >= 0) {
    writeUInt32(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, true, noAssert);
};

function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  require('buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, false, noAssert);
};

Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, true, noAssert);
};

function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 7 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  require('buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, false, noAssert);
};

Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, true, noAssert);
};

SlowBuffer.prototype.readUInt8 = Buffer.prototype.readUInt8;
SlowBuffer.prototype.readUInt16LE = Buffer.prototype.readUInt16LE;
SlowBuffer.prototype.readUInt16BE = Buffer.prototype.readUInt16BE;
SlowBuffer.prototype.readUInt32LE = Buffer.prototype.readUInt32LE;
SlowBuffer.prototype.readUInt32BE = Buffer.prototype.readUInt32BE;
SlowBuffer.prototype.readInt8 = Buffer.prototype.readInt8;
SlowBuffer.prototype.readInt16LE = Buffer.prototype.readInt16LE;
SlowBuffer.prototype.readInt16BE = Buffer.prototype.readInt16BE;
SlowBuffer.prototype.readInt32LE = Buffer.prototype.readInt32LE;
SlowBuffer.prototype.readInt32BE = Buffer.prototype.readInt32BE;
SlowBuffer.prototype.readFloatLE = Buffer.prototype.readFloatLE;
SlowBuffer.prototype.readFloatBE = Buffer.prototype.readFloatBE;
SlowBuffer.prototype.readDoubleLE = Buffer.prototype.readDoubleLE;
SlowBuffer.prototype.readDoubleBE = Buffer.prototype.readDoubleBE;
SlowBuffer.prototype.writeUInt8 = Buffer.prototype.writeUInt8;
SlowBuffer.prototype.writeUInt16LE = Buffer.prototype.writeUInt16LE;
SlowBuffer.prototype.writeUInt16BE = Buffer.prototype.writeUInt16BE;
SlowBuffer.prototype.writeUInt32LE = Buffer.prototype.writeUInt32LE;
SlowBuffer.prototype.writeUInt32BE = Buffer.prototype.writeUInt32BE;
SlowBuffer.prototype.writeInt8 = Buffer.prototype.writeInt8;
SlowBuffer.prototype.writeInt16LE = Buffer.prototype.writeInt16LE;
SlowBuffer.prototype.writeInt16BE = Buffer.prototype.writeInt16BE;
SlowBuffer.prototype.writeInt32LE = Buffer.prototype.writeInt32LE;
SlowBuffer.prototype.writeInt32BE = Buffer.prototype.writeInt32BE;
SlowBuffer.prototype.writeFloatLE = Buffer.prototype.writeFloatLE;
SlowBuffer.prototype.writeFloatBE = Buffer.prototype.writeFloatBE;
SlowBuffer.prototype.writeDoubleLE = Buffer.prototype.writeDoubleLE;
SlowBuffer.prototype.writeDoubleBE = Buffer.prototype.writeDoubleBE;

    return (require['buffer'] = module.exports);
  };
};
require['buffer'].nonce = nonce;

require['buffer_ieee754'] = function() {
  return new function() {
    var exports = require['buffer_ieee754'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/browserify/builtins/buffer_ieee754.js";
    exports.readIEEE754 = function(buffer, offset, isBE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isBE ? 0 : (nBytes - 1),
      d = isBE ? 1 : -1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.writeIEEE754 = function(buffer, value, offset, isBE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isBE ? (nBytes - 1) : 0,
      d = isBE ? -1 : 1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

    return (require['buffer_ieee754'] = module.exports);
  };
};
require['buffer_ieee754'].nonce = nonce;

require['fs'] = function() {
  return new function() {
    var exports = require['fs'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/browserify/builtins/fs.js";
    // nothing to see here... no file methods for the browser

// global fs ref
var _fs = null;

function withFileSystem(cb) {
  if (_fs) {
    cb(_fs);
  } else {
    window.webkitStorageInfo.requestQuota(TEMPORARY, 1024*1024, function(grantedBytes) {
      window.webkitRequestFileSystem(TEMPORARY, grantedBytes, function(fs) { _fs = fs; cb(fs); }, errorHandler);
    }, function(e) {
      errorHandler(e);
    });
  };
};

// Return a fake writer synchronously.
// You can use it like a node.js file write stream.
function makeStreamAdapter() {
  var writeBuffer = [];
  var fakeStream = {};
  fakeStream.write = function (str, enc) {
    if (enc != 'utf8') {
      throw new Error("FakeStream wants utf8");
    }
    console.log('fs.write: '+str);
    writeBuffer.push(str);
  };
  // make it real
  fakeStream.realize = function (fileWriter) {
    fakeStream.fileWriter = fileWriter;
    fakeStream.write = function (str, enc) {
      if (enc != 'utf8') {
        throw new Error("FakeStream wants utf8");
      }
      console.log('fs.write: '+str);
      // blobs? are you for fucking real?
      var bb = new WebKitBlobBuilder();
      while (writeBuffer.length) {
        bb.append(writeBuffer.shift());
      }
      bb.append(str);
      var blob = bb.getBlob('text/plain');
      fileWriter.write(blob);
    };
    if (writeBuffer.length) {
      fakeStream.write('', 'utf8');
    }
  };
  return fakeStream;
};

exports.createWriteStream = function (path, options) {
  var fakeStream = makeStreamAdapter();
  withFileSystem(function(fs) {
    // TODO handle options
    fs.root.getFile(path, {create:true}, function(fileEntry) {
      // Create a FileWriter object for our FileEntry
      fileEntry.createWriter(function(fileWriter) {
        //fileWriter.onwriteend = function(e) {
        //  console.log('Write completed.');
        //};
        fileWriter.onerror = function(e) {
          console.log('Write failed: ' + e.toString());
        };
        fakeStream.realize(fileWriter);
      }, errorHandler);
    });
  });
  return fakeStream;
};

function errorHandler(e) {
  var msg = '';
  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };
  console.log('Error: ' + msg);
}


    return (require['fs'] = module.exports);
  };
};
require['fs'].nonce = nonce;

require['cardamom'] = function() {
  return new function() {
    var exports = require['cardamom'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/cardamom/lib/cardamom.js";
    (function() {

  this.clazz = require('cardamom/src/clazz').clazz;

  this.Fn = require('cardamom/src/fnstuff').Fn;

  this.ErrorBase = require('cardamom/src/errors').ErrorBase;

  this.colors = require('cardamom/src/colors');

  this.bisect = require('cardamom/src/bisect');

  this.collections = require('cardamom/src/collections');

}).call(this);

    return (require['cardamom'] = module.exports);
  };
};
require['cardamom'].nonce = nonce;

require['cardamom/src/bisect'] = function() {
  return new function() {
    var exports = require['cardamom/src/bisect'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/cardamom/lib/bisect.js";
    (function() {
  "Bisection algorithms.";

  var _cmp;

  _cmp = function(x, y) {
    if (x < y) {
      return -1;
    } else if (x === y) {
      return 0;
    } else {
      return 1;
    }
  };

  this.insort_right = function(a, x, _arg) {
    var cmp, hi, lo, mid, _ref, _ref2;
    _ref = _arg != null ? _arg : {}, lo = _ref.lo, hi = _ref.hi, cmp = _ref.cmp;
    "Insert item x in list a, and keep it sorted assuming a is sorted.\n\nIf x is already in a, insert it to the right of the rightmost x.\n\nOptional args lo (default 0) and hi (default len(a)) bound the\nslice of a to be searched.";

    if (lo == null) lo = 0;
    if (cmp == null) cmp = _cmp;
    if (lo < 0) throw new Error('lo must be non-negative');
    if (hi === void 0) hi = a.length;
    while (lo < hi) {
      mid = Math.floor((lo + hi) / 2);
      if (cmp(x, a[mid]) === -1) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(_ref2 = [x])), _ref2);
  };

  this.bisect_right = function(a, x, _arg) {
    var cmp, hi, lo, mid, _ref;
    _ref = _arg != null ? _arg : {}, lo = _ref.lo, hi = _ref.hi, cmp = _ref.cmp;
    "Return the index where to insert item x in list a, assuming a is sorted.\n\nThe return value i is such that all e in a[:i] have e <= x, and all e in\na[i:] have e > x.  So if x already appears in the list, a.insert(x) will\ninsert just after the rightmost x already there.\n\nOptional args lo (default 0) and hi (default len(a)) bound the\nslice of a to be searched.";

    if (lo == null) lo = 0;
    if (cmp == null) cmp = _cmp;
    if (lo < 0) throw new Error('lo must be non-negative');
    if (hi === void 0) hi = a.length;
    while (lo < hi) {
      mid = Math.floor((lo + hi) / 2);
      if (cmp(x, a[mid]) === -1) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return lo;
  };

  this.insort_left = function(a, x, _arg) {
    var cmp, hi, lo, mid, _ref, _ref2;
    _ref = _arg != null ? _arg : {}, lo = _ref.lo, hi = _ref.hi, cmp = _ref.cmp;
    "Insert item x in list a, and keep it sorted assuming a is sorted.\n\nIf x is already in a, insert it to the left of the leftmost x.\n\nOptional args lo (default 0) and hi (default len(a)) bound the\nslice of a to be searched.";

    if (lo == null) lo = 0;
    if (cmp == null) cmp = _cmp;
    if (lo < 0) throw new Error('lo must be non-negative');
    if (hi === void 0) hi = a.length;
    while (lo < hi) {
      mid = Math.floor((lo + hi) / 2);
      if (cmp(a[mid], x) === -1) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(_ref2 = [x])), _ref2);
  };

  this.bisect_left = function(a, x, _arg) {
    var cmp, hi, lo, mid, _ref;
    _ref = _arg != null ? _arg : {}, lo = _ref.lo, hi = _ref.hi, cmp = _ref.cmp;
    "Return the index where to insert item x in list a, assuming a is sorted.\n\nThe return value i is such that all e in a[:i] have e < x, and all e in\na[i:] have e >= x.  So if x already appears in the list, a.insert(x) will\ninsert just before the leftmost x already there.\n\nOptional args lo (default 0) and hi (default len(a)) bound the\nslice of a to be searched.";

    if (lo == null) lo = 0;
    if (cmp == null) cmp = _cmp;
    if (lo < 0) throw new Error('lo must be non-negative');
    if (hi === void 0) hi = a.length;
    while (lo < hi) {
      mid = Math.floor((lo + hi) / 2);
      if (cmp(a[mid], x) === -1) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  };

}).call(this);

    return (require['cardamom/src/bisect'] = module.exports);
  };
};
require['cardamom/src/bisect'].nonce = nonce;

require['cardamom/src/clazz'] = function() {
  return new function() {
    var exports = require['cardamom/src/clazz'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/cardamom/lib/clazz.js";
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
          return Object.defineProperty(_this, name, {
            enumerable: false,
            configurable: true,
            writable: true,
            value: value
          });
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

    return (require['cardamom/src/clazz'] = module.exports);
  };
};
require['cardamom/src/clazz'].nonce = nonce;

require['cardamom/src/collections'] = function() {
  return new function() {
    var exports = require['cardamom/src/collections'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/cardamom/lib/collections.js";
    (function() {
  var Set, clazz;

  clazz = require('cardamom/src/clazz').clazz;

  this.Set = Set = clazz('Set', function() {
    return {
      __init__: function(elements) {
        this.elements = elements;
      }
    };
  });

}).call(this);

    return (require['cardamom/src/collections'] = module.exports);
  };
};
require['cardamom/src/collections'].nonce = nonce;

require['cardamom/src/colors'] = function() {
  return new function() {
    var exports = require['cardamom/src/colors'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/cardamom/lib/colors.js";
    (function() {
  var _wrap_with;

  _wrap_with = function(code) {
    return function(text, bold) {
      return "\x1b[" + (bold ? '1;' : '') + code + "m" + text + "\x1b[0m";
    };
  };

  this.black = _wrap_with('30');

  this.red = _wrap_with('31');

  this.green = _wrap_with('32');

  this.yellow = _wrap_with('33');

  this.blue = _wrap_with('34');

  this.magenta = _wrap_with('35');

  this.cyan = _wrap_with('36');

  this.white = _wrap_with('37');

  this.normal = function(text) {
    return text;
  };

}).call(this);

    return (require['cardamom/src/colors'] = module.exports);
  };
};
require['cardamom/src/colors'].nonce = nonce;

require['cardamom/src/errors'] = function() {
  return new function() {
    var exports = require['cardamom/src/errors'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/cardamom/lib/errors.js";
    (function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (Error.captureStackTrace) {
    this.ErrorBase = (function(_super) {

      __extends(ErrorBase, _super);

      ErrorBase.name = 'ErrorBase';

      function ErrorBase(message) {
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
      }

      return ErrorBase;

    })(Error);
  } else {
    this.ErrorBase = (function(_super) {

      __extends(ErrorBase, _super);

      ErrorBase.name = 'ErrorBase';

      function ErrorBase() {
        var e;
        e = ErrorBase.__super__.constructor.apply(this, arguments);
        e.name = this.constructor.name;
        this.message = e.message;
        Object.defineProperty(this, 'stack', {
          get: function() {
            return e.stack;
          }
        });
      }

      return ErrorBase;

    })(Error);
  }

}).call(this);

    return (require['cardamom/src/errors'] = module.exports);
  };
};
require['cardamom/src/errors'].nonce = nonce;

require['cardamom/src/fnstuff'] = function() {
  return new function() {
    var exports = require['cardamom/src/fnstuff'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/cardamom/lib/fnstuff.js";
    (function() {
  var assert;

  assert = require('assert');

  this.Fn = function(syntax, fn) {
    var argParts, args, wrapFn, _ref;
    if (fn == null) fn = null;
    _ref = [[], syntax.trim().split(' ')], args = _ref[0], argParts = _ref[1];
    assert.ok(argParts.length > 0, 'Syntax for Fn should contain 1 or more args.');
    argParts.forEach(function(part, partIndex) {
      var arg, fnParts;
      args.push((arg = {}));
      if (part[0] === '[') {
        assert.ok(part[part.length - 1] === ']', "Unclosed brackets []: " + part);
        part = part.slice(1, (part.length - 1));
        arg.optional = true;
        arg.splat = false;
      } else if (part.slice(part.length - 3) === '...') {
        assert.equal(partIndex, argParts.length - 1, "Splat was not the last argument: " + part);
        part = part.slice(0, (part.length - 3));
        arg.optional = false;
        arg.splat = true;
      } else {
        arg.optional = false;
        arg.splat = false;
      }
      if (part[part.length - 1] === '?') {
        part = part.slice(0, (part.length - 1));
        arg.undefinedOk = true;
      } else {
        arg.undefinedOk = false;
      }
      if (part[0] === '{') {
        assert.ok(part[part.length - 1] === '}', "Unclosed brackets {}: " + part);
        part = part.slice(1, (part.length - 1));
        arg.type = 'object';
        return arg.name = part || void 0;
      } else if (part.indexOf('->') >= 0) {
        fnParts = part.split('->');
        assert.ok(fnParts.length === 2, "Unrecognized function syntax: " + part);
        arg.type = 'function';
        arg.name = fnParts[0] || void 0;
        return arg["return"] = fnParts[1];
      } else if (part[0] === '"' || part[0] === '\'') {
        assert.ok(part[part.length - 1] === part[0], "Unclosed string: " + part);
        part = part.slice(1, (part.length - 1));
        arg.type = 'string';
        return arg.name = part || void 0;
      } else {
        arg.type = void 0;
        return arg.name = part || void 0;
      }
    });
    wrapFn = function(fn) {
      var doesMatch, type;
      type = function(arg) {
        if (arg instanceof Array) {
          return 'Array';
        } else {
          return typeof arg;
        }
      };
      doesMatch = function(arg, expectedArg) {
        return !(expectedArg.type != null) || expectedArg.type === type(arg) || expectedArg.undefinedOk && type(arg) === 'undefined';
      };
      return function() {
        var arg, argumentIndex, expectedArg, expectedIndex, toPass;
        toPass = [];
        argumentIndex = 0;
        expectedIndex = 0;
        while (expectedIndex < args.length) {
          expectedArg = args[expectedIndex];
          arg = arguments[argumentIndex];
          if (doesMatch(arg, expectedArg)) {
            if (expectedArg.splat) {
              if (argumentIndex >= arguments.length) break;
              toPass.push(arg);
              argumentIndex += 1;
            } else {
              toPass.push(arg);
              argumentIndex += 1;
              expectedIndex += 1;
            }
          } else if (expectedArg.optional) {
            toPass.push(void 0);
            expectedIndex += 1;
          } else {
            if (argumentIndex >= arguments.length) {
              throw new Error("Fn expected arg of type " + expectedArg.type + " for argument #0+" + argumentIndex + ", but ran out of arguments.");
            } else {
              throw new Error("Fn expected arg of type " + expectedArg.type + " for argument #0+" + argumentIndex + ", but got type '" + (type(arg)) + "': " + arg);
            }
          }
        }
        if (argumentIndex < arguments.length) {
          throw new Error("Fn received extra arguments from #0+" + argumentIndex + " (" + arguments.length + " total): " + arguments[argumentIndex]);
        }
        return fn.apply(this, toPass);
      };
    };
    if (fn != null) {
      return wrapFn(fn);
    } else {
      return wrapFn;
    }
  };

}).call(this);

    return (require['cardamom/src/fnstuff'] = module.exports);
  };
};
require['cardamom/src/fnstuff'].nonce = nonce;

require['sugar'] = function() {
  return new function() {
    var exports = require['sugar'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/sugar/release/1.2.5/development/sugar-1.2.5-core.development.js";
    // Google Closure Compiler will output a wrapping function here.
(function() {

  // A few optimizations for Google Closure Compiler will save us a couple kb in the release script.
  var object = Object, array = Array, regexp = RegExp, date = Date, string = String, number = Number, Undefined;

  // defineProperty exists in IE8 but will error when trying to define a property on
  // native objects. IE8 does not have defineProperies, however, so this check saves a try/catch block.
  var definePropertySupport = object.defineProperty && object.defineProperties;

  // Class extending methods

  function extend(klass, instance, override, methods) {
    var extendee = instance ? klass.prototype : klass, original;
    initializeClass(klass, instance, methods);
    iterateOverObject(methods, function(name, method) {
      original = extendee[name];
      if(typeof override === 'function') {
        method = wrapNative(extendee[name], method, override);
      }
      if(override !== false || !extendee[name]) {
        defineProperty(extendee, name, method);
      }
      // If the method is internal to Sugar, then store a reference so it can be restored later.
      klass['SugarMethods'][name] = { instance: instance, method: method, original: original };
    });
  }

  function initializeClass(klass) {
    if(klass.SugarMethods) return;
    defineProperty(klass, 'SugarMethods', {});
    extend(klass, false, false, {
      'restore': function() {
        var all = arguments.length === 0, methods = multiArgs(arguments);
        iterateOverObject(klass['SugarMethods'], function(name, m) {
          if(all || methods.has(name)) {
            defineProperty(m.instance ? klass.prototype : klass, name, m.method);
          }
        });
      },
      'extend': function(methods, override, instance) {
        if(klass === object && arguments.length === 0) {
          mapObjectPrototypeMethods();
        } else {
          extend(klass, instance !== false, override, methods);
        }
      }
    });
  }

  function wrapNative(nativeFn, extendedFn, condition) {
    return function() {
      if(nativeFn && (condition === true || !condition.apply(this, arguments))) {
        return nativeFn.apply(this, arguments);
      } else {
        return extendedFn.apply(this, arguments);
      }
    }
  }

  function defineProperty(target, name, method) {
    if(definePropertySupport) {
      object.defineProperty(target, name, { 'value': method, 'configurable': true, 'enumerable': false, 'writable': true });
    } else {
      target[name] = method;
    }
  }

  // Object helpers

  function hasOwnProperty(obj, key) {
    return object.prototype.hasOwnProperty.call(obj, key);
  }

  function iterateOverObject(obj, fn) {
    var key;
    for(key in obj) {
      if(!hasOwnProperty(obj, key)) continue;
      fn.call(obj, key, obj[key]);
    }
  }

  function multiMatch(el, match, scope, params) {
    var result = true;
    if(el === match) {
      // Match strictly equal values up front.
      return true;
    } else if(object.isRegExp(match)) {
      // Match against a regexp
      return regexp(match).test(el);
    } else if(object.isFunction(match)) {
      // Match against a filtering function
      return match.apply(scope, [el].concat(params));
    } else if(object.isObject(match) && object.isObject(el)) {
      // Match against a hash or array.
      iterateOverObject(match, function(key, value) {
        if(!multiMatch(el[key], match[key], scope, params)) {
          result = false;
        }
      });
      return !object.isEmpty(match) && result;
    } else {
      return object.equal(el, match);
    }
  }

  function stringify(thing, stack) {
    var value, klass, isObject, isArray, arr, i, key, type = typeof thing;

    // Return quickly if string to save cycles
    if(type === 'string') return thing;

    klass    = object.prototype.toString.call(thing)
    isObject = klass === '[object Object]';
    isArray  = klass === '[object Array]';

    if(thing != null && isObject || isArray) {
      // This method for checking for cyclic structures was egregiously stolen from
      // the ingenious method by @kitcambridge from the Underscore script:
      // https://github.com/documentcloud/underscore/issues/240
      if(!stack) stack = [];
      // Allowing a step into the structure before triggering this
      // script to save cycles on standard JSON structures and also to
      // try as hard as possible to catch basic properties that may have
      // been modified.
      if(stack.length > 1) {
        i = stack.length;
        while (i--) {
          if (stack[i] === thing) {
            return 'CYC';
          }
        }
      }
      stack.push(thing);
      value = string(thing.constructor);
      arr = isArray ? thing : object.keys(thing).sort();
      for(i = 0; i < arr.length; i++) {
        key = isArray ? i : arr[i];
        value += key + stringify(thing[key], stack);
      }
      stack.pop();
    } else if(1 / thing === -Infinity) {
      value = '-0';
    } else {
      value = string(thing);
    }
    return type + klass + value;
  }


  // Argument helpers

  function transformArgument(el, map, context, mapArgs) {
    if(isUndefined(map)) {
      return el;
    } else if(object.isFunction(map)) {
      return map.apply(context, mapArgs || []);
    } else if(object.isFunction(el[map])) {
      return el[map].call(el);
    } else {
      return el[map];
    }
  }

  function getArgs(args, index) {
    return Array.prototype.slice.call(args, index);
  }

  function multiArgs(args, fn, flatten, index) {
    args = getArgs(args);
    if(flatten === true) args = arrayFlatten(args, 1);
    arrayEach(args, fn || function(){}, index);
    return args;
  }


  // Used for both arrays and strings

  function entryAtIndex(arr, args, str) {
    var result = [], length = arr.length, loop = args[args.length - 1] !== false, r;
    multiArgs(args, function(index) {
      if(object.isBoolean(index)) return false;
      if(loop) {
        index = index % length;
        if(index < 0) index = length + index;
      }
      r = str ? arr.charAt(index) || '' : arr[index];
      result.push(r);
    });
    return result.length < 2 ? result[0] : result;
  }

  /***
   * Object module
   *
   * Much thanks to kangax for his informative aricle about how problems with instanceof and constructor
   * http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
   *
   ***/

  function isClass(obj, str) {
    return object.prototype.toString.call(obj) === '[object '+str+']';
  }

  function isUndefined(o) {
    return o === Undefined;
  }

  function setParamsObject(obj, param, value, deep) {
    var reg = /^(.+?)(\[.*\])$/, isArray, match, allKeys, key;
    if(deep !== false && (match = param.match(reg))) {
      key = match[1];
      allKeys = match[2].replace(/^\[|\]$/g, '').split('][');
      arrayEach(allKeys, function(k) {
        isArray = !k || k.match(/^\d+$/);
        if(!key && object.isArray(obj)) key = obj.length;
        if(!obj[key]) {
          obj[key] = isArray ? [] : {};
        }
        obj = obj[key];
        key = k;
      });
      if(!key && isArray) key = obj.length.toString();
      setParamsObject(obj, key, value);
    } else if(value.match(/^[\d.]+$/)) {
      obj[param] = parseFloat(value);
    } else if(value === 'true') {
      obj[param] = true;
    } else if(value === 'false') {
      obj[param] = false;
    } else {
      obj[param] = value;
    }
  }

  function Hash(obj) {
    var self = this;
    iterateOverObject(obj, function(key, value) {
      self[key] = value;
    });
  }

  /***
   * @method is[Type](<obj>)
   * @returns Boolean
   * @short Returns true if <obj> is an object of that type.
   * @extra %isObject% will return false on anything that is not an object literal, including instances of inherited classes. Note also that %isNaN% will ONLY return true if the object IS %NaN%. It does not mean the same as browser native %isNaN%, which returns true for anything that is "not a number". Type methods are available as instance methods on extended objects.
   * @example
   *
   *   Object.isArray([1,2,3])            -> true
   *   Object.isDate(3)                   -> false
   *   Object.isRegExp(/wasabi/)          -> true
   *   Object.isObject({ broken:'wear' }) -> true
   *
   ***
   * @method isArray()
   * @set isType
   ***
   * @method isBoolean()
   * @set isType
   ***
   * @method isDate()
   * @set isType
   ***
   * @method isFunction()
   * @set isType
   ***
   * @method isNumber()
   * @set isType
   ***
   * @method isString()
   * @set isType
   ***
   * @method isRegExp()
   * @set isType
   ***/


  var ObjectTypeMethods = ['isObject','isNaN'];
  var ObjectHashMethods = ['keys','values','each','merge','isEmpty','clone','equal','watch','tap','has']

  function buildTypeMethods() {
    var methods = {}, name;
    arrayEach(['Array','Boolean','Date','Function','Number','String','RegExp'], function(type) {
      name = 'is' + type;
      ObjectTypeMethods.push(name);
      methods[name] = function(obj) {
        return isClass(obj, type);
      }
    });
    extend(Object, false, false, methods);
  }

  function buildInstanceMethods(set, target) {
    var methods = {};
    arrayEach(set, function(name) {
      methods[name + (name === 'equal' ? 's' : '')] = function() {
        return Object[name].apply(null, [this].concat(getArgs(arguments)));
      }
    });
    extend(target, true, false, methods);
  }

  function buildObject() {
    buildTypeMethods();
    buildInstanceMethods(ObjectHashMethods, Hash);
  }

  function mapObjectPrototypeMethods() {
    buildInstanceMethods(ObjectTypeMethods.concat(ObjectHashMethods), Object);
  }

  extend(object, false, true, {
      /***
       * @method watch(<obj>, <prop>, <fn>)
       * @returns Nothing
       * @short Watches a property of <obj> and runs <fn> when it changes.
       * @extra <fn> is passed three arguments: the property <prop>, the old value, and the new value. The return value of [fn] will be set as the new value. This method is useful for things such as validating or cleaning the value when it is set. Warning: this method WILL NOT work in browsers that don't support %Object.defineProperty%. This notably includes IE 8 and below, and Opera. This is the only method in Sugar that is not fully compatible with all browsers. %watch% is available as an instance method on extended objects.
       * @example
       *
       *   Object.watch({ foo: 'bar' }, 'foo', function(prop, oldVal, newVal) {
       *     // Will be run when the property 'foo' is set on the object.
       *   });
       *   Object.extended().watch({ foo: 'bar' }, 'foo', function(prop, oldVal, newVal) {
       *     // Will be run when the property 'foo' is set on the object.
       *   });
       *
       ***/
    'watch': function(obj, prop, fn) {
      if(!definePropertySupport) return;
      var value = obj[prop];
      object.defineProperty(obj, prop, {
        'get': function() {
          return value;
        },
        'set': function(to) {
          value = fn.call(obj, prop, value, to);
        },
        'enumerable': true,
        'configurable': true
      });
    }
  });

  extend(object, false, false, {

    /***
     * @method Object.extended(<obj> = {})
     * @returns Extended object
     * @short Creates a new object, equivalent to %new Object()% or %{}%, but with extended methods.
     * @extra See extended objects for more.
     * @example
     *
     *   Object.extended()
     *   Object.extended({ happy:true, pappy:false }).keys() -> ['happy','pappy']
     *   Object.extended({ happy:true, pappy:false }).values() -> [true, false]
     *
     ***/
    'extended': function(obj) {
      return new Hash(obj);
    },

    /***
     * @method isObject()
     * @set isType
     ***/
    'isObject': function(obj) {
      if(obj == null) {
        return false;
      } else {
        // === on the constructor is not safe across iframes
        return isClass(obj, 'Object') && string(obj.constructor) === string(object) || obj.constructor === Hash;
      }
    },

    /***
     * @method isNaN()
     * @set isType
     ***/
    'isNaN': function(obj) {
      // This is only true of NaN
      return object.isNumber(obj) && obj.valueOf() !== obj.valueOf();
    },

    /***
     * @method each(<obj>, [fn])
     * @returns Object
     * @short Iterates over each property in <obj> calling [fn] on each iteration.
     * @extra %each% is available as an instance method on extended objects.
     * @example
     *
     *   Object.each({ broken:'wear' }, function(key, value) {
     *     // Iterates over each key/value pair.
     *   });
     *   Object.extended({ broken:'wear' }).each(function(key, value) {
     *     // Iterates over each key/value pair.
     *   });
     *
     ***/
    'each': function(obj, fn) {
      if(fn) {
        iterateOverObject(obj, function(k,v) {
          fn.call(obj, k, v, obj);
        });
      }
      return obj;
    },

    /***
     * @method merge(<target>, <source>, [deep] = false, [resolve] = true)
     * @returns Merged object
     * @short Merges all the properties of <source> into <target>.
     * @extra Merges are shallow unless [deep] is %true%. Properties of <source> will win in the case of conflicts, unless [resolve] is %false%. [resolve] can also be a function that resolves the conflict. In this case it will be passed 3 arguments, %key%, %targetVal%, and %sourceVal%, with the context set to <source>. This will allow you to solve conflict any way you want, ie. adding two numbers together, etc. %merge% is available as an instance method on extended objects.
     * @example
     *
     *   Object.merge({a:1},{b:2}) -> { a:1, b:2 }
     *   Object.merge({a:1},{a:2}, false, false) -> { a:1 }
     +   Object.merge({a:1},{a:2}, false, function(key, a, b) {
     *     return a + b;
     *   }); -> { a:3 }
     *   Object.extended({a:1}).merge({b:2}) -> { a:1, b:2 }
     *
     ***/
    'merge': function(target, source, deep, resolve) {
      var key, val;
      // Strings cannot be reliably merged thanks to
      // their properties not being enumerable in < IE8.
      if(target && typeof source != 'string') {
        for(key in source) {
          if(!hasOwnProperty(source, key) || !target) continue;
          val = source[key];
          // Conflict!
          if(target[key] !== Undefined) {
            // Do not merge.
            if(resolve === false) {
              continue;
            }
            // Use the result of the callback as the result.
            if(object.isFunction(resolve)) {
              val = resolve.call(source, key, target[key], source[key])
            }
          }
          // Deep merging.
          if(deep === true && val && typeof val === 'object') {
            if(object.isDate(val)) {
              val = new Date(val.getTime());
            } else if(object.isRegExp(val)) {
              val = new RegExp(val.source, val.getFlags());
            } else {
              if(!target[key]) target[key] = array.isArray(val) ? [] : {};
              Object.merge(target[key], source[key], deep, resolve);
              continue;
            }
          }
          target[key] = val;
        }
      }
      return target;
    },

    /***
     * @method isEmpty(<obj>)
     * @returns Boolean
     * @short Returns true if <obj> is empty.
     * @extra %isEmpty% is available as an instance method on extended objects.
     * @example
     *
     *   Object.isEmpty({})          -> true
     *   Object.isEmpty({foo:'bar'}) -> false
     *   Object.extended({foo:'bar'}).isEmpty() -> false
     *
     ***/
    'isEmpty': function(obj) {
      if(obj == null || typeof obj != 'object') return !(obj && obj.length > 0);
      return object.keys(obj).length == 0;
    },

    /***
     * @method equal(<a>, <b>)
     * @returns Boolean
     * @short Returns true if <a> and <b> are equal.
     * @extra %equal% in Sugar is "egal", meaning the values are equal if they are "not observably distinguishable". Note that on extended objects the name is %equals% for readability.
     * @example
     *
     *   Object.equal({a:2}, {a:2}) -> true
     *   Object.equal({a:2}, {a:3}) -> false
     *   Object.extended({a:2}).equals({a:3}) -> false
     *
     ***/
    'equal': function(a, b) {
      return stringify(a) === stringify(b);
    },

    /***
     * @method values(<obj>, [fn])
     * @returns Array
     * @short Returns an array containing the values in <obj>. Optionally calls [fn] for each value.
     * @extra Returned values are in no particular order. %values% is available as an instance method on extended objects.
     * @example
     *
     *   Object.values({ broken: 'wear' }) -> ['wear']
     *   Object.values({ broken: 'wear' }, function(value) {
     *     // Called once for each value.
     *   });
     *   Object.extended({ broken: 'wear' }).values() -> ['wear']
     *
     ***/
    'values': function(obj, fn) {
      var values = [];
      iterateOverObject(obj, function(k,v) {
        values.push(v);
        if(fn) fn.call(obj,v);
      });
      return values;
    },

    /***
     * @method clone(<obj> = {}, [deep] = false)
     * @returns Cloned object
     * @short Creates a clone (copy) of <obj>.
     * @extra Default is a shallow clone, unless [deep] is true. %clone% is available as an instance method on extended objects.
     * @example
     *
     *   Object.clone({foo:'bar'})            -> { foo: 'bar' }
     *   Object.clone()                       -> {}
     *   Object.extended({foo:'bar'}).clone() -> { foo: 'bar' }
     *
     ***/
    'clone': function(obj, deep) {
      if(obj == null || typeof obj !== 'object') return obj;
      if(array.isArray(obj)) return obj.clone();
      var target = obj.constructor === Hash ? new Hash() : {};
      return object.merge(target, obj, deep);
    },

    /***
     * @method Object.fromQueryString(<str>, [deep] = true)
     * @returns Object
     * @short Converts the query string of a URL into an object.
     * @extra If [deep] is %false%, conversion will only accept shallow params (ie. no object or arrays with %[]% syntax) as these are not universally supported.
     * @example
     *
     *   Object.fromQueryString('foo=bar&broken=wear') -> { foo: 'bar', broken: 'wear' }
     *   Object.fromQueryString('foo[]=1&foo[]=2')     -> { foo: [1,2] }
     *
     ***/
    'fromQueryString': function(str, deep) {
      var result = object.extended(), split;
      str = str && str.toString ? str.toString() : '';
      str.replace(/^.*?\?/, '').unescapeURL().split('&').each(function(p) {
        var split = p.split('=');
        if(split.length !== 2) return;
        setParamsObject(result, split[0], split[1], deep);
      });
      return result;
    },

    /***
     * @method tap(<obj>, <fn>)
     * @returns Object
     * @short Runs <fn> and returns <obj>.
     * @extra  A string can also be used as a shortcut to a method. This method is used to run an intermediary function in the middle of method chaining. As a standalone method on the Object class it doesn't have too much use. The power of %tap% comes when using extended objects or modifying the Object prototype with Object.extend().
     * @example
     *
     *   Object.extend();
     *   [2,4,6].map(Math.exp).tap(function(){ arr.pop(); }).map(Math.round); ->  [7,55]
     *   [2,4,6].map(Math.exp).tap('pop').map(Math.round); ->  [7,55]
     *
     ***/
    'tap': function(obj, fn) {
      transformArgument(obj, fn, obj, [obj]);
      return obj;
    },

    /***
     * @method has(<obj>, <key>)
     * @returns Boolean
     * @short Checks if <obj> has <key> using hasOwnProperty from Object.prototype.
     * @extra This method is considered safer than %Object#hasOwnProperty% when using objects as hashes. See %http://www.devthought.com/2012/01/18/an-object-is-not-a-hash/% for more.
     * @example
     *
     *   Object.has({ foo: 'bar' }, 'foo') -> true
     *   Object.has({ foo: 'bar' }, 'baz') -> false
     *   Object.has({ hasOwnProperty: true }, 'foo') -> false
     ***/
    'has': function (obj, key) {
      return hasOwnProperty(obj, key);
    }

  });


  extend(object, false, function() { return arguments.length > 1; }, {

    /***
     * @method keys(<obj>, [fn])
     * @returns Array
     * @short Returns an array containing the keys in <obj>. Optionally calls [fn] for each key.
     * @extra This method is provided for browsers that don't support it natively, and additionally is enhanced to accept the callback [fn]. Returned keys are in no particular order. %keys% is available as an instance method on extended objects.
     * @example
     *
     *   Object.keys({ broken: 'wear' }) -> ['broken']
     *   Object.keys({ broken: 'wear' }, function(key, value) {
     *     // Called once for each key.
     *   });
     *   Object.extended({ broken: 'wear' }).keys() -> ['broken']
     *
     ***/
    'keys': function(obj, fn) {
      if(obj == null || typeof obj != 'object' && !object.isRegExp(obj) && !object.isFunction(obj)) {
        throw new TypeError('Object required');
      }
      var keys = [];
      iterateOverObject(obj, function(key, value) {
        keys.push(key);
        if(fn) fn.call(obj, key, value);
      });
      return keys;
    }

  });








  /***
   * Array module
   *
   ***/


  // Basic array internal methods

  function arrayEach(arr, fn, startIndex, loop, sparse) {
    var length, index, i;
    checkCallback(fn);
    if(startIndex < 0) startIndex = arr.length + startIndex;
    i = toIntegerWithDefault(startIndex, 0);
    length = loop === true ? arr.length + i : arr.length;
    while(i < length) {
      index = i % arr.length;
      if(!(index in arr) && sparse === true) {
        return iterateOverSparseArray(arr, fn, i, loop);
      } else if(fn.call(arr, arr[index], index, arr) === false) {
        break;
      }
      i++;
    }
  }

  function arrayFind(arr, f, startIndex, loop, returnIndex) {
    var result, index;
    arrayEach(arr, function(el, i, arr) {
      if(multiMatch(el, f, arr, [i, arr])) {
        result = el;
        index = i;
        return false;
      }
    }, startIndex, loop);
    return returnIndex ? index : result;
  }

  function arrayUnique(arr, map) {
    var result = [], o = {}, stringified, transformed;
    arrayEach(arr, function(el, i) {
      transformed = map ? transformArgument(el, map, arr, [el, i, arr]) : el;
      stringified = stringify(transformed);
      if(!arrayObjectExists(o, stringified, el)) {
        o[stringified] = transformed;
        result.push(el);
      }
    })
    return result;
  }

  function arrayFlatten(arr, level, current) {
    level = level || Infinity;
    current = current || 0;
    var result = [];
    arrayEach(arr, function(el) {
      if(object.isArray(el) && current < level) {
        result = result.concat(arrayFlatten(el, level, current + 1));
      } else {
        result.push(el);
      }
    });
    return result;
  }

  function arrayIntersect(arr1, arr2, subtract) {
    var result = [], o = {};
    arr2.each(function(el) {
      o[stringify(el)] = el;
    });
    arr1.each(function(el) {
      var stringified = stringify(el), exists = arrayObjectExists(o, stringified, el);
      // Add the result to the array if:
      // 1. We're subtracting intersections or it doesn't already exist in the result and
      // 2. It exists in the compared array and we're adding, or it doesn't exist and we're removing.
      if(exists != subtract) {
        delete o[stringified];
        result.push(el);
      }
    });
    return result;
  }

  function arrayObjectExists(hash, stringified, obj) {
    return stringified in hash && (typeof obj !== 'function' || obj === hash[stringified]);
  }

  // ECMA5 methods

  function arrayIndexOf(arr, search, fromIndex, increment) {
    var length = arr.length,
        fromRight = increment == -1,
        start = fromRight ? length - 1 : 0,
        index = toIntegerWithDefault(fromIndex, start);
    if(index < 0) {
      index = length + index;
    }
    if((!fromRight && index < 0) || (fromRight && index >= length)) {
      index = start;
    }
    while((fromRight && index >= 0) || (!fromRight && index < length)) {
      if(arr[index] === search) {
        return index;
      }
      index += increment;
    }
    return -1;
  }

  function arrayReduce(arr, fn, initialValue, fromRight) {
    var length = arr.length, count = 0, defined = initialValue !== Undefined, result, index;
    checkCallback(fn);
    if(length == 0 && !defined) {
      throw new TypeError('Reduce called on empty array with no initial value');
    } else if(defined) {
      result = initialValue;
    } else {
      result = arr[fromRight ? length - 1 : count];
      count++;
    }
    while(count < length) {
      index = fromRight ? length - count - 1 : count;
      if(index in arr) {
        result = fn.call(Undefined, result, arr[index], index, arr);
      }
      count++;
    }
    return result;
  }

  function toIntegerWithDefault(i, d) {
    if(isNaN(i)) {
      return d;
    } else {
      return parseInt(i >> 0);
    }
  }

  function isArrayIndex(arr, i) {
    return i in arr && toUInt32(i) == i && i != 0xffffffff;
  }

  function toUInt32(i) {
    return i >>> 0;
  }

  function checkCallback(fn) {
    if(!fn || !fn.call) {
      throw new TypeError('Callback is not callable');
    }
  }

  function checkFirstArgumentExists(args) {
    if(args.length === 0) {
      throw new TypeError('First argument must be defined');
    }
  }

  // Support methods

  function iterateOverSparseArray(arr, fn, fromIndex, loop) {
    var indexes = [], i;
    for(i in arr) {
      if(isArrayIndex(arr, i) && i >= fromIndex) {
        indexes.push(i.toNumber());
      }
    }
    indexes.sort().each(function(index) {
      return fn.call(arr, arr[index], index, arr);
    });
    return arr;
  }

  function getMinOrMax(obj, map, which, isArray) {
    var max = which === 'max', min = which === 'min';
    var edge = max ? -Infinity : Infinity;
    var result = [];
    iterateOverObject(obj, function(key) {
      var entry = obj[key];
      var test = transformArgument(entry, map, obj, isArray? [entry, key.toNumber(), obj] : []);
      if(test === edge) {
        result.push(entry);
      } else if((max && test > edge) || (min && test < edge)) {
        result = [entry];
        edge = test;
      }
    });
    return result;
  }


  // Alphanumeric collation helpers

  function collateStrings(a, b) {
    var aValue, bValue, aChar, bChar, aEquiv, bEquiv, index = 0, tiebreaker = 0;
    a = getCollationReadyString(a);
    b = getCollationReadyString(b);
    do {
      aChar  = getCollationCharacter(a, index);
      bChar  = getCollationCharacter(b, index);
      aValue = getCollationValue(aChar);
      bValue = getCollationValue(bChar);
      if(aValue === -1 || bValue === -1) {
        aValue = a.charCodeAt(index) || null;
        bValue = b.charCodeAt(index) || null;
      }
      aEquiv = aChar !== a.charAt(index);
      bEquiv = bChar !== b.charAt(index);
      if(aEquiv !== bEquiv && tiebreaker === 0) {
        tiebreaker = aEquiv - bEquiv;
      }
      index += 1;
    } while(aValue != null && bValue != null && aValue === bValue);
    if(aValue === bValue) return tiebreaker;
    return aValue < bValue ? -1 : 1;
  }

  function getCollationReadyString(str) {
    if(array[AlphanumericSortIgnoreCase]) {
      str = str.toLowerCase();
    }
    return str.remove(array[AlphanumericSortIgnore]);
  }

  function getCollationCharacter(str, index) {
    var chr = str.charAt(index), eq = array[AlphanumericSortEquivalents] || {};
    return eq[chr] || chr;
  }

  function getCollationValue(chr) {
    if(!chr) {
      return null;
    } else {
      return array[AlphanumericSortOrder].indexOf(chr);
    }
  }

  var AlphanumericSortOrder       = 'AlphanumericSortOrder';
  var AlphanumericSortIgnore      = 'AlphanumericSortIgnore';
  var AlphanumericSortIgnoreCase  = 'AlphanumericSortIgnoreCase';
  var AlphanumericSortEquivalents = 'AlphanumericSortEquivalents';

  function buildArray() {
    var order = 'AÁÀÂÃĄBCĆČÇDĎÐEÉÈĚÊËĘFGĞHıIÍÌİÎÏJKLŁMNŃŇÑOÓÒÔPQRŘSŚŠŞTŤUÚÙŮÛÜVWXYÝZŹŻŽÞÆŒØÕÅÄÖ';
    var equiv = 'AÁÀÂÃÄ,CÇ,EÉÈÊË,IÍÌİÎÏ,OÓÒÔÕÖ,Sß,UÚÙÛÜ';
    array[AlphanumericSortOrder] = order.split('').map(function(str) {
      return str + str.toLowerCase();
    }).join('');
    var equivalents = {};
    equiv.split(',').each(function(set) {
      var equivalent = set.charAt(0);
      set.slice(1).chars(function(chr) {
        equivalents[chr] = equivalent;
        equivalents[chr.toLowerCase()] = equivalent.toLowerCase();
      });
    });
    array[AlphanumericSortIgnoreCase] = true;
    array[AlphanumericSortEquivalents] = equivalents;
  }

  extend(array, false, false, {

    /***
     *
     * @method Array.create(<obj1>, <obj2>, ...)
     * @returns Array
     * @short Alternate array constructor.
     * @extra This method will create a single array by calling %concat% on all arguments passed. In addition to ensuring that an unknown variable is in a single, flat array (the standard constructor will create nested arrays, this one will not), it is also a useful shorthand to convert a function's arguments object into a standard array.
     * @example
     *
     *   Array.create('one', true, 3)   -> ['one', true, 3]
     *   Array.create(['one', true, 3]) -> ['one', true, 3]
     +   Array.create(function(n) {
     *     return arguments;
     *   }('howdy', 'doody'));
     *
     ***/
    'create': function(obj) {
      var result = [];
      multiArgs(arguments, function(a) {
        if(a && a.callee) a = getArgs(a);
        result = result.concat(a);
      });
      return result;
    },

    /***
     *
     * @method Array.isArray(<obj>)
     * @returns Boolean
     * @short Returns true if <obj> is an Array.
     * @extra This method is provided for browsers that don't support it internally.
     * @example
     *
     *   Array.isArray(3)        -> false
     *   Array.isArray(true)     -> false
     *   Array.isArray('wasabi') -> false
     *   Array.isArray([1,2,3])  -> true
     *
     ***/
    'isArray': function(obj) {
      return isClass(obj, 'Array');
    }

  });



  extend(array, true, function() { var a = arguments; return a.length > 0 && !object.isFunction(a[0]); }, {

    /***
     * @method every(<f>, [scope])
     * @returns Boolean
     * @short Returns true if all elements in the array match <f>.
     * @extra [scope] is the %this% object. In addition to providing this method for browsers that don't support it natively, this enhanced method also directly accepts strings, numbers, deep objects, and arrays for <f>. %all% is provided an alias.
     * @example
     *
     +   ['a','a','a'].every(function(n) {
     *     return n == 'a';
     *   });
     *   ['a','a','a'].every('a')   -> true
     *   [{a:2},{a:2}].every({a:2}) -> true
     *
     ***/
    'every': function(f, scope) {
      var length = this.length, index = 0;
      checkFirstArgumentExists(arguments);
      while(index < length) {
        if(index in this && !multiMatch(this[index], f, scope, [index, this])) {
          return false;
        }
        index++;
      }
      return true;
    },

    /***
     * @method some(<f>, [scope])
     * @returns Boolean
     * @short Returns true if any element in the array matches <f>.
     * @extra [scope] is the %this% object. In addition to providing this method for browsers that don't support it natively, this enhanced method also directly accepts strings, numbers, deep objects, and arrays for <f>. %any% and %has% are provided as aliases.
     * @example
     *
     +   ['a','b','c'].some(function(n) {
     *     return n == 'a';
     *   });
     +   ['a','b','c'].some(function(n) {
     *     return n == 'd';
     *   });
     *   ['a','b','c'].some('a')   -> true
     *   [{a:2},{b:5}].some({a:2}) -> true
     *
     ***/
    'some': function(f, scope) {
      var length = this.length, index = 0;
      checkFirstArgumentExists(arguments);
      while(index < length) {
        if(index in this && multiMatch(this[index], f, scope, [index, this])) {
          return true;
        }
        index++;
      }
      return false;
    },

    /***
     * @method map(<map>, [scope])
     * @returns Array
     * @short Maps the array to another array containing the values that are the result of calling <map> on each element.
     * @extra [scope] is the %this% object. In addition to providing this method for browsers that don't support it natively, this enhanced method also directly accepts a string, which is a shortcut for a function that gets that property (or invokes a function) on each element. %collect% is provided as an alias.
     * @example
     *
     +   [1,2,3].map(function(n) {
     *     return n * 3;
     *   });                                  -> [3,6,9]
     *   ['one','two','three'].map(function(n) {
     *     return n.length;
     *   });                                  -> [3,3,5]
     *   ['one','two','three'].map('length')  -> [3,3,5]
     *
     ***/
    'map': function(map, scope) {
      var length = this.length, index = 0, el, result = new Array(length);
      checkFirstArgumentExists(arguments);
      while(index < length) {
        if(index in this) {
          el = this[index];
          result[index] = transformArgument(el, map, scope, [el, index, this]);
        }
        index++;
      }
      return result;
    },

    /***
     * @method filter(<f>, [scope])
     * @returns Array
     * @short Returns any elements in the array that match <f>.
     * @extra [scope] is the %this% object. In addition to providing this method for browsers that don't support it natively, this enhanced method also directly accepts strings, numbers, deep objects, and arrays for <f>.
     * @example
     *
     +   [1,2,3].filter(function(n) {
     *     return n > 1;
     *   });
     *   [1,2,2,4].filter(2) -> 2
     *
     ***/
    'filter': function(f, scope) {
      var length = this.length, index = 0, result = [];
      checkFirstArgumentExists(arguments);
      while(index < length) {
        if(index in this && multiMatch(this[index], f, scope, [index, this])) {
          result.push(this[index]);
        }
        index++;
      }
      return result;
    }

  });


  extend(array, true, false, {

    /***
     * @method indexOf(<search>, [fromIndex])
     * @returns Number
     * @short Searches the array and returns the first index where <search> occurs, or -1 if the element is not found.
     * @extra [fromIndex] is the index from which to begin the search. This method performs a simple strict equality comparison on <search>. It does not support enhanced functionality such as searching the contents against a regex, callback, or deep comparison of objects. For such functionality, use the %find% method instead.
     * @example
     *
     *   [1,2,3].indexOf(3)           -> 1
     *   [1,2,3].indexOf(7)           -> -1
     *
     ***/
    'indexOf': function(search, fromIndex) {
      if(object.isString(this)) return this.indexOf(search, fromIndex);
      return arrayIndexOf(this, search, fromIndex, 1);
    },

    /***
     * @method lastIndexOf(<search>, [fromIndex])
     * @returns Number
     * @short Searches the array and returns the last index where <search> occurs, or -1 if the element is not found.
     * @extra [fromIndex] is the index from which to begin the search. This method performs a simple strict equality comparison on <search>.
     * @example
     *
     *   [1,2,1].lastIndexOf(1)                 -> 2
     *   [1,2,1].lastIndexOf(7)                 -> -1
     *
     ***/
    'lastIndexOf': function(search, fromIndex) {
      if(object.isString(this)) return this.lastIndexOf(search, fromIndex);
      return arrayIndexOf(this, search, fromIndex, -1);
    },

    /***
     * @method forEach([fn], [scope])
     * @returns Nothing
     * @short Iterates over the array, calling [fn] on each loop.
     * @extra This method is only provided for those browsers that do not support it natively. [scope] becomes the %this% object.
     * @example
     *
     *   ['a','b','c'].forEach(function(a) {
     *     // Called 3 times: 'a','b','c'
     *   });
     *
     ***/
    'forEach': function(fn, scope) {
      var length = this.length, index = 0;
      checkCallback(fn);
      while(index < length) {
        if(index in this) {
          fn.call(scope, this[index], index, this);
        }
        index++;
      }
    },

    /***
     * @method reduce([fn], [init])
     * @returns Mixed
     * @short Reduces the array to a single result.
     * @extra By default this method calls [fn] n - 1 times, where n is the length of the array. On the first call it is passed the first and second elements in the array. The result of that callback will then be passed into the next iteration until it reaches the end, where the accumulated value will be returned as the final result. If [init] is passed, it will call [fn] one extra time in the beginning passing in [init] along with the first element. This method is only provided for those browsers that do not support it natively.
     * @example
     *
     +   [1,2,3,4].reduce(function(a, b) {
     *     return a + b;
     *   });
     +   [1,2,3,4].reduce(function(a, b) {
     *     return a + b;
     *   }, 100);
     *
     ***/
    'reduce': function(fn, init) {
      return arrayReduce(this, fn, init);
    },

    /***
     * @method reduceRight([fn], [init])
     * @returns Mixed
     * @short Reduces the array to a single result by stepping through it from the right.
     * @extra By default this method calls [fn] n - 1 times, where n is the length of the array. On the first call it is passed the last and second to last elements in the array. The result of that callback will then be passed into the next iteration until it reaches the beginning, where the accumulated value will be returned as the final result. If [init] is passed, it will call [fn] one extra time in the beginning passing in [init] along with the last element. This method is only provided for those browsers that do not support it natively.
     * @example
     *
     +   [1,2,3,4].reduceRight(function(a, b) {
     *     return a - b;
     *   });
     *
     ***/
    'reduceRight': function(fn, init) {
      return arrayReduce(this, fn, init, true);
    },

    /***
     * @method each(<fn>, [index] = 0, [loop] = false)
     * @returns Array
     * @short Runs <fn> against elements in the array. Enhanced version of %Array#forEach%.
     * @extra Parameters passed to <fn> are identical to %forEach%, ie. the first parameter is the current element, second parameter is the current index, and third parameter is the array itself. If <fn> returns %false% at any time it will break out of the loop. Once %each% finishes, it will return the array. If [index] is passed, <fn> will begin at that index and work its way to the end. If [loop] is true, it will then start over from the beginning of the array and continue until it reaches [index] - 1.
     * @example
     *
     *   [1,2,3,4].each(function(n) {
     *     // Called 4 times: 1, 2, 3, 4
     *   });
     *   [1,2,3,4].each(function(n) {
     *     // Called 4 times: 3, 4, 1, 2
     *   }, 2, true);
     *
     ***/
    'each': function(fn, index, loop) {
      arrayEach(this, fn, index, loop, true);
      return this;
    },

    /***
     * @method find(<f>, [index] = 0, [loop] = false)
     * @returns Mixed
     * @short Returns the first element that matches <f>.
     * @extra <f> will match a string, number, array, object, or alternately test against a function or regex. Starts at [index], and will continue once from index = 0 if [loop] is true.
     * @example
     *
     +   [{a:1,b:2},{a:1,b:3},{a:1,b:4}].find(function(n) {
     *     return n['a'] == 1;
     *   });                                     -> {a:1,b:3}
     *   ['cuba','japan','canada'].find(/^c/, 2) -> 'canada'
     *
     ***/
    'find': function(f, index, loop) {
      return arrayFind(this, f, index, loop);
    },

    /***
     * @method findAll(<f>, [index] = 0, [loop] = false)
     * @returns Array
     * @short Returns all elements that match <f>.
     * @extra <f> will match a string, number, array, object, or alternately test against a function or regex. Starts at [index], and will continue once from index = 0 if [loop] is true.
     * @example
     *
     +   [{a:1,b:2},{a:1,b:3},{a:2,b:4}].findAll(function(n) {
     *     return n['a'] == 1;
     *   });                                        -> [{a:1,b:3},{a:1,b:4}]
     *   ['cuba','japan','canada'].findAll(/^c/)    -> 'cuba','canada'
     *   ['cuba','japan','canada'].findAll(/^c/, 2) -> 'canada'
     *
     ***/
    'findAll': function(f, index, loop) {
      var result = [];
      arrayEach(this, function(el, i, arr) {
        if(multiMatch(el, f, arr, [i, arr])) {
          result.push(el);
        }
      }, index, loop);
      return result;
    },

    /***
     * @method findIndex(<f>, [startIndex] = 0, [loop] = false)
     * @returns Number
     * @short Returns the index of the first element that matches <f> or -1 if not found.
     * @extra This method has a few notable differences to native %indexOf%. Although <f> will similarly match a primitive such as a string or number, it will also match deep objects and arrays that are not equal by reference (%===%). Additionally, if a function is passed it will be run as a matching function (similar to the behavior of %Array#filter%) rather than attempting to find that function itself by reference in the array. Finally, a regexp will be matched against elements in the array, presumed to be strings. Starts at [index], and will continue once from index = 0 if [loop] is true.
     * @example
     *
     +   [1,2,3,4].findIndex(3);  -> 2
     +   [1,2,3,4].findIndex(function(n) {
     *     return n % 2 == 0;
     *   }); -> 1
     +   ['one','two','three'].findIndex(/th/); -> 2
     *
     ***/
    'findIndex': function(f, startIndex, loop) {
      var index = arrayFind(this, f, startIndex, loop, true);
      return isUndefined(index) ? -1 : index;
    },

    /***
     * @method count(<f>)
     * @returns Number
     * @short Counts all elements in the array that match <f>.
     * @extra <f> will match a string, number, array, object, or alternately test against a function or regex.
     * @example
     *
     *   [1,2,3,1].count(1)       -> 2
     *   ['a','b','c'].count(/b/) -> 1
     +   [{a:1},{b:2}].count(function(n) {
     *     return n['a'] > 1;
     *   });                      -> 0
     *
     ***/
    'count': function(f) {
      if(isUndefined(f)) return this.length;
      return this.findAll(f).length;
    },

    /***
     * @method none(<f>)
     * @returns Boolean
     * @short Returns true if none of the elements in the array match <f>.
     * @extra <f> will match a string, number, array, object, or alternately test against a function or regex.
     * @example
     *
     *   [1,2,3].none(5)         -> true
     *   ['a','b','c'].none(/b/) -> false
     +   [{a:1},{b:2}].none(function(n) {
     *     return n['a'] > 1;
     *   });                     -> true
     *
     ***/
    'none': function() {
      return !this.any.apply(this, arguments);
    },

    /***
     * @method remove([f1], [f2], ...)
     * @returns Array
     * @short Removes any element in the array that matches [f1], [f2], etc.
     * @extra Will match a string, number, array, object, or alternately test against a function or regex. This method will change the array! Use %exclude% for a non-destructive alias.
     * @example
     *
     *   [1,2,3].remove(3)         -> [1,2]
     *   ['a','b','c'].remove(/b/) -> ['a','c']
     +   [{a:1},{b:2}].remove(function(n) {
     *     return n['a'] == 1;
     *   });                       -> [{b:2}]
     *
     ***/
    'remove': function() {
      var i, arr = this;
      multiArgs(arguments, function(f) {
        i = 0;
        while(i < arr.length) {
          if(multiMatch(arr[i], f, arr, [i, arr])) {
            arr.splice(i, 1);
          } else {
            i++;
          }
        }
      });
      return arr;
    },

    /***
     * @method removeAt(<start>, [end])
     * @returns Array
     * @short Removes element at <start>. If [end] is specified, removes the range between <start> and [end]. This method will change the array! If you don't intend the array to be changed use %clone% first.
     * @example
     *
     *   ['a','b','c'].removeAt(0) -> ['b','c']
     *   [1,2,3,4].removeAt(1, 3)  -> [1]
     *
     ***/
    'removeAt': function(start, end) {
      if(isUndefined(start)) return this;
      if(isUndefined(end)) end = start;
      for(var i = 0; i <= (end - start); i++) {
        this.splice(start, 1);
      }
      return this;
    },

    /***
     * @method add(<el>, [index])
     * @returns Array
     * @short Adds <el> to the array.
     * @extra If [index] is specified, it will add at [index], otherwise adds to the end of the array. %add% behaves like %concat% in that if <el> is an array it will be joined, not inserted. This method will change the array! Use %include% for a non-destructive alias. Also, %insert% is provided as an alias that reads better when using an index.
     * @example
     *
     *   [1,2,3,4].add(5)       -> [1,2,3,4,5]
     *   [1,2,3,4].add([5,6,7]) -> [1,2,3,4,5,6,7]
     *   [1,2,3,4].insert(8, 1) -> [1,8,2,3,4]
     *
     ***/
    'add': function(el, index) {
      if(!object.isNumber(number(index)) || isNaN(index) || index == -1) index = this.length;
      else if(index < -1) index += 1;
      array.prototype.splice.apply(this, [index, 0].concat(el));
      return this;
    },

    /***
     * @method include(<el>, [index])
     * @returns Array
     * @short Adds <el> to the array.
     * @extra This is a non-destructive alias for %add%. It will not change the original array.
     * @example
     *
     *   [1,2,3,4].include(5)       -> [1,2,3,4,5]
     *   [1,2,3,4].include(8, 1)    -> [1,8,2,3,4]
     *   [1,2,3,4].include([5,6,7]) -> [1,2,3,4,5,6,7]
     *
     ***/
    'include': function(el, index) {
      return this.clone().add(el, index);
    },

    /***
     * @method exclude([f1], [f2], ...)
     * @returns Array
     * @short Removes any element in the array that matches [f1], [f2], etc.
     * @extra This is a non-destructive alias for %remove%. It will not change the original array.
     * @example
     *
     *   [1,2,3].exclude(3)         -> [1,2]
     *   ['a','b','c'].exclude(/b/) -> ['a','c']
     +   [{a:1},{b:2}].exclude(function(n) {
     *     return n['a'] == 1;
     *   });                       -> [{b:2}]
     *
     ***/
    'exclude': function() {
      return array.prototype.remove.apply(this.clone(), arguments);
    },

    /***
     * @method clone()
     * @returns Array
     * @short Clones the array.
     * @example
     *
     *   [1,2,3].clone() -> [1,2,3]
     *
     ***/
    'clone': function() {
      return object.merge([], this);
    },

    /***
     * @method unique([map] = null)
     * @returns Array
     * @short Removes all duplicate elements in the array.
     * @extra [map] may be a function mapping the value to be uniqued on or a string acting as a shortcut. This is most commonly used when you have a key that ensures the object's uniqueness, and don't need to check all fields.
     * @example
     *
     *   [1,2,2,3].unique()                 -> [1,2,3]
     *   [{foo:'bar'},{foo:'bar'}].unique() -> [{foo:'bar'}]
     +   [{foo:'bar'},{foo:'bar'}].unique(function(obj){
     *     return obj.foo;
     *   }); -> [{foo:'bar'}]
     *   [{foo:'bar'},{foo:'bar'}].unique('foo') -> [{foo:'bar'}]
     *
     ***/
    'unique': function(map) {
      return arrayUnique(this, map);
    },

    /***
     * @method union([a1], [a2], ...)
     * @returns Array
     * @short Returns an array containing all elements in all arrays with duplicates removed.
     * @example
     *
     *   [1,3,5].union([5,7,9])     -> [1,3,5,7,9]
     *   ['a','b'].union(['b','c']) -> ['a','b','c']
     *
     ***/
    'union': function() {
      var arr = this;
      multiArgs(arguments, function(arg) {
        arr = arr.concat(arg);
      });
      return arrayUnique(arr);
    },

    /***
     * @method intersect([a1], [a2], ...)
     * @returns Array
     * @short Returns an array containing the elements all arrays have in common.
     * @example
     *
     *   [1,3,5].intersect([5,7,9])   -> [5]
     *   ['a','b'].intersect('b','c') -> ['b']
     *
     ***/
    'intersect': function() {
      return arrayIntersect(this, multiArgs(arguments, null, true), false);
    },

    /***
     * @method subtract([a1], [a2], ...)
     * @returns Array
     * @short Subtracts from the array all elements in [a1], [a2], etc.
     * @example
     *
     *   [1,3,5].subtract([5,7,9])   -> [1,3]
     *   [1,3,5].subtract([3],[5])   -> [1]
     *   ['a','b'].subtract('b','c') -> ['a']
     *
     ***/
    'subtract': function(a) {
      return arrayIntersect(this, multiArgs(arguments, null, true), true);
    },

    /***
     * @method at(<index>, [loop] = true)
     * @returns Mixed
     * @short Gets the element(s) at a given index.
     * @extra When [loop] is true, overshooting the end of the array (or the beginning) will begin counting from the other end. As an alternate syntax, passing multiple indexes will get the elements at those indexes.
     * @example
     *
     *   [1,2,3].at(0)        -> 1
     *   [1,2,3].at(2)        -> 3
     *   [1,2,3].at(4)        -> 2
     *   [1,2,3].at(4, false) -> null
     *   [1,2,3].at(-1)       -> 3
     *   [1,2,3].at(0,1)      -> [1,2]
     *
     ***/
    'at': function() {
      return entryAtIndex(this, arguments);
    },

    /***
     * @method first([num] = 1)
     * @returns Mixed
     * @short Returns the first element(s) in the array.
     * @extra When <num> is passed, returns the first <num> elements in the array.
     * @example
     *
     *   [1,2,3].first()        -> 1
     *   [1,2,3].first(2)       -> [1,2]
     *
     ***/
    'first': function(num) {
      if(isUndefined(num)) return this[0];
      if(num < 0) num = 0;
      return this.slice(0, num);
    },

    /***
     * @method last([num] = 1)
     * @returns Mixed
     * @short Returns the last element(s) in the array.
     * @extra When <num> is passed, returns the last <num> elements in the array.
     * @example
     *
     *   [1,2,3].last()        -> 3
     *   [1,2,3].last(2)       -> [2,3]
     *
     ***/
    'last': function(num) {
      if(isUndefined(num)) return this[this.length - 1];
      var start = this.length - num < 0 ? 0 : this.length - num;
      return this.slice(start);
    },

    /***
     * @method from(<index>)
     * @returns Array
     * @short Returns a slice of the array from <index>.
     * @example
     *
     *   [1,2,3].from(1)  -> [2,3]
     *   [1,2,3].from(2)  -> [3]
     *
     ***/
    'from': function(num) {
      return this.slice(num);
    },

    /***
     * @method to(<index>)
     * @returns Array
     * @short Returns a slice of the array up to <index>.
     * @example
     *
     *   [1,2,3].to(1)  -> [1]
     *   [1,2,3].to(2)  -> [1,2]
     *
     ***/
    'to': function(num) {
      if(isUndefined(num)) num = this.length;
      return this.slice(0, num);
    },

    /***
     * @method min([map])
     * @returns Array
     * @short Returns the elements in the array with the lowest value.
     * @extra [map] may be a function mapping the value to be checked or a string acting as a shortcut.
     * @example
     *
     *   [1,2,3].min()                    -> [1]
     *   ['fee','fo','fum'].min('length') -> ['fo']
     +   ['fee','fo','fum'].min(function(n) {
     *     return n.length;
     *   });                              -> ['fo']
     +   [{a:3,a:2}].min(function(n) {
     *     return n['a'];
     *   });                              -> [{a:2}]
     *
     ***/
    'min': function(map) {
      return arrayUnique(getMinOrMax(this, map, 'min', true));
    },

    /***
     * @method max(<map>)
     * @returns Array
     * @short Returns the elements in the array with the greatest value.
     * @extra <map> may be a function mapping the value to be checked or a string acting as a shortcut.
     * @example
     *
     *   [1,2,3].max()                    -> [3]
     *   ['fee','fo','fum'].max('length') -> ['fee','fum']
     +   [{a:3,a:2}].max(function(n) {
     *     return n['a'];
     *   });                              -> [{a:3}]
     *
     ***/
    'max': function(map) {
      return arrayUnique(getMinOrMax(this, map, 'max', true));
    },

    /***
     * @method least(<map>)
     * @returns Array
     * @short Returns the elements in the array with the least commonly occuring value.
     * @extra <map> may be a function mapping the value to be checked or a string acting as a shortcut.
     * @example
     *
     *   [3,2,2].least()                   -> [3]
     *   ['fe','fo','fum'].least('length') -> ['fum']
     +   [{age:35,name:'ken'},{age:12,name:'bob'},{age:12,name:'ted'}].least(function(n) {
     *     return n.age;
     *   });                               -> [{age:35,name:'ken'}]
     *
     ***/
    'least': function() {
      var result = arrayFlatten(getMinOrMax(this.groupBy.apply(this, arguments), 'length', 'min'));
      return result.length === this.length ? [] : arrayUnique(result);
    },

    /***
     * @method most(<map>)
     * @returns Array
     * @short Returns the elements in the array with the most commonly occuring value.
     * @extra <map> may be a function mapping the value to be checked or a string acting as a shortcut.
     * @example
     *
     *   [3,2,2].most()                   -> [2]
     *   ['fe','fo','fum'].most('length') -> ['fe','fo']
     +   [{age:35,name:'ken'},{age:12,name:'bob'},{age:12,name:'ted'}].most(function(n) {
     *     return n.age;
     *   });                              -> [{age:12,name:'bob'},{age:12,name:'ted'}]
     *
     ***/
    'most': function() {
      var result = arrayFlatten(getMinOrMax(this.groupBy.apply(this, arguments), 'length', 'max'));
      return result.length === this.length ? [] : arrayUnique(result);
    },

    /***
     * @method sum(<map>)
     * @returns Number
     * @short Sums all values in the array.
     * @extra <map> may be a function mapping the value to be summed or a string acting as a shortcut.
     * @example
     *
     *   [1,2,2].sum()                           -> 5
     +   [{age:35},{age:12},{age:12}].sum(function(n) {
     *     return n.age;
     *   });                                     -> 59
     *   [{age:35},{age:12},{age:12}].sum('age') -> 59
     *
     ***/
    'sum': function(map) {
      var arr = map ? this.map(map) : this;
      return arr.length > 0 ? arr.reduce(function(a,b) { return a + b; }) : 0;
    },

    /***
     * @method average(<map>)
     * @returns Number
     * @short Averages all values in the array.
     * @extra <map> may be a function mapping the value to be averaged or a string acting as a shortcut.
     * @example
     *
     *   [1,2,3].average()                           -> 2
     +   [{age:35},{age:11},{age:11}].average(function(n) {
     *     return n.age;
     *   });                                         -> 19
     *   [{age:35},{age:11},{age:11}].average('age') -> 19
     *
     ***/
    'average': function(map) {
      var arr = map ? this.map(map) : this;
      return arr.length > 0 ? arr.sum() / arr.length : 0;
    },

    /***
     * @method groupBy(<map>, [fn])
     * @returns Object
     * @short Groups the array by <map>.
     * @extra Will return an object with keys equal to the grouped values. <map> may be a mapping function, or a string acting as a shortcut. Optionally calls [fn] for each group.
     * @example
     *
     *   ['fee','fi','fum'].groupBy('length') -> { 2: ['fi'], 3: ['fee','fum'] }
     +   [{age:35,name:'ken'},{age:15,name:'bob'}].groupBy(function(n) {
     *     return n.age;
     *   });                                  -> { 35: [{age:35,name:'ken'}], 15: [{age:15,name:'bob'}] }
     *
     ***/
    'groupBy': function(map, fn) {
      var arr = this, result = object.extended(), key;
      arrayEach(arr, function(el, index) {
        key = transformArgument(el, map, arr, [el, index, arr]);
        if(!result[key]) result[key] = [];
        result[key].push(el);
      });
      return result.each(fn);
    },

    /***
     * @method inGroups(<num>, [padding])
     * @returns Array
     * @short Groups the array into <num> arrays.
     * @extra [padding] specifies a value with which to pad the last array so that they are all equal length.
     * @example
     *
     *   [1,2,3,4,5,6,7].inGroups(3)         -> [ [1,2,3], [4,5,6], [7] ]
     *   [1,2,3,4,5,6,7].inGroups(3, 'none') -> [ [1,2,3], [4,5,6], [7,'none','none'] ]
     *
     ***/
    'inGroups': function(num, padding) {
      var pad = arguments.length > 1;
      var arr = this;
      var result = [];
      var divisor = (this.length / num).ceil();
      (0).upto(num - 1, function(i) {
        var index = i * divisor;
        var group = arr.slice(index, index + divisor);
        if(pad && group.length < divisor) {
          (divisor - group.length).times(function() {
            group = group.add(padding);
          });
        }
        result.push(group);
      });
      return result;
    },

    /***
     * @method inGroupsOf(<num>, [padding] = null)
     * @returns Array
     * @short Groups the array into arrays of <num> elements each.
     * @extra [padding] specifies a value with which to pad the last array so that they are all equal length.
     * @example
     *
     *   [1,2,3,4,5,6,7].inGroupsOf(4)         -> [ [1,2,3,4], [5,6,7] ]
     *   [1,2,3,4,5,6,7].inGroupsOf(4, 'none') -> [ [1,2,3,4], [5,6,7,'none'] ]
     *
     ***/
    'inGroupsOf': function(num, padding) {
      if(this.length === 0 || num === 0) return this;
      if(isUndefined(num)) num = 1;
      if(isUndefined(padding)) padding = null;
      var result = [];
      var group = null;
      var len = this.length;
      this.each(function(el, i) {
        if((i % num) === 0) {
          if(group) result.push(group);
          group = [];
        }
        if(isUndefined(el)) el = padding;
        group.push(el);
      });
      if(!this.length.isMultipleOf(num)) {
        (num - (this.length % num)).times(function() {
          group.push(padding);
        });
        this.length = this.length + (num - (this.length % num));
      }
      if(group.length > 0) result.push(group);
      return result;
    },

    /***
     * @method compact([all] = false)
     * @returns Array
     * @short Removes all instances of %undefined%, %null%, and %NaN% from the array.
     * @extra If [all] is %true%, all "falsy" elements will be removed. This includes empty strings, 0, and false.
     * @example
     *
     *   [1,null,2,undefined,3].compact() -> [1,2,3]
     *   [1,'',2,false,3].compact()       -> [1,'',2,false,3]
     *   [1,'',2,false,3].compact(true)   -> [1,2,3]
     *
     ***/
    'compact': function(all) {
      var result = [];
      arrayEach(this, function(el, i) {
        if(object.isArray(el)) {
          result.push(el.compact());
        } else if(all && el) {
          result.push(el);
        } else if(!all && el != null && !object.isNaN(el)) {
          result.push(el);
        }
      });
      return result;
    },

    /***
     * @method isEmpty()
     * @returns Boolean
     * @short Returns true if the array is empty.
     * @extra This is true if the array has a length of zero, or contains only %undefined%, %null%, or %NaN%.
     * @example
     *
     *   [].isEmpty()               -> true
     *   [null,undefined].isEmpty() -> true
     *
     ***/
    'isEmpty': function() {
      return this.compact().length == 0;
    },

    /***
     * @method flatten([limit] = Infinity)
     * @returns Array
     * @short Returns a flattened, one-dimensional copy of the array.
     * @extra You can optionally specify a [limit], which will only flatten that depth.
     * @example
     *
     *   [[1], 2, [3]].flatten()      -> [1,2,3]
     *   [['a'],[],'b','c'].flatten() -> ['a','b','c']
     *
     ***/
    'flatten': function(limit) {
      return arrayFlatten(this, limit);
    },

    /***
     * @method sortBy(<map>, [desc] = false)
     * @returns Array
     * @short Sorts the array by <map>.
     * @extra <map> may be a function, a string acting as a shortcut, or blank (direct comparison of array values). [desc] will sort the array in descending order. When the field being sorted on is a string, the resulting order will be determined by an internal algorithm that is optimized for major Western languages, but can be customized. For more information see @array_sorting.
     * @example
     *
     *   ['world','a','new'].sortBy('length')       -> ['a','new','world']
     *   ['world','a','new'].sortBy('length', true) -> ['world','new','a']
     +   [{age:72},{age:13},{age:18}].sortBy(function(n) {
     *     return n.age;
     *   });                                        -> [{age:13},{age:18},{age:72}]
     *
     ***/
    'sortBy': function(map, desc) {
      var arr = this.clone();
      arr.sort(function(a, b) {
        var aProperty, bProperty, comp;
        aProperty = transformArgument(a, map, arr, [a]);
        bProperty = transformArgument(b, map, arr, [b]);
        if(object.isString(aProperty) && object.isString(bProperty)) {
          comp = collateStrings(aProperty, bProperty);
        } else if(aProperty < bProperty) {
          comp = -1;
        } else if(aProperty > bProperty) {
          comp = 1;
        } else {
          comp = 0;
        }
        return comp * (desc ? -1 : 1);
      });
      return arr;
    },

    /***
     * @method randomize()
     * @returns Array
     * @short Randomizes the array.
     * @extra Uses Fisher-Yates algorithm.
     * @example
     *
     *   [1,2,3,4].randomize()  -> [?,?,?,?]
     *
     ***/
    'randomize': function() {
      var a = this.concat();
      for(var j, x, i = a.length; i; j = parseInt(Math.random() * i), x = a[--i], a[i] = a[j], a[j] = x) {};
      return a;
    },

    /***
     * @method zip([arr1], [arr2], ...)
     * @returns Array
     * @short Merges multiple arrays together.
     * @extra This method "zips up" smaller arrays into one large whose elements are "all elements at index 0", "all elements at index 1", etc. Useful when you have associated data that is split over separated arrays. If the arrays passed have more elements than the original array, they will be discarded. If they have fewer elements, the missing elements will filled with %null%.
     * @example
     *
     *   [1,2,3].zip([4,5,6])                                       -> [[1,2], [3,4], [5,6]]
     *   ['Martin','John'].zip(['Luther','F.'], ['King','Kennedy']) -> [['Martin','Luther','King'], ['John','F.','Kennedy']]
     *
     ***/
    'zip': function() {
      var args = getArgs(arguments);
      return this.map(function(el, i) {
        return [el].concat(args.map(function(k) {
          return (i in k) ? k[i] : null;
        }));
      });
    },

    /***
     * @method sample([num] = null)
     * @returns Mixed
     * @short Returns a random element from the array.
     * @extra If [num] is a number greater than 0, will return an array containing [num] samples.
     * @example
     *
     *   [1,2,3,4,5].sample()  -> // Random element
     *   [1,2,3,4,5].sample(3) -> // Array of 3 random elements
     *
     ***/
    'sample': function(num) {
      var result = [], arr = this.clone(), index;
      if(!(num > 0)) num = 1;
      while(result.length < num) {
        index = Number.random(0, arr.length - 1);
        result.push(arr[index]);
        arr.removeAt(index);
        if(arr.length == 0) break;
      }
      return arguments.length > 0 ? result : result[0];
    }

  });


  // Aliases
  extend(array, true, false, {

    /***
     * @method all()
     * @alias every
     *
     ***/
    'all': array.prototype.every,

    /*** @method any()
     * @alias some
     *
     ***/
    'any': array.prototype.some,

    /***
     * @method has()
     * @alias some
     *
     ***/
    'has': array.prototype.some,

    /***
     * @method insert()
     * @alias add
     *
     ***/
    'insert': array.prototype.add

  });










  /***
   * Number module
   *
   ***/


  function round(val, precision, method) {
    var fn = Math[method || 'round'];
    var multiplier = Math.pow(10, (precision || 0).abs());
    if(precision < 0) multiplier = 1 / multiplier;
    return fn(val * multiplier) / multiplier;
  }

  function getRange(start, stop, fn, step) {
    var arr = [], i = parseInt(start), up = step > 0;
    while((up && i <= stop) || (!up && i >= stop)) {
      arr.push(i);
      if(fn) fn.call(this, i);
      i += step;
    }
    return arr;
  }

  function abbreviateNumber(num, roundTo, str, mid, limit, bytes) {
    var fixed        = num.toFixed(20),
        decimalPlace = fixed.search(/\./),
        numeralPlace = fixed.search(/[1-9]/),
        significant  = decimalPlace - numeralPlace,
        unit, i, divisor;
    if(significant > 0) {
      significant -= 1;
    }
    i = Math.max(Math.min((significant / 3).floor(), limit === false ? str.length : limit), -mid);
    unit = str.charAt(i + mid - 1);
    if(significant < -9) {
      i = -3;
      roundTo = significant.abs() - 9;
      unit = str.first();
    }
    divisor = bytes ? (2).pow(10 * i) : (10).pow(i * 3);
    return (num / divisor).round(roundTo || 0).format() + unit.trim();
  }


  extend(number, false, false, {

    /***
     * @method Number.random([n1], [n2])
     * @returns Number
     * @short Returns a random integer between [n1] and [n2].
     * @extra If only 1 number is passed, the other will be 0. If none are passed, the number will be either 0 or 1.
     * @example
     *
     *   Number.random(50, 100) -> ex. 85
     *   Number.random(50)      -> ex. 27
     *   Number.random()        -> ex. 0
     *
     ***/
    'random': function(n1, n2) {
      var min, max;
      if(arguments.length == 1) n2 = n1, n1 = 0;
      min = Math.min(n1 || 0, isUndefined(n2) ? 1 : n2);
      max = Math.max(n1 || 0, isUndefined(n2) ? 1 : n2);
      return round((Math.random() * (max - min)) + min);
    }

  });

  extend(number, true, false, {

    /***
     * @method toNumber()
     * @returns Number
     * @short Returns a number. This is mostly for compatibility reasons.
     * @example
     *
     *   (420).toNumber() -> 420
     *
     ***/
    'toNumber': function() {
      return parseFloat(this, 10);
    },

    /***
     * @method abbr([precision] = 0)
     * @returns String
     * @short Returns an abbreviated form of the number.
     * @extra [precision] will round to the given precision.
     * @example
     *
     *   (1000).abbr()    -> "1k"
     *   (1000000).abbr() -> "1m"
     *   (1280).abbr(1)   -> "1.3k"
     *
     ***/
    'abbr': function(precision) {
      return abbreviateNumber(this, precision, 'kmbt', 0, 4);
    },

    /***
     * @method metric([precision] = 0, [limit] = 1)
     * @returns String
     * @short Returns the number as a string in metric notation.
     * @extra [precision] will round to the given precision. Both very large numbers and very small numbers are supported. [limit] is the upper limit for the units. The default is %1%, which is "kilo". If [limit] is %false%, the upper limit will be "exa". The lower limit is "nano", and cannot be changed.
     * @example
     *
     *   (1000).metric()            -> "1k"
     *   (1000000).metric()         -> "1,000k"
     *   (1000000).metric(0, false) -> "1M"
     *   (1249).metric(2) + 'g'     -> "1.25kg"
     *   (0.025).metric() + 'm'     -> "25mm"
     *
     ***/
    'metric': function(precision, limit) {
      return abbreviateNumber(this, precision, 'nμm kMGTPE', 4, isUndefined(limit) ? 1 : limit);
    },

    /***
     * @method bytes([precision] = 0, [limit] = 4)
     * @returns String
     * @short Returns an abbreviated form of the number, considered to be "Bytes".
     * @extra [precision] will round to the given precision. [limit] is the upper limit for the units. The default is %4%, which is "terabytes" (TB). If [limit] is %false%, the upper limit will be "exa".
     * @example
     *
     *   (1000).bytes()                 -> "1kB"
     *   (1000).bytes(2)                -> "0.98kB"
     *   ((10).pow(20)).bytes()         -> "90,949,470TB"
     *   ((10).pow(20)).bytes(0, false) -> "87EB"
     *
     ***/
    'bytes': function(precision, limit) {
      return abbreviateNumber(this, precision, 'kMGTPE', 0, isUndefined(limit) ? 4 : limit, true) + 'B';
    },

    /***
     * @method isInteger()
     * @returns Boolean
     * @short Returns true if the number has no trailing decimal.
     * @example
     *
     *   (420).isInteger() -> true
     *   (4.5).isInteger() -> false
     *
     ***/
    'isInteger': function() {
      return this % 1 == 0;
    },

    /***
     * @method ceil([precision] = 0)
     * @returns Number
     * @short Rounds the number up. [precision] will round to the given precision.
     * @example
     *
     *   (4.434).ceil()  -> 5
     *   (-4.434).ceil() -> -4
     *   (44.17).ceil(1) -> 44.2
     *   (4417).ceil(-2) -> 4500
     *
     ***/
    'ceil': function(precision) {
      return round(this, precision, 'ceil');
    },

    /***
     * @method floor([precision] = 0)
     * @returns Number
     * @short Rounds the number down. [precision] will round to the given precision.
     * @example
     *
     *   (4.434).floor()  -> 4
     *   (-4.434).floor() -> -5
     *   (44.17).floor(1) -> 44.1
     *   (4417).floor(-2) -> 4400
     *
     ***/
    'floor': function(precision) {
      return round(this, precision, 'floor');
    },

    /***
     * @method abs()
     * @returns Number
     * @short Returns the absolute value for the number.
     * @example
     *
     *   (3).abs()  -> 3
     *   (-3).abs() -> 3
     *
     ***/
    'abs': function() {
      return Math.abs(this);
    },

    /***
     * @method pow(<p> = 1)
     * @returns Number
     * @short Returns the number to the power of <p>.
     * @example
     *
     *   (3).pow(2) -> 9
     *   (3).pow(3) -> 27
     *   (3).pow()  -> 3
     *
     ***/
    'pow': function(power) {
      if(isUndefined(power)) power = 1;
      return Math.pow(this, power);
    },

    /***
     * @method round(<precision> = 0)
     * @returns Number
     * @short Rounds a number to the precision of <precision>.
     * @example
     *
     *   (3.241).round()  -> 3
     *   (3.841).round()  -> 4
     *   (-3.241).round() -> -3
     *   (-3.841).round() -> -4
     *   (3.241).round(2) -> 3.24
     *   (3748).round(-2) -> 3800
     *
     ***/
    'round': function(precision) {
      return round(this, precision, 'round');
    },

    /***
     * @method chr()
     * @returns String
     * @short Returns a string at the code point of the number.
     * @example
     *
     *   (65).chr() -> "A"
     *   (75).chr() -> "K"
     *
     ***/
    'chr': function() {
      return string.fromCharCode(this);
    },

    /***
     * @method isOdd()
     * @returns Boolean
     * @short Returns true if the number is odd.
     * @example
     *
     *   (3).isOdd()  -> true
     *   (18).isOdd() -> false
     *
     ***/
    'isOdd': function() {
      return !this.isMultipleOf(2);
    },

    /***
     * @method isEven()
     * @returns Boolean
     * @short Returns true if the number is even.
     * @example
     *
     *   (6).isEven()  -> true
     *   (17).isEven() -> false
     *
     ***/
    'isEven': function() {
      return this.isMultipleOf(2);
    },

    /***
     * @method isMultipleOf(<num>)
     * @returns Boolean
     * @short Returns true if the number is a multiple of <num>.
     * @example
     *
     *   (6).isMultipleOf(2)  -> true
     *   (17).isMultipleOf(2) -> false
     *   (32).isMultipleOf(4) -> true
     *   (34).isMultipleOf(4) -> false
     *
     ***/
    'isMultipleOf': function(num) {
      return this % num === 0;
    },

    /***
     * @method upto(<num>, [fn], [step] = 1)
     * @returns Array
     * @short Returns an array containing numbers from the number up to <num>.
     * @extra Optionally calls [fn] callback for each number in that array. [step] allows multiples greater than 1.
     * @example
     *
     *   (2).upto(6) -> [2, 3, 4, 5, 6]
     *   (2).upto(6, function(n) {
     *     // This function is called 5 times receiving n as the value.
     *   });
     *   (2).upto(8, null, 2) -> [2, 4, 6, 8]
     *
     ***/
    'upto': function(num, fn, step) {
      return getRange(this, num, fn, step || 1);
    },

    /***
     * @method downto(<num>, [fn], [step] = 1)
     * @returns Array
     * @short Returns an array containing numbers from the number down to <num>.
     * @extra Optionally calls [fn] callback for each number in that array. [step] allows multiples greater than 1.
     * @example
     *
     *   (8).downto(3) -> [8, 7, 6, 5, 4, 3]
     *   (8).downto(3, function(n) {
     *     // This function is called 6 times receiving n as the value.
     *   });
     *   (8).downto(2, null, 2) -> [8, 6, 4, 2]
     *
     ***/
    'downto': function(num, fn, step) {
      return getRange(this, num, fn, -(step || 1));
    },


    /***
     * @method times(<fn>)
     * @returns Number
     * @short Calls <fn> a number of times equivalent to the number.
     * @example
     *
     *   (8).times(function(i) {
     *     // This function is called 8 times.
     *   });
     *
     ***/
    'times': function(fn) {
      if(fn) {
        for(var i = 0; i < this; i++) {
          fn.call(this, i);
        }
      }
      return this.toNumber();
    },

    /***
     * @method ordinalize()
     * @returns String
     * @short Returns an ordinalized (English) string, i.e. "1st", "2nd", etc.
     * @example
     *
     *   (1).ordinalize() -> '1st';
     *   (2).ordinalize() -> '2nd';
     *   (8).ordinalize() -> '8th';
     *
     ***/
    'ordinalize': function() {
      var suffix, num = this.abs(), last = num.toString().last(2).toNumber();
      if(last >= 11 && last <= 13) {
        suffix = 'th';
      } else {
        switch(num % 10) {
          case 1:  suffix = 'st'; break;
          case 2:  suffix = 'nd'; break;
          case 3:  suffix = 'rd'; break;
          default: suffix = 'th';
        }
      }
      return this.toString() + suffix;
    },


    /***
     * @method pad(<place> = 0, [sign] = false, [base] = 10)
     * @returns String
     * @short Pads a number with "0" to <place>.
     * @extra [sign] allows you to force the sign as well (+05, etc). [base] can change the base for numeral conversion.
     * @example
     *
     *   (5).pad(2)        -> '05'
     *   (-5).pad(4)       -> '-0005'
     *   (82).pad(3, true) -> '+082'
     *
     ***/
    'pad': function(place, sign, base) {
      base = base || 10;
      var str = this.toNumber() === 0 ? '' : this.toString(base).replace(/^-/, '');
      str = padString(str, '0', place - str.replace(/\.\d+$/, '').length, 0);
      if(sign || this < 0) {
        str = (this < 0 ? '-' : '+') + str;
      }
      return str;
    },

    /***
     * @method format([place] = 0, [thousands] = ',', [decimal] = '.')
     * @returns String
     * @short Formats the number to a readable string.
     * @extra If [place] is %undefined%, will automatically determine the place. [thousands] is the character used for the thousands separator. [decimal] is the character used for the decimal point.
     * @example
     *
     *   (56782).format()           -> '56,782'
     *   (56782).format(2)          -> '56,782.00'
     *   (4388.43).format(2, ' ')      -> '4 388.43'
     *   (4388.43).format(2, '.', ',') -> '4.388,43'
     *
     ***/
    'format': function(place, thousands, decimal) {
      var str, split, method, after, r = /(\d+)(\d{3})/;
      if(string(thousands).match(/\d/)) throw new TypeError('Thousands separator cannot contain numbers.');
      str = object.isNumber(place) ? round(this, place).toFixed(Math.max(place, 0)) : this.toString();
      thousands = thousands || ',';
      decimal = decimal || '.';
      split = str.split('.');
      str = split[0];
      after = split[1] || '';
      while (str.match(r)) {
        str = str.replace(r, '$1' + thousands + '$2');
      }
      if(after.length > 0) {
        str += decimal + padString(after, '0', 0, place - after.length);
      }
      return str;
    },

    /***
     * @method hex([pad] = 1)
     * @returns String
     * @short Converts the number to hexidecimal.
     * @extra [pad] will pad the resulting string to that many places.
     * @example
     *
     *   (255).hex()   -> 'ff';
     *   (255).hex(4)  -> '00ff';
     *   (23654).hex() -> '5c66';
     *
     ***/
    'hex': function(pad) {
      return this.pad(pad || 1, false, 16);
    }

  });





  /***
   * String module
   *
   ***/


  // WhiteSpace/LineTerminator as defined in ES5.1 plus Unicode characters in the Space, Separator category.
  var getTrimmableCharacters = function() {
    return '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u2028\u2029\u3000\uFEFF';
  }

  /***
   * @method has[Script]()
   * @returns Boolean
   * @short Returns true if the string contains any characters in that script.
   * @example
   *
   *   'أتكلم'.hasArabic()          -> true
   *   'визит'.hasCyrillic()        -> true
   *   '잘 먹겠습니다!'.hasHangul() -> true
   *   'ミックスです'.hasKatakana() -> true
   *   "l'année".hasLatin()         -> true
   *
   ***
   * @method is[Script]()
   * @returns Boolean
   * @short Returns true if the string contains only characters in that script. Whitespace is ignored.
   * @example
   *
   *   'أتكلم'.isArabic()          -> true
   *   'визит'.isCyrillic()        -> true
   *   '잘 먹겠습니다!'.isHangul() -> true
   *   'ミックスです'.isKatakana() -> false
   *   "l'année".isLatin()         -> true
   *
   ***
   * @method hasArabic()
   * @set hasScript
   ***
   * @method isArabic()
   * @set isScript
   ****
   * @method hasCyrillic()
   * @set hasScript
   ***
   * @method isCyrillic()
   * @set isScript
   ****
   * @method hasGreek()
   * @set hasScript
   ***
   * @method isGreek()
   * @set isScript
   ****
   * @method hasHangul()
   * @set hasScript
   ***
   * @method isHangul()
   * @set isScript
   ****
   * @method hasHan()
   * @set hasScript
   ***
   * @method isHan()
   * @set isScript
   ****
   * @method hasKanji()
   * @set hasScript
   ***
   * @method isKanji()
   * @set isScript
   ****
   * @method hasHebrew()
   * @set hasScript
   ***
   * @method isHebrew()
   * @set isScript
   ****
   * @method hasHiragana()
   * @set hasScript
   ***
   * @method isHiragana()
   * @set isScript
   ****
   * @method hasKana()
   * @set hasScript
   ***
   * @method isKana()
   * @set isScript
   ****
   * @method hasKatakana()
   * @set hasScript
   ***
   * @method isKatakana()
   * @set isScript
   ****
   * @method hasLatin()
   * @set hasScript
   ***
   * @method isKatakana()
   * @set isScript
   ****
   * @method hasThai()
   * @set hasScript
   ***
   * @method isThai()
   * @set isScript
   ****
   * @method hasDevanagari()
   * @set hasScript
   ***
   * @method isDevanagari()
   * @set isScript
   ***/
  var unicodeScripts = [
    { names: ['Arabic'],      source: '\u0600-\u06FF' },
    { names: ['Cyrillic'],    source: '\u0400-\u04FF' },
    { names: ['Devanagari'],  source: '\u0900-\u097F' },
    { names: ['Greek'],       source: '\u0370-\u03FF' },
    { names: ['Hangul'],      source: '\uAC00-\uD7AF\u1100-\u11FF' },
    { names: ['Han','Kanji'], source: '\u4E00-\u9FFF\uF900-\uFAFF' },
    { names: ['Hebrew'],      source: '\u0590-\u05FF' },
    { names: ['Hiragana'],    source: '\u3040-\u309F\u30FB-\u30FC' },
    { names: ['Kana'],        source: '\u3040-\u30FF\uFF61-\uFF9F' },
    { names: ['Katakana'],    source: '\u30A0-\u30FF\uFF61-\uFF9F' },
    { names: ['Latin'],       source: '\u0001-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F' },
    { names: ['Thai'],        source: '\u0E00-\u0E7F' }
  ];

  function buildUnicodeScripts() {
    unicodeScripts.each(function(s) {
      var is = regexp('^['+s.source+'\\s]+$');
      var has = regexp('['+s.source+']');
      s.names.each(function(name) {
        defineProperty(string.prototype, 'is' + name, function() { return is.test(this.trim()); });
        defineProperty(string.prototype, 'has' + name, function() { return has.test(this); });
      });
    });
  }

  function convertCharacterWidth(str, args, reg, table) {
    var mode = getArgs(args).join('');
    mode = mode.replace(/all/, '').replace(/(\w)lphabet|umbers?|atakana|paces?|unctuation/g, '$1');
    return str.replace(reg, function(c) {
      if(table[c] && (!mode || mode.has(table[c].type))) {
        return table[c].to;
      } else {
        return c;
      }
    });
  }

  var widthConversionRanges = [
    { type: 'a', shift: 65248, start: 65,  end: 90  },
    { type: 'a', shift: 65248, start: 97,  end: 122 },
    { type: 'n', shift: 65248, start: 48,  end: 57  },
    { type: 'p', shift: 65248, start: 33,  end: 47  },
    { type: 'p', shift: 65248, start: 58,  end: 64  },
    { type: 'p', shift: 65248, start: 91,  end: 96  },
    { type: 'p', shift: 65248, start: 123, end: 126 }
  ];

  var ZenkakuTable = {};
  var HankakuTable = {};
  var allHankaku   = /[\u0020-\u00A5]|[\uFF61-\uFF9F][ﾞﾟ]?/g;
  var allZenkaku   = /[\u3000-\u301C]|[\u301A-\u30FC]|[\uFF01-\uFF60]|[\uFFE0-\uFFE6]/g;
  var hankakuPunctuation  = '｡､｢｣¥¢£';
  var zenkakuPunctuation  = '。、「」￥￠￡';
  var voicedKatakana      = /[カキクケコサシスセソタチツテトハヒフヘホ]/;
  var semiVoicedKatakana  = /[ハヒフヘホヲ]/;
  var hankakuKatakana     = 'ｱｲｳｴｵｧｨｩｪｫｶｷｸｹｺｻｼｽｾｿﾀﾁﾂｯﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔｬﾕｭﾖｮﾗﾘﾙﾚﾛﾜｦﾝｰ･';
  var zenkakuKatakana     = 'アイウエオァィゥェォカキクケコサシスセソタチツッテトナニヌネノハヒフヘホマミムメモヤャユュヨョラリルレロワヲンー・';


  function buildWidthConversionTables() {
    var hankaku;
    arrayEach(widthConversionRanges, function(r) {
      r.start.upto(r.end, function(n) {
        setWidthConversion(r.type, n.chr(), (n + r.shift).chr());
      });
    });
    zenkakuKatakana.each(function(c, i) {
      hankaku = hankakuKatakana.charAt(i);
      setWidthConversion('k', hankaku, c);
      if(c.match(voicedKatakana)) {
        setWidthConversion('k', hankaku + 'ﾞ', c.shift(1));
      }
      if(c.match(semiVoicedKatakana)) {
        setWidthConversion('k', hankaku + 'ﾟ', c.shift(2));
      }
    });
    zenkakuPunctuation.each(function(c, i) {
      setWidthConversion('p', hankakuPunctuation.charAt(i), c);
    });
    setWidthConversion('k', 'ｳﾞ', 'ヴ');
    setWidthConversion('k', 'ｦﾞ', 'ヺ');
    setWidthConversion('s', ' ', '　');
  }

  function setWidthConversion(type, half, full) {
    ZenkakuTable[half] = { type: type, to: full };
    HankakuTable[full] = { type: type, to: half };
  }

  function padString(str, p, left, right) {
    var padding = String(p);
    if(padding != p) {
      padding = '';
    }
    if(!object.isNumber(left))  left = 1;
    if(!object.isNumber(right)) right = 1;
    return padding.repeat(left) + str + padding.repeat(right);
  }

  function getAcronym(word) {
    return string.Inflector && string.Inflector.acronyms && string.Inflector.acronyms[word];
  }

  var btoa, atob;

  function buildBase64(key) {
    if(this.btoa) {
      btoa = this.btoa;
      atob = this.atob;
    }
    var base64reg = /[^A-Za-z0-9\+\/\=]/g;
    btoa = function(str) {
      var output = '';
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;
      do {
        chr1 = str.charCodeAt(i++);
        chr2 = str.charCodeAt(i++);
        chr3 = str.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
          enc4 = 64;
        }
        output = output + key.charAt(enc1) + key.charAt(enc2) + key.charAt(enc3) + key.charAt(enc4);
        chr1 = chr2 = chr3 = '';
        enc1 = enc2 = enc3 = enc4 = '';
      } while (i < str.length);
      return output;
    }
    atob = function(input) {
      var output = '';
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;
      if(input.match(base64reg)) {
        throw new Error('String contains invalid base64 characters');
      }
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
      do {
        enc1 = key.indexOf(input.charAt(i++));
        enc2 = key.indexOf(input.charAt(i++));
        enc3 = key.indexOf(input.charAt(i++));
        enc4 = key.indexOf(input.charAt(i++));
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
        output = output + chr1.chr();
        if (enc3 != 64) {
          output = output + chr2.chr();
        }
        if (enc4 != 64) {
          output = output + chr3.chr();
        }
        chr1 = chr2 = chr3 = '';
        enc1 = enc2 = enc3 = enc4 = '';
      } while (i < input.length);
      return unescape(output);
    }
  }

  function buildTrim() {
    var support = getTrimmableCharacters().match(/^\s+$/);
    try { string.prototype.trim.call([1]); } catch(e) { support = false; }
    var trimL = regexp('^['+getTrimmableCharacters()+']+');
    var trimR = regexp('['+getTrimmableCharacters()+']+$');
    extend(string, true, !support, {

      /***
       * @method trim[Side]()
       * @returns String
       * @short Removes leading and/or trailing whitespace from the string.
       * @extra Whitespace is defined as line breaks, tabs, and any character in the "Space, Separator" Unicode category, conforming to the the ES5 spec. The standard %trim% method is only added when not fully supported natively.
       * @example
       *
       *   '   wasabi   '.trim()      -> 'wasabi'
       *   '   wasabi   '.trimLeft()  -> 'wasabi   '
       *   '   wasabi   '.trimRight() -> '   wasabi'
       *
       ***
       * @method trim()
       * @set trimSide
       ***/
      'trim': function() {
        return this.toString().trimLeft().trimRight();
      },

      /***
       * @method trimLeft()
       * @set trimSide
       ***/
      'trimLeft': function() {
        return this.replace(trimL, '');
      },

      /***
       * @method trimRight()
       * @set trimSide
       ***/
      'trimRight': function() {
        return this.replace(trimR, '');
      }
    });
  }

  function buildString() {
    buildBase64('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=');
    buildTrim();
    buildWidthConversionTables();
    buildUnicodeScripts();
  }



  extend(string, true, false, {

     /***
      * @method escapeRegExp()
      * @returns String
      * @short Escapes all RegExp tokens in the string.
      * @example
      *
      *   'really?'.escapeRegExp()       -> 'really\?'
      *   'yes.'.escapeRegExp()         -> 'yes\.'
      *   '(not really)'.escapeRegExp() -> '\(not really\)'
      *
      ***/
    'escapeRegExp': function() {
      return regexp.escape(this);
    },

     /***
      * @method escapeURL([param] = false)
      * @returns String
      * @short Escapes characters in a string to make a valid URL.
      * @extra If [param] is true, it will also escape valid URL characters for use as a URL parameter.
      * @example
      *
      *   'http://foo.com/"bar"'.escapeURL()     -> 'http://foo.com/%22bar%22'
      *   'http://foo.com/"bar"'.escapeURL(true) -> 'http%3A%2F%2Ffoo.com%2F%22bar%22'
      *
      ***/
    'escapeURL': function(param) {
      return param ? encodeURIComponent(this) : encodeURI(this);
    },

     /***
      * @method unescapeURL([partial] = false)
      * @returns String
      * @short Restores escaped characters in a URL escaped string.
      * @extra If [partial] is true, it will only unescape non-valid URL characters. [partial] is included here for completeness, but should very rarely be needed.
      * @example
      *
      *   'http%3A%2F%2Ffoo.com%2Fthe%20bar'.unescapeURL()     -> 'http://foo.com/the bar'
      *   'http%3A%2F%2Ffoo.com%2Fthe%20bar'.unescapeURL(true) -> 'http%3A%2F%2Ffoo.com%2Fthe bar'
      *
      ***/
    'unescapeURL': function(param) {
      return param ? decodeURI(this) : decodeURIComponent(this);
    },

     /***
      * @method escapeHTML()
      * @returns String
      * @short Converts HTML characters to their entity equivalents.
      * @example
      *
      *   '<p>some text</p>'.escapeHTML() -> '&lt;p&gt;some text&lt;/p&gt;'
      *   'one & two'.escapeHTML()        -> 'one &amp; two'
      *
      ***/
    'escapeHTML': function() {
      return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

     /***
      * @method unescapeHTML([partial] = false)
      * @returns String
      * @short Restores escaped HTML characters.
      * @example
      *
      *   '&lt;p&gt;some text&lt;/p&gt;'.unescapeHTML() -> '<p>some text</p>'
      *   'one &amp; two'.unescapeHTML()                -> 'one & two'
      *
      ***/
    'unescapeHTML': function() {
      return this.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    },

     /***
      * @method encodeBase64()
      * @returns String
      * @short Encodes the string into base 64 encoding.
      * @extra This methods wraps the browser native %btoa% when available, and uses a custom implementation when not available.
      * @example
      *
      *   'gonna get encoded!'.encodeBase64()  -> 'Z29ubmEgZ2V0IGVuY29kZWQh'
      *   'http://twitter.com/'.encodeBase64() -> 'aHR0cDovL3R3aXR0ZXIuY29tLw=='
      *
      ***/
    'encodeBase64': function() {
      return btoa(this);
    },

     /***
      * @method decodeBase64()
      * @returns String
      * @short Decodes the string from base 64 encoding.
      * @extra This methods wraps the browser native %atob% when available, and uses a custom implementation when not available.
      * @example
      *
      *   'aHR0cDovL3R3aXR0ZXIuY29tLw=='.decodeBase64() -> 'http://twitter.com/'
      *   'anVzdCBnb3QgZGVjb2RlZA=='.decodeBase64()     -> 'just got decoded!'
      *
      ***/
    'decodeBase64': function() {
      return atob(this);
    },

    /***
     * @method capitalize([all] = false)
     * @returns String
     * @short Capitalizes the first character in the string.
     * @extra If [all] is true, all words in the string will be capitalized.
     * @example
     *
     *   'hello'.capitalize()           -> 'hello'
     *   'hello kitty'.capitalize()     -> 'hello kitty'
     *   'hello kitty'.capitalize(true) -> 'hello kitty'
     *
     *
     ***/
    'capitalize': function(all) {
      var reg = all ? /^\S|\s\S/g : /^\S/;
      return this.toLowerCase().replace(reg, function(letter) {
        return letter.toUpperCase();
      });
    },

    /***
     * @method pad[Side](<padding> = '', [num] = 1)
     * @returns String
     * @short Pads either/both sides of the string.
     * @extra [num] is the number of characters on each side, and [padding] is the character to pad with.
     * @example
     *
     *   'wasabi'.pad('-')         -> '-wasabi-'
     *   'wasabi'.pad('-', 2)      -> '--wasabi--'
     *   'wasabi'.padLeft('-', 2)  -> '--wasabi'
     *   'wasabi'.padRight('-', 2) -> 'wasabi--'
     *
     ***
     * @method pad()
     * @set padSide
     ***/
    'pad': function(padding, num) {
      return padString(this, padding, num, num);
    },

    /***
     * @method padLeft()
     * @set padSide
     ***/
    'padLeft': function(padding, num) {
      return padString(this, padding, num, 0);
    },

    /***
     * @method padRight()
     * @set padSide
     ***/
    'padRight': function(padding, num) {
      return padString(this, padding, 0, num);
    },

    /***
     * @method repeat([num] = 0)
     * @returns String
     * @short Returns the string repeated [num] times.
     * @example
     *
     *   'jumpy'.repeat(2) -> 'jumpyjumpy'
     *   'a'.repeat(5)     -> 'aaaaa'
     *
     ***/
    'repeat': function(num) {
      var str = '', i = 0;
      if(object.isNumber(num) && num > 0) {
        while(i < num) {
          str += this;
          i++;
        }
      }
      return str;
    },

    /***
     * @method each([search] = single character, [fn])
     * @returns Array
     * @short Runs callback [fn] against each occurence of [search].
     * @extra Returns an array of matches. [search] may be either a string or regex, and defaults to every character in the string.
     * @example
     *
     *   'jumpy'.each() -> ['j','u','m','p','y']
     *   'jumpy'.each(/[r-z]/) -> ['u','y']
     *   'jumpy'.each(/[r-z]/, function(m) {
     *     // Called twice: "u", "y"
     *   });
     *
     ***/
    'each': function(search, fn) {
      if(object.isFunction(search)) {
        fn = search;
        search = /[\s\S]/g;
      } else if(!search) {
        search = /[\s\S]/g
      } else if(object.isString(search)) {
        search = regexp(regexp.escape(search), 'gi');
      } else if(object.isRegExp(search)) {
        search = search.addFlag('g');
      }
      var match = this.match(search) || [];
      if(fn) {
        for(var i = 0; i < match.length; i++) {
          match[i] = fn.call(this, match[i], i, match) || match[i];
        }
      }
      return match;
    },

    /***
     * @method shift(<n>)
     * @returns Array
     * @short Shifts each character in the string <n> places in the character map.
     * @example
     *
     *   'a'.shift(1)  -> 'b'
     *   'ク'.shift(1) -> 'グ'
     *
     ***/
    'shift': function(n) {
      var result = '';
      n = n || 0;
      this.codes(function(c) {
        result += (c + n).chr();
      });
      return result;
    },

    /***
     * @method codes([fn])
     * @returns Array
     * @short Runs callback [fn] against each character code in the string. Returns an array of character codes.
     * @example
     *
     *   'jumpy'.codes() -> [106,117,109,112,121]
     *   'jumpy'.codes(function(c) {
     *     // Called 5 times: 106, 117, 109, 112, 121
     *   });
     *
     ***/
    'codes': function(fn) {
      var codes = [];
      for(var i=0; i<this.length; i++) {
        var code = this.charCodeAt(i);
        codes.push(code);
        if(fn) fn.call(this, code, i);
      }
      return codes;
    },

    /***
     * @method chars([fn])
     * @returns Array
     * @short Runs callback [fn] against each character in the string. Returns an array of characters.
     * @example
     *
     *   'jumpy'.chars() -> ['j','u','m','p','y']
     *   'jumpy'.chars(function(c) {
     *     // Called 5 times: "j","u","m","p","y"
     *   });
     *
     ***/
    'chars': function(fn) {
      return this.each(fn);
    },

    /***
     * @method words([fn])
     * @returns Array
     * @short Runs callback [fn] against each word in the string. Returns an array of words.
     * @extra A "word" here is defined as any sequence of non-whitespace characters.
     * @example
     *
     *   'broken wear'.words() -> ['broken','wear']
     *   'broken wear'.words(function(w) {
     *     // Called twice: "broken", "wear"
     *   });
     *
     ***/
    'words': function(fn) {
      return this.trim().each(/\S+/g, fn);
    },

    /***
     * @method lines([fn])
     * @returns Array
     * @short Runs callback [fn] against each line in the string. Returns an array of lines.
     * @example
     *
     *   'broken wear\nand\njumpy jump'.lines() -> ['broken wear','and','jumpy jump']
     *   'broken wear\nand\njumpy jump'.lines(function(l) {
     *     // Called three times: "broken wear", "and", "jumpy jump"
     *   });
     *
     ***/
    'lines': function(fn) {
      return this.trim().each(/^.*$/gm, fn);
    },

    /***
     * @method paragraphs([fn])
     * @returns Array
     * @short Runs callback [fn] against each paragraph in the string. Returns an array of paragraphs.
     * @extra A paragraph here is defined as a block of text bounded by two or more line breaks.
     * @example
     *
     *   'Once upon a time.\n\nIn the land of oz...'.paragraphs() -> ['Once upon a time.','In the land of oz...']
     *   'Once upon a time.\n\nIn the land of oz...'.paragraphs(function(p) {
     *     // Called twice: "Once upon a time.", "In teh land of oz..."
     *   });
     *
     ***/
    'paragraphs': function(fn) {
      var paragraphs = this.trim().split(/[\r\n]{2,}/);
      paragraphs = paragraphs.map(function(p) {
        if(fn) var s = fn.call(p);
        return s ? s : p;
      });
      return paragraphs;
    },

    /***
     * @method startsWith(<find>, [case] = true)
     * @returns Boolean
     * @short Returns true if the string starts with <find>.
     * @extra <find> may be either a string or regex. Case sensitive if [case] is true.
     * @example
     *
     *   'hello'.startsWith('hell')        -> true
     *   'hello'.startsWith(/[a-h]/)       -> true
     *   'hello'.startsWith('HELL')        -> false
     *   'hello'.startsWith('HELL', false) -> true
     *
     ***/
    'startsWith': function(reg, c) {
      if(isUndefined(c)) c = true;
      var source = object.isRegExp(reg) ? reg.source.replace('^', '') : regexp.escape(reg);
      return regexp('^' + source, c ? '' : 'i').test(this);
    },

    /***
     * @method endsWith(<find>, [case] = true)
     * @returns Boolean
     * @short Returns true if the string ends with <find>.
     * @extra <find> may be either a string or regex. Case sensitive if [case] is true.
     * @example
     *
     *   'jumpy'.endsWith('py')         -> true
     *   'jumpy'.endsWith(/[q-z]/)      -> true
     *   'jumpy'.endsWith('MPY')        -> false
     *   'jumpy'.endsWith('MPY', false) -> true
     *
     ***/
    'endsWith': function(reg, c) {
      if(isUndefined(c)) c = true;
      var source = object.isRegExp(reg) ? reg.source.replace('$', '') : regexp.escape(reg);
      return regexp(source + '$', c ? '' : 'i').test(this);
    },

    /***
     * @method isBlank()
     * @returns Boolean
     * @short Returns true if the string has a length of 0 or contains only whitespace.
     * @example
     *
     *   ''.isBlank()      -> true
     *   '   '.isBlank()   -> true
     *   'noway'.isBlank() -> false
     *
     ***/
    'isBlank': function() {
      return this.trim().length === 0;
    },

    /***
     * @method has(<find>)
     * @returns Boolean
     * @short Returns true if the string matches <find>.
     * @extra <find> may be a string or regex.
     * @example
     *
     *   'jumpy'.has('py')     -> true
     *   'broken'.has(/[a-n]/) -> true
     *   'broken'.has(/[s-z]/) -> false
     *
     ***/
    'has': function(find) {
      return this.search(object.isRegExp(find) ? find : RegExp.escape(find)) !== -1;
    },


    /***
     * @method add(<str>, [index] = 0)
     * @returns String
     * @short Adds <str> at [index]. Negative values are also allowed.
     * @extra %insert% is provided as an alias, and is generally more readable when using an index.
     * @example
     *
     *   'schfifty'.add(' five')      -> schfifty five
     *   'dopamine'.insert('e', 3)       -> dopeamine
     *   'spelling eror'.insert('r', -3) -> spelling error
     *
     ***/
    'add': function(str, index) {
      return this.split('').add(str, index).join('');
    },

    /***
     * @method remove(<f>)
     * @returns String
     * @short Removes any part of the string that matches <f>.
     * @extra <f> can be a string or a regex.
     * @example
     *
     *   'schfifty five'.remove('f')     -> 'schity ive'
     *   'schfifty five'.remove(/[a-f]/g) -> 'shity iv'
     *
     ***/
    'remove': function(f) {
      return this.replace(f, '');
    },

    /***
     * @method hankaku([mode] = 'all')
     * @returns String
     * @short Converts full-width characters (zenkaku) to half-width (hankaku).
     * @extra [mode] accepts any combination of "a" (alphabet), "n" (numbers), "k" (katakana), "s" (spaces), "p" (punctuation), or "all".
     * @example
     *
     *   'タロウ　ＹＡＭＡＤＡです！'.hankaku()                      -> 'ﾀﾛｳ YAMADAです!'
     *   'タロウ　ＹＡＭＡＤＡです！'.hankaku('a')                   -> 'タロウ　YAMADAです！'
     *   'タロウ　ＹＡＭＡＤＡです！'.hankaku('alphabet')            -> 'タロウ　YAMADAです！'
     *   'タロウです！　２５歳です！'.hankaku('katakana', 'numbers') -> 'ﾀﾛｳです！　25歳です！'
     *   'タロウです！　２５歳です！'.hankaku('k', 'n')              -> 'ﾀﾛｳです！　25歳です！'
     *   'タロウです！　２５歳です！'.hankaku('kn')                  -> 'ﾀﾛｳです！　25歳です！'
     *   'タロウです！　２５歳です！'.hankaku('sp')                  -> 'タロウです! ２５歳です!'
     *
     ***/
    'hankaku': function() {
      return convertCharacterWidth(this, arguments, allZenkaku, HankakuTable);
    },

    /***
     * @method zenkaku([mode] = 'all')
     * @returns String
     * @short Converts half-width characters (hankaku) to full-width (zenkaku).
     * @extra [mode] accepts any combination of "a" (alphabet), "n" (numbers), "k" (katakana), "s" (spaces), "p" (punctuation), or "all".
     * @example
     *
     *   'ﾀﾛｳ YAMADAです!'.zenkaku()                         -> 'タロウ　ＹＡＭＡＤＡです！'
     *   'ﾀﾛｳ YAMADAです!'.zenkaku('a')                      -> 'ﾀﾛｳ ＹＡＭＡＤＡです!'
     *   'ﾀﾛｳ YAMADAです!'.zenkaku('alphabet')               -> 'ﾀﾛｳ ＹＡＭＡＤＡです!'
     *   'ﾀﾛｳです! 25歳です!'.zenkaku('katakana', 'numbers') -> 'タロウです! ２５歳です!'
     *   'ﾀﾛｳです! 25歳です!'.zenkaku('k', 'n')              -> 'タロウです! ２５歳です!'
     *   'ﾀﾛｳです! 25歳です!'.zenkaku('kn')                  -> 'タロウです! ２５歳です!'
     *   'ﾀﾛｳです! 25歳です!'.zenkaku('sp')                  -> 'ﾀﾛｳです！　25歳です！'
     *
     ***/
    'zenkaku': function() {
      return convertCharacterWidth(this, arguments, allHankaku, ZenkakuTable);
    },

    /***
     * @method hiragana([all] = true)
     * @returns String
     * @short Converts katakana into hiragana.
     * @extra If [all] is false, only full-width katakana will be converted.
     * @example
     *
     *   'カタカナ'.hiragana()   -> 'かたかな'
     *   'コンニチハ'.hiragana() -> 'こんにちは'
     *   'ｶﾀｶﾅ'.hiragana()       -> 'かたかな'
     *   'ｶﾀｶﾅ'.hiragana(false)  -> 'ｶﾀｶﾅ'
     *
     ***/
    'hiragana': function(all) {
      var str = this;
      if(all !== false) {
        str = str.zenkaku('k');
      }
      return str.replace(/[\u30A1-\u30F6]/g, function(c) {
        return c.shift(-96);
      });
    },

    /***
     * @method katakana()
     * @returns String
     * @short Converts hiragana into katakana.
     * @example
     *
     *   'かたかな'.katakana()   -> 'カタカナ'
     *   'こんにちは'.katakana() -> 'コンニチハ'
     *
     ***/
    'katakana': function() {
      return this.replace(/[\u3041-\u3096]/g, function(c) {
        return c.shift(96);
      });
    },

    /***
     * @method toNumber([base] = 10)
     * @returns Number
     * @short Converts the string into a number.
     * @extra Any value with a "." fill be converted to a floating point value, otherwise an integer.
     * @example
     *
     *   '153'.toNumber()    -> 153
     *   '12,000'.toNumber() -> 12000
     *   '10px'.toNumber()   -> 10
     *   'ff'.toNumber(16)   -> 255
     *
     ***/
    'toNumber': function(base) {
      var str = this.replace(/,/g, '');
      return str.match(/\./) ? parseFloat(str) : parseInt(str, base || 10);
    },

    /***
     * @method reverse()
     * @returns String
     * @short Reverses the string.
     * @example
     *
     *   'jumpy'.reverse()        -> 'ypmuj'
     *   'lucky charms'.reverse() -> 'smrahc ykcul'
     *
     ***/
    'reverse': function() {
      return this.split('').reverse().join('');
    },

    /***
     * @method compact()
     * @returns String
     * @short Compacts all white space in the string to a single space and trims the ends.
     * @example
     *
     *   'too \n much \n space'.compact() -> 'too much space'
     *   'enough \n '.compact()           -> 'enought'
     *
     ***/
    'compact': function() {
      return this.trim().replace(/([\r\n\s　])+/g, function(match, whitespace){
        return whitespace === '　' ? whitespace : ' ';
      });
    },

    /***
     * @method at(<index>, [loop] = true)
     * @returns String or Array
     * @short Gets the character(s) at a given index.
     * @extra When [loop] is true, overshooting the end of the string (or the beginning) will begin counting from the other end. As an alternate syntax, passing multiple indexes will get the characters at those indexes.
     * @example
     *
     *   'jumpy'.at(0)               -> 'j'
     *   'jumpy'.at(2)               -> 'm'
     *   'jumpy'.at(5)               -> 'j'
     *   'jumpy'.at(5, false)        -> ''
     *   'jumpy'.at(-1)              -> 'y'
     *   'luckly charms'.at(1,3,5,7) -> ['u','k','y',c']
     *
     ***/
    'at': function() {
      return entryAtIndex(this, arguments, true);
    },

    /***
     * @method first([n] = 1)
     * @returns String
     * @short Returns the first [n] characters of the string.
     * @example
     *
     *   'lucky charms'.first()   -> 'l'
     *   'lucky charms'.first(3)  -> 'luc'
     *
     ***/
    'first': function(num) {
      if(isUndefined(num)) num = 1;
      return this.substr(0, num);
    },

    /***
     * @method last([n] = 1)
     * @returns String
     * @short Returns the last [n] characters of the string.
     * @example
     *
     *   'lucky charms'.last()   -> 's'
     *   'lucky charms'.last(3)  -> 'rms'
     *
     ***/
    'last': function(num) {
      if(isUndefined(num)) num = 1;
      var start = this.length - num < 0 ? 0 : this.length - num;
      return this.substr(start);
    },

    /***
     * @method from([index] = 0)
     * @returns String
     * @short Returns a section of the string starting from [index].
     * @example
     *
     *   'lucky charms'.from()   -> 'lucky charms'
     *   'lucky charms'.from(7)  -> 'harms'
     *
     ***/
    'from': function(num) {
      return this.slice(num);
    },

    /***
     * @method to([index] = end)
     * @returns String
     * @short Returns a section of the string ending at [index].
     * @example
     *
     *   'lucky charms'.to()   -> 'lucky charms'
     *   'lucky charms'.to(7)  -> 'lucky ch'
     *
     ***/
    'to': function(num) {
      if(isUndefined(num)) num = this.length;
      return this.slice(0, num);
    },

    /***
     * @method toDate([locale])
     * @returns Date
     * @short Creates a date from the string.
     * @extra Accepts a wide range of input. [locale] allows you to specify a locale code. See @date_format for more information.
     * @example
     *
     *   'January 25, 2015'.toDate() -> same as Date.create('January 25, 2015')
     *   'yesterday'.toDate()        -> same as Date.create('yesterday')
     *   'next Monday'.toDate()      -> same as Date.create('next Monday')
     *
     ***/
    'toDate': function(locale) {
      var str = this.toString();
      return date.create ? date.create(str, locale) : new date(str);
    },

    /***
     * @method dasherize()
     * @returns String
     * @short Converts underscores and camel casing to hypens.
     * @example
     *
     *   'a_farewell_to_arms'.dasherize() -> 'a-farewell-to-arms'
     *   'capsLock'.dasherize()           -> 'caps-lock'
     *
     ***/
    'dasherize': function() {
      return this.underscore().replace(/_/g, '-');
    },

    /***
     * @method underscore()
     * @returns String
     * @short Converts hyphens and camel casing to underscores.
     * @example
     *
     *   'a-farewell-to-arms'.underscore() -> 'a_farewell_to_arms'
     *   'capsLock'.underscore()           -> 'caps_lock'
     *
     ***/
    'underscore': function() {
      return this
        .replace(/[-\s]+/g, '_')
        .replace(String.Inflector && String.Inflector.acronymRegExp, function(acronym, index) {
          return (index > 0 ? '_' : '') + acronym.toLowerCase();
        })
        .replace(/([A-Z\d]+)([A-Z][a-z])/g,'$1_$2')
        .replace(/([a-z\d])([A-Z])/g,'$1_$2')
        .toLowerCase();
    },

    /***
     * @method camelize([first] = true)
     * @returns String
     * @short Converts underscores and hyphens to camel case. If [first] is true the first letter will also be capitalized.
     * @example
     *
     *   'caps_lock'.camelize()              -> 'CapsLock'
     *   'moz-border-radius'.camelize()      -> 'MozBorderRadius'
     *   'moz-border-radius'.camelize(false) -> 'mozBorderRadius'
     *
     ***/
    'camelize': function(first) {
      return this.underscore().replace(/(^|_)([^_]+)/g, function(match, pre, word, index) {
        var acronym = getAcronym(word), capitalize = first !== false || index > 0;
        if(acronym) return capitalize ? acronym : acronym.toLowerCase();
        return capitalize ? word.capitalize() : word;
      });
    },

    /***
     * @method spacify()
     * @returns String
     * @short Converts camel case, underscores, and hyphens to a properly spaced string.
     * @example
     *
     *   'camelCase'.spacify()                         -> 'camel case'
     *   'an-ugly-string'.spacify()                    -> 'an ugly string'
     *   'oh-no_youDid-not'.spacify().capitalize(true) -> 'something else'
     *
     ***/
    'spacify': function() {
      return this.underscore().replace(/_/g, ' ');
    },

    /***
     * @method stripTags([tag1], [tag2], ...)
     * @returns String
     * @short Strips all HTML tags from the string.
     * @extra Tags to strip may be enumerated in the parameters, otherwise will strip all.
     * @example
     *
     *   '<p>just <b>some</b> text</p>'.stripTags()    -> 'just some text'
     *   '<p>just <b>some</b> text</p>'.stripTags('p') -> 'just <b>some</b> text'
     *
     ***/
    'stripTags': function() {
      var str = this, args = arguments.length > 0 ? arguments : [''];
      multiArgs(args, function(tag) {
        str = str.replace(regexp('<\/?' + tag.escapeRegExp() + '[^<>]*>', 'gi'), '');
      });
      return str;
    },

    /***
     * @method removeTags([tag1], [tag2], ...)
     * @returns String
     * @short Removes all HTML tags and their contents from the string.
     * @extra Tags to remove may be enumerated in the parameters, otherwise will remove all.
     * @example
     *
     *   '<p>just <b>some</b> text</p>'.removeTags()    -> ''
     *   '<p>just <b>some</b> text</p>'.removeTags('b') -> '<p>just text</p>'
     *
     ***/
    'removeTags': function() {
      var str = this, args = arguments.length > 0 ? arguments : ['\\S+'];
      multiArgs(args, function(t) {
        var reg = regexp('<(' + t + ')[^<>]*(?:\\/>|>.*?<\\/\\1>)', 'gi');
        str = str.replace(reg, '');
      });
      return str;
    },

    /***
     * @method truncate(<length>, [split] = true, from = 'right', [ellipsis] = '...')
     * @returns Object
     * @short Truncates a string.
     * @extra If [split] is %false%, will not split words up, and instead discard the word where the truncation occurred. [from] can also be %"middle"% or %"left"%.
     * @example
     *
     *   'just sittin on the dock of the bay'.truncate(20)                 -> 'just sittin on the do...'
     *   'just sittin on the dock of the bay'.truncate(20, false)          -> 'just sittin on the...'
     *   'just sittin on the dock of the bay'.truncate(20, true, 'middle') -> 'just sitt...of the bay'
     *   'just sittin on the dock of the bay'.truncate(20, true, 'middle') -> '...the dock of the bay'
     *
     ***/
    'truncate': function(length, split, from, ellipsis) {
      var pos,
        prepend = '',
        append = '',
        str = this.toString(),
        chars = '[' + getTrimmableCharacters() + ']+',
        space = '[^' + getTrimmableCharacters() + ']*',
        reg = regexp(chars + space + '$');
      ellipsis = isUndefined(ellipsis) ? '...' : string(ellipsis);
      if(str.length <= length) {
        return str;
      }
      switch(from) {
        case 'left':
          pos = str.length - length;
          prepend = ellipsis;
          str = str.slice(pos);
          reg = regexp('^' + space + chars);
          break;
        case 'middle':
          pos    = Math.floor(length / 2);
          append = ellipsis + str.slice(str.length - pos).trimLeft();
          str    = str.slice(0, pos);
          break;
        default:
          pos = length;
          append = ellipsis;
          str = str.slice(0, pos);
      }
      if(split === false && this.slice(pos, pos + 1).match(/\S/)) {
        str = str.remove(reg);
      }
      return prepend + str + append;
    },

    /***
     * @method assign(<obj1>, <obj2>, ...)
     * @returns String
     * @short Assigns variables to tokens in a string.
     * @extra If an object is passed, it's properties can be assigned using the object's keys. If a non-object (string, number, etc.) is passed it can be accessed by the argument number beginning with 1 (as with regex tokens). Multiple objects can be passed and will be merged together.
     * @example
     *
     *   'Welcome, Mr. {name}.'.assign({ name: 'Franklin' })   -> 'Welcome, Mr. Franklin.'
     *   'You are {1} years old today.'.assign(14)             -> 'You are 14 years old today.'
     *   '{n} and {r}'.assign({ n: 'Cheech' }, { r: 'Chong' }) -> 'Cheech and Chong'
     *
     ***/
    'assign': function() {
      var assign = object.extended();
      multiArgs(arguments, function(a, i) {
        if(object.isObject(a)) {
          assign.merge(a);
        } else {
          assign[i + 1] = a;
        }
      });
      return this.replace(/\{(.+?)\}/g, function(m, key) {
        return hasOwnProperty(assign, key) ? assign[key] : m;
      });
    }

  });


  extend(string, true, function(s) { return object.isRegExp(s); }, {

    /*
     * Many thanks to Steve Levithan here for a ton of inspiration and work dealing with
     * cross browser Regex splitting.  http://blog.stevenlevithan.com/archives/cross-browser-split
     */

    /***
     * @method split([separator], [limit])
     * @returns Array
     * @short Splits the string by [separator] into an Array.
     * @extra This method is native to Javascript, but Sugar patches it to provide cross-browser reliability when splitting on a regex.
     * @example
     *
     *   'comma,separated,values'.split(',') -> ['comma','separated','values']
     *   'a,b|c>d'.split(/[,|>]/)            -> ['multi','separated','values']
     *
     ***/
    'split': function(separator, limit) {
      var output = [];
      var lastLastIndex = 0;
      var separator = regexp(separator).addFlag('g'); // make `global` and avoid `lastIndex` issues by working with a copy
      var separator2, match, lastIndex, lastLength;
      if(!regexp.NPCGSupport) {
        separator2 = RegExp("^" + separator.source + "$(?!\\s)", separator.getFlags()); // doesn't need /g or /y, but they don't hurt
      }
      if(isUndefined(limit) || limit < 0) {
        limit = Infinity;
      } else {
        limit = limit | 0;
        if(!limit) return [];
      }

      while (match = separator.exec(this)) {
        lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser
        if(lastIndex > lastLastIndex) {
          output.push(this.slice(lastLastIndex, match.index));
          // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
          if(!regexp.NPCGSupport && match.length > 1) {
            match[0].replace(separator2, function () {
              for (var i = 1; i < arguments.length - 2; i++) {
                if(isUndefined(arguments[i])) {
                  match[i] = Undefined;
                }
              }
            });
          }
          if(match.length > 1 && match.index < this.length) {
            array.prototype.push.apply(output, match.slice(1));
          }
          lastLength = match[0].length;
          lastLastIndex = lastIndex;
          if(output.length >= limit) {
            break;
          }
        }
        if(separator.lastIndex === match.index) {
          separator.lastIndex++; // avoid an infinite loop
        }
      }
      if(lastLastIndex === this.length) {
        if(lastLength || !separator.test('')) output.push('');
      } else {
        output.push(this.slice(lastLastIndex));
      }
      return output.length > limit ? output.slice(0, limit) : output;
    }

  });




  // Aliases

  extend(string, true, false, {

    /***
     * @method insert()
     * @alias add
     *
     ***/
    'insert': string.prototype.add
  });






  /***
   * RegExp module
   *
   * Note here that methods on the RegExp class like .exec and .test will fail in the current version of SpiderMonkey being
   * used by CouchDB when using shorthand regex notation like /foo/. This is the reason for the intermixed use of shorthand
   * and compiled regexes here. If you're using JS in CouchDB, it is safer to ALWAYS compile your regexes from a string.
   *
   ***/

  regexp.NPCGSupport = isUndefined(regexp('()??').exec('')[1]); // NPCG: nonparticipating capturing group

  function getFlags(reg, flag) {
    var flags = '';
    if(flag == 'g' || reg.global)     flags += 'g';
    if(flag == 'i' || reg.ignoreCase) flags += 'i';
    if(flag == 'm' || reg.multiline)  flags += 'm';
    if(flag == 'y' || reg.sticky)     flags += 'y';
    return flags;
  }

  extend(regexp, false, false, {

   /***
    * @method RegExp.escape(<str> = '')
    * @returns String
    * @short Escapes all RegExp tokens in a string.
    * @example
    *
    *   RegExp.escape('really?')      -> 'really\?'
    *   RegExp.escape('yes.')         -> 'yes\.'
    *   RegExp.escape('(not really)') -> '\(not really\)'
    *
    ***/
    'escape': function(str) {
      if(!object.isString(str)) str = String(str);
      return str.replace(/([\\/'*+?|()\[\]{}.^$])/g,'\\$1');
    }

  });

  extend(regexp, true, false, {

   /***
    * @method getFlags()
    * @returns String
    * @short Returns the flags of the regex as a string.
    * @example
    *
    *   /texty/gim.getFlags('testy') -> 'gim'
    *
    ***/
    'getFlags': function() {
      return getFlags(this);
    },

   /***
    * @method setFlags(<flags>)
    * @returns RegExp
    * @short Sets the flags on a regex and retuns a copy.
    * @example
    *
    *   /texty/.setFlags('gim') -> now has global, ignoreCase, and multiline set
    *
    ***/
    'setFlags': function(flags) {
      return regexp(this.source, flags);
    },

   /***
    * @method addFlag(<flag>)
    * @returns RegExp
    * @short Adds <flag> to the regex.
    * @example
    *
    *   /texty/.addFlag('g') -> now has global flag set
    *
    ***/
    'addFlag': function(flag) {
      return this.setFlags(getFlags(this, flag));
    },

   /***
    * @method removeFlag(<flag>)
    * @returns RegExp
    * @short Removes <flag> from the regex.
    * @example
    *
    *   /texty/g.removeFlag('g') -> now has global flag removed
    *
    ***/
    'removeFlag': function(flag) {
      return this.setFlags(getFlags(this).replace(flag, ''));
    }

  });




  /***
   * Function module
   *
   ***/

  function setDelay(fn, ms, after, scope, args) {
    if(!fn.timers) fn.timers = [];
    if(!object.isNumber(ms)) ms = 0;
    fn.timers.push(setTimeout(function(){
      fn.timers.removeAt(index);
      after.apply(scope, args || []);
    }, ms));
    var index = fn.timers.length;
  }

  function buildBind() {
    var support = false;
    if(Function.prototype.bind) {
      function F() {};
      var B = F.bind();
      support = (new B instanceof B) && !(new F instanceof B);
    }
    extend(Function, true, !support, {

       /***
       * @method bind(<scope>, [arg1], ...)
       * @returns Function
       * @short Binds <scope> as the %this% object for the function when it is called. Also allows currying an unlimited number of parameters.
       * @extra "currying" means setting parameters ([arg1], [arg2], etc.) ahead of time so that they are passed when the function is called later. If you pass additional parameters when the function is actually called, they will be added will be added to the end of the curried parameters.
       * @example
       *
       +   (function() {
       *     return this;
       *   }).bind('woof')(); -> returns 'woof'; function is bound with 'woof' as the this object.
       *   (function(a) {
       *     return a;
       *   }).bind(1, 2)();   -> returns 2; function is bound with 1 as the this object and 2 curried as the first parameter
       *   (function(a, b) {
       *     return a + b;
       *   }).bind(1, 2)(3);  -> returns 5; function is bound with 1 as the this object, 2 curied as the first parameter and 3 passed as the second when calling the function
       *
       ***/
      'bind': function(scope) {
        var fn = this, args = getArgs(arguments, 1), nop, bound;
        if(!object.isFunction(this)) {
          throw new TypeError('Function.prototype.bind called on a non-function');
        }
        bound = function() {
          return fn.apply(fn.prototype && this instanceof fn ? this : scope, args.concat(getArgs(arguments)));
        }
        nop = function() {};
        nop.prototype = this.prototype;
        bound.prototype = new nop();
        return bound;
      }

    });
  }

  function buildFunction() {
    buildBind();
  }


  extend(Function, true, false, {

     /***
     * @method lazy([ms] = 1, [limit] = Infinity)
     * @returns Function
     * @short Creates lazy functions for non-blocking operations.
     * @extra This method will wrap the function inside another that, when executed repeatedly in a loop, will execute [ms] milliseconds after the last iteration (a.k.a. "function throttling"). By passing in a smaller value for [ms] (can be a decimal < 1), you can "tighen up" the execution time so that the iterations happen faster. By passing in a larger value for [ms], you can space the function execution out to prevent thread blocking. Playing with this number is the easiest way to strike a balance for heavier operations. Calls to lazy functions beyond [limit], if it is set to a finite number, will be ignored if other calls are waiting. For example if [limit] is 50 and 50 calls are queued, any subsequent call will be ignored until the number of queued calls goes down to < 50 again. This prevents lazy functions from being hammered too hard. Additionally, lazy functions can be canceled during execution using the %cancel% method, which will clear the entire queue.
     * @example
     *
     *   (function() {
     *     // Executes immediately.
     *   }).lazy()();
     *   (3).times(function() {
     *     // Executes 3 times, with each execution 20ms later than the last.
     *   }.lazy(20));
     *   (100).times(function() {
     *     // Executes 50 times, with each execution 20ms later than the last.
     *   }.lazy(20, 50));
     *
     ***/
    'lazy': function(ms, limit) {
      var fn = this, queue = [], lock = false, execute, rounded, perExecution;
      ms = ms || 1;
      limit = limit || Infinity;
      rounded = ms.ceil();
      perExecution = round(rounded / ms);
      execute = function() {
        if(lock || queue.length == 0) return;
        var max = Math.max(queue.length - perExecution, 0);
        while(queue.length > max) {
          // Getting uber-meta here...
          Function.prototype.apply.apply(fn, queue.shift());
        }
        setDelay(lazy, rounded, function() {
          lock = false;
          execute();
        });
        lock = true;
      }
      function lazy() {
        // The first call is immediate, so having 1 in the queue
        // implies two calls have already taken place.
        if(lock && queue.length > limit - 2) return;
        queue.push([this, arguments]);
        execute();
      }
      return lazy;
    },

     /***
     * @method delay([ms] = 1, [arg1], ...)
     * @returns Function
     * @short Executes the function after <ms> milliseconds.
     * @extra Returns a reference to itself. %delay% is also a way to execute non-blocking operations that will wait until the CPU is free. Delayed functions can be canceled using the %cancel% method. Can also curry arguments passed in after <ms>.
     * @example
     *
     *   (function(arg1) {
     *     // called 1s later
     *   }).delay(1000, 'arg1');
     *
     ***/
    'delay': function(ms) {
      var fn = this;
      var args = getArgs(arguments, 1);
      setDelay(fn, ms, fn, fn, args);
      return fn;
    },

     /***
     * @method throttle(<ms>)
     * @returns Function
     * @short Creates a throttled version of the function that will only be executed once per <ms> milliseconds.
     * @example
     *
     *   var fn = (function(arg1) {
     *     // called immediately and will wait 50ms until it responds again
     *   }).throttle(50); fn() fn() fn();
     *
     ***/
    'throttle': function(ms) {
      return this.lazy(ms, 1);
    },

     /***
     * @method debounce(<ms>)
     * @returns Function
     * @short Creates a "debounced" function that postpones its execution until after <ms> milliseconds have passed.
     * @extra This method is useful to execute a function after things have "settled down". A good example of this is when a user tabs quickly through form fields, execution of a heavy operation should happen after a few milliseconds when they have "settled" on a field.
     * @example
     *
     *   var fn = (function(arg1) {
     *     // called once 50ms later
     *   }).debounce(50); fn() fn() fn();
     *
     ***/
    'debounce': function(ms) {
      var fn = this;
      return function() {
        fn.cancel();
        setDelay(fn, ms, fn, this, arguments);
      }
    },

     /***
     * @method cancel()
     * @returns Function
     * @short Cancels a delayed function scheduled to be run.
     * @extra %delay%, %lazy%, and %debounce% can all set delays. Note that this method won't work when using certain other frameworks like Prototype, as they will retain their %delay% method.
     * @example
     *
     *   (function() {
     *     alert('hay'); // Never called
     *   }).delay(500).cancel();
     *
     ***/
    'cancel': function() {
      if(object.isArray(this.timers)) {
        while(this.timers.length > 0) {
          clearTimeout(this.timers.shift());
        }
      }
      return this;
    },

     /***
     * @method after([num] = 1)
     * @returns Function
     * @short Creates a function that will execute after [num] calls.
     * @extra %after% is useful for running a final callback after a series of asynchronous operations, when the order in which the operations will complete is unknown.
     * @example
     *
     *   var fn = (function() {
     *     // Will be executed once only
     *   }).after(3); fn(); fn(); fn();
     *
     ***/
    'after': function(num) {
      var fn = this, counter = 0, storedArguments = [];
      if(!object.isNumber(num)) {
        num = 1;
      } else if(num === 0) {
        fn.call();
        return fn;
      }
      return function() {
        var ret;
        storedArguments.push(Array.create(arguments));
        counter++;
        if(counter == num) {
          ret = fn.call(this, storedArguments);
          counter = 0;
          storedArguments = [];
          return ret;
        }
      }
    },

     /***
     * @method once()
     * @returns Function
     * @short Creates a function that will execute only once and store the result.
     * @extra %once% is useful for creating functions that will cache the result of an expensive operation and use it on subsequent calls. Also it can be useful for creating initialization functions that only need to be run once.
     * @example
     *
     *   var fn = (function() {
     *     // Will be executed once only
     *   }).once(); fn(); fn(); fn();
     *
     ***/
    'once': function() {
      var fn = this;
      return function() {
        return hasOwnProperty(fn, 'memo') ? fn['memo'] : fn['memo'] = fn.apply(this, arguments);
      }
    },

     /***
     * @method fill(<arg1>, <arg2>, ...)
     * @returns Function
     * @short Returns a new version of the function which when called will have some of its arguments pre-emptively filled in, also known as "currying".
     * @extra Arguments passed to a "filled" function are generally appended to the curried arguments. However, if %undefined% is passed as any of the arguments to %fill%, it will be replaced, when the "filled" function is executed. This allows currying of arguments even when they occur toward the end of an argument list (the example demonstrates this much more clearly).
     * @example
     *
     *   var delayOneSecond = setTimeout.fill(undefined, 1000);
     *   delayOneSecond(function() {
     *     // Will be executed 1s later
     *   });
     *
     ***/
    'fill': function() {
      var fn = this, curried = getArgs(arguments);
      return function() {
        var args = getArgs(arguments);
        arrayEach(curried, function(arg, index) {
          if(arg != null || index >= args.length) args.splice(index, 0, arg);
        });
        return fn.apply(this, args);
      }
    }


  });


  // Initialize
  buildObject();
  buildString();
  buildFunction();
  buildArray();
  initializeClass(date);

  Object.initializeClass = initializeClass;


})();

    return (require['sugar'] = module.exports);
  };
};
require['sugar'].nonce = nonce;

require['async'] = function() {
  return new function() {
    var exports = require['async'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/async/lib/async.js";
    /*global setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root = this,
        previous_async = root.async;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    else {
        root.async = async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    //// cross-browser compatiblity functions ////

    var _forEach = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _forEach(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _forEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        async.nextTick = function (fn) {
            setTimeout(fn, 0);
        };
    }
    else {
        async.nextTick = process.nextTick;
    }

    async.forEach = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _forEach(arr, function (x) {
            iterator(x, function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback(null);
                    }
                }
            });
        });
    };

    async.forEachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };

    async.forEachLimit = function (arr, limit, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length || limit <= 0) {
            return callback();
        }
        var completed = 0;
        var started = 0;
        var running = 0;

        (function replenish () {
            if (completed === arr.length) {
                return callback();
            }

            while (running < limit && started < arr.length) {
                started += 1;
                running += 1;
                iterator(arr[started - 1], function (err) {
                    if (err) {
                        callback(err);
                        callback = function () {};
                    }
                    else {
                        completed += 1;
                        running -= 1;
                        if (completed === arr.length) {
                            callback();
                        }
                        else {
                            replenish();
                        }
                    }
                });
            }
        })();
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.forEach].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.forEachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);


    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.forEachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.forEach(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.forEach(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _forEach(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _forEach(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                if (err) {
                    callback(err);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    taskComplete();
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.nextTick(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    async.parallel = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.forEach(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.forEachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.queue = function (worker, concurrency) {
        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _forEach(data, function(task) {
                    q.tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (q.saturated && q.tasks.length == concurrency) {
                        q.saturated();
                    }
                    async.nextTick(q.process);
                });
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if(q.empty && q.tasks.length == 0) q.empty();
                    workers += 1;
                    worker(task.data, function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if(q.drain && q.tasks.length + workers == 0) q.drain();
                        q.process();
                    });
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _forEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

}());

    return (require['async'] = module.exports);
  };
};
require['async'].nonce = nonce;

require['nogg'] = function() {
  return new function() {
    var exports = require['nogg'] = this;
    var module = {exports:exports};
    var process = require('_process');
    var __filename = "node_modules/nogg/lib/nogg.js";
    (function() {
  var COLORS, LEVELS, PIDMAP, STREAM_GENERATORS, assert, colors, fs, getStream, inspect, level, loggingConfig, num, toMessage, writeLog, _fn, _ref,
    __slice = Array.prototype.slice,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  fs = require('fs');

  try {
    colors = require('cardamom/src/colors');
  } catch (e) {
    colors = require('./colors');
  }

  assert = require('assert');

  inspect = require('util').inspect;

  try {
    loggingConfig = (_ref = require('config')) != null ? _ref.logging : void 0;
  } catch (e) {
    loggingConfig = {
      'default': [
        {
          file: 'stdout',
          level: 'debug'
        }
      ]
    };
  }

  LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 3
  };

  COLORS = {
    debug: colors.green,
    info: colors.white,
    warn: colors.yellow,
    error: colors.red,
    fatal: colors.red
  };

  STREAM_GENERATORS = {
    stdout: function() {
      return process.stdout;
    },
    stderr: function() {
      return process.stderr;
    }
  };

  PIDMAP = {};

  getStream = function(handler) {
    var name, stream, streamCache, _name;
    if (handler.file.write != null) {
      return handler.file;
    } else {
      name = handler.file;
      streamCache = (PIDMAP[_name = process.pid] || (PIDMAP[_name] = {}));
      if (streamCache[name] != null) return streamCache[name];
      if (STREAM_GENERATORS[name] != null) {
        stream = STREAM_GENERATORS[name]();
      } else {
        stream = fs.createWriteStream(name, {
          flags: 'a',
          mode: 0666
        });
      }
      return (streamCache[name] = stream);
    }
  };

  this.setStream = function(name, streamGen) {
    var _ref2;
    STREAM_GENERATORS[name] = streamGen;
    return (_ref2 = PIDMAP[process.pid]) != null ? delete _ref2[name] : void 0;
  };

  writeLog = function(handler, name, level, message) {
    var logLine, wstream, _handler, _i, _len;
    if (handler instanceof Array) {
      for (_i = 0, _len = handler.length; _i < _len; _i++) {
        _handler = handler[_i];
        writeLog(_handler, name, level, message);
      }
      return;
    }
    if ((handler.level != null) && LEVELS[handler.level] > LEVELS[level]) return;
    if (handler.forward != null) {
      exports.log(handler.forward, level, message);
      return;
    }
    if (handler.formatter === null) {
      logLine = message;
    } else {
      logLine = "" + (new Date()) + "\t" + level + "\t" + name + " - " + message + "\n";
      if (handler.file === 'stdout') logLine = COLORS[level](logLine);
    }
    wstream = getStream(handler);
    try {
      return wstream.write(logLine, 'utf8');
    } catch (e) {
      return console.log("ERROR IN LOGGING: COULD NOT WRITE TO FILE " + handler.file + ". " + e.stack);
    }
  };

  this.configure = function(config) {
    loggingConfig = config;
    return exports;
  };

  toMessage = function(obj) {
    if (typeof obj === 'object') {
      return inspect(obj);
    } else {
      return '' + obj;
    }
  };

  exports.log = function() {
    var level, message, name, nameParts, routeHandlers, subname, useParts, x, _i, _ref2;
    name = arguments[0], level = arguments[1], message = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    assert.ok(LEVELS[level] != null, "Unknown logging level '" + level + "'");
    assert.ok(loggingConfig != null, "Nogg wasn't configured. Call require('nogg').configure(...)");
    switch (message.length) {
      case 0:
        message = '';
        break;
      case 1:
        message = toMessage(message[0]);
        break;
      default:
        message = ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = message.length; _i < _len; _i++) {
            x = message[_i];
            _results.push(toMessage(x));
          }
          return _results;
        })()).join(' ');
    }
    nameParts = name.split('.');
    for (useParts = _i = _ref2 = nameParts.length; _ref2 <= 1 ? _i <= 1 : _i >= 1; useParts = _ref2 <= 1 ? ++_i : --_i) {
      subname = nameParts.slice(0, useParts).join(".");
      routeHandlers = loggingConfig[subname];
      if (routeHandlers != null) {
        writeLog(routeHandlers, name, level, message);
        return;
      }
    }
    assert.ok(loggingConfig["default"] != null, "Logging route 'default' not defined");
    return writeLog(loggingConfig["default"], name, level, message);
  };

  _fn = function(level, num) {
    return exports[level] = function() {
      var message, name;
      name = arguments[0], message = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return exports.log.apply(exports, [name, level].concat(__slice.call(message)));
    };
  };
  for (level in LEVELS) {
    num = LEVELS[level];
    _fn(level, num);
  }

  exports.Logger = (function() {
    var level, num, _fn2,
      _this = this;

    Logger.name = 'Logger';

    function Logger(name) {
      var level, num;
      this.name = name;
      this.log = __bind(this.log, this);

      for (level in LEVELS) {
        num = LEVELS[level];
        this[level] = Logger.prototype[level].bind(this);
      }
    }

    Logger.prototype.log = function() {
      var level, message;
      level = arguments[0], message = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return exports.log.apply(exports, [this.name, level].concat(__slice.call(message)));
    };

    _fn2 = function(level, num) {
      return Logger.prototype[level] = function() {
        var message;
        message = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return this.log.apply(this, [level].concat(__slice.call(message)));
      };
    };
    for (level in LEVELS) {
      num = LEVELS[level];
      _fn2(level, num);
    }

    return Logger;

  }).call(this);

  exports.logger = function(name) {
    return new exports.Logger(name);
  };

}).call(this);

    return (require['nogg'] = module.exports);
  };
};
require['nogg'].nonce = nonce;


    require('sugar');
    return require('joeson/src/client');
  }();

  if (typeof define === 'function' && define.amd) {
    define(function() { return Sembly; });
  } else { 
    root.Sembly = Sembly; 
  }
}(this));