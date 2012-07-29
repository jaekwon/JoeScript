###

Conventions
  - Do not access thread.last directly, instead use the third argument of the instruction function.
  -> I'm not sure that saving @last will always happen...

###

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{randid, pad, htmlEscape, escape, starts, ends} = require 'sembly/lib/helpers'
{
  parse,
  NODES:joe
  HELPERS:{isWord,isVariable}
} = require 'sembly/src/joescript'
{
  NODES: {JStub, JObject, JArray, JUser, JSingleton, JNull, JUndefined, JNaN, JBoundFunc}
  HELPERS: {isInteger, isObject}
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
  interpret: ($) ->
    $.pop()
    return $.scope.__get__ $, @, yes
  __key__: ($) -> @key

joe.Undetermined::extend
  __key__: ($) ->
    assert.ok @word?, "Undetermined not yet determined!"
    return @word.key

joe.Block::extend
  interpret: ($) ->
    $.pop()
    # lucky us these can just be synchronous
    $.scope.__set__ $, variable, JUndefined for variable in @ownScope.nonparameterVariables if @ownScope?
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
    if cond.__isTrue__?() or cond
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
      $.scope.__update__ $, @target, value
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
      i9n.obj.__set__($, i9n.key, i9n.value)
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
      $.pushValue value
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
      i9n.arr.__set__($, i9n.idx-1, value)
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

joe.Operation::extend
  interpret: ($, i9n) ->
    i9n.func = joe.Operation::interpret2
    if @left?
      $.push this:i9n, func:storeLast, key:'left'
      $.pushValue @left
      if @left instanceof joe.Index and @op in ['--', '++']
        {obj:targetObj, key} = @left
        $.push this:i9n, func:storeLast, key:'targetObj'
        $.pushValue targetObj
        if key instanceof joe.Word
          i9n.key = key
        else if key instanceof joe.Str
          $.push this:i9n, func:storeLast, key:'key'
          $.pushValue key
        else throw new Error "Unexpected object key of type #{key?.constructor.name}"
    if @right?
      $.push this:i9n, func:storeLast, key:'right'
      $.pushValue @right
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
          when '%'  then return left.__mod__ $, right
          when '<'  then return left.__cmp__($, right) < 0
          when '>'  then return left.__cmp__($, right) > 0
          when '<=' then return left.__cmp__($, right) <= 0
          when '>=' then return left.__cmp__($, right) >= 0
          when '==','is' then return left.__eq__($, right)
          when '!=','isnt' then return not left.__eq__($, right)
          when '||','or' then return left.__or__($, right)
          when '&&','and' then return left.__and__($, right)
          else throw new Error "Unexpected operation #{@op}"
      else # left++, left--...
        switch @op
          when '++' then value = left.__add__ $, 1
          when '--' then value = left.__sub__ $, 1
          else throw new Error "Unexpected operation #{@op}"
        if isVariable @left
          $.scope.__update__ $, @left, value
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
    $.pushValue @obj
    return
  interpretTarget: ($, i9n, obj) ->
    i9n.setSource?.source = obj # for invocations.
    switch @type
      when '.'
        assert.ok @key instanceof joe.Word, "Unexpected key of type #{@key?.constructor.name}"
        $.pop()
        return obj.__get__ $, @key
      when '!'
        assert.ok @key instanceof joe.Word, "Unexpected key of type #{@key?.constructor.name}"
        $.pop()
        return obj.__del__ $, @key
      when '?'
        return $.throw 'InternalError', "Meta not yet supported"
      when '[', '!['
        i9n.obj = obj
        i9n.func = joe.Index::interpretKey
        $.pushValue @key
        return
      else throw new Error "Unexpected index type #{@type}"
        
  interpretKey: ($, i9n, key) ->
    switch @type
      when '['
        $.pop()
        return i9n.obj.__get__ $, key
      when '!['
        $.pop()
        return i9n.obj.__del__ $, key
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
    # setSource is a HACK/trick to set i9n.source to the
    # 'obj' part of an index, if @func is indeed an object.
    # That way we can bind 'this' correctly.
    $.pushValue(@func).setSource = i9n
    return
  interpretScope: ($, i9n, bfunc) ->
    unless bfunc instanceof JBoundFunc or bfunc instanceof Function
      return $.throw 'TypeError', "#{@func} is not callable"
    i9n.invokedFunction = bfunc
    i9n.func = joe.Invocation::interpretParams
    if bfunc instanceof JBoundFunc and bfunc.scope instanceof JStub
      # dereference if bfunc.scope is JStub
      $.push this:bfunc, func:storeLast, key:'data', index:'scope'
      return bfunc.__get__ $, 'scope', yes
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
      if i9n.source?
        if scope is JNull
          $.scope = $.new JObject creator:$.user, data:{this:i9n.source}
        # else if scope is JUndefined
        #   This is bad:
        #   $.scope = $.new JObject creator:$.user, data:{this:i9n.source}
        else
          $.scope = scope.__create__ $, {this:i9n.source}
      else
        if scope is JNull
          $.scope = $.new JObject creator:$.user
        # else if scope is JUndefined
        #   This is bad:
        #   $.scope = oldScope.__create__ $
        else if scope?
          $.scope = scope.__create__ $ # this isnt bound to global
      if params?
        # Though params is an AssignList,
        assert.ok params instanceof joe.AssignList
        # ... we'll manually bind values to param names.
        for {target:argName}, i in params.items
          assert.ok isVariable argName, "Expected variable but got #{argName} (#{argName?.constructor.name})"
          $.scope.__set__ $, argName, (paramValues[i] ? JUndefined)
      if block?
        $.push this:block, func:block.interpret
      else
        return JUndefined
      return
    else if i9n.invokedFunction instanceof Function # native function
      try
        # NOTE: i9n is unavailable to native functions
        # me don't see why it should be needed.
        return i9n.invokedFunction.call i9n.source, $, i9n.paramValues...
      catch error
        fatal "Internal error: \n#{error.stack ? error}"
        return $.throw 'InternalError:'+(error?.name ? 'UnknownError'), error?.message ? ''+error
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
      $.pushValue @expr
      return
    else
      return $.return JUndefined
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
      $.pushValue @cond
    else
      i9n.func = joe.JSForC::interpretUnconditionalLoop
    if @setup?
      $.push this:@setup, func:@setup.interpret
    return
  interpretConditionalLoop: ($, i9n, cond) ->
    if cond.__bool__()
      $.pushValue @cond
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
      $.push this:i9n, func:storeLast, key:'start'
      $.pushValue @start
    if @end?
      $.push this:i9n, func:storeLast, key:'end'
      $.pushValue @end
    if @by?
      $.push this:i9n, func:storeLast, key:'by'
      $.pushValue @by
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
