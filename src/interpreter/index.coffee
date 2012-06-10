###
Concerns:
  * permissions (ACL)
  * concurrency (interwoven within a line of process,
                 simultaneous amongst processes.)
  * performance
  * networking  (future)
###

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'
joe = require('joeson/src/joescript').NODES
{pad, escape} = require 'joeson/lib/helpers'
{extend, isWord, isVariable} = require('joeson/src/joescript').HELPERS

###
ERRORS = [ 'RangeError',
  'EvalError',
  'SyntaxError',
  'URIError',
  'ReferenceError',
  'Error',
  'TypeError' ]
###

printStack = (stack) ->
  # code
  for item, i in stack
    itemCopy = _.clone item
    delete itemCopy.this
    delete itemCopy.func
    console.log "#{ green pad right:12, "#{item.this.constructor.name}"
               } #{ green item.this
               }.#{ yellow item.func?._name
               }(#{ white inspect itemCopy })"

printScope = (scope, lvl=0) ->
  for key, value of scope when key isnt '__parent__'
    console.log "#{pad left:4, lvl} #{red pad left:10, key+':'} #{value}"
  printScope scope.__parent__, lvl+1 if scope.__parent__?

JRuntimeContext = @JRuntimeContext = clazz 'JRuntimeContext', ->

  # Create a new context with a new scope.
  # e.g.
  #   scope = {}
  #   scope.global = scope
  #   new JRuntimeContext user, scope
  init: (@user, @scope={}) ->
    assert.ok @user instanceof JObject, "A JRuntimeContext must have an associated user object."
    if @user is SYSTEM.user then @will = -> yes
    @codes = [] # code stack

  # Run to completion, synchronously.
  # node: If present, will push node to @codes
  #       before starting.
  exec: (node) ->
    @push this:node, func:node.interpret
    last = undefined
    loop
      try
        while item = @codes[@codes.length-1]
          console.log cyan "             -- step --"
          func = item.func
          that = item.this
          @print()
          last = func.call that, this, item, last
          console.log "             #{cyan "->"} #{last}"
        return last
      catch error
        # Unwind to the last Try item.
        # We pop the @codes stack until we hit a Try item,
        # then set the error on the item.
        dontcare = @pop()
        loop
          item = @pop()
          if not item
            # just print error here
            console.log "#{@error.name}: #{@error.message}"
            # print stack
            printStack @error.stack
            return
          if item.this instanceof joe.Try and not item.isHandlingError
            item.isHandlingError = true
            item.func = joe.Try::interpretCatch
            return @error
        throw new Error "should not happen"

  ### STACKS ###

  pop: -> @codes.pop()

  push: (item) -> @codes.push item

  copy: -> @codes[...]

  print: ->
    printStack @codes
    printScope @scope

  ### SCOPE ###

  # Spawn a child context with its own scope
  # thiz:   Will be bound to the upper scope frame's
  #         'this' variable.
  scopeSpawn: (thiz) ->
    return {__parent__:@scope, this:thiz}

  #
  scopeGet: (name) ->
    scope = @scope
    while not `name in scope`
      scope = scope.__parent__
      if not scope?
        @throw 'ReferenceError', "#{name} is not defined"
    return scope[name]

  # Set a name/value pair on the topmost scope of the chain
  # Error if name already exists... all updates should happen w/ scopeUpdate.
  scopeDefine: (name, value) ->
    assert.ok not `name in this.scope`, "Already defined in scope: #{name}"
    @scope[name] = value
    return

  # Find scope in prototype chain with name declared, set it there.
  # NOTE on v8, you can't set __proto__. You can't even use it
  # as a local variable. Same applies to the function below.
  # It's just an expensive no-op.
  scopeUpdate: (name, value) ->
    scope = @scope
    while not `name in scope`
      scope = scope.__parent__
      if not scope?
        @throw 'ReferenceError', "#{name} is not defined"
    scope[name] = value
    return

  ### FLOW CONTROL ###

  throw: (name, message) ->
    @error = name:name, message:message, stack:@copy()
    throw EvalError "Error (#{name}) thrown"

  ### ACCESS CONTROL ###

  # Look at the object's acl to determine
  # if the action is permitted.
  will: (action, obj) ->
    return yes if obj.creator is @user
    acl = obj.acl ? obj
    throw new Error 'TODO determine permissing using ACL'

  toString: -> "[JRuntimeContext]"

# A function gets bound to the runtime context upon declaration.
JBoundFunc = @JBoundFunc = clazz 'JBoundFunc', ->

  # func:    The joe.Func node
  # context: The context in which func was constructed.
  init: ({@func, @context}) ->
    assert.ok @func instanceof joe.Func, "func not Func"
    assert.ok @context instanceof JRuntimeContext, "context not JRuntimeContext"

  toString: -> "[JBoundFunc]"

JAccessControlItem = @JAccessControlItem = clazz 'JAccessControlItem', ->

  # who:  User or JArray of users
  # what: Action or JArray of actions
  init: (@who, @what) ->

  toString: -> "[JAccessControlItem #{@who}: #{@what}]"

JObject = @JObject = clazz 'JObject', ->

  # data: An Object of key-value pairs
  # acl:  A JArray of JAccessControlItems
  #       NOTE: the acl has its own acl!
  init: ({@creator, @data, @acl}) ->
    assert.ok @creator? and @creator instanceof JObject,
                        "JObject.init requires 'creator' (JObject)."
                        # Everything has a creator. Wait a minute...
    assert.ok @data? and @data instanceof Object,
                        "JObject.init requires 'data' (Object)."

  __get__: ($, key) ->
    $.will('read', this)
    return @data[key]

  __set__: ($, key, value) ->
    $.will('write', this)
    @data[key] = value
    return

  __keys__: ($) ->
    $.will('read', this)
    return _.keys @data

  __iterator__: ($) ->
    $.will('read', this)
    return new SimpleIterator _.keys @data

  toString: -> "[JObject]"

SimpleIterator = clazz 'SimpleIterator', ->
  init: (@items) ->
    @length = @items.length
    @idx = 0
  next: ->
    if @idx < @length
      return @items[@idx]
    else throw 'StopIteration'

JUser = @JUser = clazz 'JUser', JObject, ->
  init: ({@name}) ->
    assert.equal typeof @name, 'string', "@name not string"
    @super.init creator:this, data:{name:@name}
  toString: -> "[JUser #{@name}]"

SYSTEM = @SYSTEM =
  user: new JUser name:'root'

## JObject subclasses...

JSingleton = @JSingleton = clazz 'JSingleton', ->
  __init__: (@name) ->
  __get__: ($, key)   -> $.throw 'TypeError', "Cannot read property '#{key}' of #{@name}"
  __set__: ($, key, value) ->
                         $.throw 'TypeError', "Cannot set property '#{key}' of #{@name}"
  __keys__: ($) ->       $.throw 'TypeError', "Cannot get keys of #{@name}"
  __iterator__: ($) ->   $.throw 'TypeError', "Cannot get iterator of #{@name}"
  __add__: ($, other) -> $.throw 'TypeError', "Cannot operate (+) with #{@name}"
  __sub__: ($, other) -> $.throw 'TypeError', "Cannot operate (-) with #{@name}"
  __mul__: ($, other) -> $.throw 'TypeError', "Cannot operate (*) with #{@name}"
  __div__: ($, other) -> $.throw 'TypeError', "Cannot operate (/) with #{@name}"
  toString: -> "Singleton(#{@name})"

_JNull = clazz '_JNull', JSingleton, ->
  valueOf: -> null
JNull = @JNull = new _JNull()

_JUndefined = clazz '_JUndefined', JSingleton, ->
  valueOf: -> undefined
JUndefined = @JUndefined = new _JUndefined()

## SETUP

unless joe.Node::interpret? then do =>
  require('joeson/src/translators/scope').install() # dependency
  require('joeson/src/translators/javascript').install() # dependency

  joe.Node::extend
    interpret: ($) ->
      new EvalError "Dunno how to evaluate #{this}"

  joe.Word::extend
    interpret: ($) ->
      $.pop()
      return $.scopeGet @word

  joe.Block::extend
    interpret: ($) ->
      $.pop()
      $.scopeDefine variable, undefined for variable in @ownScope.variables if @ownScope?
      if (length=@lines.length) > 1
        $.push this:@, func:joe.Block::interpretLoop, length:length, idx:0
      firstLine = @lines[0]
      $.push this:firstLine, func:firstLine.interpret
      return
    interpretLoop: ($, item, last) ->
      assert.ok typeof item.idx is 'number'
      if item.idx is item.length-2
        $.pop() # pop this
      nextLine = @lines[++item.idx]
      $.push this:nextLine, func:nextLine.interpret
      return

  joe.If::extend
    interpret: ($) ->
      $.pop()
      $.push this:this,  func:joe.If::interpret2
      $.push this:@cond, func:@cond.interpret
      return
    interpret2: ($, item, cond) ->
      $.pop()
      if cond.__isTrue__?() or cond
        $.push this:@block, func:@block.interpret
      else if @elseBlock
        $.push this:@elseblock, func:@elseBlock.interpret
      return

  joe.Assign::extend
    interpret: ($) ->
      $.pop()
      $.push this:this,    func:joe.Assign::interpret2
      $.push this:@value,  func:@value.interpret
      return
    interpret2: ($, item, value) ->
      $.pop()
      if isWord @target
        $.scopeUpdate @target, value
      else if @target instanceof joe.Index
        throw new Error "Implement me"
      else
        throw new Error "Dunnow how to assign to #{@target} (#{@target.constructor.name})"

  joe.Operation::extend
    interpret: ($, item, last) ->
      switch item.stage
        when undefined
          if @left?
            if @right?
              item.stage = 'andGetRight'
            else
              item.stage = 'evaluateLeft'
            $.push this:@left, func:@left.interpret
          else
            item.stage = 'evaluateRight'
            $.push this:@right, func:@right.interpret
        when 'andGetRight'
          item.left = last
          item.stage = 'evaluateBoth'
          $.push this:@right, func:@right.interpret
        when 'evaluateLeft'
          $.pop()
          throw new Error "Implement me"
          return result
        when 'evaluateRight'
          $.pop()
          throw new Error "Implement me"
          return result
        when 'evaluateBoth'
          $.pop()
          switch @op
            when '+' then return item.left.__add__ $, last
            when '-' then return item.left.__sub__ $, last
            when '*' then return item.left.__mul__ $, last
            when '/' then return item.left.__div__ $, last
            else throw new Error "Unexpected operation #{@op}"
      return

  joe.Null::extend
    interpret: ($) ->
      $.pop()
      return JNull

  joe.Undefined::extend
    interpret: ($) ->
      $.pop()
      return JUndefined

  String::interpret = ($) ->
      $.pop()
      return @valueOf()

  Number::interpret = ($) ->
      $.pop()
      return @valueOf()
