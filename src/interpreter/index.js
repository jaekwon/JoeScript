
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
          i9nCopy = _.clone(i9n);
          delete i9nCopy["this"];
          delete i9nCopy.func;
          _results.push(info("" + (blue(pad({
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
