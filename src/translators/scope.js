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
