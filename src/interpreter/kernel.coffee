log = trace = no

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{randid, pad, escape, starts, ends} = require 'joeson/lib/helpers'
{
  NODES:joe
  HELPERS: {extend, isVariable}
} = require('joeson/src/joescript')

{@NODES, @HELPERS} = {NODES:{JStub, JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc}} = require 'joeson/src/interpreter/object'

# installs instructions to joescript prototypes
require 'joeson/src/interpreter/instructions'

_parseCode = (code) ->
  return code if code instanceof joe.Node
  info "received code:\n#{code}" if log
  node = require('joeson/src/joescript').parse code
  info "unparsed node:\n" + node.serialize() if log
  node = node.toJSNode(toValue:yes).installScope().determine()
  info "parsed node:\n" + node.serialize() if log
  return node

JStackItem = @JStackItem = clazz 'JStackItem', ->
  init: ({@node}) ->
    # figure out which function this node is declared in
    # used for printing a stack trace.
    # TODO make it lazy
    declaringFunc = @node.parent
    declaringFunc = declaringFunc.parent while declaringFunc? and declaringFunc not instanceof joe.Func
    @declaringFunc = declaringFunc
  toString: -> "'#{@node?.toJavascript?()}' (source:#{@declaringFunc}, line:#{@node._origin?.start.line}, col:#{@node._origin?.start.col})"

# A runtime context. (Represents a thread/process of execution)
# user:     Owner of the process
# scope:    All the local variables, a dual of the lexical scope.
# i9ns:     Instructions, a "stack" that also stores intermediate data.
# error:    Last thrown error
JThread = @JThread = clazz 'JThread', ->

  # kernel: JKernel to which this thread belongs
  # code:   The code node of next program to run
  # user:   The user associated with this thread
  # scope:  Immediate local lexical scope object
  init: ({@kernel, code, @user, @scope, callback}) ->
    assert.ok @kernel instanceof JKernel,  "JThread wants kernel"
    assert.ok code instanceof joe.Node, "JThread wants Joescript node"
    assert.ok @user   instanceof JObject,  "JThread wants user"
    @scope ?= new JObject creator:@user
    assert.ok @scope  instanceof JObject,  "JThread scope not JObject"
    @id = randid()
    @queue = []
    @waitKeys = []
    @start {code, callback}

  # Main run loop iteration.
  runStep: ->
    if @i9ns.length is 0
      @state = if @error then 'error' else 'return'
      return
    {func, this:that} = i9n = @i9ns[@i9ns.length-1]
    info blue "             -- runStep --" if trace
    @printScope @scope if trace
    @printStack() if trace
    throw new Error "Last i9n.func undefined!" if not func?
    result = func.call that ? i9n, this, i9n, @last
    @last = result
    
    switch @state
      when null
        info "             #{blue 'last ->'} #{@last}" if trace
        return # @state=null
      when 'error'
        info "             #{red 'throw ->'} #{@last}" if trace
        loop # unwind loop
          dontcare = @pop()
          i9n = @peek()
          if not i9n?
            return # @state='error'
          else if i9n.this instanceof joe.Try and not i9n.isHandlingError
            i9n.isHandlingError = true
            i9n.func = joe.Try::interpretCatch
            @last = @error
            return @state=null
      when 'return'
        info "             #{yellow 'return ->'} #{@last}" if trace
        loop # unwind loop
          dontcare = @pop()
          i9n = @peek()
          if not i9n?
            return # @state='return'
          else if i9n.this instanceof joe.Invocation
            assert.ok i9n.func is joe.Invocation::interpretFinal, "Unexpected i9n.func #{i9n.func?._name or i9n.func?._name}"
            return @state=null
      when 'wait'
        info "             #{yellow 'wait ->'} #{inspect @waitKey}" if trace
        return # @state='wait'
      else
        throw new Error "Unexpected state #{@state}"

  ### STACKS ###

  pop: -> @i9ns.pop()

  peek: -> @i9ns[@i9ns.length-1]

  push: (i9n) -> @i9ns.push i9n

  callStack: ->
    stack = []
    for item in @i9ns when item.this instanceof joe.Invocation
      stack.push JStackItem node:item.this
    return stack

  ### FLOW CONTROL

    $.throw, $.return, $.wait are methods to change the state of the thread.
    They set the state on the thread appropriately, and if needed modify
    kernel waitlists. The handling of removing the thread from the runloop,
    and calling thread callbacks, happen in the kernel loop.

    For coding convenience, the result of these functions get returned
    and set in thread.last, so be deliberate about what is returned, usually 'undefined'.

  ###

  throw: (name, message) ->
    @error = name:name, message:message, stack:@callStack()
    if @state is 'wait'
      while waitKey=@waitKeys.pop()
        (waitList=@kernel.waitLists[waitKey]).remove @
        delete @kernel.waitLists[waitKey] if waitList.length is 0
      @state = 'error'
      return undefined
    else
      assert.ok @waitKeys.length is 0, "During a throw, #{@} @state!='wait' had waitKeys #{@waitKeys}"
      @state = 'error'
      return undefined

  return: (result) ->
    assert.ok result?, "result value can't be undefined. Maybe JUndefined?"
    debug "#{@}.return result = #{result}" if log
    @state = 'return'
    return result # return the result of this to set @last.

  wait: (waitKey) ->
    debug "#{@}.wait waitKey = #{waitKey}" if log
    # assert.ok @state is null, "JThread::wait wants null state for waiting but got #{@state}"
    (@kernel.waitLists[waitKey]?=[]).push @
    @waitKeys.push waitKey
    @state = 'wait'
    return undefined

  resume: (waitKey) ->
    debug "#{@}.resume waitKey = #{waitKey}" if log
    @kernel.resumeThreads waitKey

  # A process of the thread has ended. Call callback functions and clean up.
  exit: ->
    debug "#{@}.exit, @callback?:#{@callback?}"
    if @callback?
      try
        callback = @callback
        @callback = null
        callback.call(@, @error)
      catch err
        @kernel.errorCallback(err)

  # Run more code after current code exits.
  # If the callback is not specified, it gets set to null.
  enqueue: ({code, callback}) ->
    if @state in ['return', 'error']
      # reset state
      @start {code, callback}
      # TODO refactor the below two lines
      @kernel.runloop.push @
      process.nextTick @kernel.runRunloop if @kernel.runloop.length is 1
    else
      @queue.push {code, callback}

  # Set the thread to start the next process.
  start: ({code, callback}) ->
    @i9ns = []
    @last = JUndefined
    @error = null
    @state = null
    if code
      node = _parseCode code
      @i9ns.push this:node, func:node.interpret
    @callback = callback ? null

  ### ACCESS CONTROL ###

  # Look at the object's acl to determine
  # if the action is permitted.
  will: (action, obj) ->
    return yes # TODO
    #return yes if obj.creator is @user
    #acl = obj.acl ? obj
    #throw new Error 'TODO determine permissing using ACL'

  ### DEBUG ###

  printStack: (stack=@i9ns) ->
    assert.ok stack instanceof Array
    for i9n, i in stack
      i9nCopy = Object.clone i9n
      delete i9nCopy.this
      delete i9nCopy.func
      info        "#{ blue pad right:12, "#{i9n.this?.constructor?.name}"
                 }.#{ yellow i9n.func?._name
             }($, {#{ white Object.keys(i9nCopy).join ','
            }}, _) #{ black if i9n.this.toString? then escape(i9n.this) else "(#{typeof i9n.this}) with no toString" }"

  errorStack: ->
    stackTrace = @error.stack.map((x)->'  at '+x).join('\n') or '  -- no stack trace available --'
    "#{@error.name ? 'UnknownError'}: #{@error.message ? ''}\n  Most recent call last:\n#{stackTrace}"

  printErrorStack: -> warn @errorStack()

  printScope: (scope, lvl=0) ->
    if scope instanceof JStub
      info "#{black pad left:13, lvl}#{red scope.__str__()}"
      return
    for key, value of scope.data when key isnt '__proto__'
      try
        valueStr = value.__str__(@)
      catch error
        valueStr = "<ERROR IN __STR__: #{error}>"
      info "#{black pad left:13, lvl}#{red key}#{ blue ':'} #{valueStr}"
    @printScope scope.data.__proto__, lvl+1 if scope.data.__proto__?

  # Convenience
  pushValue: (thing) ->
    i9n = this:thing, func:thing.interpret
    @push i9n
    return i9n

  # Add a new object jobj to the kernel cache
  new: (jobj) ->
    assert.ok jobj instanceof JObject
    assert.ok jobj.id, "$.new(jobj) requires jobj.id, but id was undefined"
    @kernel.cache[jobj.id] = jobj

  # DEPRECATED
  # for convenience, jml is available on a thread.
  jml: (args...) ->
    attributes = undefined
    if args[0] instanceof Object and args[0] not instanceof JObject
      attributes = args.shift()
    if args.length is 1 and args[0] instanceof Array
      elements = args[0]
    else
      elements = args
    if attributes?
      elements[''+key] = value for key, value of attributes
    return new JArray creator:@user, data:elements

  toString: -> "[JThread ##{@id} s:#{@state} l:#{@last}]"

## KERNEL ##
# Multi-user time-shared interpreter.
@JKernel = JKernel = clazz 'JKernel', ->

  # cache:            cache of JObjects
  # nativeFunctions:  all registered native functions
  # errorCallback:    when thread callbacks error out
  init: ({@cache, @nativeFunctions, @errorCallback}={}) ->
    @runloop = []  # TODO threads pushed here must have state=null. better API.
    @cache ?= {}      # TODO should be weak etc.
    @nativeFunctions ?= {}
    @index = 0
    @ticker = 0
    @waitLists = {}   # waitKey -> [thread1,thread2,...]
    @emitter = new (require('events').EventEmitter)()
    @errorCallback ?= @defaultErrorCallback

  defaultErrorCallback: (error) ->
    fatal "KERNEL ERROR!\n#{error.stack ? error}"

  # Start processing another thread
  # user:     The same user object as returned by login.
  # callback: Called with thread after it exits.
  # CONTRACT: Caller shouldn't have to worry about catching errors from run. See @errorCallback
  run: ({user, code, scope, callback}) ->
    assert.ok user?, "User must be provided."
    assert.ok user instanceof JUser, "User not instanceof JUser, got #{user?.constructor.name}"
    try
      node = _parseCode code
      thread = new JThread
        kernel:@
        code:node
        user:user
        scope:scope
        callback:callback
      @runloop.push thread
      @runRunloop() if @runloop.length is 1
    catch error
      if node?
        @errorCallback "Error in user code start:\n#{error.stack ? error}\nfor node:\n#{node.serialize()}"
      else
        @errorCallback "Error parsing code:\n#{error.stack}\nfor code text:\n#{code}"

  runRunloop$: ->
    info "JKernel::runRunloop. @#{@index} (of #{@runloop.length})" if log
    # A thread polled from the runloop can have any @state.
    # After it gets polled, the state gets handled, and the thread
    # may get removed from the runloop.
    thread = @runloop[@index]
    try
      # This reduces nextTick overhead, which is more significant when server is running (vs just testing)
      # kinda like a linux "tick", values is adjustable.
      for i in [0..20]
        @ticker++
        info "tick #{@ticker}. #{thread} (of #{@runloop.length})" if log
        thread.runStep()
        if thread.state?
          # Run callbacks. Callbacks may enqueue more callbacks.
          thread.exit() unless thread.state is 'wait'
          # Pull the thread out,
          if thread.queue.length is 0 or thread.state is 'wait'
            @runloop[@index..@index] = [] # splice out
            @index = @index % @runloop.length or 0
            process.nextTick @runRunloop if @runloop.length > 0
            return
          # or, run what's next in the queue.
          else
            # thread.queue.length > 0 and thread.state != 'wait'
            assert.ok thread.state in ['return', 'error'], "Unexpected thread state #{thread.state}"
            thread.start thread.queue.shift()
      @index = (@index + 1) % @runloop.length
      process.nextTick @runRunloop
    catch error
      fatal "Native error thrown in runStep. Stopping execution, setting error. stack:\n" + (error.stack ? error)
      if thread?
        thread.throw 'InternalError', "#{error.name}:#{error.message}"
        @runloop[@index..@index] = [] # splice out
        @index = @index % @runloop.length or 0
        process.nextTick @runRunloop if @runloop.length > 0
        thread.exit()
      else
        @errorCallback(error)
      return

  resumeThreads: (waitKey) ->
    assert.ok waitKey?, "JKernel::resumeThreads wants waitKey"
    debug "JKernel::resumeThreads waitKey = #{waitKey}" if log
    waitList = @waitLists[waitKey]
    debug "waitList = #{waitList}" if log
    return if not waitList?.length # was already resumed some other how.
    newWaitList = []
    for thread in waitList
      thread.waitKeys.remove waitKey
      if thread.waitKeys.length is 0
        debug "JKernel inserting #{thread} into @runloop" if log
        thread.state = null
        @runloop.push thread
        process.nextTick @runRunloop if @runloop.length is 1
      else
        newWaitList.push thread
    debug "new waitList = #{newWaitList}" if log
    if newWaitList.length
      @waitLists[waitKey] = newWaitList
    else
      delete @waitLists[waitKey]

  shutdown: -> @emitter.emit 'shutdown'

  toString: -> "[JKernel]"
