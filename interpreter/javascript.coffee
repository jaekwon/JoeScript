assert = require 'assert'
_ = require 'underscore'
joe = require('../joescript_grammar').NODES
{inspect} = require 'util'
{clazz} = require 'cardamom'
{RScope} = require './runtime'

isTrue = (node) ->
  switch typeof node
    when 'number', 'string', 'boolean' then Boolean(node)
    when 'object'
      switch node
        when joe.Undefined.undefined, joe.Null.null then false
        else true
    when 'function' then true
    else throw new Error "Unexpected node for isTrue: #{node} (#{node.constructor.name})"

toKey = (node) ->
  if node instanceof joe.Str
    return valueOf(node)
  else
    return ''+node

# A function in runtime.
@BoundFunc = BoundFunc = clazz 'BoundFunc', ->
  init: ({@func, @context, @this}) ->
    assert.ok @func instanceof joe.Func
    assert.ok @context?

# Interpret the given node
@interpretOnce = _i_ = interpretOnce = (node, context) ->

  valueOf = (node, _context=context) ->
    result = _i_ node, _context
    return result

  switch node.constructor

    when joe.Block
      for line, i in node.lines
        res = valueOf line
        if i is node.lines.length-1
          return res
      undefined

    when joe.Index
      return valueOf(node.obj)[toKey(node.attr)]

    when joe.Assign
      value = valueOf if node.op then joe.Operation left:valueOf(node.target), op:node.op, right:node.value else node.value
      if node.target instanceof joe.Word
        context.scope.set node.target, value
      else
        throw new Error "Unexpected node target #{node.target}"
      return value

    when joe.If
      ifRes = valueOf node.cond
      if isTrue ifRes
        valueOf node.block
      else if node.elseBlock?
        valueOf node.elseBlock

    when joe.While, joe.Loop
      'TODO:While,Loop'

    when joe.Operation
      result = switch node.op
        when '+' then valueOf(node.left) + valueOf(node.right)
        when '-' then valueOf(node.left) - valueOf(node.right)
        when '*' then valueOf(node.left) * valueOf(node.right)
        when '/' then valueOf(node.left) / valueOf(node.right)
        else throw new Error "Unexpected operation #{node.op}"
      result = not result if node.not
      return result

    when joe.Invocation
      if node.type is 'new'
        assert.ok node.params.length is 1, "New only takes one parameter"
        if node.params[0] instanceof joe.Invocation
          constructor = valueOf(node.params[0].func)
          params = (valueOf(param) for param in node.params[0].params)
        else
          constructor = valueOf(node.params[0])
          params = null
        
        ctor = ->
        ctor.prototype = constructor.prototype
        console.log "constructor: #{constructor} (#{constructor.constructor.name})"
        child = new ctor
        result = constructor.apply(child, params)
        return if typeof result is "object" then result else child
      else
        bfunc = valueOf(node.func)
        func = bfunc.func
        assert.ok bfunc instanceof BoundFunc, "Expected BoundFunc instance but got #{bfunc} (#{bfunc.constructor.name})"
        # create context, set parameters
        newContext = {scope:bfunc.context.scope.spawn(func.block)}
        newContext.scope.set(func.params[i], valueOf(param)) for param, i in node.params
        try
          return valueOf(func.block, newContext)
        catch error
          return error.value if error.statement is 'return'
          throw error

    when joe.Statement
      switch node.type
        when 'return' then throw statement:'return', value:valueOf(node.expr)
        else throw new Error "Unexpected statement type #{node.type}"

    when joe.Obj
      obj = {}
      obj[toKey(item.key)] = valueOf(item.value) for item in node.items
      return obj

    when joe.Arr
      'TODO:Arr'
      
    when joe.Func
      return BoundFunc func:node, context:context

    when String, Number, Boolean
      return node

    when joe.Undefined, joe.Null
      return node.value

    when joe.Word
      return context.scope.get(node)

    when joe.Str
      return (valueOf(part) for part in node.parts).join ''

    when joe.For
      # TODO: optimize for Range
      results = []
      if node.type is 'of'
        if node.own
          for own key, value of valueOf(node.obj) when ((not node.cond?) or valueOf(node.cond))
            context.scope.set(node.keyIndex, key) if node.keyIndex?
            context.scope.set(node.keyValue, value) if node.keyValue?
            results.push valueOf(node.block)
        else
          for key, value of valueOf(node.obj) when ((not node.cond?) or valueOf(node.cond))
            context.scope.set(node.keyIndex, key) if node.keyIndex?
            context.scope.set(node.keyValue, value) if node.keyValue?
            results.push valueOf(node.block)
      else if node.type is 'in'
        for value, index of valueOf(node.obj) when ((not node.cond?) or valueOf(node.cond))
          context.scope.set(node.keyIndex, key) if node.keyIndex?
          context.scope.set(node.keyValue, value) if node.keyValue?
          results.push valueOf(node.block)
      else throw new Error "Unexpected For type #{node.type}"
      return results

    when joe.Range
      results = []
      if node.type is '..'
        results.push x for x in [valueOf(node.start)..valueOf(node.end)] by valueOf(node.by)
      else if node.type is '...'
        results.push x for x in [valueOf(node.start)...valueOf(node.end)] by valueOf(node.by)
      else throw new Error "Unexpected Range type #{node.type}"
      return results

    else
      throw new Error "Dunno how to interpret #{node} (#{node.constructor?.name})"

@interpret = (node) ->
  node.prepare() if not node.prepared
  interpretOnce node, {scope:new RScope(node:node)}
