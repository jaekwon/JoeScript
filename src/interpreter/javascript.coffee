# The interpreter shall be a Javascript interpreter.

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'
joe = require('joeson/src/joescript').NODES
{extend, isWord, isVariable} = require('joeson/src/joescript').HELPERS

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
    interpret: ($) ->
      throw new EvalError "Dunno how to evaluate #{this}"

  joe.Word::extend
    interpret: ($) ->
      $.code_pop()
      $.data_push $.scopeGet @word

  joe.Block::extend
    interpret: ($) ->
      $.code_pop()
      $.scopeDefine variable, undefined for variable in @ownScope.variables if @ownScope?
      $.data_push @lines.length-1
      $.code_push this:this, func:joe.Block::interpretLoop
    interpretLoop: ($) ->
      idx = $.data_peek(0)
      if idx < 0
        $.code_pop()
        $.data_pop()
      else
        line = @lines[idx]
        $.data_set 0, idx-1
        $.code_push this:line, func:line.interpret

  joe.If::extend
    interpret: ($) ->
      $.code_pop()
      $.code_push this:this,  func:joe.If::interpret2
      $.code_push this:@cond, func:@cond.interpret
    interpret2: ($) ->
      $.code_pop()
      cond = $.data_pop()
      if cond.__isTrue__?() or cond
        $.code_push this:@block, func:@block.interpret
      else if @elseBlock
        $.code_push this:@elseblock, func:@elseBlock.interpret

  joe.Assign::extend
    interpret: ($) ->
      $.code_pop()
      $.code_push this:this,    func:joe.Assign::interpret2
      $.code_push this:@value,  func:@value.interpret
    interpret2: ($) ->
      $.code_pop()
      if isWord @target
        value = $.data_pop()
        $.scopeUpdate @target, value
      else if @target instanceof joe.Index
        throw new EvalError "Implement me"
      else
        throw new EvalError "Dunnow how to assign to #{@target} (#{@target.constructor.name})"

  String::interpret = ($) ->
      $.code_pop()
      $.data_push @valueOf()

  Number::interpret = ($) ->
      $.code_pop()
      $.data_push @valueOf()

# deprecated for now:
# eval a node using the interpreter
@interpret = (node, {context, scope, include}) ->
  # install plugin
  install()
  # install scopes and translate to javascript.
  jsnode = require('joeson/src/translators/javascript').translate(node)
  throw new Error "TODO Deprecated. Re-implement me!"
