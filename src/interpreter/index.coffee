###
Concerns:
  * permissions (ACL)
  * concurrency (interwoven within a line of process,
                 simultaneous amongst processes.)
  * performance
  * networking  (future)

i9n: short for instruction
###

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'
joe = require('joeson/src/joescript').NODES
{pad, escape} = require 'joeson/lib/helpers'
{extend, isVariable} = require('joeson/src/joescript').HELPERS

# ERRORS = [ 'RangeError', 'EvalError', 'SyntaxError', 'URIError', 'ReferenceError', 'Error', 'TypeError' ]

printStack = (stack) ->
  for i9n, i in stack
    i9nCopy = _.clone i9n
    delete i9nCopy.this
    delete i9nCopy.func
    console.log "#{ blue pad right:12, "#{i9n.this?.constructor.name}"
               }.#{ yellow i9n.func?._name
           }($, {#{ white _.keys(i9nCopy).join ','
          }}, _) #{ black escape i9n.this }"

printScope = (scope, lvl=0) ->
  for key, value of scope when key isnt '__parent__'
    console.log "#{black pad left:13, lvl}#{red key}#{ blue ':'} #{value}"
  printScope scope.__parent__, lvl+1 if scope.__parent__?

# A runtime context. (Represents a thread/process of execution)
# user:     Owner of the process
# scope:    All the local variables, a dual of the lexical scope.
# i9ns:     Instructions, a "stack" that also stores intermediate data.
# error:    Last thrown error
JRuntimeContext = @JRuntimeContext = clazz 'JRuntimeContext', ->

  # Usage..
  #   scope = {}
  #   scope.global = scope
  #   new JRuntimeContext user, scope
  init: (@user, @scope={}) ->
    assert.ok @user instanceof JObject, "A JRuntimeContext must have an associated user object."
    if @user is SYSTEM.user then @will = -> yes
    @i9ns = [] # i9n stack

  # Run to completion, synchronously.
  # node: If present, will push node to @i9ns
  #       before starting.
  exec: (node) ->
    @push this:node, func:node.interpret
    last = undefined
    # interrupt recovery loop
    loop
      try
        # main loop
        while i9n = @i9ns[@i9ns.length-1]
          console.log blue "\n             -- step --"
          func = i9n.func
          that = i9n.this
          # validation
          @print()
          if not func?
            throw new Error "Last i9n.func undefined!"
          if not that?
            throw new Error "Last i9n.this undefined!"
          last = func.call that, this, i9n, last
          console.log "             #{blue "return"} #{last}"
        if last?.__jsValue__?
          return last.__jsValue__()
        else
          return last
      catch interrupt
        throw interrupt if typeof interrupt isnt 'string'

        switch interrupt
          when 'throw'
            loop # unwind loop
              dontcare = @pop()
              i9n = @peek()
              if not i9n?
                # just print error here
                console.log "#{@error.name}: #{@error.message}"
                # print stack
                printStack @error.stack
                return
              else if i9n.this instanceof joe.Try and not i9n.isHandlingError
                i9n.isHandlingError = true
                i9n.func = joe.Try::interpretCatch
                last = @error
                break
          when 'return'
            loop # unwind loop
              dontcare = @pop()
              i9n = @peek()
              if not i9n?
                return @result
              else if i9n.this instanceof joe.Invocation
                assert.ok i9n.func is joe.Invocation::interpretFinish
                last = @result
                break
          else throw new Error "Unexpected interrupt #{interrupt} (#{interrupt?.constructor.name})"

  ### STACKS ###

  pop: -> @i9ns.pop()

  peek: -> @i9ns[@i9ns.length-1]

  push: (i9n) -> @i9ns.push i9n

  copy: -> @i9ns[...]

  print: ->
    printScope @scope
    printStack @i9ns

  ### SCOPE ###

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
    alreadyDefined = `name in this.scope` # coffeescript but, can't say "not `...`"
    assert.ok not alreadyDefined, "Already defined in scope: #{name}"
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
    throw 'throw'

  return: (result) ->
    @result = result
    throw 'return'

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

  # func:    The joe.Func node.
  # creator: The owner of the process that declared above function.
  # scope:   Runtime scope of process that declares above function.
  init: ({@func, @creator, @scope}) ->
    assert.ok @func instanceof joe.Func, "func not Func"
    assert.ok @scope? and @scope instanceof Object, "scope not an object"
    assert.ok @creator instanceof JUser, "creator not JUser"

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
    @data ?= {}
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

  __jsValue__: ->
    tmp = {}
    for key, value of @data
      if value?.__jsValue__?
        tmp[key] = value.__jsValue__()
      else
        tmp[key] = value
    return tmp

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
  __add__: ($, other) -> JNaN
  __sub__: ($, other) -> JNaN
  __mul__: ($, other) -> JNaN
  __div__: ($, other) -> JNaN
  toString: -> "Singleton(#{@name})"

_JNull = clazz '_JNull', JSingleton, ->
  __jsValue__: -> null
JNull = @JNull = new _JNull()

_JUndefined = clazz '_JUndefined', JSingleton, ->
  __jsValue__: -> undefined
JUndefined = @JUndefined = new _JUndefined()

_JNaN = clazz '_JNaN', JSingleton, ->
  __jsValue__: -> NaN
JNaN = @JNaN = new _JNaN()

## SETUP

unless joe.Node::interpret? then do =>
  require('joeson/src/translators/scope').install() # dependency
  require('joeson/src/translators/javascript').install() # dependency

  joe.Node::extend
    interpret: ($) ->
      throw new Error "Dunno how to evaluate a #{this.constructor.name}."

  joe.Word::extend
    interpret: ($) ->
      $.pop()
      return $.scopeGet @word

  joe.Block::extend
    interpret: ($) ->
      $.pop()
      $.scopeDefine variable, undefined for variable in @ownScope.nonparameterVariables if @ownScope?
      if (length=@lines.length) > 1
        $.push this:@, func:joe.Block::interpretLoop, length:length, idx:0
      firstLine = @lines[0]
      $.push this:firstLine, func:firstLine.interpret
      return
    interpretLoop: ($, i9n, last) ->
      assert.ok typeof i9n.idx is 'number'
      if i9n.idx is i9n.length-2
        $.pop() # pop this
      nextLine = @lines[++i9n.idx]
      $.push this:nextLine, func:nextLine.interpret
      return

  joe.If::extend
    interpret: ($) ->
      $.pop()
      $.push this:this,  func:joe.If::interpret2
      $.push this:@cond, func:@cond.interpret
      return
    interpret2: ($, i9n, cond) ->
      $.pop()
      if cond.__isTrue__?() or cond
        $.push this:@block, func:@block.interpret
      else if @else
        $.push this:@else, func:@else.interpret
      return

  joe.Assign::extend
    interpret: ($) ->
      $.pop()
      $.push this:this,    func:joe.Assign::interpret2
      $.push this:@value,  func:@value.interpret
      return
    interpret2: ($, i9n, value) ->
      $.pop()
      if isVariable @target
        $.scopeUpdate @target, value
      else if @target instanceof joe.Index
        throw new Error "Implement me"
      else
        throw new Error "Dunnow how to assign to #{@target} (#{@target.constructor.name})"
      return value

  joe.Obj::extend
    interpret: ($, i9n) ->
      length = @items.length
      if length > 0
        {key, value} = @items[0]
        i9n.obj = new JObject(creator:$.user)
        i9n.idx = 0
        i9n.length = @items.length
        if key instanceof joe.Word
          i9n.func = joe.Obj::interpretKV
          i9n.key = key.toString()
          $.push this:value, func:value.interpret
        else
          i9n.func = joe.Obj::interpretKey
          $.push this:key, func:key.interpret
        return
      else
        $.pop()
        return new JObject(creator:$.user)
    interpretKey: ($, i9n, key) ->
      i9n.key = key
      i9n.func = joe.Obj::interpretKV
      return
    interpretKV: ($, i9n, value) ->
      i9n.obj.__set__($, i9n.key, value)
      idx = i9n.idx + 1
      if idx < idx.length
        {key, value} = @items[idx]
        i9n.idx = idx
        if key instanceof joe.Word
          i9n.key = key
          $.push this:value, func:value.interpret
        else if key instanceof joe.Str
          i9n.func = joe.Obj::interpretKey
          $.push this:key, func:key.interpret
        else throw new Error "Dunno how to handle object key of type #{key.constructor.name}"
        return
      else
        $.pop()
        return i9n.obj

  joe.Operation::extend
    interpret: ($, i9n, last) ->
      switch i9n.stage
        when undefined
          if @left?
            if @right?
              i9n.stage = 'andGetRight'
            else
              i9n.stage = 'evaluateLeft'
            $.push this:@left, func:@left.interpret
          else
            i9n.stage = 'evaluateRight'
            $.push this:@right, func:@right.interpret
        when 'andGetRight'
          i9n.left = last
          i9n.stage = 'evaluateBoth'
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
            when '+' then return i9n.left.__add__ $, last
            when '-' then return i9n.left.__sub__ $, last
            when '*' then return i9n.left.__mul__ $, last
            when '/' then return i9n.left.__div__ $, last
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

  joe.Index::extend
    interpret: ($, i9n) ->
      i9n.func = joe.Index::interpretTarget
      $.push this:@obj, func:@obj.interpret
      return
    interpretTarget: ($, i9n, obj) ->
      if @attr instanceof joe.Word
        $.pop()
        return obj.__get__ $, @attr
      else
        i9n.obj = obj
        i9n.func = joe.Index::interpretKey
        $.push this:@attr, func:@attr.interpret
        return
    interpretKey: ($, i9n, key) ->
      $.pop()
      return i9n.obj.__get__ $, key

  joe.Func::extend
    interpret: ($, i9n) ->
      $.pop()
      return new JBoundFunc func:this, creator:$.user, scope:$.scope

  joe.Invocation::extend
    interpret: ($, i9n) ->
      i9n.oldScope = $.scope # remember
      # interpret the func
      i9n.func = joe.Invocation::interpretFunc
      $.push this:@func, func:@func.interpret
      return
    interpretFunc: ($, i9n, func) ->
      # interpret the parameters
      length = @params.length
      if length > 0
        i9n._func = func
        i9n.func = joe.Invocation::interpretParams
        i9n.idx = 0
        i9n.length = @params.length
        i9n.paramValues = new Array(length)
        paramValue = @params[0]
        $.push this:paramValue, func:paramValue.interpret
        return
      else
        i9n.func = joe.Invocation::interpretCall
        return
    interpretParams: ($, i9n, value) ->
      i9n.paramValues[i9n.idx] = value
      if i9n.idx < i9n.length - 1
        i9n.idx = i9n.idx + 1
        paramValue = @params[i9n.idx]
        $.push this:paramValue, func:paramValue.interpret
        return
      else
        i9n.func = joe.Invocation::interpretCall
        return
    interpretCall: ($, i9n) ->
      i9n.func = joe.Invocation::interpretFinish
      i9n.oldScope = $.scope
      {block, params} = i9n._func.func
      paramValues = i9n.paramValues
      $.scope = {__parent__:$.scope} # spawn new scope.
      # Though params is an AssignList,
      assert.ok params instanceof joe.AssignList
      # ... we'll manually bind values to param names.
      for {target:argName}, i in params.items
        assert.ok isVariable argName, "Expected variable but got #{argName} (#{argName?.constructor.name})"
        $.scopeDefine argName, paramValues[i]
      $.push this:block, func:block.interpret
      return
    interpretFinish: ($, i9n, result) ->
      $.pop()
      $.scope = i9n.oldScope # recall old scope
      return result

  joe.AssignObj::extend
    interpret: ($, i9n, rhs) ->
      assert.ok no, "AssignObjs aren't part of javascript. Why didn't they get transformed away?"

  joe.Statement::extend
    interpret: ($, i9n) ->
      if @expr?
        i9n.func = joe.Statement::interpretResult
        $.push this:@expr, func:@expr.interpret
        return
      else
        $.return joe.JUndefined
    interpretResult: ($, i9n, result) ->
      $.return result
      
  clazz.extend String,
    interpret: ($) ->
      $.pop()
      return @valueOf()
    __get__: ($, key) -> # pass
    __set__: ($, key, value) -> # pass
    __keys__:       ($) -> $.throw 'TypeError', "Object.keys called on non-object"
    __iterator__:   ($) -> new SimpleIterator @valueOf()
    __str__:        ($) -> @valueOf()
    __add__: ($, other) -> @valueOf() + other.__str__()
    __sub__: ($, other) -> $.throw 'TypeError', "Can't subtract strings yet"
    __mul__: ($, other) -> $.throw 'TypeError', "Can't multiply strings yet"
    __div__: ($, other) -> $.throw 'TypeError', "Can't divide strings yet"

  clazz.extend Number,
    interpret: ($) ->
      $.pop()
      return @valueOf()
    __str__:        ($) -> ''+@valueOf()
    __num__:        ($) -> @valueOf()
    __add__: ($, other) -> @valueOf() + other.__num__()
    __sub__: ($, other) -> @valueOf() - other.__num__()
    __mul__: ($, other) -> @valueOf() * other.__num__()
    __div__: ($, other) -> @valueOf() / other.__num__()

  clazz.extend Boolean,
    interpret: ($) ->
      $.pop()
      return @valueOf()
