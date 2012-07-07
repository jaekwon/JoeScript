{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{randid, pad, htmlEscape, escape, starts, ends} = require 'joeson/lib/helpers'
{
  parse,
  NODES:joe
  HELPERS:{isWord,isVariable}
} = require 'joeson/src/joescript'

# HELPERS FOR INTERPRETATION
isInteger = (n) -> n%1 is 0
isObject =  (o) -> o instanceof JObject or o instanceof JStub
setLast = ($, i9n, last) ->
  # An Instruction to write last to `this`
  $.pop()
  assert.ok i9n.key?, "setLast requires set key."
  if i9n.index?
    @[i9n.key][i9n.index] = last
  else
    @[i9n.key] = last
  return last
setLast._name = "setLast"
@HELPERS = {isInteger, isObject, setLast}

JStub = @JStub = clazz 'JStub', ->
  init: (@id) ->
    assert.ok @id?, "Stub wants id"
  jsValue: ($, $$) ->
    cached1 = $$[@id]
    return cached1 if cached1?
    cached2 = $.kernel.cache[@id]
    return cached2.jsValue($, $$) if cached2?
    #throw new Error "DereferenceError: Broken reference: #{@}"
    return @
  toString: ->
    "<##{@id}>"

JObject = @JObject = clazz 'JObject', ->
  # data:   An Object
  # acl:    A JArray of JAccessControlItems
  #         NOTE: the acl has its own acl!
  # proto:  Both a workaround the native .__proto__ behavior,
  #         and a convenient way to create new JObjects w/ their prototypes.
  init: ({@id, @creator, @data, @acl, @proto}) ->
    assert.ok not @proto? or isObject @proto, "JObject wants JObject proto or null"
    assert.ok isObject @creator, "JObject wants JObject creator"
    @id ?= randid()
    @data ?= {}
    @data.__proto__ = null # detatch prototype

  # Event handling
  addListener: (listener) ->
    assert.ok listener.id?, "Listener needs an id"
    assert.ok listener.on?, "Listener needs an 'on' method"
    listeners = @listeners ?= {}
    assert.ok not listeners[listener.id]?, "Listener with id #{listener.id} already registered"
    listeners[listener.id] = listener
  emit: (name, data) ->
    return unless @listeners?
    for id, listener of @listeners
      listener.on @, name, data

  # Runtime functions
  __get__: ($, key, required=no) ->
    assert.ok key=key.__key__?($), "Key couldn't be stringified"
    $.will('read', this)
    if key is '__proto__'
      value = @proto
    else
      value = @data[key]
    if value?
      if value instanceof JStub
        # TODO make a call to aynchronously fetch value
        # TODO then replace stub with value in @data[key] (or @proto)
        # TODO dont forget 'required'.
        console.log "WORKING"
        return $.wait value.key
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
      if starts(key, '__') and ends(key, '__') and nativeValue=@[key]
        return nativeValue
      return $.throw 'ReferenceError', "#{key} is not defined" if required
      return JUndefined
  create: (creator, newData={}) ->
    new JObject creator:creator, data:newData, proto:@
  __create__: ($, newData) -> @create $.user, newData
  __hasOwn__: ($, key) ->
    $.will('read', this)
    return @data[key]?
  __set__: ($, key, value) ->
    assert.ok key=key.__key__?($), "Key couldn't be stringified"
    $.will('write', this)
    @data[key] = value
    @emit 'set', {key,value}
    return
  # an __update__ only happens for scope objects.
  __update__: ($, key, value) ->
    assert.ok key=key.__key__?($), "Key couldn't be stringified"
    $.will('write', this)
    if key is '__proto__'
      @proto = value
      @emit 'update', {key,value} # TODO more complicated, the chain was updated.
      return
    else if @data[key]?
      @data[key] = value
      @emit 'update', {key,value}
      return
    else if @proto?
      @emit 'update', {key,value} # TODO this is wrong... should be asynchronous.
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
  __num__:         ($) -> JNaN
  __add__:  ($, other) -> $.throw 'TypeError', "Can't add to object yet"
  __sub__:  ($, other) -> $.throw 'TypeError', "Can't subtract from object yet"
  __mul__:  ($, other) -> $.throw 'TypeError', "Can't multiply with object yet"
  __div__:  ($, other) -> $.throw 'TypeError', "Can't divide an object yet"
  __cmp__:  ($, other) -> $.throw 'TypeError', "Can't compare objects yet"
  __bool__: ($, other) -> yes
  __key__:         ($) -> $.throw 'TypeError', "Can't use object as a key"
  __str__:  ($, $$={}) ->
    return "<##{@id}>" if $$[@id]
    $$[@id] = yes
    dataPart = ("#{key.__str__($)}:#{value.__str__($, $$)}" for key, value of @data).join(',')
    return "{O|##{@id}@#{@creator.id} #{dataPart}}"
  __repr__: ($) ->
    # this is what it would look like in joescript
    # <"{#< ([key.__str__(),':',value.__repr__()] for key, value of @data).weave ', ', flattenItems:yes >}">
    $.jml(
      '{',
      $.jml(([key, ':', value.__repr__($)] for key, value of @data).weave(', ', flattenItems:yes)),
      '}'
    )
  jsValue: ($, $$={}) ->
    return $$[@id] if $$[@id]
    jsObj = $$[@id] = {}
    jsObj[key] = value.jsValue($, $$) for key, value of @data
    return jsObj
  toString: -> "[JObject]"

JArray = @JArray = clazz 'JArray', JObject, ->
  protoKeys = ['push']

  init: ({id, creator, data, acl}) ->
    data ?= []
    data.__proto__ = null # detatch prototype
    @super.init.call @, {id, creator, data, acl}
  __get__: ($, key) ->
    $.will('read', this)
    if isInteger key
      return @data[key] ? JUndefined
    else
      assert.ok key=key.__key__?($), "Key couldn't be stringified"
      #console.log "GET:", key
      value = @data[key]
      return value if value?
      return @[key] ? JUndefined if starts(key, '__') and ends(key, '__')
      return @[key] if key in protoKeys
      return JUndefined
  __set__: ($, key, value) ->
    $.will('write', this)
    if isInteger key
      @data[key] = value
      @emit 'set', {key,value}
      return
    assert.ok key=key.__key__?($), "Key couldn't be stringified"
    @data[key] = value
    @emit 'set', {key,value}
    return
  __keys__: ($) ->
    $.will('read', this)
    return Object.keys(@data)
  __num__:        ($) -> JNaN
  __add__: ($, other) -> $.throw 'TypeError', "Can't add to array yet"
  __sub__: ($, other) -> $.throw 'TypeError', "Can't subtract from array yet"
  __mul__: ($, other) -> $.throw 'TypeError', "Can't multiply with array yet"
  __div__: ($, other) -> $.throw 'TypeError', "Can't divide an array yet"
  __cmp__: ($, other) -> $.throw 'TypeError', "Can't compare arrays yet"
  __bool__: ($, other) -> yes
  __key__:        ($) -> $.throw 'TypeError', "Can't use an array as a key"
  __str__: ($, $$={}) ->
    return "<##{@id}>" if $$[@id]
    $$[@id] = yes
    return "{A|##{@id}@#{@creator.id} #{("#{if isInteger key then ''+key else key.__str__($)}:#{value.__str__($, $$)}" for key, value of @data).join(',')}}"
  __repr__: ($) ->
    arrayPart = (item.__repr__($) for item in @data).weave(',')
    dataPart = $.jml ([key, ':', value.__repr__($)] for key, value of @data when not isInteger key).weave(', ')
    if dataPart.length > 0
      return $.jml '[',arrayPart...,' ',dataPart,']'
    else
      return $.jml '[',arrayPart...,']'
  jsValue: ($, $$={}) ->
    return $$[@id] if $$[@id]
    jsObj = $$[@id] = []
    jsObj[key] = value.jsValue($, $$) for key, value of @data
    return jsObj
  toString: -> "[JArray]"

  # protokeys
  push: ($, [value]) ->
    Array.prototype.push.call @data, value
    # also emit the key, to mitigate syncrony issues
    @emit 'push', {key:@data.length-1, value}
    return JUndefined

JAccessControlItem = @JAccessControlItem = clazz 'JAccessControlItem', ->
  # who:  User or JArray of users
  # what: Action or JArray of actions
  init: (@who, @what) ->
  toString: -> "[JAccessControlItem #{@who}: #{@what}]"

JUser = @JUser = clazz 'JUser', JObject, ->
  init: ({id, @name}) ->
    assert.equal typeof @name, 'string', "@name not string"
    {GOD} = require('joeson/src/interpreter/global')
    assert.ok @name is 'god', "Who else could it be?" unless GOD?
    GOD ?= this
    @super.init.call @, id:id, creator:GOD, data:{name:@name}
  __str__:  ($, $$={}) ->
    return "<##{@id}>" if $$[@id]
    $$[@id] = yes
    dataPart = ("#{key.__str__($)}:#{value.__str__($, $$)}" for key, value of @data).join(',')
    return "{U|##{@id} #{dataPart}}"
  toString: -> "[JUser #{@name}]"

JSingleton = @JSingleton = clazz 'JSingleton', ->
  init: (@name, @_jsValue) ->
  __get__:    ($, key) -> $.throw 'TypeError', "Cannot read property '#{key}' of #{@name}"
  __set__: ($, key, value) -> $.throw 'TypeError', "Cannot set property '#{key}' of #{@name}"
  __keys__:        ($) -> $.throw 'TypeError', "Cannot get keys of #{@name}"
  __iter__:        ($) -> $.throw 'TypeError', "Cannot get iterator of #{@name}"
  __num__:         ($) -> JNaN
  __add__:  ($, other) -> JNaN
  __sub__:  ($, other) -> JNaN
  __mul__:  ($, other) -> JNaN
  __div__:  ($, other) -> JNaN
  __cmp__:  ($, other) -> $.throw 'TypeError', "Can't compare with #{@name}"
  __bool__: ($, other) -> no
  __key__:         ($) -> $.throw 'TypeError', "Can't use #{@name} as key"
  __str__:         ($) -> @name
  __repr__:        ($) -> @name
  jsValue: -> @_jsValue
  toString: -> "Singleton(#{@name})"

JNull       = @JNull      = new JSingleton 'null', null
JUndefined  = @JUndefined = new JSingleton 'undefined', undefined
JNaN        = @JNaN       = new Number NaN
# JFalse/JTrue don't exist, just use native booleans.

# Actually, not always bound to a scope.
JBoundFunc = @JBoundFunc = clazz 'JBoundFunc', JObject, ->
  # func:    The joe.Func node, or a string for lazy parsing.
  # creator: The owner of the process that declared above function.
  # scope:   Runtime scope of process that declares above function.
  init: ({id, creator, acl, func, @scope}) ->
    @super.init.call @, {id, creator, acl}
    assert.ok (@scope is null) or isObject @scope, "scope, if present, must be a JObject"
    if func instanceof joe.Func
      @func = func
    else if typeof func is 'string'
      @_func = func
    else
      throw new Error "funky func"
  func$: get: ->
    node = parse @_func
    node = node.toJSNode(toValue:yes).installScope().determine()
    assert.ok node instanceof joe.Block, "Expected Block at root node, but got #{node?.constructor?.name}"
    assert.ok node.lines.length is 1 and node.lines[0] instanceof joe.Func, "Expected one Func"
    return @func=node.lines[0]
  __str__: ($) -> "<##{@id}>"
  __repr__: ($) ->
    dataPart = ([key, ':', value.__repr__($)] for key, value of @data).weave(', ', flattenItems:yes)
    if dataPart.length > 0
      return $.jml('[JBoundFunc ', $.jml(dataPart), ']')
    else
      return "[JBoundFunc]"
  toString: -> "[JBoundFunc]"

SimpleIterator = clazz 'SimpleIterator', ->
  init: (@items) ->
    @length = @items.length
    @idx = 0
  next: ->
    if @idx < @length
      return @items[@idx]
    else throw 'StopIteration'

@NODES = {
  JStub, JObject, JArray, JUser, JSingleton, JNull, JUndefined, JNaN, JBoundFunc
}

