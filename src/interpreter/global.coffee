require 'sugar'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
async = require 'async'
{pad, escape, starts, ends} = require 'sembly/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{JObject, JArray, JUndefined, JNull, JNaN, JStub, JBoundFunc} = require 'sembly/src/interpreter/object'

# Caches.
CACHE = @CACHE = {}
fnNamed = (name, fn) ->
  CACHE[name] = fn
  fn.id = name
  fn
encache = (obj) ->
  CACHE[obj.id] = obj
  obj

if window?
  PERSISTENCE = @PERSISTENCE = undefined
else
  {JPersistence} = p = require 'sembly/src/interpreter/persistence'
  PERSISTENCE = @PERSISTENCE = new JPersistence()

GOD     = @GOD    = encache JObject id:'god',   creator:null, data:{name:'God'}
ANON    = @ANON   = encache JObject id:'anon',  creator:GOD,  data:{name:'Anonymous'}
USERS   = @USERS  = encache JObject id:'users', creator:GOD,  data:{
  god:    GOD
  anon:   ANON
}
OBJECT  = @OBJECT = encache JObject id:'object', creator:GOD, proto:null, data:{
  toString: fnNamed('object_toString', ($, obj) -> obj.toString())
}
ARRAY   = @ARRAY  = encache JObject id:'array', creator:GOD, data:{
  push: fnNamed('array_push', ($, arr, value) ->
    Array.prototype.push.call arr.data, value
    arr.emit {thread:$, type:'set', key:arr.data.length-1, value}
    return JUndefined
  )
  pop: fnNamed('array_pop', ($, arr) ->
    value = Array.prototype.pop.call arr.data
    arr.emit {thread:$, type:'set', key:'length', value:arr.data.length}
    return value ? JUndefined
  )
  shift: fnNamed('array_shift', ($, arr) ->
    value = Array.prototype.shift.call arr.data
    arr.emit {thread:$, type:'shift'}
    return value ? JUndefined
  )
  unshift: fnNamed('array_unshift', ($, arr, value) ->
    Array.prototype.unshift.call arr.data, value
    arr.emit {thread:$, type:'unshift', value}
    return arr.data.length ? JUndefined
  )
}
WORLD   = @WORLD = encache JObject id:'world', creator:GOD, data: {
  world:  JStub(id:'world', persistence:PERSISTENCE)
  this:   USERS
  users:  USERS
  Object: OBJECT
  Array:  ARRAY

  eval:   fnNamed('eval', ($, this_, codeStr) ->
    # Parse the codeStr and associate functions with the output Item
    try
      info "evaluating code:\n#{codeStr}"
      node = require('sembly/src/joescript').parse codeStr
      info "unparsed node:\n" + node.serialize()
      node = node.toJSNode(toVal:yes).installScope().determine()
      info "parsed node:\n" + node.serialize()
    catch err
      return $.throw 'EvalError', "Error in eval(): #{err}"
    # Run node by pushing node into the stack.
    # NOTE: node should be a block, and it has its own scope,
    # so it's different from javascript's eval in this way.
    $.i9ns.push this:node, func:node.interpret
    return JUndefined
  )

  hasPrototype: encache JBoundFunc(id:'hasPrototype', creator:GOD, scope:JNull, func:"""
    (obj, proto) ->
      obj = obj.__proto__ while obj? and obj != proto
      obj?
  """)

  serialize: fnNamed('serialize', ($, this_, codeStr, {maxDepth}={}) ->
    maxDepth ?= 4
    # ensure that maxDepth isn't greater than some limit,
    # otherwise the system will hang.
  )

  hydrate: encache JBoundFunc(id:'hydrate', creator:GOD, scope:new JStub(id:'world'), func:"""
    (obj, seen={}) ->
      # print "hydrate \#{obj}"
      try
        return if seen[obj?id]
        seen[obj?id] = obj
      catch error
        #print "Error in step 1: \#{error}"
        return
      for key of obj
        try
          value = obj[key]
          if value?type is 'object'
            # print "hydrating \#{value?id}"
            hydrate(value, seen) unless seen[value?id]
        catch error
          #print "Error in step 2: \#{error}"
          return
      obj
    """)
}

{JKernel} = require 'sembly/src/interpreter/kernel'
KERNEL = @KERNEL = new JKernel cache:CACHE
KERNEL.emitter.on 'shutdown', -> PERSISTENCE?.client.quit()

USERS.reload = (cb) ->
  delete CACHE['users']
  PERSISTENCE.loadJObject 'users', CACHE, (err, users) ->
    USERS.data = users.data if users?
    cb(err, USERS)
