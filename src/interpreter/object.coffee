###

## On Interpretation ##

JObject is the base runtime object class.

The __xyz__ methods are methods meant to be called in a runtime context (with a thread).
(except some like __str__, where the thread ($) may be optional)
Some methods like __get__ can pause the thread. The value is available in @last when
the thread is resumed. This means the bitcode instruction wants to return obj.__get__(...),
which preserves the behavior of returning a value. However, these methods will return null
when pausing the thread, so you could alternatively check for that.

  if value=obj.__get__($, key) is null
    # do something else
  else i9n.value = value
  # continue bitcode instruction

Sometimes it is necessary to perform actions after a method call, though the
instruction doesn't depend on the result of these actions. In this case the JObject::emit
mechanism is suitable. Just add a handler to the object via JObject::addHandler and listen.
TODO mechanism to remove a listener...

## Common methods ##

  valueOf:  Returns a native value if this is a String, Number, Function, or Boolean.
            These values are used directly in the interpreter.
            Undefined, Null, and NaN on the other hand, are represented by a
            JSingleton instance. Objects are represented by JObject instances, and so on.
            'valueOf' for these representations return themselves.

  jsValue:  Kind of like valueOf, but also converts JObjects and JSingletons into native
            types. Used for testing, and will be used in the future for other things.

  __str__:  Returns a compact serialized value suitable for wire transfer.

  __key__:  Convert an object to a key string.

###

log = no

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
  HELPERS:{isWord,isVariable}
} = require 'sembly/src/joescript'
Node = require('sembly/src/node').createNodeClazz('ObjectNode')

# dependencies
require('sembly/src/translators/scope').install()
require('sembly/src/translators/javascript').install()
require('sembly/src/translators/etc').install()

# HELPERS FOR INTERPRETATION
isInteger = (n) -> n%1 is 0
isObject =  (o) -> o instanceof JObject or o instanceof JStub
@HELPERS = {isInteger, isObject}

RUNTIME = Set([]) # elements defined at the bottom
RUNTIME_FUNC = Set([joe.Func, Function])

# DEFAULT OPERATIONS ON ALL NODES
Node::extend DEFAULT_OPERATIONS =
  # asynchronous
  __get__:    ($, key) -> $.throw 'TypeError', "__get__ not define for #{@}"
  # synchronous:
  __set__: ($, key, value) -> $.throw 'TypeError', "__set__ not defined for #{@}"
  __keys__:        ($) -> $.throw 'TypeError', "__keys__ not defined for #{@}"
  __iter__:        ($) -> $.throw 'TypeError', "__iter__ not defined for #{@}"
  __num__:         ($) -> JNaN
  __add__:  ($, other) -> JNaN
  __sub__:  ($, other) -> JNaN
  __mul__:  ($, other) -> JNaN
  __div__:  ($, other) -> JNaN
  __mod__:  ($, other) -> JNaN
  __or__:   ($, other) -> if @__bool__($) then @valueOf() else other
  __and__:  ($, other) -> if @__bool__($) then other.valueOf() else @
  __eq__:   ($, other) -> @valueOf() is other.valueOf()
  __cmp__:  ($, other) -> $.throw 'TypeError', "__cmp__ not defined for #{@valueOf()}"
  __bool__:        ($) -> no
  __key__:         ($) -> $.throw 'TypeError', "Can't use #{@valueOf()} as key"
  __str__:         ($) -> $.throw 'TypeError', "Dunno how to serialzie #{@valueOf()}"

JStub = @JStub = clazz 'JStub', Node, ->
  init: ({@persistence, @id, @type}) ->
    assert.ok @id?, "Stub wants id"
  jsValue: ($, $$) ->
    cached1 = $$[@id]
    return cached1 if cached1?
    cached2 = $.kernel.cache[@id]
    return cached2.jsValue($, $$) if cached2?
    #throw new Error "DereferenceError: Broken reference: #{@}"
    return @
  __str__: ($) -> "<##{@id}>"
  toString: -> "<##{@id}>"

JObject = @JObject = clazz 'JObject', Node, ->

  @defineChildren
    id:       {type:String}
    creator:  {type:JUser, required:yes}
    data:     {type:{value:RUNTIME}}
    proto:    {type:RUNTIME}

  # data:   An Object
  # acl:    A JArray of JAccessControlItems
  #         NOTE: the acl has its own acl!
  # proto:  Both a workaround the native .__proto__ behavior,
  #         and a convenient way to create new JObjects w/ their prototypes.
  init: ({@id, @creator, @data, @acl, @proto}) ->
    assert.ok not @proto? or isObject @proto, "JObject wants JObject proto or null"
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

  ## Runtime functions ##
  
  __get__: ($, key, required=no) ->
    key = key.__key__($)
    $.will('read', this)
    if key is '__proto__'
      value = @proto
    else
      value = @data[key]
    debug "#{@}.__get__ #{key}, required=#{required} --> #{value} (#{typeof value};#{value?.constructor?.name})" if log
    if value?
      if value instanceof JStub
        return cached if cached=$.kernel.cache[value.id]
        assert.ok value.persistence?, "JObject::__get__ wants <JStub>.persistence"
        $.wait waitKey="load:#{value.id}"
        # Make a call to aynchronously fetch value
        value.persistence.loadJObject $.kernel, value.id, (err, obj) =>
          return $.throw 'InternalError', "Failed to load stub ##{value.id}:\n#{err.stack ? err}" if err?
          return $.throw 'ReferenceError', "#{key} is a broken stub." if required and not obj?
          # Replace stub with value in @data[key] (or @proto)
          if key is '__proto__'
            @proto = obj
          else
            @data[key] = obj
          $.last = obj
          $.resume waitKey
        return null # null means waiting
      else
        return value
    else if @proto?
      if @proto instanceof JStub
        $.push func:($, i9n, proto) ->
          $.pop()
          proto.__get__ $, key, required
        return @__get__ $, '__proto__'
      else
        return @proto.__get__ $, key, required
    else
      if (bridgedKey=@bridgedKeys?[key])?
        return @[bridgedKey]
      return $.throw 'ReferenceError', "#{key} is not defined" if required
      return JUndefined
  create: (creator, newData={}) ->
    new JObject creator:creator, data:newData, proto:@
  __create__: ($, newData) -> @create $.user, newData
  __hasOwn__: ($, key) ->
    $.will('read', this)
    return @data[key]?
  __set__: ($, key, value) ->
    key = key.__key__($)
    $.will('write', this)
    if key is '__proto__'
      @proto = value
      @emit {thread:$,type:'set',key,value}
    else
      @data[key] = value
      @emit {thread:$,type:'set',key,value}
    return
  __del__: ($, key, value) ->
    key = key.__key__($)
    $.will('write', this)
    if key is '__proto__'
      delete @proto
      @emit {thread:$,type:'delete',key}
    else
      delete @data[key]
      @emit {thread:$,type:'delete',key}
    return yes # TODO reconsider?
  # an __update__ only happens for scope objects.
  __update__: ($, key, value) ->
    key = key.__key__($)
    $.will('write', this)
    if key is '__proto__'
      @proto = value
      @emit {thread:$,type:'set',key,value}
      return
    else if @data[key]?
      @data[key] = value
      @emit {thread:$,type:'set',key,value}
      return
    else if @proto?
      if @proto instanceof JStub
        $.push func:($, i9n, proto) ->
          $.pop()
          proto.__update__ $, key, value
        return @__get__ $, '__proto__'
      else
        return @proto.__update__ $, key, value
    else
      $.throw 'ReferenceError', "#{key} is not defined, cannot update."
  __keys__: ($) ->
    $.will('read', this)
    return Object.keys @data
  __iter__: ($) ->
    $.will('read', this)
    return new SimpleIterator Object.keys @data
  __add__:  ($, other) -> $.throw 'NotImplementedError', "Can't add to object yet"
  __sub__:  ($, other) -> $.throw 'NotImplementedError', "Can't subtract from object yet"
  __mul__:  ($, other) -> $.throw 'NotImplementedError', "Can't multiply with object yet"
  __div__:  ($, other) -> $.throw 'NotImplementedError', "Can't divide an object yet"
  __mod__:  ($, other) -> $.throw 'NotImplementedError', "Can't modulate an object yet"
  __eq__:   ($, other) -> other instanceof JObject and other.id is @id
  __cmp__:  ($, other) -> $.throw 'NotImplementedError', "Can't compare objects yet"
  __bool__:        ($) -> yes
  __str__:  ($, $$={}) ->
    return "<##{@id}>" if $$[@id]
    $$[@id] = yes
    dataPart = ("#{key.__str__($)}:#{value.__str__($, $$)}" for key, value of @data).join(',')
    return "{O|##{@id}@#{@creator.id} #{dataPart}}"
  jsValue: ($, $$={}) ->
    return $$[@id] if $$[@id]
    # console.log @serialize( (c={}; (n)->seen=c[n.id];c[n.id]=yes; not seen) )
    jsObj = $$[@id] = {}
    jsObj[key] = value.jsValue($, $$) for key, value of @data
    return jsObj
  valueOf: -> @
  toString: -> "[JObject ##{@id}]"

JArray = @JArray = clazz 'JArray', JObject, ->
  bridgedKeys: {
    'push': 'push'
  }

  init: ({id, creator, data, acl}) ->
    data ?= []
    data.__proto__ = null # detatch prototype
    @super.init.call @, {id, creator, data, acl}
  __keys__: ($) ->
    $.will('read', this)
    return Object.keys(@data)
  __num__:         ($) -> JNaN
  __add__:  ($, other) -> $.throw 'NotImplementedError', "Can't add to array yet"
  __sub__:  ($, other) -> $.throw 'NotImplementedError', "Can't subtract from array yet"
  __mul__:  ($, other) -> $.throw 'NotImplementedError', "Can't multiply with array yet"
  __div__:  ($, other) -> $.throw 'NotImplementedError', "Can't divide an array yet"
  __mod__:  ($, other) -> $.throw 'NotImplementedError', "Can't modulate an array yet"
  __eq__:   ($, other) -> other instanceof JArray and other.id is @id
  __cmp__:  ($, other) -> $.throw 'NotImplementedError', "Can't compare arrays yet"
  __bool__:       ($) -> yes
  __str__:  ($, $$={}) ->
    return "<##{@id}>" if $$[@id]
    $$[@id] = yes
    return "{A|##{@id}@#{@creator.id} #{("#{if isInteger key then ''+key else key.__str__($)}:#{value.__str__($, $$)}" for key, value of @data).join(',')}}"
  jsValue: ($, $$={}) ->
    return $$[@id] if $$[@id]
    jsObj = $$[@id] = []
    jsObj[key] = value.jsValue($, $$) for key, value of @data
    return jsObj
  toString: -> "[JArray ##{@id}]"
  push: ($, value) ->
    Array.prototype.push.call @data, value
    @emit {thread:$,type:'set',key:@data.length-1, value}
    return JUndefined

JAccessControlItem = @JAccessControlItem = clazz 'JAccessControlItem', ->
  # who:  User or JArray of users
  # what: Action or JArray of actions
  init: (@who, @what) ->
  toString: -> "[JAccessControlItem #{@who}: #{@what}]"

JUser = @JUser = clazz 'JUser', JObject, ->
  init: ({id, creator, name}) ->
    assert.equal typeof name, 'string', "@name not string" if name?
    creator ?= this
    @super.init.call @, {id, creator, data:{name}}
  name$: get: -> @data.name
  __str__:  ($, $$={}) ->
    return "<##{@id}>" if $$[@id]
    $$[@id] = yes
    dataPart = ("#{key.__str__($)}:#{value.__str__($, $$)}" for key, value of @data).join(',')
    return "{U|##{@id} #{dataPart}}"
  toString: -> "[JUser ##{@id} (#{@name})]"

JSingleton = @JSingleton = clazz 'JSingleton', Node, ->
  init: (@name, @_jsValue) ->
  jsValue: -> @_jsValue
  __str__: -> ''+@_jsValue
  valueOf: -> @
  toString: -> "Singleton(#{@name})"

JNull       = @JNull      = JSingleton.null       = new JSingleton 'null', null
JUndefined  = @JUndefined = JSingleton.undefined  = new JSingleton 'undefined', undefined
JNaN        = @JNaN       = JSingleton.NaN        = new Number NaN # is this better, since op instructions carry over?
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
  __str__: ($) -> "<F|##{@id}>"
  toString: -> "[JBoundFunc]"

SimpleIterator = clazz 'SimpleIterator', ->
  init: (@items) ->
    @length = @items.length
    @idx = 0
  next: ->
    if @idx < @length
      return @items[@idx]
    else throw 'StopIteration'

# Extensions on native objects
clazz.extend String, DEFAULT_OPERATIONS
clazz.extend String,
  __get__:    ($, key) -> JUndefined
  __set__: ($, key, value) -> # pass
  __iter__:        ($) -> new SimpleIterator @valueOf()
  __add__:  ($, other) ->
    if typeof other is 'string' or other instanceof String
      @ + other
    else
      @ + other.__str__($)
  __sub__:  ($, other) -> $.throw 'NotImplementedError', "Implement me"
  __mul__:  ($, other) -> $.throw 'NotImplementedError', "Implement me"
  __div__:  ($, other) -> $.throw 'NotImplementedError', "Implement me"
  __mod__:  ($, other) -> $.throw 'NotImplementedError', "Implement me"
  __eq__:   ($, other) -> @valueOf() is other
  __cmp__:  ($, other) -> $.throw 'NotImplementedError', "Implement me"
  __bool__:        ($) -> @length > 0
  __key__:         ($) -> @valueOf()
  __str__:         ($) -> "\"#{escape @}\""
  jsValue: -> @valueOf()

clazz.extend Number, DEFAULT_OPERATIONS
clazz.extend Number,
  __num__:        ($) -> @valueOf() # prototype methods of native types, @ becomes object.
  __add__: ($, other) -> @valueOf() + other.__num__()
  __sub__: ($, other) -> @valueOf() - other.__num__()
  __mul__: ($, other) -> @valueOf() * other.__num__()
  __div__: ($, other) -> @valueOf() / other.__num__()
  __mod__: ($, other) -> @valueOf() % other.__num__()
  __eq__:  ($, other) -> @valueOf() is other
  __cmp__: ($, other) -> @valueOf() - other.__num__()
  __bool__:       ($) -> @valueOf() isnt 0
  __key__:        ($) -> @valueOf()
  __str__:        ($) -> ''+@
  jsValue: -> @valueOf()

clazz.extend Boolean, DEFAULT_OPERATIONS
clazz.extend Boolean,
  __num__:        ($) -> if @valueOf() then 1 else 0
  __eq__:  ($, other) -> @valueOf() is other
  __bool__:       ($) -> @valueOf()
  __str__:        ($) -> ''+@
  jsValue: -> @valueOf()

clazz.extend Function, DEFAULT_OPERATIONS
clazz.extend Function, # native functions
  __eq__:  ($, other) -> @valueOf() is other
  __bool__:       ($) -> yes
  __str__:        ($) -> "[NativeFunction ##{@id}]"
  jsValue: -> @valueOf()

# EXPORTS
@NODES = {
  JStub, JObject, JArray, JUser, JSingleton, JNull, JUndefined, JNaN, JBoundFunc
}

RUNTIME.elements = [JStub, JObject, JSingleton, JBoundFunc, Number, String, Function, Boolean]
