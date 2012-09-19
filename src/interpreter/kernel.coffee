log = trace = no
perf = no

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{randid, pad, escape, starts, ends} = require 'sembly/lib/helpers'
{
  NODES:joe
  HELPERS: {extend, isVariable}
} = require('sembly/src/joescript')

{@NODES, @HELPERS} = {NODES:{JStub, JObject, JArray, JUndefined, JNull, JNaN, JBoundFunc}} = require 'sembly/src/interpreter/object'

# installs instructions to joescript prototypes
require 'sembly/src/interpreter/instructions'

_parseCode = (code) ->
  return code if code instanceof joe.Node
  info "received code:\n#{code}" if log
  node = require('sembly/src/joescript').parse code
  info "unparsed node:\n" + node.serialize() if log
  node = node.toJSNode(toVal:yes).installScope().determine()
  info "parsed node:\n" + node.serialize() if log
  return node

JStackItem = @JStackItem = clazz 'JStackItem', ->
  init: ({@node}) ->
    # TODO figure out which function this node is declared in
    # used for printing a stack trace.
  toString: -> "'#{@node}' (line:#{@node._origin?.start.line}, col:#{@node._origin?.start.col})"


_i9nPerf = {}

INTERRUPT_ERROR = 'INTERRUPT_ERROR'
INTERRUPT_NONE = 'INTERRUPT_NONE'
STATE_RUNNING = 'STATE_RUNNING'
STATE_RETURN = 'STATE_RETURN'
STATE_ERROR = 'STATE_ERROR'
STATE_WAIT = 'STATE_WAIT'

# A runtime context. (Represents a thread/process of execution)
# user:     Owner of the process
# scope:    All the local variables, a dual of the lexical scope.
# i9ns:     Instructions, a "stack" that also stores intermediate data.
# error:    Last thrown error
JThread = @JThread = clazz 'JThread', ->

  # kernel:  JKernel to which this thread belongs
  # code:    The code node of next program to run
  # user:    The user associated with this thread
  # scope:   Immediate local lexical scope object
  # timeout: Timeout in milliseconds, force error
  init: ({@kernel, code, @user, @scope, timeout, callback}) ->
    assert.ok @kernel instanceof JKernel,  "JThread wants kernel"
    assert.ok code    instanceof joe.Node, "JThread wants Joescript node"
    assert.ok @user   instanceof JObject,  "JThread wants user"
    @scope ?= new JObject creator:@user
    assert.ok @scope  instanceof JObject,  "JThread scope not JObject"
    @id = randid()
    @queue = []
    @waitKeys = []
    @start {code, timeout, callback}

  # Main run loop iteration.
  runStep: ->
    if @i9ns.length is 0
      @state = if @error then STATE_ERROR else STATE_RETURN
      return
    {func, this:that} = i9n = @i9ns[@i9ns.length-1]
    i9nKey = "#{that?.constructor.name}.#{func._name}" if perf
    info blue "             -- runStep --" if trace
    @printScope @scope if trace
    @printStack() if trace
    throw new Error "Last i9n.func undefined!" if not func?
    before = new Date() if perf
    result = func.call that ? i9n, this, i9n, @last
    if perf
      after = new Date()
      _i9nPerf[i9nKey] ?= total:0, count:0
      _i9nPerf[i9nKey].total += (after-before)
      _i9nPerf[i9nKey].count += 1
      _i9nPerf.counter ?= 0
      if _i9nPerf.counter++ % 1000000 is 0
        console.log perf:_i9nPerf
    @last = result
    
    switch @state
      when STATE_RUNNING
        info "             #{blue 'last ->'} #{@last}" if trace
      when STATE_RETURN
        info "             #{yellow 'return ->'} #{@last}" if trace
      when STATE_WAIT
        info "             #{yellow 'wait ->'} #{inspect @waitKey}" if trace
      else
        throw new Error "Unexpected state #{@state}"

  ### STACKS ###

  pop: -> @i9ns.pop()

  peek: -> @i9ns[@i9ns.length-1]

  push: (i9n) ->
    throw 'missing i9n.func' if not i9n.func?
    @i9ns.push i9n

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

  # Throw an error in this thread,
  # An error can be thrown during a wait, such as during IO.
  #
  #   If the state is STATE_WAIT,
  #     set @state and @error,
  #     and @exit() (e.g. call callbacks)
  #     Thread is already out of the runloop,
  #     but waitlists should be cleared.
  #   Else If the state is STATE_RUNNING,
  #     set @state and @error,
  #     and throw a native string (INTERRUPT_XYZ) to interrupt runloop.
  #   Else
  #     this shouldn't happen.
  throw: (name, message, catchable=yes) ->
    callStack = @callStack()
    callStackStrs = (''+x for x in callStack)
    @error = new JObject(creator:@user, data:{
      name:     name
      message:  message
      stack:    new JArray(creator:@user, data:callStackStrs)
    })
    @error.name = name
    @error.message = message
    @error.stack = callStackStrs # for convenience
    assert.ok @state in [STATE_WAIT, STATE_RUNNING], "Thread was unexpectedly in #{@state} during a JThread.throw. Runtime error: #{name}/#{message}"
    origState = @state
    @state = STATE_ERROR
    if origState is STATE_WAIT
      while waitKey=@waitKeys.pop()
        (waitList=@kernel.waitLists[waitKey]).remove @
        delete @kernel.waitLists[waitKey] if waitList.length is 0
    # unwind the stack as necessary
    loop
      dontcare = @pop()
      i9n = @peek()
      if not i9n?
        @last = JUndefined
        if origState is STATE_WAIT
          @exit()
          return
        else
          throw INTERRUPT_ERROR
      else if catchable and i9n.this instanceof joe.Try
        i9n.func = joe.Try::interpretCatch
        @last = @error
        @error = null
        @state = STATE_RUNNING
        if origState is STATE_WAIT
          @kernel.runloop.push @
          process.nextTick @kernel.runRunloop if @kernel.runloop.length is 1
          return
        else
          throw INTERRUPT_NONE

  return: (result) ->
    assert.ok result?, "result value can't be undefined. Maybe JUndefined?"
    debug "#{@}.return result = #{result}" if log
    @state = STATE_RETURN
    # unwind the stack as necessary
    loop
      dontcare = @pop()
      i9n = @peek()
      if not i9n?
        return result
      else if i9n.this instanceof joe.Invocation
        assert.ok i9n.func is joe.Invocation::interpretFinal, "Unexpected i9n.func #{i9n.func?._name or i9n.func?._name}"
        @state = STATE_RUNNING
        return result

  wait: (waitKey) ->
    debug "#{@}.wait waitKey = #{waitKey}" if log
    # assert.ok @state is STATE_RUNNING, "JThread::wait wants state STATE_RUNNING for waiting but got #{@state}"
    (@kernel.waitLists[waitKey]?=[]).push @
    @waitKeys.push waitKey
    @state = STATE_WAIT
    return undefined

  resume: (waitKey) ->
    debug "#{@}.resume waitKey = #{waitKey}" if log
    @kernel.resumeThreads waitKey

  # A process of the thread has ended. Call callback functions and clean up.
  exit: ->
    debug "#{@}.exit, @callback?:#{@callback?}" if log
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
    if @state in [STATE_RETURN, STATE_ERROR]
      # reset state
      @start {code, callback}
      # TODO refactor the below two lines
      @kernel.runloop.push @
      process.nextTick @kernel.runRunloop if @kernel.runloop.length is 1
    else
      @queue.push {code, callback}

  # Set the thread to start the next process.
  start: ({code, timeout, callback}) ->
    assert.ok timeout > 0, "Timeout must be positive if given. got #{timeout}" if timeout?
    @i9ns = []
    @last = JUndefined
    @error = null
    @expiration = (new Date()).getTime() + timeout if timeout?
    @state = STATE_RUNNING
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
            }}, _) #{ black if i9n.this?.toString? then escape(i9n.this) else "(#{typeof i9n.this}) with no toString" }"

  errorStack: ->
    stackTrace = Array::map.call(@error.stack, ((x)->'  at '+x)).join('\n') or '  -- no stack trace available --'
    "#{@error.name ? 'UnknownError'}: #{@error.message ? ''}\n  Most recent call last:\n#{stackTrace}"

  printErrorStack: -> warn @errorStack()

  printScope: (scope, lvl=0) ->
    if scope instanceof JStub
      info "#{black pad left:13, lvl}#{red scope}"
      return
    for key, value of scope.data when key isnt '__proto__'
      try
        valueStr = ''+value
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

  toString: -> "[JThread ##{@id} s:#{@state} l:#{@last}]"

## KERNEL ##
# Multi-user time-shared interpreter.
@JKernel = JKernel = clazz 'JKernel', ->

  # cache:            cache of JObjects
  # errorCallback:    when thread callbacks error out
  init: ({@cache, @errorCallback}={}) ->
    @runloop = []  # TODO threads pushed here must have state=STATE_RUNNING. better API.
    @cache ?= {}      # TODO should be weak etc.
    @index = 0
    @ticker = 0
    @time = (new Date()).getTime()
    @waitLists = {}   # waitKey -> [thread1,thread2,...]
    @emitter = new (require('events').EventEmitter)()
    @errorCallback ?= @defaultErrorCallback

  defaultErrorCallback: (error) ->
    fatal "KERNEL ERROR!\n#{error.stack ? error}"

  # Start processing another thread
  # user:     The same user object as returned by login.
  # timeout:  Timeout in milliseconds, after which thread should error.
  # callback: Called with thread after it exits.
  # CONTRACT: Caller shouldn't have to worry about catching errors from run. See @errorCallback
  run: ({user, code, scope, timeout, callback}) ->
    assert.ok user?, "User must be provided."
    assert.ok user instanceof JObject, "User not instanceof JObject, got #{user?.constructor.name}"
    try
      node = _parseCode code
      thread = new JThread
        kernel:@
        code:node
        user:user
        scope:scope
        timeout:timeout
        callback:callback
      @runloop.push thread
      @runRunloop() if @runloop.length is 1
      return thread
    catch error
      if node?
        @errorCallback "Error in user code start:\n#{error.stack ? error}\nfor node:\n#{node.serialize()}"
      else
        @errorCallback "Error parsing code:\n#{error.stack}\nfor code text:\n#{code}"
      return

  # Main entrance function for kernel runloop.
  # Processes a number of ticks and stops for process.nextTick.
  # Unless there are no more threads to run, (e.g. they are all waiting)
  # schedule to run again via process.nextTick, allowing
  # server to accept requests.
  runRunloop$: ->
    @time = (new Date()).getTime()
    info "JKernel::runRunloop. @#{@index} (of #{@runloop.length}) @ time #{@time}" if log
    # A thread polled from the runloop can have any @state.
    # After it gets polled, the state gets handled, and the thread
    # may get removed from the runloop.
    thread = @runloop[@index]
    try
      # First check to see that thread hasn't expired.
      if thread.expiration <= @time
        thread.throw 'TimeoutError', 'Thread timed out', no
        throw new Error "Whoa. Thread.throw should have thrown INTERRUPT_ERROR"
      # This reduces nextTick overhead, which is more significant when server is running (vs just testing)
      # kinda like a linux "tick", values is adjustable.
      for i in [0..100]
        @ticker++
        info "tick #{@ticker}. #{thread} (of #{@runloop.length})" if log
        thread.runStep()
        if thread.state isnt STATE_RUNNING
          # Run callbacks. Callbacks may enqueue more callbacks.
          thread.exit() unless thread.state is STATE_WAIT
          # Pull the thread out,
          if thread.queue.length is 0 or thread.state is STATE_WAIT
            @runloop[@index..@index] = [] # splice out
            @index = @index % @runloop.length or 0
            process.nextTick @runRunloop if @runloop.length > 0
            return
          # or, run what's next in the queue.
          else
            # thread.queue.length > 0 and thread.state != STATE_WAIT
            assert.ok thread.state in [STATE_RETURN, STATE_ERROR], "Unexpected thread state #{thread.state}"
            thread.start thread.queue.shift()
    catch error
      # Hook to handle native errors, which are unexpected.
      if typeof error isnt 'string' or error[..9] != 'INTERRUPT_'
        nativeError = error
        fatal "Native error thrown in runStep. thread throwing:\n" + (error.stack ? error)
        try
          thread.throw 'InternalError', "#{error.name}:#{error.message}"
        catch error2
          error = error2
      # Switch on what thread.throw returned.
      switch error
        # Userland error
        when INTERRUPT_ERROR
          @runloop[@index..@index] = [] # splice out
          @index = @index % @runloop.length or 0
          process.nextTick @runRunloop if @runloop.length > 0
          thread.exit()
          return
        # Error thrown but caught in userland.
        when INTERRUPT_NONE
          'pass'
        # Unexpected native errors
        else
          fatal "Unexpected interrupt #{error}"
          @errorCallback(error)
          return

    # Schedule another runloop call
    @index = (@index + 1) % @runloop.length
    process.nextTick @runRunloop

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
        thread.state = STATE_RUNNING
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
