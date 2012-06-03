###
Concerns:
  * permissions (ACL)
  * concurrency (interwoven within a line of process,
                 simultaneous amongst processes.)
  * performance
  * networking  (future)
###

{clazz} = require 'cardamom'
assert = require 'assert'
_ = require 'underscore'
joe = require('joeson/src/joescript').NODES

# Optimization.
# See http://jsperf.com/prototype-vs-userland-prototype
hasOwn = Object.prototype.hasOwnProperty

JRuntimeContext = @JRuntimeContext = clazz 'JRuntimeContext', ->

  # Create a new context with a new scope.
  # e.g.
  #   scope = {}
  #   scope.global = scope
  #   new JRuntimeContext user, scope
  init: (@user, @scope={}) ->
    assert.ok @user instanceof JObject, "A JRuntimeContext must have an associated user object."
    if @user is SYSTEM.root then @will = -> yes

  # Spawn a child context with its own scope
  # thiz:   Will be bound to the upper scope frame's
  #         'this' variable.
  spawn: (thiz) ->
    scopeFn = (@this) ->
    scopeFn.prototype = parent
    newScope = scopeFn(thiz)
    return new JRuntimeContext @user, newScope

  # Set a name/value pair on the topmost scope of the chain
  # Error if name already exists... all updates should happen w/ scopeUpdate.
  scopeDefine: (name, value) ->
    assert.ok not hasOwn.call(@scope, name), "Already defined in scope: #{name}"
    @scope[name] = value

  # Find scope in prototype chain with name declared, set it there.
  # NOTE on v8, you can't set __proto__. You can't even use it
  # as a local variable. Same applies to the function below.
  # It's just an expensive no-op.
  scopeUpdate: (name, value) ->
    scope = @scope
    scope = scope.__proto__ while scope.__proto__? and not hasOwn.call(scope, name)
    scope[name] = value

  # Look at the object's acl to determine
  # if the action is permitted.
  will: (action, obj) ->
    return yes if obj.creator is @user
    acl = obj.acl ? obj
    throw new Error 'TODO determine permissing using ACL'

  # Queue a function node to be interpreted
  queue: (node, cb) ->

  toString: -> "[JRuntimeContext]"

# A function gets bound to the runtime context upon declaration.
JBoundFunc = @JBoundFunc = clazz 'JBoundFunc', ->

  # func:    The joe.Func node
  # context: The context in which func was constructed.
  init: ({@func, @context}) ->
    assert.ok @func instanceof joe.Func
    assert.ok @context instanceof JRuntimeContext

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
                        # You may wonder how the creator creates himself.
                        # Good question. 
    assert.ok @acl?,    "JObject.init requires 'acl' (JAccessControlList)."
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
    assert.ok typeof @name is 'string'
    super.init creator:this, data:{name:@name}
  toString: -> "[JUser #{@name}]"

SYSTEM =
  root: new JUser('root')
