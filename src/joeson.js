
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
