# The interpreter shall be a Javascript interpreter.

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'
joe = require('joeson/src/joescript').NODES

ERRORS = [ 'RangeError',
  'EvalError',
  'SyntaxError',
  'URIError',
  'ReferenceError',
  'Error',
  'TypeError' ]

@install = install = ->
  return if joe.Node::interpret? # already defined.
  require('joeson/src/translators/scope').install() # dependency
  require('joeson/src/translators/javascript').install() # dependency

  joe.Node::extend
    interpret: ($, cb) ->
      throw new EvalError "Dunno how to evaluate #{this}"

  joe.Word::extend
    interpret: ($, cb) ->
      cb($.scopeGet @word)

  joe.Block::extend
    interpret: ($, cb) ->
      i = 0
      doLine = =>
        line = @lines[i++]
        if i < @lines.length
          $.queue line, doLine
        else
          $.queue line, cb
      doLine()

  joe.If::extend
    interpret: ($, cb) ->
      $.queue @cond, (cond) =>
        if cond
          $.queue @block, cb
        else
          $.queue @elseBlock, cb

  # We're interpreting javascript, so
  # loops have no value.
  joe.Loop::extend
    interpret: ($, cb) ->
      # TODO do label stuff
      doLoop = =>
        $.queue @cond, (cond) =>
          if cond
            $.queue @block, doLoop
          else
            cb()
      doLoop()

  joe.JSForC::extend
    interpret: ($, cb) ->
      # TODO do label stuff
      $.queue @setup, =>
        doLoop = =>
          $.queue @cond, (cond) =>
            if cond
              $.queue @block, =>
                $.queue @counter, doLoop
            else
              cb()
        doLoop()

  joe.JSForK::extend
    interpret: ($, cb) ->
      # TODO do label stuff
      $.queue @obj, (obj) =>
        keys = (key for key in @obj)
        i = 0
        doLoop = =>
          key = keys[i++]
          $.set @key, key
          if i < keys.length
            $.queue @block, doLoop
          else
            $.queue @block, cb
        doLoop()

  joe.Switch::extend
    interpret: ($, cb) ->

# eval a node using the interpreter
@interpret = (node, {context, scope, include}) ->
  # install plugin
  install()
  # install scopes and translate to javascript.
  jsnode = require('joeson/src/translators/javascript').translate(node)
  context ||= new Context(scope:scope, global:GLOBAL)
  context.scope[key] = value for key, value of include if include?
  return context.valueOf node
