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

isInteger = (n) -> n%1 is 0

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
JThread = @JThread = clazz 'JThread', ->

  # start:  The start node of program to run
  # user:   The user associated with this thread
  # global: Global lexical scope object
  # stdin:  Native function, () -> "user input string" or null if EOL
  # stdout: Native function, (str) -> # prints to user console
  init: ({@start, @user, global, @stdin, @stdout}) ->
    assert.ok @start instanceof joe.Node, "Start must be a function node"
    assert.ok @user instanceof JObject, "A JThread must have an associated user object."
    assert.ok Object.isFrozen(global), "Global object must be pre-frozen" if global
    @scope = if global then {__parent__:global} else {}
    if @user is SYSTEM.user then @will = -> yes
    @i9ns = [] # i9n stack
    @last = JUndefined # last return value.
    @interrupt = null
    @push this:@start, func:@start.interpret

  # Convenience
  run: ->
    resCode=@runStep() while not resCode?
    switch resCode
      when 'return' then return @last.jsValue
      when 'error' then throw @error
      else throw new Error "Unexpected resCode #{resCode}"

  # Main run loop.
  # returns...
  #   'error'   for uncaught errors. see @error
  #   'return'  for the final return value. see @last
  #   null      for all other intermediate cases.
  runStep: ->
    console.log blue "\n             -- runStep --"
    return 'return' if @i9ns.length is 0
    {func, this:that, target, targetKey, targetIndex} = i9n = @i9ns[@i9ns.length-1]
    printScope @scope
    printStack @i9ns
    throw new Error "Last i9n.func undefined!" if not func?
    throw new Error "Last i9n.this undefined!" if not that?
    throw new Error "target and targetKey must be present together" if (target? or targetKey?) and not (target? and targetKey?)
    @last = func.call that, this, i9n, @last
    switch @interrupt
      when 'error'
        console.log "             #{red 'throw ->'} #{@last}"
        @interrupt = null
        loop # unwind loop
          dontcare = @pop()
          i9n = @peek()
          if not i9n?
            # just print error here
            console.log "#{@error.name}: #{@error.message}"
            # print stack
            printStack @error.stack
            return 'error'
          else if i9n.this instanceof joe.Try and not i9n.isHandlingError
            i9n.isHandlingError = true
            i9n.func = joe.Try::interpretCatch
            last = @error
            return null
      when 'return'
        console.log "             #{yellow 'return ->'} #{@last}"
        @interrupt = null
        loop # unwind loop
          dontcare = @pop()
          i9n = @peek()
          if not i9n?
            return 'return'
          else if i9n.this instanceof joe.Invocation
            assert.ok i9n.func is joe.Invocation::interpretFinish
            return null
      else
        console.log "             #{blue 'last ->'} #{@last}"
        if targetIndex?
          target[targetKey][targetIndex] = @last
        else if target?
          target[targetKey] = @last
        return null

  ### STACKS ###

  pop: -> @i9ns.pop()

  peek: -> @i9ns[@i9ns.length-1]

  push: (i9n) -> @i9ns.push i9n

  copy: -> @i9ns[...]

  ### SCOPE ###

  #
  scopeGet: (name) ->
    scope = @scope
    loop
      nameInScope = `name in scope`
      break if nameInScope
      scope = scope.__parent__
      if not scope?
        return @throw 'ReferenceError', "#{name} is not defined"
    return scope[name]

  # Set a name/value pair on the topmost scope of the chain
  # Error if name already exists... all updates should happen w/ scopeUpdate.
  scopeDefine: (name, value) ->
    name = name.toKey()
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
    # while not `name in scope` TODO coffeesript bug
    loop
      nameInScope = `name in scope`
      break if nameInScope
      scope = scope.__parent__
      if not scope?
        return @throw 'ReferenceError', "#{name} is not defined"
    scope[name] = value
    return

  ### FLOW CONTROL ###

  throw: (name, message) ->
    @error = name:name, message:message, stack:@copy()
    @interrupt = 'error'

  return: (result) ->
    @last = result
    @interrupt = 'return'

  ### ACCESS CONTROL ###

  # Look at the object's acl to determine
  # if the action is permitted.
  will: (action, obj) ->
    return yes if obj.creator is @user
    acl = obj.acl ? obj
    throw new Error 'TODO determine permissing using ACL'

  toString: -> "[JThread]"

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
  # data: An Object
  # acl:  A JArray of JAccessControlItems
  #       NOTE: the acl has its own acl!
  init: ({@creator, @data, @proto, @acl}) ->
    assert.ok @creator? and @creator instanceof JObject,
                        "#{@constructor.name}.init requires 'creator' (JObject) but got #{@creator} (#{@creator?.constructor.name})"
                        # Everything has a creator. Wait a minute...
    @data ?= {}
  __get__: ($, key) ->
    $.will('read', this)
    value = @data[key.__str__($)]
    return value if value?
    return @proto.__get__($, key)
  __set__: ($, key, value) ->
    $.will('write', this)
    @data[key.__str__($)] = value
    return
  __keys__: ($) ->
    $.will('read', this)
    return _.keys @data
  __iterator__: ($) ->
    $.will('read', this)
    return new SimpleIterator _.keys @data
  __add__:  ($, other) -> $.throw 'TypeError', "Can't add to object yet"
  __sub__:  ($, other) -> $.throw 'TypeError', "Can't subtract from object yet"
  __mul__:  ($, other) -> $.throw 'TypeError', "Can't multiply with object yet"
  __div__:  ($, other) -> $.throw 'TypeError', "Can't divide an object yet"
  __bool__: ($, other) -> yes
  jsValue$: get: ->
    tmp = {}
    tmp[key] = value.jsValue for key, value of @data
    return tmp
  toString: -> "[JObject]"

JArray = @JArray = clazz 'JArray', JObject, ->
  init: ({creator, data, acl, array}) ->
    @array = array ? []
    @super.init.call @, {creator, data, acl}
  __get__: ($, key) ->
    $.will('read', this)
    return @array[key] if isInteger key
    keyStr = key.__str__($)
    return @array.length if keyStr is 'length'
    return @data[keyStr]
  __set__: ($, key, value) ->
    $.will('write', this)
    if isInteger key
      @array[key] = value
      return
    keyStr = key.__str__($)
    if keyStr is 'length'
      @array.length = value
      return
    @data[keyStr] = value
  __keys__: ($) ->
    $.will('read', this)
    return _.keys(@array).concat _.keys(@data)
  __add__:  ($, other) -> $.throw 'TypeError', "Can't add to array yet"
  __sub__:  ($, other) -> $.throw 'TypeError', "Can't subtract from array yet"
  __mul__:  ($, other) -> $.throw 'TypeError', "Can't multiply with array yet"
  __div__:  ($, other) -> $.throw 'TypeError', "Can't divide an array yet"
  __bool__: ($, other) -> yes
  jsValue$: get: ->
    tmp = @array[...]
    tmp[key] = value.jsValue for key, value of @data
    return tmp
  toString: -> "[JArray]"

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
    @super.init.call @, creator:this, data:{name:@name}
  toString: -> "[JUser #{@name}]"

JSingleton = @JSingleton = clazz 'JSingleton', ->
  __init__: (@name, @jsValue) ->
  __get__:    ($, key) -> $.throw 'TypeError', "Cannot read property '#{key}' of #{@name}"
  __set__: ($, key, value) -> $.throw 'TypeError', "Cannot set property '#{key}' of #{@name}"
  __keys__:        ($) -> $.throw 'TypeError', "Cannot get keys of #{@name}"
  __iterator__:    ($) -> $.throw 'TypeError', "Cannot get iterator of #{@name}"
  __add__:  ($, other) -> JNaN
  __sub__:  ($, other) -> JNaN
  __mul__:  ($, other) -> JNaN
  __div__:  ($, other) -> JNaN
  __bool__: ($, other) -> no
  toString: -> "Singleton(#{@name})"

JNull       = @JNull      = new JSingleton 'null', null
JUndefined  = @JUndefined = new JSingleton 'undefined', undefined
JNaN        = @JNaN       = new JSingleton 'NaN', NaN
# JFalse/JTrue don't exist, just use native booleans.

## SETUP

SYSTEM = @SYSTEM = user: new JUser name:'root'

unless joe.Node::interpret? then do =>
  require('joeson/src/translators/scope').install() # dependency
  require('joeson/src/translators/javascript').install() # dependency

  joe.Node::extend
    interpret: ($) ->
      throw new Error "Dunno how to evaluate a #{this.constructor.name}."

  joe.Word::extend
    interpret: ($) ->
      $.pop()
      return $.scopeGet @
    __str__: joe.Word::toString

  joe.Block::extend
    interpret: ($) ->
      $.pop()
      $.scopeDefine variable, JUndefined for variable in @ownScope.nonparameterVariables if @ownScope?
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
      # setup
      length = @items.length
      if length > 0
        i9n.obj = new JObject(creator:$.user)
        i9n.idx = 0
        i9n.length = @items.length
        i9n.func = joe.Obj::interpretKV
      else
        $.pop()
        return new JObject(creator:$.user)
    interpretKV: ($, i9n) ->
      # store prior item
      if 0 < i9n.idx
        i9n.obj.__set__($, i9n.key, i9n.value)
      # push next item evaluation
      if i9n.idx < i9n.length
        {key, value} = @items[i9n.idx]
        # setup key
        if key instanceof joe.Word
          i9n.key = key
        else if key instanceof joe.Str
          $.push this:key, func:key.interpret, target:i9n, targetKey:'key'
        else throw new Error "Unexpected object key of type #{key?.constructor.name}"
        # setup value
        $.push this:value, func:value.interpret, target:i9n, targetKey:'value'
        i9n.idx++
      else
        $.pop()
        return i9n.obj

  joe.Operation::extend
    interpret: ($, i9n) ->
      i9n.func = joe.Operation::interpret2
      if @left?
        $.push this:@left, func:@left.interpret, target:i9n, targetKey:'left'
        if @left instanceof joe.Index and @op in ['--', '++']
          {target, key} = @left
          $.push this:target, func:target.interpret, target:i9n, targetKey:'target'
          if key instanceof joe.Word
            i9n.key = key
          else if key instanceof joe.Str
            $.push this:key, func:key.interpret, target:i9n, targetKey:'key'
          else throw new Error "Unexpected object key of type #{key?.constructor.name}"
      if @right?
        $.push this:@right, func:@right.interpret, target:i9n, targetKey:'right'
      return
    interpret2: ($, i9n) ->
      $.pop()
      if @left?
        left = i9n.left
        if @right?
          right = i9n.right
          switch @op
            when '+'  then return left.__add__ $, right
            when '-'  then return left.__sub__ $, right
            when '*'  then return left.__mul__ $, right
            when '/'  then return left.__div__ $, right
            when '<'  then return left.__cmp__($, right) < 0
            when '>'  then return left.__cmp__($, right) > 0
            when '<=' then return left.__cmp__($, right) <= 0
            when '>=' then return left.__cmp__($, right) >= 0
            else throw new Error "Unexpected operation #{@op}"
        else # left++, left--...
          switch @op
            when '++' then value = left.__add__ $, 1
            when '--' then value = left.__sub__ $, 1
            else throw new Error "Unexpected operation #{@op}"
          if isVariable left
            $.scopeUpdate left, value
          else if left instanceof joe.Index
            i9n.target.__set__ $, i9n.key, value
          else
            throw new Error "Dunno how to increment #{left} (#{left.constructor.name})"
          return value
      else
        throw new Error "implement me"

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
      if @key instanceof joe.Word
        $.pop()
        return obj.__get__ $, @key
      else
        i9n.obj = obj
        i9n.func = joe.Index::interpretKey
        $.push this:@key, func:@key.interpret
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
      # interpret the func synchronously.
      i9n.func = joe.Invocation::interpretParams
      $.push this:@func, func:@func.interpret
      return
    interpretParams: ($, i9n, func) ->
      i9n.invokedFunction = func
      # interpret the parameters
      i9n.paramValeus = []
      for param, i in @params
        $.push this:param, func:param.interpret, target:i9n, targetKey:'paramValues', targetIndex:i
      i9n.func = joe.Invocation::interpretCall
      return
    interpretCall: ($, i9n) ->
      i9n.func = joe.Invocation::interpretFinal
      if i9n.invokedFunction instanceof joe.BoundFunc
        i9n.oldScope = $.scope
        {func:{block,params}, scope} = i9n.invokedFunction
        paramValues = i9n.paramValues
        $.scope = {__parent__:scope} # spawn new scope.
        if params?
          # Though params is an AssignList,
          assert.ok params instanceof joe.AssignList
          # ... we'll manually bind values to param names.
          for {target:argName}, i in params.items
            assert.ok isVariable argName, "Expected variable but got #{argName} (#{argName?.constructor.name})"
            $.scopeDefine argName, paramValues[i]
        $.push this:block, func:block.interpret
        return
      else if i9n.invokedFunction instanceof Function # native function
        try
          # NOTE: i9n is unavailable to native functions
          # me don't see why it should be needed.
          return i9n.invokedFunction.apply $, i9n.paramValues
        catch error
          return $.throw error?.name ? 'UnknownError', error?.message ? ''+error
    interpretFinal: ($, i9n, result) ->
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
        return $.return joe.JUndefined
    interpretResult: ($, i9n, result) ->
      return $.return result

  joe.Loop::extend
    interpret: ($, i9n) ->
      $.push this:@block, func:@block.interpret

  joe.JSForC::extend
    interpret: ($, i9n) ->
      if @cond?
        i9n.func = joe.JSForC::interpretConditionalLoop
        $.push this:@cond,  func:@cond.interpret
      else
        i9n.func = joe.JSForC::interpretUnconditionalLoop
      if @setup?
        $.push this:@setup, func:@setup.interpret
    interpretConditionalLoop: ($, i9n, cond) ->
      if cond.__bool__().jsValue
        $.push this:@cond,    func:@cond.interpret
        $.push this:@block,   func:@block.interpret
        $.push this:@counter, func:@counter.interpret
      else
        $.pop()
    interpretUnconditionalLoop: ($, i9n) ->
      $.push this:@block,   func:@block.interpret
      $.push this:@counter, func:@counter.interpret

  joe.Range::extend
    interpret: ($, i9n) ->
      i9n.func = joe.Range::interpret2
      if @start?
        $.push this:@start, func:@start.interpret, target:i9n, targetKey:'start'
      if @end?
        $.push this:@end, func:@end.interpret, target:i9n, targetKey:'end'
      if @by?
        $.push this:@by, func:@by.interpret, target:i9n, targetKey:'by'
    interpret2: ($, i9n) ->
      # TODO Make range an iterator
      $.pop()
      if i9n.by?
        array = (x for x in [i9n.start...i9n.end] by i9n.by)
      else
        array = [i9n.start...i9n.end]
      return JArray creator:SYSTEM.user, array:array
      
  clazz.extend String,
    interpret: ($) ->
      $.pop()
      return @valueOf()
    __get__: ($, key) -> # pass
    __set__: ($, key, value) -> # pass
    __keys__:       ($) -> $.throw 'TypeError', "Object.keys called on non-object"
    __iterator__:   ($) -> new SimpleIterator @valueOf()
    __str__:        ($) -> @valueOf()
    __add__: ($, other) -> @valueOf() + other.__str__($)
    __sub__: ($, other) -> $.throw 'TypeError', "Can't subtract strings yet"
    __mul__: ($, other) -> $.throw 'TypeError', "Can't multiply strings yet"
    __div__: ($, other) -> $.throw 'TypeError', "Can't divide strings yet"
    jsValue$: get: -> @

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
    __cmp__: ($, other) -> @valueOf() - other.__num__()
    __bool__:       ($) -> this isnt 0
    jsValue$: get: -> @

  clazz.extend Boolean,
    interpret: ($) ->
      $.pop()
      return @valueOf()
    __str__:        ($) -> ''+@valueOf()
    __num__:        ($) -> JNaN
    __add__: ($, other) -> JNaN
    __sub__: ($, other) -> JNaN
    __mul__: ($, other) -> JNaN
    __div__: ($, other) -> JNaN
    __cmp__: ($, other) -> JNaN
    __bool__:       ($) -> @
    jsValue$: get: -> @

# Global objects available in everybody's scope.
GLOBAL_ =
  print: ($, str) -> $.stdout(str)
Object.freeze GLOBAL_

# Multi-user time-shared interpreter.
@JKernel = JKernel = clazz 'JKernel', ->

  init: ->
    @threads = []
    @index = 0

  # start processing another thread
  run: ({user, code, stdin, stdout, stderr}) ->
    try
      if typeof 'code' is 'string'
        node = require('joeson/src/joescript').parse code
        node = node.toJSNode().installScope().determine()
      else
        node = code
      thread = new JThread start:node, user:user, global:GLOBAL_, stdin:stdin, stdout:stdout, stderr:stderr
      @threads.push thread
      if @threads.length is 1
        @index = 0 # might have been NaN
        @runloop()
    catch error
      stderr(error)

  runloop$: ->
    thread = @threads[@index]
    console.log "tick"
    resCode = thread.runStep()
    if resCode?
      if resCode is 'error'
        thread.stderr(thread.error)
      else if resCode is 'return'
        thread.stdout(thread.last.jsValue)
      console.log "thread #{thread} finished with rescode #{resCode}."
      @threads[@index..@index] = [] # splice out
      @index = @index % @threads.length # oops, sometimes NaN
    else
      process.nextTick @runloop
      @index = (@index + 1) % @threads.length
