log = no

###

JObject is the base runtime object class.

valueOf:  Returns a native value if this is a String, Number, Function, or Boolean.
          These values are used directly in the interpreter.
          Undefined, Null, and NaN on the other hand, are represented by a
          JSingleton instance. Objects are represented by JObject instances, and so on.
          'valueOf' for these representations return themselves.

jsValue:  Like valueOf, but also converts JObjects and JSingletons into native types.
          Used for bridged functions and testing.

toJoe:    The opposite of jsValue, returns a JoeScript runtime object from native types.

###

{
  clazz,
  colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}
  collections:{Set}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{randid, pad, htmlEscape, escape, starts, ends} = require 'sembly/lib/helpers'
{
  parse,
  NODES:joe
  HELPERS:{isVariable}
} = require 'sembly/src/joescript'
Node = require('sembly/src/node').createNodeClazz('ObjectNode')

# dependencies
require('sembly/src/translators/scope').install()
require('sembly/src/translators/javascript').install()
require('sembly/src/translators/etc').install()

# HELPERS FOR INTERPRETATION
isInteger = (n) -> n%1 is 0
isObject =  (o) -> o instanceof JObject or o instanceof JStub
_typeof = (obj) ->
  type = typeof obj
  return type if type isnt 'object'
  if obj instanceof JSingleton
    return obj.name
  else if obj instanceof JStub
    return 'stub'
  else
    return 'object'
@HELPERS = {isInteger, isObject, _typeof}

RUNTIME = Set([]) # elements defined at the bottom
RUNTIME_FUNC = Set([joe.Func, Function])

JStub = @JStub = clazz 'JStub', Node, ->
  init: ({@persistence, @id, @type}) ->
    assert.ok @id?, "JStub wants id"
    # persistence is undefined on a thin client.
    # assert.ok @persistence?, "JStub wants persistence"
  jsValue: ($, $$) ->
    cached1 = $$[@id]
    return cached1 if cached1?
    cached2 = $.kernel.cache[@id]
    return cached2.jsValue($, $$) if cached2?
    #throw new Error "DereferenceError: Broken reference: #{@}"
    return @
  toString: -> "<##{@id}>"

JObject = @JObject = clazz 'JObject', Node, ->

  @defineChildren
    id:       {type:String}
    creator:  {type:JObject, required:yes}
    data:     {type:{value:RUNTIME}}
    proto:    {type:RUNTIME}

  # data:   An Object
  # acl:    A JArray of JAccessControlItems
  #         NOTE: the acl has its own acl!
  # proto:  Both a workaround the native .__proto__ behavior,
  #         and a convenient way to create new JObjects w/ their prototypes.
  init: ({@id, @creator, @data, @acl, @proto}) ->
    assert.ok not @proto? or isObject @proto, "JObject wants JObject proto or null"
    @creator = this if @creator is null
    assert.ok isObject @creator, "JObject wants JObject creator"
    if not @id?
      @id = randid()
      debug "Created new object #{@id}" if log
    @data ?= {}
    @data.__proto__ = null # detatch prototype

  # Event handling
  # Returns whether listener was added
  addListener: (listener) ->
    assert.ok listener.id?, "Listener needs an id"
    assert.ok listener.on?, "Listener needs an 'on' method"
    listeners = @listeners ?= {}
    return no if listeners[listener.id]?
    listeners[listener.id] = listener
    return yes

  # Remove listener...
  removeListener: (listener) ->
    assert.ok listener.id?, "removeListener wants listener.id"
    if @listeners?[listener.id]
      delete @listeners[listener.id]
      return yes
    return no

  # Emit an event from object to listeners
  emit: (event) ->
    assert.ok typeof event is 'object', 'Event must be an object'
    debug "emit: {type:#{event?.type},...} // listeners: #{Object.values @listeners}" if log # // #{inspect event}"
    return unless @listeners?
    event.sourceId = @id
    for id, listener of @listeners
      listener.on @, event

  create: (creator, newData={}) ->
    new JObject creator:creator, data:newData, proto:@

  stub: ($P) ->
    new JStub id:@id, persistence:$P

  jsValue: ($, $$={}) ->
    return $$[@id] if $$[@id]
    jsObj = $$[@id] = {}
    jsObj[key] = value.jsValue($, $$) for key, value of @data
    return jsObj
  valueOf: -> @
  toString: -> "[JObject ##{@id}]"

  bridged: {}

JArray = @JArray = clazz 'JArray', JObject, ->

  init: ({id, creator, data, acl}) ->
    data ?= []
    data.__proto__ = null # detatch prototype
    @super.init.call @, {id, creator, data, acl}
  jsValue: ($, $$={}) ->
    return $$[@id] if $$[@id]
    jsObj = $$[@id] = []
    jsObj[key] = value.jsValue($, $$) for key, value of @data
    return jsObj
  toString: -> "[JArray ##{@id}]"

  # Bridged keys. These functions are available as runtime native functions.
  bridged:
    push: ($, arr, value) ->
      Array.prototype.push.call arr.data, value
      # actually, transaction below isn't necessary because set/length isn't necessary.
      # TODO BEGIN XACTION
      arr.emit {thread:$, type:'set', key:arr.data.length-1, value}
      # @emit {thread:$, type:'set', key:'length', value:@data.length}
      # TODO END XACTION
      return JUndefined
    pop: ($, arr) ->
      value = Array.prototype.pop.call arr.data
      arr.emit {thread:$, type:'set', key:'length', value:arr.data.length}
      return value ? JUndefined
    shift: ($, arr) -> # popping from the left
      value = Array.prototype.shift.call arr.data
      arr.emit {thread:$, type:'shift'}
      return value ? JUndefined
    unshift: ($, arr, value) ->
      Array.prototype.unshift.call arr.data, value
      arr.emit {thread:$, type:'unshift', value}
      return arr.data.length ? JUndefined

JAccessControlItem = @JAccessControlItem = clazz 'JAccessControlItem', ->
  # who:  User or JArray of users
  # what: Action or JArray of actions
  init: (@who, @what) ->
  toString: -> "[JAccessControlItem #{@who}: #{@what}]"

JSingleton = @JSingleton = clazz 'JSingleton', Node, ->
  init: (@name, @_jsValue) ->
  jsValue: -> @_jsValue
  valueOf: -> @
  toString: -> "Singleton(#{@name})"

JNull       = @JNull      = JSingleton.null       = new JSingleton 'null', null
JUndefined  = @JUndefined = JSingleton.undefined  = new JSingleton 'undefined', undefined
JNaN        = @JNaN       = JSingleton.NaN        = new Number NaN # is this better, since op instructions carry over?
JInfinity   = @JInfinity  = JSingleton.Infinity   = new Number Infinity
# JFalse/JTrue don't exist, just use native booleans.

# Actually, not always bound to a scope.
JBoundFunc = @JBoundFunc = clazz 'JBoundFunc', JObject, ->

  @defineChildren
    func:     {type:RUNTIME_FUNC, required:yes}
    scope:    {type:JObject}
    
  # func:    The joe.Func node, or a string for lazy parsing.
  # creator: The owner of the process that declared above function.
  # scope:   Runtime scope of process that declares above function.
  #          If scope is null, this function creates a new scope upon invocation.
  #          If scope is undefined, this function inherits the caller's scope.
  #           - for lazy lexical scoping.
  init: ({id, creator, acl, func, scope}) ->
    @super.init.call @, {id, creator, acl}
    assert.ok scope is JNull or isObject scope, "JBoundFunc::__init__ wants JNull scope or a JObject, but got #{scope?.constructor.name}"
    @data.scope = scope
    if func instanceof joe.Func
      @func = func
      assert.ok func._origin.code?, "JBoundFunc::__init__ wants func._origin.code"
      @data.__code__ =  func._origin.code
      @data.__start__ = func._origin.start.pos
      @data.__end__ =   func._origin.end.pos
    # Convenient for creating functions procedurally
    else if typeof func is 'string'
      @data.__code__ =  func
      @data.__start__ = 0
      @data.__end__ =   func.length
    # Will get set later
    else if func is null
      'dontcare'
    else
      throw new Error "funky func"
  scope$:
    get: -> @data.scope,
    set: (scope) -> @data.scope = scope
  func$: get: ->
    assert.ok @data.__code__, "JBoundFunc::$func expects @data.__code__"
    assert.ok @data.__start__?, "JBoundFunc::$func expects @data.__start__"
    # TODO cache of code --> parsed nodes.
    node = parse @data.__code__
    node = node.toJSNode(toValue:yes).installScope().determine()
    assert.ok node instanceof joe.Block, "Expected Block at root node, but got #{node?.constructor?.name}"
    node = node.collectFunctions()
    assert.ok node._functions?, "Expected collected functions at node._functions"
    func = node._functions[@data.__start__]
    assert.ok func?, "Didn't get a func at the expected pos #{@data.__start__}. Code:\n#{@data.__code__}"
    return @func = func
  toString: -> "[JBoundFunc]"

SimpleIterator = @SimpleIterator = clazz 'SimpleIterator', ->
  init: (@items) ->
    @length = @items.length
    @idx = 0
  next: ->
    if @idx < @length
      return @items[@idx]
    else throw 'StopIteration'

# Extensions on native objects
clazz.extend String,
  jsValue: -> @valueOf()
  bridged:
    slice: ($, str=JUndefined, from=JUndefined, to=JUndefined, _by=JUndefined) ->
      if _by? and _by isnt 1
        return $.throw "Stride not yet supported for String.slice"
      from = from.jsValue $, no
      to   = to.jsValue   $, no
      str.slice(from, to)
    split: ($, str=JUndefined, delim=JUndefined, count=JUndefined) ->
      delim = delim.jsValue $, no
      count = count.jsValue $, no
      new JArray creator:$.user, data:str.split(delim, count)
  toJoe: -> @valueOf()

clazz.extend Number,
  jsValue: -> @valueOf()
  toJoe:  -> @valueOf()

clazz.extend Boolean,
  jsValue: -> @valueOf()
  toJoe:  -> @valueOf()

clazz.extend Function, # native functions
  jsValue: -> @valueOf()
  toJoe:  -> @valueOf()

clazz.extend Object, # fuckit, let's try this
  toJoe:  ({creator}) -> # TODO handle circular...
    data = {}
    data[key] = value.toJoe({creator}) for key, value of @
    new JObject creator:creator, data:data

# EXPORTS
@NODES = {
  JStub, JObject, JArray, JSingleton, JNull, JUndefined, JNaN, JBoundFunc
}

RUNTIME.elements = [JStub, JObject, JSingleton, JBoundFunc, Number, String, Function, Boolean]
