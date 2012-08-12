log = no

###

Conventions
  - Do not access thread.last directly, instead use the third argument of the instruction function.
  -> I'm not sure that saving @last will always happen...

The INSTR object holds all the __xyz__ methods to be called in a JThread context.
NOTE: The thread context for __str__ is optional??
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

TODO document instructions
  __get__ :
  __set__ :
  __del__ :
  __update__ :
  __create__ :
  __hasOwn__ :
  __keys__ :
  __iter__ :
  __num__ :
  __bool__ :
  __key__ :     Convert an object to a key string.
  __str__ :     Returns a compact serialized value suitable for wire transfer.
  __add__ :
  __sub__ :
  __mul__ :
  __div__ :
  __mod__ :
  __eq__ :
  __cmp__ :

###

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{randid, pad, htmlEscape, escape, starts, ends} = require 'sembly/lib/helpers'
{
  parse,
  NODES:joe
  HELPERS:{isVariable}
} = require 'sembly/src/joescript'
{
  NODES: {JStub, JObject, JArray, JSingleton, JNull, JUndefined, JNaN, JInfinity, JBoundFunc, SimpleIterator}
  HELPERS: {isInteger, isObject, _typeof}
} = require 'sembly/src/interpreter/object'

# A simple instruction to store the last return value into @[key][index?]
storeLast = ($, i9n, last) ->
  # An Instruction to write last to `this`
  $.pop()
  assert.ok i9n.key?, "storeLast requires set key."
  if i9n.index?
    @[i9n.key][i9n.index] = last
  else
    @[i9n.key] = last
  return last
storeLast._name = "storeLast"

# dependencies
require('sembly/src/translators/scope').install()
require('sembly/src/translators/javascript').install()


joe.Node::extend
  interpret: ($) ->
    throw new Error "Dunno how to evaluate a #{this.constructor.name}."

joe.Word::extend
  interpret: ($, i9n) ->
    $.pop()
    return INSTR.__get__ $, $.scope, @, i9n.expected ? yes

joe.Block::extend
  interpret: ($) ->
    $.pop()
    # lucky us these can just be synchronous
    INSTR.__set__ $, $.scope, variable, JUndefined for variable in @ownScope.nonparameterVariables if @ownScope?
    if (length=@lines.length) > 1
      $.push this:@, func:joe.Block::interpretLoop, length:length, idx:0
    $.pushValue @lines[0]
    return
  interpretLoop: ($, i9n, last) ->
    assert.ok typeof i9n.idx is 'number'
    if i9n.idx is i9n.length-2
      $.pop() # pop this
    $.pushValue @lines[++i9n.idx]
    return

joe.If::extend
  interpret: ($) ->
    $.pop()
    $.push this:this,  func:joe.If::interpret2
    $.pushValue @cond
    return
  interpret2: ($, i9n, cond) ->
    $.pop()
    if INSTR.__bool__ $, cond
      $.pushValue @block
    else if @else
      $.pushValue @else
    return

joe.Assign::extend
  interpret: ($, i9n) ->
    assert.ok not @op?, "Dunno how to interpret Assign with @op #{@op}"
    i9n.func = joe.Assign::interpret2
    $.pushValue @value
    if @target instanceof joe.Index
      {obj:targetObj, type, key} = @target
      $.push this:i9n, func:storeLast, key:'targetObj'
      $.pushValue targetObj
      if type is '.'
        assert.ok key instanceof joe.Word, "Unexpected key of type #{key?.constructor.name}"
        i9n.key = key
      else
        $.push this:i9n, func:storeLast, key:'key'
        $.pushValue key
    return
  interpret2: ($, i9n, value) ->
    $.pop()
    if isVariable @target
      INSTR.__update__ $, $.scope, @target, value
    else if @target instanceof joe.Index
      INSTR.__set__ $, i9n.targetObj, i9n.key, value
    else
      throw new Error "Dunno how to assign to #{@target} (#{@target.constructor.name})"
    return value

joe.Obj::extend
  interpret: ($, i9n) ->
    # setup
    length = @items?.length ? 0
    if length > 0
      i9n.obj = $.new JObject(creator:$.user)
      i9n.idx = 0
      i9n.length = @items.length
      i9n.func = joe.Obj::interpretKV
      return
    else
      $.pop()
      return $.new JObject(creator:$.user)
  interpretKV: ($, i9n) ->
    # store prior item
    if 0 < i9n.idx
      INSTR.__set__ $, i9n.obj, i9n.key, i9n.value
    # push next item evaluation
    if i9n.idx < i9n.length
      {key, value} = @items[i9n.idx]
      # setup key
      if key instanceof joe.Word
        i9n.key = key
      else if key instanceof joe.Str
        $.push this:i9n, func:storeLast, key:'key'
        $.pushValue key
      else throw new Error "Unexpected object key of type #{key?.constructor.name}"
      # setup value
      $.push this:i9n, func:storeLast, key:'value'
      $.pushValue value ? key # {foo} == {foo:foo}
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
      i9n.arr = $.new JArray(creator:$.user)
      i9n.idx = 0
      i9n.length = @items.length
      i9n.func = joe.Arr::interpretKV
      return
    else
      $.pop()
      return $.new JArray(creator:$.user)
  interpretKV: ($, i9n, value) ->
    # store prior item
    if 0 < i9n.idx
      INSTR.__set__ $, i9n.arr, i9n.idx-1, value
    # push next item evaluation
    if i9n.idx < i9n.length
      value = @items[i9n.idx].value
      # setup value
      $.pushValue value
      i9n.idx++
      return
    else
      $.pop()
      return i9n.arr

# NOTE: order is important, so is short circuiting (McCarthy evaluation)
joe.Operation::extend
  interpret: ($, i9n) ->
    if @left?
      i9n.func = joe.Operation::interpretStoreLeft
      i9n_left = $.pushValue @left
      if @left instanceof joe.Index and @op in ['--', '++']
        i9n_left.storeIndexObj = i9n
        i9n_left.storeIndexKey = i9n
    else
      i9n.func = joe.Operation::interpretFinal
      $.pushValue @right
    return
  interpretStoreLeft: ($, i9n, left) ->
    i9n.left = left
    # short circuit special cases
    if @op in ['and', '&&', 'or', '||']
      left_bool = INSTR.__bool__ $, left
      if !left_bool and (@op is 'or' or @op is '||') or
          left_bool and (@op is 'and' or @op is '&&')
            $.pop()
            $.pushValue @right
            return
      else
        $.pop()
        return left
    # default behavior
    i9n.func = joe.Operation::interpretFinal
    $.pushValue @right if @right?
    return
  interpretFinal: ($, i9n, right) ->
    $.pop()
    if @left?
      left = i9n.left
      if @right?
        switch @op
          when '+'  then return INSTR.__add__ $, left, right
          when '-'  then return INSTR.__sub__ $, left, right
          when '*'  then return INSTR.__mul__ $, left, right
          when '/'  then return INSTR.__div__ $, left, right
          when '%'  then return INSTR.__mod__ $, left, right
          when '<'  then return INSTR.__cmp__($, left, right) < 0
          when '>'  then return INSTR.__cmp__($, left, right) > 0
          when '<=' then return INSTR.__cmp__($, left, right) <= 0
          when '>=' then return INSTR.__cmp__($, left, right) >= 0
          when '==','is' then return INSTR.__eq__($, left, right)
          when '!=','isnt' then return not INSTR.__eq__($, left, right)
          else throw new Error "Unexpected operation #{@op}"
      else # left++, left--...
        switch @op
          when '++' then value = INSTR.__add__ $, left, 1
          when '--' then value = INSTR.__sub__ $, left, 1
          else throw new Error "Unexpected operation #{@op}"
        if isVariable @left
          INSTR.__update__ $, $.scope, @left, value
        else if @left instanceof joe.Index
          INSTR.__set__ $, i9n.indexObj, i9n.indexKey, value
        else
          throw new Error "Dunno how to operate with #{left} (#{left.constructor.name})"
        return left
    else if @right?
      switch @op
        when '!','not' then return not INSTR.__bool__($, right)
        else throw new Error "Unexpected operation #{@op}"
    else
      throw new Error "Operation should have either a left or a right"

joe.Singleton::extend
  interpret: ($) ->
    $.pop()
    switch @name
      when 'null'       then JNull
      when 'undefined'  then JUndefined
      when 'Infinity'   then JInfinity
      else throw new Error "Unknown Singleton type #{@name}"
        
joe.Index::extend
  interpret: ($, i9n) ->
    i9n.func = joe.Index::interpretTarget
    i9n_obj = $.pushValue(@obj)
    # You can check the type of an undefined variable with VAR?type (typeof VAR).
    i9n_obj.expected = no if @type is '?' and @key.toKeyString() is 'type'
    return
  interpretTarget: ($, i9n, obj) ->
    i9n.storeIndexObj?.indexObj = obj   # for ++/-- ops and invocations.
    i9n.storeIndexKey?.indexKey = @key  # for ++/-- ops
    switch @type
      when '.'
        assert.ok @key instanceof joe.Word, "Unexpected key of type #{@key?.constructor.name}"
        $.pop()
        return INSTR.__get__ $, obj, @key
      when '!'
        assert.ok @key instanceof joe.Word, "Unexpected key of type #{@key?.constructor.name}"
        $.pop()
        return INSTR.__del__ $, obj, @key
      when '?'
        switch @key.toKeyString()
          when 'type' then $.pop(); return _typeof obj
          when 'id'   then $.pop(); return obj.id ? JUndefined
          else
            return $.throw 'InternalError', "Meta '#{@key}' not supported"
      when '[', '!['
        i9n.obj = obj
        i9n.func = joe.Index::interpretKey
        $.pushValue @key
        return
      else throw new Error "Unexpected index type #{@type}"
  interpretKey: ($, i9n, key) ->
    i9n.storeIndexKey?.indexKey = key
    switch @type
      when '['
        $.pop()
        return INSTR.__get__ $, i9n.obj, key
      when '!['
        $.pop()
        return INSTR.__del__ $, i9n.obj, key
      else throw new Error "Unexpected index type #{@type}"

joe.Func::extend
  interpret: ($, i9n) ->
    $.pop()
    bfunc = $.new JBoundFunc func:this, creator:$.user, scope:$.scope

joe.Invocation::extend
  interpret: ($, i9n) ->
    i9n.oldScope = $.scope # remember
    # interpret the func synchronously.
    i9n.func = joe.Invocation::interpretScope
    return @func if @func instanceof JBoundFunc or @func instanceof Function # HACK (?) data and code getting mixed up.
    # storeIndexObj is a HACK/trick to set i9n.indexObj to the
    # 'obj' part of an index, if @func is indeed an object.
    # That way we can bind 'this' correctly.
    $.pushValue(@func).storeIndexObj = i9n
    return
  interpretScope: ($, i9n, bfunc) ->
    unless bfunc instanceof JBoundFunc or bfunc instanceof Function
      return $.throw 'TypeError', "#{@func} is not callable"
    i9n.invokedFunction = bfunc
    i9n.func = joe.Invocation::interpretParams
    if bfunc instanceof JBoundFunc and bfunc.scope instanceof JStub
      # dereference if bfunc.scope is JStub
      $.push this:bfunc, func:storeLast, key:'data', index:'scope'
      return INSTR.__get__ $, bfunc, 'scope', yes
    return
  interpretParams: ($, i9n) ->
    # interpret the parameters
    i9n.paramValues = []
    for param, i in @params ? []
      {value} = param
      $.push this:i9n, func:storeLast, key:'paramValues', index:i
      $.pushValue value
    i9n.func = joe.Invocation::interpretCall
    return
  interpretCall: ($, i9n) ->
    i9n.func = joe.Invocation::interpretFinal
    if i9n.invokedFunction instanceof JBoundFunc
      i9n.oldScope = oldScope = $.scope
      {func:{block,params}, scope} = i9n.invokedFunction
      paramValues = i9n.paramValues
      if i9n.indexObj?
        if scope is JNull
          $.scope = $.new JObject creator:$.user, data:{this:i9n.indexObj}
        # else if scope is JUndefined
        #   This is bad:
        #   $.scope = $.new JObject creator:$.user, data:{this:i9n.indexObj}
        else
          $.scope = INSTR.__create__ $, scope, {this:i9n.indexObj}
      else
        if scope is JNull
          $.scope = $.new JObject creator:$.user
        # else if scope is JUndefined
        #   This is bad:
        #   $.scope = oldScope.__create__ $
        else if scope?
          $.scope = INSTR.__create__ $, scope # this isnt bound to global
      if params?
        # Though params is an AssignList,
        assert.ok params instanceof joe.AssignList
        # ... we'll manually bind values to param names.
        for {target:argName}, i in params.items
          assert.ok isVariable argName, "Expected variable but got #{argName} (#{argName?.constructor.name})"
          INSTR.__set__ $, $.scope, argName, (paramValues[i] ? JUndefined)
      if block?
        $.pushValue block
      else
        return JUndefined
      return
    else if i9n.invokedFunction instanceof Function # native function
      try
        # NOTE: i9n is unavailable to native functions
        # me don't see why it should be needed.
        return i9n.invokedFunction $, i9n.indexObj, i9n.paramValues...
      catch error
        if typeof error is 'string' and error.startsWith('INTERRUPT')
          throw error
        else
          fatal "Internal error: \n#{error.stack ? error}"
          return $.throw 'InternalError:'+(error?.name ? 'UnknownError'), error?.message ? ''+error
  interpretFinal: ($, i9n, result) ->
    $.pop()
    $.scope = i9n.oldScope # recall old scope
    return result

joe.Try::extend
  interpret: ($, i9n) ->
    $.pushValue @block
    i9n.func = joe.Try::interpretFinally
    return
  interpretCatch: ($, i9n, error) ->
    INSTR.__set__ $, $.scope, @catchVar, error if @catchVar?
    $.pushValue @catch
    i9n.func = joe.Try::interpretFinally
    return
  interpretFinally: ($, i9n) ->
    $.pushValue @finally if @finally
    $.pop()
    return

joe.AssignObj::extend
  interpret: ($, i9n, rhs) ->
    assert.ok no, "AssignObjs aren't part of javascript. Why didn't they get transformed away?"
    return

joe.Statement::extend
  interpret: ($, i9n) ->
    if @expr?
      i9n.func = joe.Statement::interpretResult
      $.pushValue @expr
      return
    else
      return $.return JUndefined
  interpretResult: ($, i9n, result) ->
    return $.return result

joe.Loop::extend
  interpret: ($, i9n) ->
    $.pushValue @block
    return

joe.JSForC::extend
  interpret: ($, i9n) ->
    if @cond?
      i9n.func = joe.JSForC::interpretConditionalLoop
      $.pushValue @cond
    else
      i9n.func = joe.JSForC::interpretUnconditionalLoop
    if @setup?
      $.pushValue @setup
    return
  interpretConditionalLoop: ($, i9n, cond) ->
    if INSTR.__bool__ $, cond
      $.pushValue @cond
      $.pushValue @counter
      $.pushValue @block
    else
      $.pop()
      return
  interpretUnconditionalLoop: ($, i9n) ->
    $.pushValue @counter
    $.pushValue @block
    return

joe.JSForK::extend
  interpret: ($, i9n) ->
    i9n.func = joe.JSForK::interpretAllKeys
    $.pushValue @obj
    return
  interpretAllKeys: ($, i9n, obj) ->
    i9n.func = joe.JSForK::interpretLoop
    if obj instanceof JObject
      i9n.allKeys = Object.keys obj.data
      return
    else
      $.pop()
      return
  interpretLoop: ($, i9n) ->
    nextKey = i9n.allKeys.shift()
    if nextKey?
      $.pushValue @block
      INSTR.__set__ $, $.scope, @key, ''+nextKey
      return
    else
      $.pop()
      return

joe.Range::extend
  interpret: ($, i9n) ->
    i9n.func = joe.Range::interpret2
    if @from?
      $.push this:i9n, func:storeLast, key:'from'
      $.pushValue @from
    if @to?
      $.push this:i9n, func:storeLast, key:'to'
      $.pushValue @to
    if @by?
      $.push this:i9n, func:storeLast, key:'by'
      $.pushValue @by
    return
  interpret2: ($, i9n) ->
    # TODO Make range an iterator
    $.pop()
    if i9n.by?
      if @exclusive
        array = (x for x in [i9n.from...i9n.to] by i9n.by)
      else
        array = (x for x in [i9n.from..i9n.to] by i9n.by)
    else
      if @exclusive
        array = [i9n.from...i9n.to]
      else
        array = [i9n.from..i9n.to]
    return $.new JArray creator:$.user, data:array

clazz.extend JObject,
  interpret: ($) ->
    $.pop()
    return @
    
clazz.extend String,
  interpret: ($) ->
    $.pop()
    return @valueOf()

clazz.extend Number,
  interpret: ($) ->
    $.pop()
    return @valueOf()

clazz.extend Boolean,
  interpret: ($) ->
    $.pop()
    return @valueOf()

INSTR = @INSTR =
  # asynchronous
  __get__: ($, obj, key, expected=no) ->
    switch _typeof obj
      when 'object'
        key = INSTR.__key__ $, key
        $.will('read', obj)
        if key is '__proto__'
          value = obj.proto
        else
          value = obj.data[key]
        debug "#{obj}.__get__ #{key}, expected=#{expected} --> #{value} (#{typeof value};#{value?.constructor?.name})" if log
        if value?
          if value instanceof JStub
            if cached=$.kernel.cache[value.id]
              # Replace stub with value in cache
              if key is '__proto__'
                obj.proto = cached
              else
                obj.data[key] = cached
              return cached
            assert.ok value.persistence?, "JObject::__get__ wants <JStub>.persistence"
            $.wait waitKey="load:#{value.id}"
            # Make a call to aynchronously fetch value
            value.persistence.loadJObject value.id, $.kernel.cache, (err, valObj) ->
              return $.throw 'InternalError', "Failed to load stub ##{value.id}:\n#{err.stack ? err}" if err?
              return $.throw 'ReferenceError', "#{key} is a broken stub." if not valObj?
              # Replace stub with value in @data[key] (or @proto)
              if key is '__proto__'
                obj.proto = valObj
              else
                obj.data[key] = valObj
              $.last = valObj
              $.resume waitKey
            return null # null means waiting
          else
            return value
        else if obj.proto?
          if obj.proto instanceof JStub
            $.push func:($, i9n, proto) ->
              $.pop()
              INSTR.__get__ $, proto, key, expected
            return INSTR.__get__ $, obj, '__proto__'
          else
            return INSTR.__get__ $, obj.proto, key, expected
        else if (bridged=obj.bridged[key])?
          return bridged
        else
          return $.throw 'ReferenceError', "#{key} is not defined" if expected
          return JUndefined
      when 'string'
        key = INSTR.__key__ $, key
        if isInteger key
          return obj[key]
        else if (bridged=String::bridged[key])?
          return bridged
        return JUndefined
      else
        $.throw 'TypeError', "__get__ not define for #{_typeof obj}"

  # synchronous:
  __set__: ($, obj, key, value) ->
    switch _typeof obj
      when 'object'
        key = INSTR.__key__ $, key
        $.will('write', obj)
        if key is '__proto__'
          obj.proto = value
          obj.emit {thread:$,type:'set',key,value}
        else
          obj.data[key] = value
          obj.emit {thread:$,type:'set',key,value}
        return
      # when 'string'
      #   return JUndefined
      else $.throw 'TypeError', "__set__ not defined for #{_typeof obj}"

  __del__: ($, obj, key) ->
    switch _typeof obj
      when 'object'
        key = INSTR.__key__ $, key
        $.will('write', obj)
        if key is '__proto__'
          delete obj.proto
          obj.emit {thread:$,type:'delete',key}
        else
          delete obj.data[key]
          obj.emit {thread:$,type:'delete',key}
        return yes # TODO reconsider?
      # when 'string'
      #   return JUndefined
      else $.throw 'TypeError', "__del__ not defined for #{_typeof obj}"

  # an __update__ only happens for scope objects.
  __update__: ($, obj, key, value) ->
    switch _typeof obj
      when 'object'
        key = INSTR.__key__ $, key
        $.will('write', obj)
        if key is '__proto__'
          obj.proto = value
          obj.emit {thread:$,type:'set',key,value}
          return
        else if obj.data[key]?
          obj.data[key] = value
          obj.emit {thread:$,type:'set',key,value}
          return
        else if obj.proto?
          if obj.proto instanceof JStub
            $.push func:($, i9n, proto) ->
              $.pop()
              INSTR.__update__ $, proto, key, value
            return INSTR.__get__ $, obj, '__proto__'
          else
            return INSTR.__update__ $, obj.proto, key, value
        else
          $.throw 'ReferenceError', "#{key} is not defined, cannot update."
      else $.throw 'TypeError', "__update__ not defined for #{_typeof obj}"

  __create__: ($, obj, newData) ->
    switch _typeof obj
      when 'object'
        new JObject creator:$.user, data:newData, proto:obj
      else $.throw 'TypeError', "__create__ not defined for #{_typeof obj}"

  __hasOwn__: ($, obj, key) ->
    switch _typeof obj
      when 'object'
        $.will('read', obj)
        return obj.data[key]?
      else $.throw 'TypeError', "__hasOwn__ not defined for #{_typeof obj}"

  __keys__: ($, obj) ->
    switch _typeof obj
      when 'object'
        $.will('read', obj)
        return Object.keys obj.data
      else $.throw 'TypeError', "__keys__ not defined for #{_typeof obj}"

  __iter__: ($, obj) ->
    switch _typeof obj
      when 'object'
        $.will('read', obj)
        return new SimpleIterator Object.keys obj.data
      when 'string'
        return new SimpleIterator obj
      else $.throw 'TypeError', "__iter__ not defined for #{_typeof obj}"

  __num__: ($, obj) ->
    switch _typeof obj
      when 'number' then return obj
      when 'boolean'
        if obj then return 1 else return 0
      else return JNaN

  __bool__: ($, obj) ->
    switch _typeof obj
      when 'object' then yes
      when 'number' then obj isnt 0
      when 'string' then obj.length > 0
      when 'boolean' then obj
      when 'function' then yes
      else no

  __key__: ($, obj) ->
    switch _typeof obj
      when 'string', 'number' then obj
      when 'object'
        if obj instanceof joe.Undetermined
          assert.ok obj.word?, "Undetermined not yet determined!"
          return obj.word.key
        if obj instanceof joe.Word then return obj.key
        $.throw 'TypeError', "__key__ not defined for #{obj?.constructor?.name}"
      else $.throw 'TypeError', "__key__ not defined for #{_typeof obj}"

  __str__: ($, obj, $$={}) ->
    switch _typeof obj
      when 'stub' then return "<##{obj.id}>"
      when 'object'
        return "<##{obj.id}>" if $$[obj.id]
        $$[obj.id] = yes
        if obj instanceof JArray
          dataPart = ("#{INSTR.__str__ $, if isInteger(key) then Number(key) else key}:#{INSTR.__str__ $, value, $$}" for key, value of obj.data).join(',')
          typeCode = 'A'
        else if obj instanceof JBoundFunc
          return "<F|##{obj.id}>"
        else
          dataPart = ("#{INSTR.__str__ $, key}:#{INSTR.__str__ $, value, $$}" for key, value of obj.data).join(',')
          typeCode = 'O'
        return "{#{typeCode}|##{obj.id}@#{obj.creator.id} #{dataPart}}"
      when 'function' then "<F|##{obj.id}>"
      when 'string' then "\"#{escape obj}\""
      when 'number','boolean' then ''+obj
      when 'function' then "[NativeFunction ##{obj.id}]"
      when 'undefined' then 'undefined'
      when 'null' then 'null'
      else $.throw 'TypeError', "__str__ not defined for #{_typeof obj}"

  __add__: ($, left, right) ->
    switch _typeof left
      when 'string'
        switch _typeof right
          when 'string' then return left + right
          else               return left + INSTR.__str__ $, right
      when 'number'
        switch _typeof right
          when 'number' then return left + right
          else               return left + INSTR.__num__ $, right
      else return JNaN

  __sub__: ($, left, right) ->
    switch _typeof left
      when 'number'
        switch _typeof right
          when 'number' then return left - right
          else               return left - INSTR.__num__ $, right
      else return JNaN

  __mul__: ($, left, right) ->
    switch _typeof left
      when 'number'
        switch _typeof right
          when 'number' then return left * right
          else               return left * INSTR.__num__ $, right
      else return JNaN

  __div__: ($, left, right) ->
    switch _typeof left
      when 'number'
        switch _typeof right
          when 'number' then return left / right
          else               return left / INSTR.__num__ $, right
      else return JNaN

  __mod__: ($, left, right) ->
    switch _typeof left
      when 'number'
        switch _typeof right
          when 'number' then return left % right
          else               return left % INSTR.__num__ $, right
      else return JNaN
    
  __eq__: ($, left, right) ->
    leftType = _typeof left
    rightType = _typeof right
    return no if leftType isnt rightType
    return left is right

  __cmp__: ($, left, right) ->
    switch _typeof left
      when 'number'
        switch _typeof right
          when 'number' then return left - right
          else               return left - INSTR.__num__ $, right
      else $.throw 'TypeError', "__cmp__ not defined for #{_typeof left}"
