# The interpreter shall be a Javascript interpreter.

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'
joe = require('joeson/src/joescript').NODES

@install = install = ->

  joe.Word::extend
    interpret: ($, cb) ->
      cb($.get @word)

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
      

"""
@NODES = {
  Node, Word, Block, If, Loop, For, Switch, Try, Case, Operation,
  Statement, Invocation, Assign, Slice, Index, Soak, Obj, This,
  Null, Undefined,
  Arr, Item, Str, Func, Range, NativeExpression, Heredoc, Dummy,
  AssignList, AssignObj, AssignItem,
  Undetermined, JSForC, JSForK
}
"""


# Interpret the given node
_valueOf = (node) -> switch node.constructor
  when joe.Block
    @scopeDefine variable, undefined for variable in node.scope.variables
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
        @scopeUpdate node.target, value
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

  when joe.Loop
    'TODO:Loop'

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
          @scopeUpdate node.keyIndex, key if node.keyIndex?
          @scopeUpdate node.keyValue, value if node.keyValue?
          results.push @valueOf(node.block)
      else
        for key, value of @valueOf(node.obj) when ((not node.cond?) or @valueOf(node.cond))
          @scopeUpdate node.keyIndex, key if node.keyIndex?
          @scopeUpdate node.keyValue, value if node.keyValue?
          results.push @valueOf(node.block)
    else if node.type is 'in'
      for value, index of @valueOf(node.obj) when ((not node.cond?) or @valueOf(node.cond))
        @scopeUpdate node.keyIndex, key if node.keyIndex?
        @scopeUpdate node.keyValue, value if node.keyValue?
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


# eval a node using the interpreter
@interpret = (node, {context, scope, include}) ->
  node.prepare() if not node.prepared
  context ||= new Context(scope:scope, global:GLOBAL)
  context.scope[key] = value for key, value of include if include?
  return context.valueOf node
