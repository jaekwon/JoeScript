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
{pad, escape, starts, ends} = require 'joeson/lib/helpers'
{extend, isVariable} = require('joeson/src/joescript').HELPERS
{debug, info, warn, error:fatal} = require('nogg').logger 'server'

{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc} = require 'joeson/src/interpreter/object'
defaultGlobal = require 'joeson/src/interpreter/global'

trace = debug:no

times = {}
counter = 0
timeit = (name, fn) ->
  start = (new Date()).valueOf()
  result = fn()
  times[name] ?= durations:0, hits:0
  times[name].durations += (new Date()).valueOf() - start
  times[name].hits++
  if counter++ % 100 is 0
    console.log "times:", times
  return result

## Universe
GOD = @GOD = new JUser name:'god'
WORLD = @WORLD = new JObject creator:GOD

JStackItem = @JStackItem = clazz 'JStackItem', ->
  init: ({@node}) ->
    # figure out which function this node is declared in
    declaringFunc = @node.parent
    declaringFunc = declaringFunc.parent while declaringFunc? and declaringFunc not instanceof joe.Func
    @declaringFunc = declaringFunc
  toString: -> "'#{@node}' (source:#{@declaringFunc}, line:#{@node._origin?.line}, col:#{@node._origin?.col})"

# A runtime context. (Represents a thread/process of execution)
# user:     Owner of the process
# scope:    All the local variables, a dual of the lexical scope.
# i9ns:     Instructions, a "stack" that also stores intermediate data.
# error:    Last thrown error
JThread = @JThread = clazz 'JThread', ->

  # start:  The start node of program to run
  # user:   The user associated with this thread
  # scope:  Immediate local lexical scope object
  # stdin:  Native function, () -> "user input string" or null if EOL
  # stdout: Native function, (str) -> # prints to user console
  # stderr: Native function, (str) -> # prints to user console
  init: ({@start, @user, @scope, @stdin, @stdout, @stderr}) ->
    assert.ok @start instanceof joe.Node, "Start must be a function node"
    assert.ok @user instanceof JObject, "A JThread must have an associated user object."
    @scope ?= {}
    if @user is GOD then @will = -> yes
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
    return 'return' if @i9ns.length is 0
    {func, this:that, target, targetKey, targetIndex} = i9n = @i9ns[@i9ns.length-1]
    console.log blue "             -- runStep --" if trace.debug
    @printScope @scope if trace.debug
    @printStack() if trace.debug
    throw new Error "Last i9n.func undefined!" if not func?
    throw new Error "Last i9n.this undefined!" if not that?
    throw new Error "target and targetKey must be present together" if (target? or targetKey?) and not (target? and targetKey?)
    #key = "#{that.constructor.name}.#{func._name}"
    #timeit key, =>
    #  @last = func.call that, this, i9n, @last
    @last = func.call that, this, i9n, @last
    switch @interrupt
      when null
        console.log "             #{blue 'last ->'} #{@last}" if trace.debug
        if targetIndex?
          target[targetKey][targetIndex] = @last
        else if target?
          target[targetKey] = @last
        return null
      when 'error'
        console.log "             #{red 'throw ->'} #{@last}" if trace.debug
        @interrupt = null
        loop # unwind loop
          dontcare = @pop()
          i9n = @peek()
          if not i9n?
            # just print error here
            console.log "#{@error.name}: #{@error.message}"
            # print stack
            @printStack @error.stack
            return 'error'
          else if i9n.this instanceof joe.Try and not i9n.isHandlingError
            i9n.isHandlingError = true
            i9n.func = joe.Try::interpretCatch
            last = @error
            return null
      when 'return'
        console.log "             #{yellow 'return ->'} #{@last}" if trace.debug
        @interrupt = null
        loop # unwind loop
          dontcare = @pop()
          i9n = @peek()
          if not i9n?
            return 'return'
          else if i9n.this instanceof joe.Invocation
            assert.ok i9n.func is joe.Invocation::interpretFinal
            return null
      else
        throw new Error "Unexpected interrupt #{@interrupt}"

  ### STACKS ###

  pop: -> @i9ns.pop()

  peek: -> @i9ns[@i9ns.length-1]

  push: (i9n) -> @i9ns.push i9n

  callStack: ->
    stack = []
    for item in @i9ns when item.this instanceof joe.Invocation
      stack.push JStackItem node:item.this
    return stack

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
    #alreadyDefined = `name in this.scope` # coffeescript but, can't say "not `...`"
    #assert.ok not alreadyDefined, "Already defined in scope: #{name}"
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
    @error = name:name, message:message, stack:@callStack()
    @interrupt = 'error'

  return: (result) ->
    @interrupt = 'return'
    return result # return the result of this to set @last.

  ### ACCESS CONTROL ###

  # Look at the object's acl to determine
  # if the action is permitted.
  will: (action, obj) ->
    return yes if obj.creator is @user
    acl = obj.acl ? obj
    throw new Error 'TODO determine permissing using ACL'

  toString: -> "[JThread]"

  ### DEBUG ###

  printStack: (stack=@i9ns) ->
    for i9n, i in stack
      i9nCopy = _.clone i9n
      delete i9nCopy.this
      delete i9nCopy.func
      console.log "#{ blue pad right:12, "#{i9n.this?.constructor.name}"
                 }.#{ yellow i9n.func?._name
             }($, {#{ white _.keys(i9nCopy).join ','
            }}, _) #{ black escape i9n.this }"

  printScope: (scope, lvl=0) ->
    for key, value of scope when key isnt '__parent__'
      console.log "#{black pad left:13, lvl}#{red key}#{ blue ':'} #{value.__str__(@)}"
    @printScope scope.__parent__, lvl+1 if scope.__parent__?


# Multi-user time-shared interpreter.
@JKernel = JKernel = clazz 'JKernel', ->

  init: ->
    @threads = []
    @users = {}       # name -> user
    @userScopes = {}  # name -> scope 
    @index = 0

  login: ({name, password}) -> # user JSON
    user = @users[name]
    unless user?
      user = new JUser name:name
      @users[name] = user
      @userScopes[name] = {__parent__:defaultGlobal}
    return user

  # Start processing another thread
  # user: the same user object as returned by login.
  run: ({user, code, stdin, stdout, stderr}) ->
    assert.ok user?, "User must be provided."
    assert.ok user instanceof JUser, "User not instanceof JUser, got #{user?.constructor.name}"
    scope = @userScopes[user.name]
    assert.ok scope?, "Scope missing for user #{user.name}"
    try
      if typeof 'code' is 'string'
        node = require('joeson/src/joescript').parse code
        node = node.toJSNode(toValue:yes).installScope().determine()
        info "Kernel.run parsed node.\n" + node.serialize() if trace.debug
      else
        node = code
      thread = new JThread start:node, user:user, scope:scope, stdin:stdin, stdout:stdout, stderr:stderr
      @threads.push thread
      if @threads.length is 1
        @index = 0 # might have been NaN
        @runloop()
    catch error
      if node?
        warn "Error in user code start:", error.stack, "\nfor node:\n", node.serialize()
      else
        warn "Error parsing code:", error.stack, "\nfor code text:\n", code
      stderr('InternalError:'+error)

  runloop$: ->
    thread = @threads[@index]
    debug "tick" if trace.debug
    try
      # TODO this reduces nextTick overhead, which is more significant when server is running (vs just testing)
      # kinda like a linux "tick", values is adjustable.
      for i in [0..20]
        resCode = thread.runStep()
        if resCode?
          if resCode is 'error'
            if thread.error.stack?
              stackTrace = thread.error.stack.map((x)->'        at '+x).join('\n')
              thread.stderr("#{thread.error.name ? 'UnknownError'}: #{thread.error.message ? ''}\n      Most recent call last:\n#{stackTrace}")
            else
              thread.stderr("#{thread.error.name ? 'UnknownError'}: #{thread.error.message ? ''}")
          else if resCode is 'return'
            thread.stdout(thread.last.__repr__(thread).__html__(thread))
          info "thread #{thread} finished with rescode #{resCode}."
          @threads[@index..@index] = [] # splice out
          @index = @index % @threads.length # oops, sometimes NaN
          process.nextTick @runloop if @threads.length > 0
          return
      @index = (@index + 1) % @threads.length
      process.nextTick @runloop
    catch error
      fatal "Error in runStep. Stopping execution.", error.stack
      thread.stderr 'InternalError:'+error
      @threads[@index..@index] = [] # splice out
      @index = @index % @threads.length # oops, sometimes NaN
      process.nextTick @runloop if @threads.length > 0
      return
