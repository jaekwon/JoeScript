# TODO Secure GLOBAL scope & this

assert = require 'assert'
_ = require 'underscore'
joe = require('joeson/src/joescript').NODES
{inspect} = require 'util'
{clazz} = require 'cardamom'

_isTrue = (node) ->
  switch typeof node
    when 'number', 'string', 'boolean' then Boolean(node)
    when 'object'
      switch node
        when joe.Undefined.undefined, joe.Null.null then false
        else true
    when 'function' then true
    else throw new Error "Unexpected node for isTrue: #{node} (#{node.constructor.name})"

# Interpret the given node
_valueOf = (node) -> switch node.constructor
  when joe.Block
    @setScope variable, undefined for variable in node.scope.variables
    for line, i in node.lines
      res = @valueOf line
      if i is node.lines.length-1
        return res
    undefined

  when joe.Index
    return @valueOf(node.obj)[@toKey(node.attr)]

  when joe.Assign
    value = @valueOf if node.op then joe.Operation left:@valueOf(node.target), op:node.op, right:node.value else node.value
    switch node.target.constructor
      when joe.Word
        @updateScope node.target, value
      when joe.Index
        targetObj = @valueOf(node.target.obj)
        targetAttr = @toKey(node.target.attr)
        targetObj[targetAttr] = value
      else throw new Error "Unexpected LHS in assignment: #{node.target}"
    return value

  when joe.If
    ifRes = @valueOf node.cond
    if _isTrue ifRes
      @valueOf node.block
    else if node.elseBlock?
      @valueOf node.elseBlock

  when joe.While, joe.Loop
    'TODO:While,Loop'

  when joe.Operation
    result = switch node.op
      when '+' then @valueOf(node.left) + @valueOf(node.right)
      when '-' then @valueOf(node.left) - @valueOf(node.right)
      when '*' then @valueOf(node.left) * @valueOf(node.right)
      when '/' then @valueOf(node.left) / @valueOf(node.right)
      else throw new Error "Unexpected operation #{node.op}"
    result = not result if node.not
    return result

  when joe.Invocation
    if node.type is 'new'
      assert.ok node.params.length is 1, "New only takes one parameter"
      if node.params[0] instanceof joe.Invocation
        constructor = @valueOf(node.params[0].func)
        params = (@valueOf(param) for param in node.params[0].params)
      else
        constructor = @valueOf(node.params[0])
        params = null
      
      ctor = ->
      ctor.prototype = constructor.prototype
      child = new ctor
      result = constructor.apply(child, params)
      return if typeof result is "object" then result else child
    else
      thiz = if node.func instanceof joe.Index then @valueOf(node.func.obj) else @global
      params = (@valueOf(param) for param, i in node.params)
      return @valueOf(node.func).apply(thiz, params)

  when joe.Statement
    switch node.type
      when 'return' then throw statement:'return', value:@valueOf(node.expr)
      else throw new Error "Unexpected statement type #{node.type}"

  when joe.Obj
    obj = {}
    obj[@toKey(item.key)] = @valueOf(item.value) for item in node.items
    return obj

  when joe.Arr
    'TODO:Arr'
    
  when joe.Func
    return BoundFunc(func:node, context:this).function

  when String, Number, Boolean
    return node

  when joe.Undefined, joe.Null
    return node.value

  when joe.Word
    key = @toKey node
    return @scope[key] if `key in this.scope`
    throw new ReferenceError "ReferenceError (JOE): #{key} is not defined"

  when joe.Str
    return (@valueOf(part) for part in node.parts).join ''

  when joe.For
    # TODO: optimize for Range
    results = []
    if node.type is 'of'
      if node.own
        for own key, value of @valueOf(node.obj) when ((not node.cond?) or @valueOf(node.cond))
          @updateScope node.keyIndex, key if node.keyIndex?
          @updateScope node.keyValue, value if node.keyValue?
          results.push @valueOf(node.block)
      else
        for key, value of @valueOf(node.obj) when ((not node.cond?) or @valueOf(node.cond))
          @updateScope node.keyIndex, key if node.keyIndex?
          @updateScope node.keyValue, value if node.keyValue?
          results.push @valueOf(node.block)
    else if node.type is 'in'
      for value, index of @valueOf(node.obj) when ((not node.cond?) or @valueOf(node.cond))
        @updateScope node.keyIndex, key if node.keyIndex?
        @updateScope node.keyValue, value if node.keyValue?
        results.push @valueOf(node.block)
    else throw new Error "Unexpected For type #{node.type}"
    return results

  when joe.Range
    results = []
    if node.type is '..'
      results.push x for x in [@valueOf(node.start)..@valueOf(node.end)] by @valueOf(node.by)
    else if node.type is '...'
      results.push x for x in [@valueOf(node.start)...@valueOf(node.end)] by @valueOf(node.by)
    else throw new Error "Unexpected Range type #{node.type}"
    return results

  when joe.NativeExpression
    throw new Error "Punting this for now..."

  else
    throw new Error "Dunno how to interpret #{node} (#{node.constructor?.name})"

# Runtime Context
@Context = Context = clazz 'Context', ->

  # spawn a new object with a prototype of thiz
  _makeScope = (thiz, parent) ->
    scopeFn = (@this, @__parentScope__) ->
    scopeFn.prototype = parent if parent?
    new scopeFn(thiz, parent)

  # scope is a runtime scope, not associated with its lexical scope
  init: ({@scope,@global}={}) ->
    @scope ||= _makeScope(@global, @global)

  # spawn a child context with its own scope
  spawn: (thiz) ->
    return new Context scope:_makeScope(thiz, @scope), global:@global

  # Set a name/value pair on the topmost scope of the chain
  # Error if name already exists... all updates should happen w/ updateScope.
  setScope: (name, value) ->
    #console.log "set #{name} = #{value}"
    throw new Error "Already set on scope: #{name}" if @scope.hasOwnProperty(name)
    @scope[name] = value

  # Find scope in prototype chain with name declared, set it there.
  updateScope: (name, value) ->
    #console.log "update #{name} = #{value}"
    scope = @scope
    scope = scope.__parentScope__ while scope.__parentScope__? and not scope.hasOwnProperty(name)
    scope[name] = value

  valueOf: _valueOf

  toKey: (node) ->
    if node instanceof joe.Str then return @valueOf (node)
    else return ''+node

# A runtime function typically is associated with its context
@BoundFunc = BoundFunc = clazz 'BoundFunc', ->
  # func:    The joe.Func node
  # context: The context in which func was constructed.
  init: ({@func, @context}) ->
    assert.ok @func instanceof joe.Func
    @context ||= Context()

  # Returns a native javascript function.
  function$: get: ->
    bfunc = this
    context = @context
    func = @func
    if func.block?
      _function = ->
        newContext = context.spawn(this)
        newContext.setScope param, arguments[i] for param, i in func.params if func.params?
        try
          result = newContext.valueOf(func.block)
          return result
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
    # TODO

  toString: -> "<BoundFunc>"

# eval a node using the interpreter
@interpret = (node, {context, scope, include}) ->
  node.prepare() if not node.prepared
  context ||= new Context(scope:scope, global:GLOBAL)
  context.scope[key] = value for key, value of include if include?
  return context.valueOf node
