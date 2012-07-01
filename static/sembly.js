(function(root) {
  var Sembly = function() {
    function require(path){
      var module = require[path];
      console.log("require:start", path);
      if (!module) {
        throw new Error("Can't find module "+path);
      }
      if (module.nonce === nonce) {
        module = module();
        console.log("require:end", path);
      }
      console.log("require:cached", path);
      return module;
    }
    nonce = {nonce:'nonce'};require['joeson'] = function() {
  return new function() {
    var exports = require['joeson'] = this;
    var module = {exports:exports};
    var process = require('_process');
    
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
  var C, Choice, CodeStream, E, Existential, Frame, GNode, GRAMMAR, Grammar, ILine, L, La, Line, Lookahead, MACROS, N, Node, Not, OLine, P, ParseContext, Pattern, R, Rank, Re, Ref, Regex, S, Sequence, St, Str, assert, black, blue, clazz, cyan, escape, green, i, inspect, magenta, normal, o, pad, red, tokens, trace, white, yellow, _, _loopStack, _ref, _ref2, _ref3,
    __hasProp = Object.prototype.hasOwnProperty,
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  _ = require('underscore');

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
        return this.capture = _.all(this.choices, function(choice) {
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
          assert.ok((_.intersection(GNode.optionKeys, _.keys(line))).length > 0, "Invalid options? " + line.constructor.name);
          _.extend(rank, line);
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
          return (_ref4 = this._labels) != null ? _ref4 : this._labels = (this.label != null ? [this.label] : _.flatten((function() {
            var _i, _len, _ref5, _results;
            _ref5 = this.sequence;
            _results = [];
            for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
              child = _ref5[_i];
              _results.push(child.labels);
            }
            return _results;
          }).call(this)));
        }
      },
      captures$: {
        get: function() {
          var child, _ref4;
          return (_ref4 = this._captures) != null ? _ref4 : this._captures = _.flatten((function() {
            var _i, _len, _ref5, _results;
            _ref5 = this.sequence;
            _results = [];
            for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
              child = _ref5[_i];
              _results.push(child.captures);
            }
            return _results;
          }).call(this));
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
                results = results != null ? _.extend(res, results) : res;
              } else if (child.label === '@') {
                results = results != null ? _.extend(results, res) : res;
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
                _.extend(((_ref4 = (_base2 = node.choices[0]).rules) != null ? _ref4 : _base2.rules = {}), node.rules);
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
          oldTrace = _.clone(trace);
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
        if (attrs != null) _.extend(rule, attrs);
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
            _.extend(_a_.attrs, next);
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
          assert.ok(_.keys(rule).length === 1, "Named rule should only have one key-value pair");
          name = _.keys(rule)[0];
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

    require['joeson'] = module.exports;
  };
};
require['joeson'].nonce = nonce;

require['joeson/src/codestream'] = function() {
  return new function() {
    var exports = require['joeson/src/codestream'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['joeson/src/codestream'] = module.exports;
  };
};
require['joeson/src/codestream'].nonce = nonce;

require['joeson/src/joescript'] = function() {
  return new function() {
    var exports = require['joeson/src/joescript'] = this;
    var module = {exports:exports};
    var process = require('_process');
    (function() {
  var Arr, Assign, AssignItem, AssignList, AssignObj, Block, Case, Dummy, EXPR, For, Func, GRAMMAR, Grammar, Heredoc, If, Index, Invocation, Item, JSForC, JSForK, Loop, NativeExpression, Node, Not, Null, Obj, Operation, Range, Set, Slice, Soak, Statement, Str, Switch, This, Try, Undefined, Undetermined, Unless, Word, assert, black, blue, checkComma, checkCommaNewline, checkIndent, checkNewline, checkSoftline, clazz, cyan, extend, green, inspect, isVariable, magenta, normal, red, resetIndent, trace, white, yellow, _, _ref, _ref2, _ref3;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow), (_ref3 = _ref.collections, Set = _ref3.Set);

  inspect = require('util').inspect;

  assert = require('assert');

  _ = require('underscore');

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
          return _.all(this.parts, function(part) {
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
                    OBJ_IMPL: " _INDENT? &:_OBJ_IMPL_ITEM+(_COMMA|_NEWLINE) "
                  }, make(Obj)), i({
                    _OBJ_IMPL_ITEM: [o(" _ key:(WORD|STRING|NUMBER) _ ':' _SOFTLINE? value:EXPR ", make(Item)), o(" HEREDOC ")]
                  }), o({
                    ASSIGN: " _ target:ASSIGNABLE _ type:('='|'+='|'-='|'*='|'/='|'?='|'||='|'or='|'and=') value:BLOCKEXPR "
                  }, make(Assign)), o({
                    INVOC_IMPL: " _ func:VALUE (__|_INDENT (? _OBJ_IMPL_ITEM) ) params:(&:EXPR splat:'...'?)+(_COMMA|_COMMA_NEWLINE) "
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
            ARR_EXPL: " '[' _SOFTLINE? (&:LINEEXPR splat:'...'?)*(_COMMA|_SOFTLINE) ___ (',' ___)? ']' "
          }, make(Arr)), o({
            RANGE: " '[' start:LINEEXPR? _ type:('...'|'..') end:LINEEXPR? _ ']' by:(_BY EXPR)? "
          }, make(Range)), o({
            OBJ_EXPL: " '{' _SOFTLINE? &:_OBJ_EXPL_ITEM*(_COMMA|_SOFTLINE) ___ '}' "
          }, make(Obj)), i({
            _OBJ_EXPL_ITEM: " _ key:(PROPERTY|WORD|STRING|NUMBER) value:(_ ':' LINEEXPR)? "
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

    require['joeson/src/joescript'] = module.exports;
  };
};
require['joeson/src/joescript'].nonce = nonce;

require['joeson/src/node'] = function() {
  return new function() {
    var exports = require['joeson/src/node'] = this;
    var module = {exports:exports};
    var process = require('_process');
    (function() {
  var Node, Set, assert, black, blue, clazz, cyan, green, indent, inspect, magenta, normal, red, validateType, white, yellow, _, _ref, _ref2, _ref3;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow), (_ref3 = _ref.collections, Set = _ref3.Set);

  inspect = require('util').inspect;

  assert = require('assert');

  _ = require('underscore');

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

    require['joeson/src/node'] = module.exports;
  };
};
require['joeson/src/node'].nonce = nonce;

require['joeson/src/interpreter'] = function() {
  return new function() {
    var exports = require['joeson/src/interpreter'] = this;
    var module = {exports:exports};
    var process = require('_process');
    
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
  var GOD, GUEST, JArray, JBoundFunc, JKernel, JNaN, JNull, JObject, JStackItem, JThread, JUndefined, JUser, WORLD, assert, black, blue, clazz, cyan, debug, ends, escape, extend, fatal, green, info, inspect, isVariable, joe, magenta, normal, pad, randid, red, starts, trace, warn, white, yellow, _, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7,
    __slice = Array.prototype.slice;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  _ = require('underscore');

  joe = require('joeson/src/joescript').NODES;

  _ref3 = require('joeson/lib/helpers'), randid = _ref3.randid, pad = _ref3.pad, escape = _ref3.escape, starts = _ref3.starts, ends = _ref3.ends;

  _ref4 = require('joeson/src/joescript').HELPERS, extend = _ref4.extend, isVariable = _ref4.isVariable;

  _ref5 = require('nogg').logger('interpreter'), debug = _ref5.debug, info = _ref5.info, warn = _ref5.warn, fatal = _ref5.error;

  trace = {
    debug: false,
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
        var _ref8, _ref9;
        return "'" + this.node + "' (source:" + this.declaringFunc + ", line:" + ((_ref8 = this.node._origin) != null ? _ref8.line : void 0) + ", col:" + ((_ref9 = this.node._origin) != null ? _ref9.col : void 0) + ")";
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
        if (trace.debug) console.log(blue("             -- runStep --"));
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
              console.log("             " + (blue('last ->')) + " " + this.last);
            }
            if (targetIndex != null) {
              target[targetKey][targetIndex] = this.last;
            } else if (target != null) {
              target[targetKey] = this.last;
            }
            return null;
          case 'error':
            if (trace.debug) {
              console.log("             " + (red('throw ->')) + " " + this.last);
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
              console.log("             " + (yellow('return ->')) + " " + this.last);
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
              console.log("             " + (yellow('wait ->')) + " " + (inspect(this.waitKey)));
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
          i9nCopy = _.clone(i9n);
          delete i9nCopy["this"];
          delete i9nCopy.func;
          _results.push(console.log("" + (blue(pad({
            right: 12
          }, "" + ((_ref8 = i9n["this"]) != null ? _ref8.constructor.name : void 0)))) + "." + (yellow((_ref9 = i9n.func) != null ? _ref9._name : void 0)) + "($, {" + (white(_.keys(i9nCopy).join(','))) + "}, _) " + (black(escape(i9n["this"])))));
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
          console.log("" + (black(pad({
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
          fatal("Error in runStep. Stopping execution, setting error.", (_ref10 = error.stack) != null ? _ref10 : error);
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

    require['joeson/src/interpreter'] = module.exports;
  };
};
require['joeson/src/interpreter'].nonce = nonce;

require['joeson/src/interpreter/global'] = function() {
  return new function() {
    var exports = require['joeson/src/interpreter/global'] = this;
    var module = {exports:exports};
    var process = require('_process');
    (function() {
  var GOD, GUEST, JArray, JNaN, JNull, JObject, JUndefined, JUser, USERS, WORLD, assert, async, black, blue, clazz, cyan, debug, ends, escape, fatal, green, info, inspect, joefn, loadJObject, magenta, nativ, normal, pad, red, saveJObject, starts, warn, white, yellow, _, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  _ = require('underscore');

  async = require('async');

  _ref3 = require('joeson/lib/helpers'), pad = _ref3.pad, escape = _ref3.escape, starts = _ref3.starts, ends = _ref3.ends;

  _ref4 = require('nogg').logger('server'), debug = _ref4.debug, info = _ref4.info, warn = _ref4.warn, fatal = _ref4.error;

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

    require['joeson/src/interpreter/global'] = module.exports;
  };
};
require['joeson/src/interpreter/global'].nonce = nonce;

require['joeson/src/interpreter/object'] = function() {
  return new function() {
    var exports = require['joeson/src/interpreter/object'] = this;
    var module = {exports:exports};
    var process = require('_process');
    (function() {
  var JAccessControlItem, JArray, JBoundFunc, JNaN, JNull, JObject, JSingleton, JStub, JUndefined, JUser, SimpleIterator, assert, black, blue, clazz, cyan, debug, ends, escape, extend, fatal, green, htmlEscape, info, inspect, isInteger, isVariable, joe, magenta, normal, pad, parse, randid, red, setLast, starts, warn, white, yellow, _, _ref, _ref2, _ref3, _ref4, _ref5, _ref6,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = Array.prototype.slice,
    _this = this;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  _ = require('underscore');

  _ref3 = require('joeson/src/joescript'), joe = _ref3.NODES, parse = _ref3.parse;

  _ref4 = require('joeson/lib/helpers'), randid = _ref4.randid, pad = _ref4.pad, htmlEscape = _ref4.htmlEscape, escape = _ref4.escape, starts = _ref4.starts, ends = _ref4.ends;

  _ref5 = require('joeson/src/joescript').HELPERS, extend = _ref5.extend, isVariable = _ref5.isVariable;

  _ref6 = require('nogg').logger('server'), debug = _ref6.debug, info = _ref6.info, warn = _ref6.warn, fatal = _ref6.error;

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
          var node;
          node = parse(this._func);
          node = node.toJSNode({
            toValue: true
          }).installScope().determine();
          assert.ok(node.constructor.name === 'Func', "Expected Func, got " + node.constructor.name);
          return this.func = node;
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
              $.scope = scope.__create__($, {
                "this": i9n.source
              });
            } else {
              $.scope = scope.__create__($);
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

    require['joeson/src/interpreter/object'] = module.exports;
  };
};
require['joeson/src/interpreter/object'].nonce = nonce;

require['joeson/src/interpreter/persistence'] = function() {
  return new function() {
    var exports = require['joeson/src/interpreter/persistence'] = this;
    var module = {exports:exports};
    var process = require('_process');
    (function() {
  var GLOBALS, JArray, JBoundFunc, JNaN, JNull, JObject, JStub, JUndefined, JUser, NATIVE_FUNCTIONS, OBJECTS, assert, async, black, blue, clazz, client, cyan, debug, ends, escape, fatal, getClient, getOrStub, green, info, inspect, joefn, key, loadJObject, magenta, nativ, normal, pad, red, saveJObject, saveJObjectItem, starts, value, warn, white, yellow, _, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  _ = require('underscore');

  async = require('async');

  _ref3 = require('joeson/lib/helpers'), pad = _ref3.pad, escape = _ref3.escape, starts = _ref3.starts, ends = _ref3.ends;

  _ref4 = require('nogg').logger('server'), debug = _ref4.debug, info = _ref4.info, warn = _ref4.warn, fatal = _ref4.error;

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

    require['joeson/src/interpreter/persistence'] = module.exports;
  };
};
require['joeson/src/interpreter/persistence'].nonce = nonce;

require['joeson/src/translators/javascript'] = function() {
  return new function() {
    var exports = require['joeson/src/translators/javascript'] = this;
    var module = {exports:exports};
    var process = require('_process');
    (function() {
  var assert, black, blue, clazz, compact, cyan, escape, extend, flatten, green, inspect, install, isVariable, isWord, joe, js, magenta, normal, red, translate, trigger, white, yellow, _, _ref, _ref2, _ref3, _ref4,
    __slice = Array.prototype.slice;

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  _ = require('underscore');

  joe = require('joeson/src/joescript').NODES;

  _ref3 = require('joeson/src/joescript').HELPERS, extend = _ref3.extend, isWord = _ref3.isWord, isVariable = _ref3.isVariable;

  _ref4 = require('joeson/lib/helpers'), escape = _ref4.escape, compact = _ref4.compact, flatten = _ref4.flatten;

  js = function(obj) {
    if (obj.toJavascript != null) {
      return obj.toJavascript();
    } else {
      return obj;
    }
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

    require['joeson/src/translators/javascript'] = module.exports;
  };
};
require['joeson/src/translators/javascript'].nonce = nonce;

require['joeson/src/translators/scope'] = function() {
  return new function() {
    var exports = require['joeson/src/translators/scope'] = this;
    var module = {exports:exports};
    var process = require('_process');
    (function() {
  var LScope, assert, black, blue, clazz, cyan, extend, green, inspect, isVariable, isWord, joe, magenta, normal, randid, red, white, yellow, _, _ref, _ref2, _ref3,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('cardamom'), clazz = _ref.clazz, (_ref2 = _ref.colors, red = _ref2.red, blue = _ref2.blue, cyan = _ref2.cyan, magenta = _ref2.magenta, green = _ref2.green, normal = _ref2.normal, black = _ref2.black, white = _ref2.white, yellow = _ref2.yellow);

  inspect = require('util').inspect;

  assert = require('assert');

  _ = require('underscore');

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
        if (_.any(this.children, function(child) {
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
          return _.difference(this.variables, this.parameters);
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

    require['joeson/src/translators/scope'] = module.exports;
  };
};
require['joeson/src/translators/scope'].nonce = nonce;

require['joeson/src/client'] = function() {
  return new function() {
    var exports = require['joeson/src/client'] = this;
    var module = {exports:exports};
    var process = require('_process');
    (function() {
  var Client, GOD, GUEST, JKernel, WORLD, clazz, domLog, kern, outBoxHtml, randid, replaceTabs, tabCache, tabSize, x, _ref;

  this.require = require;

  clazz = require('cardamom').clazz;

  randid = require('joeson/lib/helpers').randid;

  domLog = window.domLog = $('<pre/>');

  require('nogg').configure({
    "default": {
      file: {
        write: function(line) {
          return domLog.append(line);
        }
      },
      level: 'debug'
    }
  });

  _ref = require('joeson/src/interpreter'), GOD = _ref.GOD, WORLD = _ref.WORLD, GUEST = _ref.GUEST, JKernel = _ref.JKernel;

  kern = new JKernel;

  outBoxHtml = "<div class='outbox'>\n  <div class='outbox-gutter'>\n    <div class='outbox-gutter-text'>→ </div>\n  </div>\n  <div class='outbox-lines'><span class='marq2m4'>.</span><span class='marq1m4 marq3m4'>.</span><span class='marq0m4'>.</span></div>\n</div>";

  tabSize = 2;

  tabCache = (function() {
    var _i, _results;
    _results = [];
    for (x = _i = 0; 0 <= tabSize ? _i <= tabSize : _i >= tabSize; x = 0 <= tabSize ? ++_i : --_i) {
      _results.push(Array(x + 1).join(' '));
    }
    return _results;
  })();

  replaceTabs = function(str) {
    var accum, col, i1, i2, insertWs, line, lines, part, parts, _i, _j, _len, _len2;
    accum = [];
    lines = str.split('\n');
    for (i1 = _i = 0, _len = lines.length; _i < _len; i1 = ++_i) {
      line = lines[i1];
      parts = line.split('\t');
      col = 0;
      for (i2 = _j = 0, _len2 = parts.length; _j < _len2; i2 = ++_j) {
        part = parts[i2];
        col += part.length;
        accum.push(part);
        if (i2 < parts.length - 1) {
          insertWs = tabSize - col % tabSize;
          col += insertWs;
          accum.push(tabCache[insertWs]);
        }
      }
      if (i1 < lines.length - 1) accum.push('\n');
    }
    return accum.join('');
  };

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
    return kern.run({
      user: GUEST,
      code: 'login()',
      output: void 0
    });
  });

  Client = clazz('Client', function() {
    return {
      init: function() {
        this.threads = {};
        this.mirror = this.makeMirror();
        this.socket = io.connect();
        this.socket.on('output', this.onOutput);
        console.log("Client socket:", this.socket);
        return this.start({
          code: 'help()'
        });
      },
      makeMirror: function() {
        var mirror;
        mirror = CodeMirror(document.body, {
          value: '',
          mode: 'coffeescript',
          theme: 'joeson',
          keyMap: 'vim',
          autofocus: true,
          gutter: true,
          fixedGutter: true,
          tabSize: 2
        });
        mirror.sanitize = function() {
          var cursor, orig, tabReplaced;
          cursor = mirror.getCursor();
          tabReplaced = replaceTabs(orig = mirror.getValue());
          mirror.setValue(tabReplaced);
          mirror.setCursor(cursor);
          return tabReplaced;
        };
        mirror.setMarker(0, '● ', 'cm-bracket');
        $(mirror.getWrapperElement()).addClass('active');
        mirror.submit = this.onSave;
        return mirror;
      },
      start: function(_arg) {
        var code, threadId;
        code = _arg.code;
        threadId = randid();
        this.makeOutputForThread(threadId);
        return this.socket.emit('start', {
          code: code,
          threadId: threadId
        });
      },
      onSave$: function() {
        var cloned, mirrorElement, thing, value;
        value = this.mirror.sanitize();
        if (value.trim().length === 0) return;
        mirrorElement = $(this.mirror.getWrapperElement());
        cloned = mirrorElement.clone(false);
        cloned.removeClass('active');
        cloned.find('.CodeMirror-cursor, .CodeMirror-scrollbar, textarea').remove();
        thing = cloned.find('.CodeMirror-lines>div:first>div:first');
        if (thing.css('visibility') === 'hidden') {
          thing.remove();
        } else {
          console.log("where'd that thing go?");
        }
        this.append(cloned);
        return this.start({
          code: value
        });
      },
      onOutput$: function(_arg) {
        var command, html, output, threadId;
        command = _arg.command, html = _arg.html, threadId = _arg.threadId;
        output = this.threads[threadId].output;
        switch (command) {
          case 'close':
            return this.close({
              output: output
            });
          case void 0:
            return this.write({
              output: output,
              html: html
            });
          default:
            throw new Error("Unexpected command " + command);
        }
      },
      write: function(_arg) {
        var html, output;
        html = _arg.html, output = _arg.output;
        if (!output.data('initialized')) {
          output.data('initialized', true);
          output.empty();
        }
        output.append($('<span/>').html(html));
        return window.scroll(0, document.body.offsetHeight);
      },
      close: function(_arg) {
        var output;
        output = _arg.output;
        if (!output.data('initialized')) {
          output.data('initialized', true);
          return output.empty();
        }
      },
      makeOutputForThread: function(threadId) {
        var outputBox;
        outputBox = $(outBoxHtml);
        this.append(outputBox);
        this.threads[threadId] = {
          output: outputBox.find('.outbox-lines')
        };
        return window.scroll(0, document.body.offsetHeight);
      },
      append: function(elem) {
        var mirrorElement;
        mirrorElement = $(this.mirror.getWrapperElement());
        return mirrorElement.before(elem);
      }
    };
  });

}).call(this);

    require['joeson/src/client'] = module.exports;
  };
};
require['joeson/src/client'].nonce = nonce;

require['joeson/lib/helpers'] = function() {
  return new function() {
    var exports = require['joeson/lib/helpers'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['joeson/lib/helpers'] = module.exports;
  };
};
require['joeson/lib/helpers'].nonce = nonce;

require['_process'] = function() {
  return new function() {
    var exports = require['_process'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

process.stdout = process.stderr = require('fs').createWriteStream('stdout.log', {flags: 'a', mode: 0666});
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

    require['_process'] = module.exports;
  };
};
require['_process'].nonce = nonce;

require['assert'] = function() {
  return new function() {
    var exports = require['assert'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['assert'] = module.exports;
  };
};
require['assert'].nonce = nonce;

require['util'] = function() {
  return new function() {
    var exports = require['util'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['util'] = module.exports;
  };
};
require['util'].nonce = nonce;

require['events'] = function() {
  return new function() {
    var exports = require['events'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['events'] = module.exports;
  };
};
require['events'].nonce = nonce;

require['buffer'] = function() {
  return new function() {
    var exports = require['buffer'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['buffer'] = module.exports;
  };
};
require['buffer'].nonce = nonce;

require['buffer_ieee754'] = function() {
  return new function() {
    var exports = require['buffer_ieee754'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['buffer_ieee754'] = module.exports;
  };
};
require['buffer_ieee754'].nonce = nonce;

require['fs'] = function() {
  return new function() {
    var exports = require['fs'] = this;
    var module = {exports:exports};
    var process = require('_process');
    // nothing to see here... no file methods for the browser

// global fs ref
var _fs = null;

function withFileSystem(cb) {
  if (_fs) {
    cb(_fs);
  } else if (window.webkitStorageInfo) {
    window.webkitStorageInfo.requestQuota(TEMPORARY, 1024*1024, function(grantedBytes) {
      window.webkitRequestFileSystem(TEMPORARY, grantedBytes, function(fs) { _fs = fs; cb(fs); }, errorHandler);
    }, function(e) {
      errorHandler(e);
    });
  } else {
    cb(null);
  };
};

// Return a fake writer synchronously.
// You can use it like a node.js file write stream.
function makeStreamAdapter() {
  var fakeStream = {};
  var writeBuffer = fakeStream.writeBuffer = [];
  fakeStream.write = function (str, enc) {
    if (enc != 'utf8') {
      throw new Error("FakeStream wants utf8");
    }
    if (writeBuffer) writeBuffer.push(str);
    else console.log(str);
  };
  // make it real
  fakeStream.realize = function (fileWriter) {
    fakeStream.fileWriter = fileWriter;
    fakeStream.write = function (str, enc) {
      if (enc != 'utf8') {
        throw new Error("FakeStream wants utf8");
      }
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
    if (!fs) {
      fakeStream.writeBuffer = null;
      return;
    }
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


    require['fs'] = module.exports;
  };
};
require['fs'].nonce = nonce;

require['cardamom'] = function() {
  return new function() {
    var exports = require['cardamom'] = this;
    var module = {exports:exports};
    var process = require('_process');
    (function() {

  this.clazz = require('cardamom/src/clazz').clazz;

  this.Fn = require('cardamom/src/fnstuff').Fn;

  this.ErrorBase = require('cardamom/src/errors').ErrorBase;

  this.colors = require('cardamom/src/colors');

  this.bisect = require('cardamom/src/bisect');

  this.collections = require('cardamom/src/collections');

}).call(this);

    require['cardamom'] = module.exports;
  };
};
require['cardamom'].nonce = nonce;

require['cardamom/src/bisect'] = function() {
  return new function() {
    var exports = require['cardamom/src/bisect'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['cardamom/src/bisect'] = module.exports;
  };
};
require['cardamom/src/bisect'].nonce = nonce;

require['cardamom/src/clazz'] = function() {
  return new function() {
    var exports = require['cardamom/src/clazz'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['cardamom/src/clazz'] = module.exports;
  };
};
require['cardamom/src/clazz'].nonce = nonce;

require['cardamom/src/collections'] = function() {
  return new function() {
    var exports = require['cardamom/src/collections'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['cardamom/src/collections'] = module.exports;
  };
};
require['cardamom/src/collections'].nonce = nonce;

require['cardamom/src/colors'] = function() {
  return new function() {
    var exports = require['cardamom/src/colors'] = this;
    var module = {exports:exports};
    var process = require('_process');
    (function() {
  var _nothing, _wrap_with;

  if (!(typeof window !== "undefined" && window !== null)) {
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
  } else {
    _nothing = function(x) {
      return x;
    };
    this.black = _nothing;
    this.red = _nothing;
    this.green = _nothing;
    this.yellow = _nothing;
    this.blue = _nothing;
    this.magenta = _nothing;
    this.cyan = _nothing;
    this.white = _nothing;
    this.normal = function(text) {
      return text;
    };
  }

}).call(this);

    require['cardamom/src/colors'] = module.exports;
  };
};
require['cardamom/src/colors'].nonce = nonce;

require['cardamom/src/errors'] = function() {
  return new function() {
    var exports = require['cardamom/src/errors'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['cardamom/src/errors'] = module.exports;
  };
};
require['cardamom/src/errors'].nonce = nonce;

require['cardamom/src/fnstuff'] = function() {
  return new function() {
    var exports = require['cardamom/src/fnstuff'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['cardamom/src/fnstuff'] = module.exports;
  };
};
require['cardamom/src/fnstuff'].nonce = nonce;

require['underscore'] = function() {
  return new function() {
    var exports = require['underscore'] = this;
    var module = {exports:exports};
    var process = require('_process');
    //     Underscore.js 1.3.1
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.1';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      if (index == 0) {
        shuffled[0] = value;
      } else {
        rand = Math.floor(Math.random() * (index + 1));
        shuffled[index] = shuffled[rand];
        shuffled[rand] = value;
      }
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return slice.call(iterable);
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var result = [];
    _.reduce(initial, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) {
        memo[memo.length] = el;
        result[result.length] = array[i];
      }
      return memo;
    }, []);
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        func.apply(context, args);
      }
      whenDone();
      throttling = true;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Has own property?
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // Within an interpolation, evaluation, or escaping, remove HTML escaping
  // that had been previously added.
  var unescape = function(code) {
    return code.replace(/\\\\/g, '\\').replace(/\\'/g, "'");
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.escape || noMatch, function(match, code) {
           return "',_.escape(" + unescape(code) + "),'";
         })
         .replace(c.interpolate || noMatch, function(match, code) {
           return "'," + unescape(code) + ",'";
         })
         .replace(c.evaluate || noMatch, function(match, code) {
           return "');" + unescape(code).replace(/[\r\n\t]/g, ' ') + ";__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', '_', tmpl);
    if (data) return func(data, _);
    return function(data) {
      return func.call(this, data, _);
    };
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

}).call(this);

    require['underscore'] = module.exports;
  };
};
require['underscore'].nonce = nonce;

require['async'] = function() {
  return new function() {
    var exports = require['async'] = this;
    var module = {exports:exports};
    var process = require('_process');
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

    require['async'] = module.exports;
  };
};
require['async'].nonce = nonce;

require['nogg'] = function() {
  return new function() {
    var exports = require['nogg'] = this;
    var module = {exports:exports};
    var process = require('_process');
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
    error: 3
  };

  COLORS = {
    debug: colors.green,
    info: colors.white,
    warn: colors.yellow,
    error: colors.red
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
    console.log(typeof handler.file);
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

    require['nogg'] = module.exports;
  };
};
require['nogg'].nonce = nonce;


    return require('joeson/src/client');
  }();

  if (typeof define === 'function' && define.amd) {
    define(function() { return Sembly; });
  } else { 
    root.Sembly = Sembly; 
  }
}(this));