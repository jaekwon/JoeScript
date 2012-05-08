joe = require('../joescript_grammar').NODES
assert = require 'assert'
{clazz} = require 'cardamom'

# A function in runtime.
@BoundFunc = BoundFunc = clazz 'BoundFunc', ->
  # func:    The joe.Func node
  # context: The context in which func was constructed.
  init: ({@func, @context}) ->
    assert.ok @func instanceof joe.Func
    assert.ok @context?

  # Returns a native javascript function.
  function$: get: ->
    bfunc = this
    context = @context
    func = @func
    if func.block?
      _function = ->
        newContext = context.spawn(this:this)
        newContext.setScope param, arguments[i] for param, i in func.params if func.params?
        try
          return newContext.valueOf(func.block)
        catch error
          # TODO leaky
          return error.value if error.statement is 'return'
          throw error
    else
      _function = -> undefined
    _function.__joe_boundfunc__ = this
    return @function=_function

  # Returns <BoundFunc> with optimizations in @func
  optimize: ->

