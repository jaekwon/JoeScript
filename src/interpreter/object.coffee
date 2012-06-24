{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'
joe = require('joeson/src/joescript').NODES
{pad, htmlEscape, escape, starts, ends} = require 'joeson/lib/helpers'
{extend, isVariable} = require('joeson/src/joescript').HELPERS
{debug, info, warn, error:fatal} = require('nogg').logger 'server'

isInteger = (n) -> n%1 is 0
jml = ($, attributes, elements) ->
  if attributes?
    assert.ok attributes instanceof Object, "Attributes should be a simple object if present"
  assert.ok elements instanceof Array, "Elements should be an instance of array"
  if attributes?
    for key, value of attributes
      elements[''+key] = value
  jarr = new JArray creator:$.user, data:elements
  return jarr

JObject = @JObject = clazz 'JObject', ->
  # data: An Object
  # acl:  A JArray of JAccessControlItems
  #       NOTE: the acl has its own acl!
  init: ({@creator, @data, @proto, @acl}) ->
    assert.ok @creator? and @creator instanceof JObject,
                        "#{@constructor.name}.init requires 'creator' (JObject) but got #{@creator} (#{@creator?.constructor.name})"
                        # Everything has a creator. Wait a minute...
    @data ?= {}
    @data.__proto__ = null # detatch prototype
  __get__: ($, key) ->
    $.will('read', this)
    value = @data[key]
    return value if value?
    if @proto?
      return @proto.__get__($, key)
    else if starts(keyStr, '__') and ends(keyStr, '__')
      return @[keyStr] ? JUndefined
  __set__: ($, key, value) ->
    $.will('write', this)
    @data[key] = value
    return
  __keys__: ($) ->
    $.will('read', this)
    return _.keys @data
  __iter__: ($) ->
    $.will('read', this)
    return new SimpleIterator _.keys @data
  __num__:        ($) -> JNaN
  __add__: ($, other) -> $.throw 'TypeError', "Can't add to object yet"
  __sub__: ($, other) -> $.throw 'TypeError', "Can't subtract from object yet"
  __mul__: ($, other) -> $.throw 'TypeError', "Can't multiply with object yet"
  __div__: ($, other) -> $.throw 'TypeError', "Can't divide an object yet"
  __cmp__: ($, other) -> $.throw 'TypeError', "Can't compare objects yet"
  __bool__: ($, other) -> yes
  __str__:  ($) -> @__repr__($).__str__($)
  __html__: ($) -> @__repr__($).__html__($)
  __repr__: ($) ->
    # this is what it would look like in joescript
    # <"{#< ([key.__str__(),':',value.__repr__()] for key, value of @data).weave ', ', flattenItems:yes >}">
    jml($, {}, [
      '{',
      jml($, {}, ([key, ':', value.__repr__($)] for key, value of @data).weave(', ', flattenItems:yes)),
      '}'
    ])
  jsValue$: get: ->
    tmp = {}
    tmp[key] = value.jsValue for key, value of @data
    return tmp
  toString: -> "[JObject]"

JArray = @JArray = clazz 'JArray', ->
  protoKeys = ['push']

  init: ({@creator, @data, @acl}) ->
    assert.ok @creator? and @creator instanceof JObject,
                        "#{@constructor.name}.init requires 'creator' (JObject) but got #{@creator} (#{@creator?.constructor.name})"
                        # Everything has a creator. Wait a minute...
    @data ?= []
    @data.__proto__ = null # detatch prototype
  __get__: ($, key) ->
    $.will('read', this)
    if isInteger key
      return @data[key] ? JUndefined
    else
      console.log "GET:", key
      keyStr = ''+key
      value = @data[keyStr]
      return value if value?
      return @[keyStr] ? JUndefined if starts(keyStr, '__') and ends(keyStr, '__')
      return @[keyStr] if keyStr in protoKeys
      return JUndefined
  __set__: ($, key, value) ->
    $.will('write', this)
    if isInteger key
      @data[key] = value
      return
    keyStr = ''+key
    @data[keyStr] = value
    return
  __keys__: ($) ->
    $.will('read', this)
    return _.keys(@data)
  __num__:        ($) -> JNaN
  __add__: ($, other) -> $.throw 'TypeError', "Can't add to array yet"
  __sub__: ($, other) -> $.throw 'TypeError', "Can't subtract from array yet"
  __mul__: ($, other) -> $.throw 'TypeError', "Can't multiply with array yet"
  __div__: ($, other) -> $.throw 'TypeError', "Can't divide an array yet"
  __cmp__: ($, other) -> $.throw 'TypeError', "Can't compare arrays yet"
  __bool__: ($, other) -> yes
  __str__:  ($) -> (item.__str__($) for item in @data).join ''
  __html__: ($) ->
    arrayPart = (item.__html__($) for item in @data).join '\n'
    dataPart = ("#{htmlEscape key}=\"#{htmlEscape value.__str__($)}\"" for key, value of @data when not isInteger key).join(' ')
    "<span #{dataPart}>#{arrayPart}</span>"
  __repr__: ($) ->
    arrayPart = (item.__repr__($) for item in @data).weave(',')
    dataPart = jml $, {}, ([key, ':', value.__repr__($)] for key, value of @data when not isInteger key).weave(', ')
    if dataPart.length > 0
      return jml $, {}, ['[',arrayPart,' ',dataPart,']']
    else
      return jml $, {}, ['[',arrayPart,']']
  jsValue$: get: ->
    tmp = []
    tmp[key] = value.jsValue for key, value of @data
    return tmp
  toString: -> "[JArray]"

  # protokeys
  push: ($, [value]) ->
    Array.prototype.push.call @data, value
    return JUndefined

JAccessControlItem = @JAccessControlItem = clazz 'JAccessControlItem', ->
  # who:  User or JArray of users
  # what: Action or JArray of actions
  init: (@who, @what) ->
  toString: -> "[JAccessControlItem #{@who}: #{@what}]"

JUser = @JUser = clazz 'JUser', JObject, ->
  init: ({@name}) ->
    assert.equal typeof @name, 'string', "@name not string"
    @super.init.call @, creator:this, data:{name:@name}
  toString: -> "[JUser #{@name}]"

JSingleton = @JSingleton = clazz 'JSingleton', ->
  init: (@name, @jsValue) ->
  __get__:    ($, key) -> $.throw 'TypeError', "Cannot read property '#{key}' of #{@name}"
  __set__: ($, key, value) -> $.throw 'TypeError', "Cannot set property '#{key}' of #{@name}"
  __keys__:        ($) -> $.throw 'TypeError', "Cannot get keys of #{@name}"
  __iter__:        ($) -> $.throw 'TypeError', "Cannot get iterator of #{@name}"
  __num__:         ($) -> JNaN
  __add__:  ($, other) -> JNaN
  __sub__:  ($, other) -> JNaN
  __mul__:  ($, other) -> JNaN
  __div__:  ($, other) -> JNaN
  __bool__: ($, other) -> no
  __str__:         ($) -> @__repr__($).__str__($)
  __html__:        ($) -> @__repr__($).__html__($)
  __repr__:        ($) -> @name
  toString: -> "Singleton(#{@name})"

JNull       = @JNull      = new JSingleton 'null', null
JUndefined  = @JUndefined = new JSingleton 'undefined', undefined
JNaN        = @JNaN       = new Number NaN
# JFalse/JTrue don't exist, just use native booleans.

JBoundFunc = @JBoundFunc = clazz 'JBoundFunc', JObject, ->
  # func:    The joe.Func node.
  # creator: The owner of the process that declared above function.
  # scope:   Runtime scope of process that declares above function.
  init: ({creator, acl, @func, @scope}) ->
    @super.init.call @, {creator, acl}
    assert.ok @func instanceof joe.Func, "func not Func"
    assert.ok @scope? and @scope instanceof Object, "scope not an object"
  __repr__: ($) ->
    dataPart = jml $, {}, ([key, ':', value.__repr__($)] for key, value of @data).weave(', ', flattenItems:yes)
    if dataPart.length > 0
      return jml $, {}, ['[JBoundFunc ',dataPart,']']
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

unless joe.Node::interpret? then do =>
  require('joeson/src/translators/scope').install() # dependency
  require('joeson/src/translators/javascript').install() # dependency

  # simple instruction to write the last value.
  setLast = ($, i9n, last) ->
    $.pop()
    assert.ok i9n.key?, "setLast requires set key."
    if i9n.index?
      @[i9n.key][i9n.index] = last
    else
      @[i9n.key] = last
    return last
  setLast._name = "setLast"

  joe.Node::extend
    interpret: ($) ->
      throw new Error "Dunno how to evaluate a #{this.constructor.name}."

  joe.Word::extend
    interpret: ($) ->
      $.pop()
      return $.scopeGet @

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
    interpret: ($, i9n) ->
      i9n.func = joe.Assign::interpret2
      $.push this:@value,  func:@value.interpret
      if @target instanceof joe.Index
        {obj:targetObj, type, key} = @target
        $.push this:i9n, func:setLast, key:'targetObj'
        $.push this:targetObj, func:targetObj.interpret
        if type is '.'
          assert.ok key instanceof joe.Word, "Unexpected key of type #{key?.constructor.name}"
          i9n.key = key
        else
          $.push this:i9n, func:setLast, key:'key'
          $.push this:key, func:key.interpret
      return
    interpret2: ($, i9n, value) ->
      $.pop()
      if isVariable @target
        $.scopeUpdate @target, value
      else if @target instanceof joe.Index
        i9n.targetObj.__set__($, i9n.key, value)
      else
        throw new Error "Dunno how to assign to #{@target} (#{@target.constructor.name})"
      return value

  joe.Obj::extend
    interpret: ($, i9n) ->
      # setup
      length = @items?.length ? 0
      if length > 0
        i9n.obj = new JObject(creator:$.user)
        i9n.idx = 0
        i9n.length = @items.length
        i9n.func = joe.Obj::interpretKV
        return
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
          $.push this:i9n, func:setLast, key:'key'
          $.push this:key, func:key.interpret
        else throw new Error "Unexpected object key of type #{key?.constructor.name}"
        # setup value
        $.push this:i9n, func:setLast, key:'value'
        $.push this:value, func:value.interpret
        i9n.idx++
        return
      else
        $.pop()
        return i9n.obj

  joe.Arr::extend
    interpret: ($, i9n) ->
      # setup
      length = @items?.length ? 0
      if length > 0
        i9n.arr = new JArray(creator:$.user)
        i9n.idx = 0
        i9n.length = @items.length
        i9n.func = joe.Arr::interpretKV
        return
      else
        $.pop()
        return new JArray(creator:$.user)
    interpretKV: ($, i9n, value) ->
      # store prior item
      if 0 < i9n.idx
        i9n.arr.__set__($, i9n.idx-1, value)
      # push next item evaluation
      if i9n.idx < i9n.length
        value = @items[i9n.idx]
        # setup value
        $.push this:value, func:value.interpret
        i9n.idx++
        return
      else
        $.pop()
        return i9n.arr

  joe.Operation::extend
    interpret: ($, i9n) ->
      i9n.func = joe.Operation::interpret2
      if @left?
        $.push this:i9n, func:setLast, key:'left'
        $.push this:@left, func:@left.interpret
        if @left instanceof joe.Index and @op in ['--', '++']
          {obj:targetObj, key} = @left
          $.push this:i9n, func:setLast, key:'targetObj'
          $.push this:targetObj, func:targetObj.interpret
          if key instanceof joe.Word
            i9n.key = key
          else if key instanceof joe.Str
            $.push this:i9n, func:setLast, key:'key'
            $.push this:key, func:key.interpret
          else throw new Error "Unexpected object key of type #{key?.constructor.name}"
      if @right?
        $.push this:i9n, func:setLast, key:'right'
        $.push this:@right, func:@right.interpret
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
          if isVariable @left
            $.scopeUpdate @left, value
          else if @left instanceof joe.Index
            i9n.targetObj.__set__ $, i9n.key, value
          else
            throw new Error "Dunno how to operate with #{left} (#{left.constructor.name})"
          return value
      else
        throw new Error "implement me!"

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
      i9n.setSource.source = obj if i9n.setSource? # for invocations.
      if @type is '.'
        assert.ok @key instanceof joe.Word, "Unexpected key of type #{@key?.constructor.name}"
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
      i9n.invokedFunctionRepr = ''+@func
      # setSource is a hack/trick to set i9n.source to the
      # 'obj' part of an index, if @func is indeed an object.
      # That way we can bind 'this' correctly.
      $.push this:@func, func:@func.interpret, setSource:i9n
      return
    interpretParams: ($, i9n, func) ->
      unless func instanceof JBoundFunc or func instanceof Function
        return $.throw 'TypeError', "#{@func} cannot be called."
      i9n.invokedFunction = func
      # interpret the parameters
      i9n.paramValues = []
      for param, i in @params
        $.push this:i9n, func:setLast, key:'paramValues', index:i
        $.push this:param, func:param.interpret
      i9n.func = joe.Invocation::interpretCall
      return
    interpretCall: ($, i9n) ->
      i9n.func = joe.Invocation::interpretFinal
      if i9n.invokedFunction instanceof JBoundFunc
        i9n.oldScope = $.scope
        {func:{block,params}, scope} = i9n.invokedFunction
        paramValues = i9n.paramValues
        if i9n.source?
          $.scope = {__parent__:scope, this:i9n.source}
        else
          $.scope = {__parent__:scope} # ala douglass crockford's good parts.
        if params?
          # Though params is an AssignList,
          assert.ok params instanceof joe.AssignList
          # ... we'll manually bind values to param names.
          for {target:argName}, i in params.items
            assert.ok isVariable argName, "Expected variable but got #{argName} (#{argName?.constructor.name})"
            $.scopeDefine argName, paramValues[i] ? JUndefined
        if block?
          $.push this:block, func:block.interpret
        else
          return JUndefined
        return
      else if i9n.invokedFunction instanceof Function # native function
        try
          # NOTE: i9n is unavailable to native functions
          # me don't see why it should be needed.
          return i9n.invokedFunction.call i9n.source, $, i9n.paramValues
        catch error
          return $.throw error?.name ? 'UnknownError', error?.message ? ''+error
    interpretFinal: ($, i9n, result) ->
      $.pop()
      $.scope = i9n.oldScope # recall old scope
      return result

  joe.AssignObj::extend
    interpret: ($, i9n, rhs) ->
      assert.ok no, "AssignObjs aren't part of javascript. Why didn't they get transformed away?"
      return

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
      return

  joe.JSForC::extend
    interpret: ($, i9n) ->
      if @cond?
        i9n.func = joe.JSForC::interpretConditionalLoop
        $.push this:@cond,  func:@cond.interpret
      else
        i9n.func = joe.JSForC::interpretUnconditionalLoop
      if @setup?
        $.push this:@setup, func:@setup.interpret
      return
    interpretConditionalLoop: ($, i9n, cond) ->
      if cond.__bool__().jsValue
        $.push this:@cond,    func:@cond.interpret
        $.push this:@counter, func:@counter.interpret
        $.push this:@block,   func:@block.interpret
      else
        $.pop()
        return
    interpretUnconditionalLoop: ($, i9n) ->
      $.push this:@counter, func:@counter.interpret
      $.push this:@block,   func:@block.interpret
      return

  joe.Range::extend
    interpret: ($, i9n) ->
      i9n.func = joe.Range::interpret2
      if @start?
        $.push this:i9n, func:setLast, key:'start'
        $.push this:@start, func:@start.interpret
      if @end?
        $.push this:i9n, func:setLast, key:'end'
        $.push this:@end, func:@end.interpret
      if @by?
        $.push this:i9n, func:setLast, key:'by'
        $.push this:@by, func:@by.interpret
      return
    interpret2: ($, i9n) ->
      # TODO Make range an iterator
      $.pop()
      if i9n.by?
        if @type is '..'
          array = (x for x in [i9n.start..i9n.end] by i9n.by)
        else
          array = (x for x in [i9n.start...i9n.end] by i9n.by)
      else
        if @type is '..'
          array = [i9n.start..i9n.end]
        else
          array = [i9n.start...i9n.end]
      return JArray creator:$.user, data:array
      
  clazz.extend String,
    interpret: ($) ->
      $.pop()
      return @valueOf()
    __get__:    ($, key) -> JUndefined
    __set__: ($, key, value) -> # pass
    __keys__:        ($) -> $.throw 'TypeError', "Object.keys called on non-object"
    __iter__:        ($) -> new SimpleIterator @valueOf()
    __num__:         ($) -> JNaN
    __add__:  ($, other) -> @valueOf() + other.__str__($)
    __sub__:  ($, other) -> $.throw 'NotImplementedError', "Implement me"
    __mul__:  ($, other) -> $.throw 'NotImplementedError', "Implement me"
    __div__:  ($, other) -> $.throw 'NotImplementedError', "Implement me"
    __cmp__:  ($, other) -> $.throw 'NotImplementedError', "Implement me"
    __bool__:        ($) -> @length > 0
    __str__:         ($) -> @valueOf()
    __html__:        ($) -> htmlEscape @valueOf()
    __repr__:        ($) -> "'#{escape @valueOf()}'"
    jsValue$: get: -> @valueOf()

  clazz.extend Number,
    interpret: ($) ->
      $.pop()
      return @valueOf()
    __get__:        ($) -> $.throw 'NotImplementedError', "Implement me"
    __set__:        ($) -> $.throw 'NotImplementedError', "Implement me"
    __keys__:       ($) -> $.throw 'NotImplementedError', "Implement me"
    __iter__:       ($) -> $.throw 'NotImplementedError', "Implement me"
    __num__:        ($) -> @valueOf()
    __add__: ($, other) -> @valueOf() + other.__num__()
    __sub__: ($, other) -> @valueOf() - other.__num__()
    __mul__: ($, other) -> @valueOf() * other.__num__()
    __div__: ($, other) -> @valueOf() / other.__num__()
    __cmp__: ($, other) -> @valueOf() - other.__num__()
    __bool__:       ($) -> @valueOf() isnt 0
    __str__:        ($) -> ''+@valueOf()
    __html__:       ($) -> ''+@valueOf()
    __repr__:       ($) -> ''+@valueOf()
    jsValue$: get: -> @valueOf()

  clazz.extend Boolean,
    interpret: ($) ->
      $.pop()
      return @valueOf()
    __get__:        ($) -> $.throw 'NotImplementedError', "Implement me"
    __set__:        ($) -> $.throw 'NotImplementedError', "Implement me"
    __keys__:       ($) -> $.throw 'NotImplementedError', "Implement me"
    __iter__:       ($) -> $.throw 'NotImplementedError', "Implement me"
    __num__:        ($) -> JNaN
    __add__: ($, other) -> JNaN
    __sub__: ($, other) -> JNaN
    __mul__: ($, other) -> JNaN
    __div__: ($, other) -> JNaN
    __cmp__: ($, other) -> JNaN
    __bool__:       ($) -> @valueOf()
    __str__:        ($) -> ''+@valueOf()
    __html__:       ($) -> ''+@valueOf()
    __repr__:       ($) -> ''+@valueOf()
    jsValue$: get: -> @valueOf()

  clazz.extend Function, # native functions
    __get__:        ($) -> $.throw 'NotImplementedError', "Implement me"
    __set__:        ($) -> $.throw 'NotImplementedError', "Implement me"
    __keys__:       ($) -> $.throw 'NotImplementedError', "Implement me"
    __iter__:       ($) -> $.throw 'NotImplementedError', "Implement me"
    __num__:        ($) -> JNaN
    __add__: ($, other) -> JNaN
    __sub__: ($, other) -> JNaN
    __mul__: ($, other) -> JNaN
    __div__: ($, other) -> JNaN
    __cmp__: ($, other) -> JNaN
    __bool__:       ($) -> yes
    __str__:        ($) -> @__repr__($).__str__($)
    __html__:       ($) -> @__repr__($).__html__($)
    __repr__:       ($) ->
      name = @name ? @_name
      if name
        "[NativeFunction: #{name}]"
      else
        "[NativeFunction]"
    jsValue$: get: -> @valueOf()
