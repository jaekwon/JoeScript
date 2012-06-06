###
Concerns:
  * permissions (ACL)
  * concurrency (interwoven within a line of process,
                 simultaneous amongst processes.)
  * performance
  * networking  (future)
###

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
assert = require 'assert'
_ = require 'underscore'
joe = require('joeson/src/joescript').NODES
{pad, escape} = require 'joeson/lib/helpers'

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
    if @user is SYSTEM.user then @will = -> yes
    @datas = [] # data stack
    @codes = [] # code stack

  # Run to completion, synchronously.
  # node: If present, will push node to @codes
  #       before starting.
  exec: (node) ->
    @code_push this:node, func:node.interpret
    while code_item = @codes[@codes.length-1]
      func = code_item.func
      that = code_item.this
      func.call that, this
      console.log red "---"
      @printInfo()

  ### STACKS ###

  code_pop: ->
    @codes.pop()

  code_push: (item) ->
    assert.ok item.func?, "Missing function in code_push({this,func})"
    @codes.push item

  data_peek: (offset) ->
    @datas[@datas.length-1-offset]

  data_pop: ->
    @datas.pop()

  data_push: (item) ->
    @datas.push item

  data_set: (offset, value) ->
    @datas[@datas.length-1-offset] = value

  printInfo: ->
    # code
    for item, i in @codes
      console.log "#{ green pad left:10, "(#{item.this.constructor.name})"
                 } #{ green pad left:20, item.this
                }\t#{ yellow item.func?._name }"
    # data
    for i in [@datas.length-10...@datas.length-1] when i >= 0
      datum = @datas[i]
      console.log "#{blue pad left:5, "@datas["+i+"]:"} #{datum}"
    # scope
    for key, value of @scope
      if Object::hasOwnProperty.call(@scope, key)
        console.log "#{red pad left:10, key+':'} #{value}"
      else
        console.log "#{yellow pad left:10, key+':'} #{value}"

  ### SCOPE ###

  # Spawn a child context with its own scope
  # thiz:   Will be bound to the upper scope frame's
  #         'this' variable.
  scopeSpawn: (thiz) ->
    scopeFn = (@this) ->
    scopeFn.prototype = parent
    return scopeFn(thiz)

  #
  scopeGet: (name) ->
    value = @scope[name]
    if not value?
      throw new ReferenceError "#{name} is not defined"
    return @scope[name]

  # Set a name/value pair on the topmost scope of the chain
  # Error if name already exists... all updates should happen w/ scopeUpdate.
  scopeDefine: (name, value) ->
    assert.ok not hasOwn.call(@scope, name), "Already defined in scope: #{name}"
    @scope[name] = value
    return

  # Find scope in prototype chain with name declared, set it there.
  # NOTE on v8, you can't set __proto__. You can't even use it
  # as a local variable. Same applies to the function below.
  # It's just an expensive no-op.
  scopeUpdate: (name, value) ->
    scope = @scope
    while not hasOwn.call(scope, name)
      scope = scope.__proto__
      throw new EvalError "ReferenceError: #{name} is not defined" if not scope?
    scope[name] = value
    return

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
                        # You may wonder how the creator creates himself.
                        # Good question. 
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

SYSTEM =
  user: new JUser name:'root'

do =>
  require('joeson/src/translators/javascript').install()
  require('joeson/src/interpreter/javascript').install()
  node = require('joeson/src/joescript').parse "a = 'foo'"
  node = node.toJSNode().installScope()
  console.log node.serialize()
  $ = new JRuntimeContext SYSTEM.user
  $.exec node
