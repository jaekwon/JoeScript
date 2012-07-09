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
{
  NODES: {JStub, JObject, JArray, JUser, JSingleton, JNull, JUndefined, JNaN, JBoundFunc}
  HELPERS: {isInteger, isObject, setLast}
} = require 'joeson/src/interpreter/object'


# dependencies
require('joeson/src/translators/scope').install()
require('joeson/src/translators/javascript').install()


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
    assert.ok not @op?, "Dunno how to interpret Assign with @op #{@op}"
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
      value = @items[i9n.idx].value
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
      {value} = param
      $.push this:i9n, func:setLast, key:'paramValues', index:i
      $.push this:value, func:value.interpret
    i9n.func = joe.Invocation::interpretCall
    return
  interpretCall: ($, i9n) ->
    i9n.func = joe.Invocation::interpretFinal
    if i9n.invokedFunction instanceof JBoundFunc
      i9n.oldScope = $.scope
      {func:{block,params}, scope} = i9n.invokedFunction
      paramValues = i9n.paramValues
      if i9n.source?
        if scope?
          $.scope = scope.__create__ $, {this:i9n.source}
        else
          $.scope = new JObject creator:$.user, data:{this:i9n.source}
      else
        if scope?
          $.scope = scope.__create__ $ # this isnt bound to global
        else
          $.scope = new JObject creator:$.user
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
        return i9n.invokedFunction.call i9n.source, $, i9n.paramValues
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
    if cond.__bool__()
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

clazz.extend Number,
  interpret: ($) ->
    $.pop()
    return @valueOf()

clazz.extend Boolean,
  interpret: ($) ->
    $.pop()
    return @valueOf()
